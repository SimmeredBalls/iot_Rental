
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SummaryCard, Table, StatusBadge, Modal } from "../components/ui/CommonUI";

export default function Rentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRentalForTransaction, setSelectedRentalForTransaction] = useState(null);
  const ITEMS_PER_PAGE = 8;


  // ✅ Fetch rentals
  async function fetchRentals() {
    setLoading(true);

  const { data, error } = await supabase
    .from("rentals")
    .select(`
      rental_id,
      rental_date,
      due_date,
      return_date,
      rental_status,
      students ( student_id, name, email ),
      rental_items (
        quantity,
        gadgets (
          gadget_id,
          gadget_name,
          serial_number
        )
      ),
      damage_assessments (
        assessment_id,
        status
      ),
      rental_extensions!left (
        extension_id,
        status,
        new_due_date
      )
    `)
    .order("rental_date", { ascending: false });



    if (error) console.error("Error fetching rentals:", error);
    else setRentals(data);

    setLoading(false);
  }

    // ✅ Automatically create late fine transaction
  async function createLateFine(rental) {
    try {
      // calculate days overdue
      const due = new Date(rental.due_date);
      const returned = new Date();
      const daysLate = Math.ceil((returned - due) / (1000 * 60 * 60 * 24));
      if (daysLate <= 0) return; // no fine if returned on time

      const finePerDay = 50; // 💰 adjustable rate
      const totalFine = daysLate * finePerDay;

      const { error } = await supabase.from("transactions").insert([
        {
          student_id: rental.students?.student_id,
          rental_id: rental.rental_id,
          transaction_type: "Overdue Fine",
          amount: totalFine,
          status: "Unpaid",
          transaction_date: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      alert(`⚠️ Late return detected. ₱${totalFine} fine created for ${daysLate} day(s) overdue.`);
    } catch (error) {
      console.error("Error creating late fine:", error.message);
    }
  }


  async function handlePickup(rental) {
    try {
      // Step 1: Update rental status to Ongoing
      const { error: rentalError } = await supabase
        .from("rentals")
        .update({
          rental_status: "Ongoing",
          pickup_date: new Date().toISOString(),
        })
        .eq("rental_id", rental.rental_id);

      if (rentalError) throw rentalError;

      // Step 2: Mark all gadgets as "In Use"
      const { data: rentalItems, error: itemsError } = await supabase
        .from("rental_items")
        .select("gadget_id")
        .eq("rental_id", rental.rental_id);

      if (itemsError) throw itemsError;

      if (rentalItems?.length) {
        const gadgetIds = rentalItems.map((i) => i.gadget_id);
        const { error: gadgetError } = await supabase
          .from("gadgets")
          .update({ status: "In Use" })
          .in("gadget_id", gadgetIds);

        if (gadgetError) throw gadgetError;
      }

      alert("✅ Rental picked up and gadgets now marked as 'In Use'.");
      fetchRentals(); // refresh list
    } catch (error) {
      console.error("Error in pickup:", error.message);
      alert("Error processing pickup.");
    }
  }


  useEffect(() => {
    fetchRentals();
  }, []);

  useEffect(() => {
    // ✅ Real-time listener for any rental-related table changes
    const channel = supabase
      .channel("rentals_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rentals" },
        () => fetchRentals()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rental_extensions" },
        () => fetchRentals()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "damage_assessments" },
        () => fetchRentals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Reset pagination when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus]);



  async function handleMarkReturned(rental) {
    try {
      const confirmReturn = confirm(`Mark Rental #${rental.rental_id} as returned?`);
      if (!confirmReturn) return;

      // Step 1: Update rental status and return_date
      const { error: rentalError } = await supabase
        .from("rentals")
        .update({
          rental_status: "Completed",
          return_date: new Date().toISOString(),
        })
        .eq("rental_id", rental.rental_id);

      if (rentalError) throw rentalError;

      // Step 2: Get rental items (gadgets)
      const { data: rentalItems, error: itemsError } = await supabase
        .from("rental_items")
        .select("gadget_id")
        .eq("rental_id", rental.rental_id);

      if (itemsError) throw itemsError;

      // Step 3: Mark gadgets as "Available"
      if (rentalItems?.length) {
        const gadgetIds = rentalItems.map((i) => i.gadget_id);
        const { error: gadgetError } = await supabase
          .from("gadgets")
          .update({ status: "Available" })
          .in("gadget_id", gadgetIds);
        if (gadgetError) throw gadgetError;
      }
            // Step 4: Auto-create overdue fine if applicable
      await createLateFine(rental);

      alert("✅ Rental marked as returned and gadgets are now available.");
      fetchRentals(); // refresh data
    } catch (error) {
      console.error("Error marking as returned:", error.message);
      alert("❌ Failed to mark rental as returned.");
    }
  }



  // --- Stats ---
  const stats = useMemo(() => {
    const total = rentals.length;
    const pending = rentals.filter((r) => r.rental_status === "Pending").length;
    const ongoing = rentals.filter((r) => r.rental_status === "Ongoing").length;
    const completed = rentals.filter((r) => r.rental_status === "Completed").length;
    const lost = rentals.filter((r) => r.rental_status === "Lost").length;
    const overdue = rentals.filter(
      (r) =>
        r.rental_status === "Ongoing" &&
        r.due_date &&
        new Date(r.due_date) < new Date()
    ).length;

    return { total, pending, ongoing, completed, overdue, lost };

  }, [rentals]);

  if (loading) return <div className="text-gray-400">Loading rentals...</div>;

  // --- Filtered + Paginated Rentals ---
  const filteredRentals = rentals.filter((r) => {
    const matchStatus = filterStatus ? r.rental_status === filterStatus : true;
    const matchSearch = search
      ? r.students?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.rental_items?.some((i) =>
          i.gadgets?.gadget_name?.toLowerCase().includes(search.toLowerCase())
        )
      : true;
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filteredRentals.length / ITEMS_PER_PAGE);
  const paginatedRentals = filteredRentals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rentals</h1>
          <p className="text-sm text-gray-400">Manage student gadget rentals.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + New Rental
          </button>

          <button
            onClick={() => setShowExtensions(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            View Extensions
          </button>
        </div>

      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total" value={stats.total} color="blue" />
        <SummaryCard title="Pending" value={stats.pending} color="yellow" />
        <SummaryCard title="Ongoing" value={stats.ongoing} color="green" />
        <SummaryCard title="Completed" value={stats.completed} color="gray" />
        <SummaryCard title="Overdue" value={stats.overdue} color="red" />
        <SummaryCard title="Lost" value={stats.lost} color="orange" />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-900 p-4 rounded-lg">
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Reserved">Reserved</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search by student or gadget"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none w-full sm:w-72"
        />
      </div>



      {/* Rentals Table */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={["Student", "Rental Date", "Due Date", "Status", "Items", "Actions"]}
          rows={paginatedRentals.map((r) => [
            r.students?.name || "Unknown",
            new Date(r.rental_date).toLocaleDateString(),
            r.due_date ? new Date(r.due_date).toLocaleDateString() : "N/A",
            new Date(r.due_date) < new Date() && r.rental_status === "Ongoing" ? (
              <StatusBadge key={r.rental_id} status="Overdue" />
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <StatusBadge key={r.rental_id} status={r.rental_status} />
                {r.damage_assessments?.some(a => a.status === "Pending") && (
                  <span className="text-red-400 text-xs font-semibold">• Damage Flagged</span>
                )}
                {r.rental_extensions?.some(e => e.status === "Pending") && (
                  <span className="text-yellow-400 text-xs font-semibold">• Extension Pending</span>
                )}
              </div>
            ),
            r.rental_items?.map((i) => i.gadgets?.gadget_name).join(", ") || "—",
            <div key={`actions-${r.rental_id}`} className="flex gap-3">
              <button
                key={`view-${r.rental_id}`}
                onClick={() => setSelected(r)}
                className="text-blue-400 hover:underline"
              >
                View
              </button>

              {r.rental_status === "Approved" && (
                <button
                  onClick={() => handlePickup(r)}
                  className="text-green-400 hover:underline"
                >
                  Pick Up
                </button>
              )}

              {/* Actions for Ongoing Rentals */}
              {r.rental_status === "Ongoing" && (
                <>
                  <button
                    onClick={() => handleMarkReturned(r)}
                    className="text-green-400 hover:underline"
                  >
                    Mark Returned
                  </button>

                  {/* 🟧 Mark as Lost (only for ongoing, not yet returned) */}
                  <button
                    onClick={() => {
                      setSelectedRentalForTransaction(r);
                      setShowLostModal(true);
                    }}
                    className="text-orange-400 hover:underline"
                  >
                    Mark as Lost
                  </button>

                </>
              )}

              {/* Actions for Completed Rentals */}
              {r.rental_status === "Completed" && (
                <button
                  onClick={() => {
                    setSelectedRentalForTransaction(r);
                    setShowDamageModal(true);
                  }}
                  className="text-red-400 hover:underline"
                >
                  Flag Damage
                </button>
              )}

            </div>,
          ])}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-gray-400 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

      </section>

      {/* Add Rental Modal */}
      {showAddModal && (
        <AddRentalModal onClose={() => setShowAddModal(false)} onSaved={fetchRentals} />
      )}

      {showExtensions && (
        <RentalExtensionsModal
          onClose={() => setShowExtensions(false)}
          onUpdated={fetchRentals} // ✅ Auto refresh Rentals table after updates
        />
      )}

      {showDamageModal && (
        <AddDamageAssessmentModal
          rental={selectedRentalForTransaction}
          onClose={() => {
            setShowDamageModal(false);
            setSelectedRentalForTransaction(null);
            fetchRentals(); // refresh after flag
          }}
        />
      )}

      {showLostModal && (
        <AddLostAssessmentModal
          rental={selectedRentalForTransaction}
          onClose={() => {
            setShowLostModal(false);
            setSelectedRentalForTransaction(null);
            fetchRentals();
          }}
        />
      )}


      {/* View Rental Details */}
      {selected && (
        <Modal title={`Rental Details`} onClose={() => setSelected(null)}>
          <div className="space-y-2 text-sm">
            <p><b>Student:</b> {selected.students?.name}</p>
            <p><b>Email:</b> {selected.students?.email}</p>
            <p><b>Status:</b> {selected.rental_status}</p>
            <p><b>Rented on:</b> {new Date(selected.rental_date).toLocaleString()}</p>
            <p><b>Due date:</b> {selected.due_date ? new Date(selected.due_date).toLocaleString() : "N/A"}</p>
            {selected.return_date && (
              <p><b>Returned on:</b> {new Date(selected.return_date).toLocaleString()}</p>
            )}
            <p><b>Items:</b></p>
            <ul className="list-disc ml-5">
              {selected.rental_items?.map((i, idx) => (
                <li key={idx}>
                  {i.gadgets?.gadget_name} (x{i.quantity})
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ==========================
   Add Rental Modal Component
   ========================== */
function AddRentalModal({ onClose, onSaved }) {
  const [students, setStudents] = useState([]);
  const [gadgets, setGadgets] = useState([]);
  const [form, setForm] = useState({
    student_id: "",
    due_date: "",
    selectedGadgets: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchAvailableGadgets();
  }, []);

  async function fetchStudents() {
    const { data, error } = await supabase
      .from("students")
      .select("student_id, name")
      .order("name");
    if (error) console.error("Error loading students:", error);
    else setStudents(data);
  }

  async function fetchAvailableGadgets() {
    const { data, error } = await supabase
      .from("gadgets")
      .select("gadget_id, gadget_name, serial_number")
      .eq("status", "Available")
      .order("gadget_name");
    if (error) console.error("Error loading gadgets:", error);
    else setGadgets(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.student_id || !form.due_date || form.selectedGadgets.length === 0) {
      alert("Please fill out all fields and select at least one gadget.");
      return;
    }

    setLoading(true);

    // Step 1: Create rental
    const { data: rental, error: rentalError } = await supabase
      .from("rentals")
      .insert([
        {
          student_id: form.student_id,
          due_date: form.due_date,
          rental_status: "Reserved",
        },
      ])
      .select()
      .single();

    if (rentalError) {
      console.error("Error creating rental:", rentalError);
      alert("Error creating rental: " + rentalError.message);
      setLoading(false);
      return;
    }

    // Step 2: Add rental items
    const rentalItems = form.selectedGadgets.map((g) => ({
      rental_id: rental.rental_id,
      gadget_id: g,
      quantity: 1,
    }));
    const { error: itemsError } = await supabase.from("rental_items").insert(rentalItems);

    if (itemsError) {
      console.error("Error adding rental items:", itemsError);
      alert("Error adding rental items: " + itemsError.message);
    }

    // Step 3: Update gadget status
    await supabase.from("gadgets").update({ status: "Reserved" }).in("gadget_id", form.selectedGadgets);

    // Step 4: Create rental payment transaction
    const RENTAL_FEE = 200; // 💰 You can make this dynamic later
    const { error: transactionError } = await supabase.from("transactions").insert([
      {
        student_id: form.student_id,
        rental_id: rental.rental_id,
        transaction_type: "Rental Payment",
        amount: RENTAL_FEE,
        status: "Unpaid", // since they'll pay during pickup
        transaction_date: new Date().toISOString(),
      },
    ]);

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
    }


    alert("✅ Rental created successfully!");

    // Reset form
    setForm({ student_id: "", due_date: "", selectedGadgets: [] });

    // ✅ Trigger parent refresh & close
    onSaved?.();
    onClose();
    setLoading(false);
  } 

  function toggleGadgetSelection(id) {
    setForm((prev) => ({
      ...prev,
      selectedGadgets: prev.selectedGadgets.includes(id)
        ? prev.selectedGadgets.filter((gid) => gid !== id)
        : [...prev.selectedGadgets, id],
    }));
  }

  return (
    <Modal title="New Rental" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        {/* Student */}
        <div>
          <label className="block text-gray-400 mb-1">Student</label>
          <select
            value={form.student_id}
            onChange={(e) => setForm({ ...form, student_id: e.target.value })}
            className="w-full bg-gray-800 rounded px-3 py-2"
          >
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-gray-400 mb-1">Due Date</label>
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            className="w-full bg-gray-800 rounded px-3 py-2"
          />
        </div>

        {/* Gadgets */}
        <div>
          <label className="block text-gray-400 mb-1">Select Gadgets</label>
          <div className="max-h-40 overflow-y-auto bg-gray-800 rounded p-2">
            {gadgets.length === 0 ? (
              <p className="text-gray-500 text-sm">No available gadgets.</p>
            ) : (
              gadgets.map((g) => (
                <label
                  key={g.gadget_id}
                  className="flex items-center gap-2 py-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.selectedGadgets.includes(g.gadget_id)}
                    onChange={() => toggleGadgetSelection(g.gadget_id)}
                  />
                  <span>
                    {g.gadget_name} ({g.serial_number})
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            {loading ? "Creating..." : "Create Rental"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddDamageAssessmentModal({ rental, onClose }) {
  const [form, setForm] = useState({
    initial_notes: "",
    final_notes: "", 
    fine_amount: "",
    status: "Pending",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.initial_notes) {
      alert("Please enter assessment notes.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("damage_assessments").insert([
      {
        rental_id: rental.rental_id,
        initial_notes: form.initial_notes,
        final_notes: form.final_notes, // ✅ corrected
        fine_amount: Number(form.fine_amount) || null,
        date_flagged: new Date().toISOString(),
        status: form.status,
      },
    ]);


    setLoading(false);

    if (error) {
      console.error(error);
      alert("❌ Failed to save assessment.");
    } else {
      alert("✅ Damage/Loss assessment recorded!");
      onClose();
    }
  }

  return (
    <Modal title="Flag Damage or Loss" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <p>
          <b>Rental ID:</b> {rental?.rental_id}
        </p>
        <p>
          <b>Student:</b> {rental?.students?.name}
        </p>

        <div>
          <label className="block text-gray-400 mb-1">Initial Notes</label>
          <textarea
            value={form.initial_notes}
            onChange={(e) => setForm({ ...form, initial_notes: e.target.value })}
            className="w-full bg-gray-800 rounded px-3 py-2"
            rows={3}
            placeholder="Describe the issue..."
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-1">Final Notes (optional)</label>
          <input
            type="text"
            value={form.final_notes}
            onChange={(e) => setForm({ ...form, final_notes: e.target.value })}
            className="w-full bg-gray-800 rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-1">Fine Amount (₱)</label>
          <input
            type="number"
            value={form.fine_amount}
            onChange={(e) => setForm({ ...form, fine_amount: e.target.value })}
            className="w-full bg-gray-800 rounded px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            {loading ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddLostAssessmentModal({ rental, onClose }) {
  const [loading, setLoading] = useState(false);
  const LOST_FINE_RATE = 3000; // 💰 configurable fine rate

  async function handleSubmit() {
    if (!confirm("Are you sure you want to mark this rental as LOST?")) return;
    setLoading(true);

    try {
      // 1️⃣ Create lost damage assessment
      const { error: assessmentError } = await supabase
        .from("damage_assessments")
        .insert([
          {
            rental_id: rental.rental_id,
            initial_notes: "Item marked as lost by admin.",
            final_notice: "Lost",
            fine_amount: LOST_FINE_RATE,
            date_flagged: new Date().toISOString(),
            status: "Pending",
          },
        ]);

      if (assessmentError) throw assessmentError;

      // 2️⃣ Create lost fine transaction
      const { error: fineError } = await supabase.from("transactions").insert([
        {
          student_id: rental.students?.student_id,
          rental_id: rental.rental_id,
          transaction_type: "Lost Fine",
          amount: LOST_FINE_RATE,
          status: "Unpaid",
          transaction_date: new Date().toISOString(),
        },
      ]);
      if (fineError) throw fineError;

      // 3️⃣ Update gadgets → Lost
      const { data: rentalItems, error: itemsError } = await supabase
        .from("rental_items")
        .select("gadget_id")
        .eq("rental_id", rental.rental_id);

      if (itemsError) throw itemsError;

      if (rentalItems?.length) {
        const gadgetIds = rentalItems.map((i) => i.gadget_id);
        const { error: gadgetError } = await supabase
          .from("gadgets")
          .update({ status: "Lost" })
          .in("gadget_id", gadgetIds);
        if (gadgetError) throw gadgetError;
      }

      // 4️⃣ Mark rental itself as Lost
      const { error: rentalError } = await supabase
        .from("rentals")
        .update({
          rental_status: "Lost",
          return_date: new Date().toISOString(), // optional: record timestamp
        })
        .eq("rental_id", rental.rental_id);

      if (rentalError) throw rentalError;

      alert(
        `✅ Lost item recorded.\n💸 ₱${LOST_FINE_RATE} fine added.\n📦 Rental #${rental.rental_id} marked as LOST.`
      );
      onClose();
    } catch (error) {
      console.error("❌ Error marking as lost:", error.message);
      alert("❌ Failed to process lost rental.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Mark as Lost" onClose={onClose}>
      <div className="space-y-3 text-sm">
        <p><b>Rental ID:</b> {rental?.rental_id}</p>
        <p><b>Student:</b> {rental?.students?.name}</p>
        <p>This will:</p>
        <ul className="list-disc ml-5 text-gray-400">
          <li>Create a Lost report in Damage Assessments</li>
          <li>Add a Lost Fine of ₱{LOST_FINE_RATE}</li>
          <li>Mark gadgets as “Lost” in inventory</li>
          <li>Mark this rental as “Lost” in Rentals</li>
        </ul>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
          >
            {loading ? "Processing..." : "Confirm Lost"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RentalExtensionsModal({ onClose, onUpdated }) {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchExtensions();
  }, []);

  async function fetchExtensions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rental_extensions")
      .select(`
        extension_id,
        rental_id,
        new_due_date,
        status,
        request_date,
        rentals (
          students (name),
          due_date
        )
      `)
      .order("request_date", { ascending: false });

    if (error) console.error("Error fetching extensions:", error);
    else setExtensions(data || []);
    setLoading(false);
  }

  async function handleApprove(ext) {
    if (!confirm("Approve this rental extension?")) return;

    const EXTENSION_FEE = 100; // 💰 adjustable extension fee amount

    try {
      // Step 1️⃣ — Mark extension as approved
      const { error: updateError } = await supabase
        .from("rental_extensions")
        .update({ status: "Approved" })
        .eq("extension_id", ext.extension_id);

      if (updateError) throw updateError;

      // Step 2️⃣ — Update rental due date
      const { error: rentalError } = await supabase
        .from("rentals")
        .update({ due_date: ext.new_due_date })
        .eq("rental_id", ext.rental_id);

      if (rentalError) throw rentalError;

      // Step 3️⃣ — Fetch student_id for transaction creation
      const { data: rentalData, error: rentalFetchError } = await supabase
        .from("rentals")
        .select("student_id")
        .eq("rental_id", ext.rental_id)
        .single();

      if (rentalFetchError) throw rentalFetchError;

      // Step 4️⃣ — Create Extension Fee transaction
      const { error: transactionError } = await supabase.from("transactions").insert([
        {
          student_id: rentalData.student_id,
          rental_id: ext.rental_id,
          transaction_type: "Extension Fee",
          amount: EXTENSION_FEE,
          status: "Unpaid",
          transaction_date: new Date().toISOString(),
        },
      ]);

      if (transactionError) throw transactionError;

      alert(`✅ Extension approved, due date updated, and ₱${EXTENSION_FEE} extension fee created!`);
      fetchExtensions();
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error("Error approving extension:", error.message);
      alert("❌ Failed to approve extension request.");
    }
  }


  async function handleReject(id) {
    if (!confirm("Reject this extension request?")) return;
    const { error } = await supabase
      .from("rental_extensions")
      .update({ status: "Rejected" })
      .eq("extension_id", id);

    if (error) {
      console.error(error);
      alert("❌ Failed to reject extension.");
    } else {
      alert("❌ Extension rejected.");
      fetchExtensions();
      if (onUpdated) onUpdated();
    }
  }

  return (
    <Modal title="Rental Extension Requests" onClose={onClose}>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : extensions.length === 0 ? (
        <div className="text-gray-400 text-sm">No extension requests.</div>
      ) : (
        <div className="space-y-3 text-sm">
          {extensions.map((ext) => (
            <div
              key={ext.extension_id}
              className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"
            >
              <div>
                <p>
                  <b>Student:</b> {ext.rentals?.students?.name || "Unknown"}
                </p>
                <p>
                  <b>Current Due:</b>{" "}
                  {new Date(ext.rentals?.due_date).toLocaleDateString()}
                </p>
                <p>
                  <b>Requested New Due:</b>{" "}
                  {new Date(ext.new_due_date).toLocaleDateString()}
                </p>
                <p>
                  <b>Status:</b> <StatusBadge status={ext.status} />
                </p>
              </div>

              {ext.status === "Pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(ext)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(ext.extension_id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}