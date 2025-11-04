import { useState } from "react";

export default function Rentals() {
  // --- Mock Rentals Data (Replace with Supabase fetch later) ---
  const [rentals, setRentals] = useState([
    {
      rental_id: 1001,
      student_name: "John Doe",
      rental_date: "2025-10-20",
      due_date: "2025-11-05",
      return_date: null,
      status: "Pending",
      items: [{ serial: "SN-A001", gadget_name: "Arduino Uno", condition: "Good" }],
    },
    {
      rental_id: 1002,
      student_name: "Jane Smith",
      rental_date: "2025-10-22",
      due_date: "2025-11-06",
      return_date: null,
      status: "For Pick-Up",
      items: [{ serial: "SN-B015", gadget_name: "ESP32 Dev Board", condition: "Good" }],
    },
    {
      rental_id: 1003,
      student_name: "Mike Johnson",
      rental_date: "2025-10-25",
      due_date: "2025-11-01",
      return_date: null,
      status: "Active",
      items: [{ serial: "SN-C009", gadget_name: "Raspberry Pi 4", condition: "Good" }],
    },
    {
      rental_id: 1004,
      student_name: "Lisa Brown",
      rental_date: "2025-10-10",
      due_date: "2025-10-20",
      return_date: "2025-10-21",
      status: "Returned",
      items: [{ serial: "SN-D011", gadget_name: "Ultrasonic Sensor", condition: "Good" }],
    },
    {
      rental_id: 1005,
      student_name: "Alex Lee",
      rental_date: "2025-10-15",
      due_date: "2025-10-25",
      return_date: null,
      status: "Overdue",
      items: [{ serial: "SN-E007", gadget_name: "Multimeter", condition: "Good" }],
    },
  ]);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [damageModal, setDamageModal] = useState(null);
  const [fines, setFines] = useState([]);

  // --- Status Counts ---
  const stats = {
    Pending: rentals.filter((r) => r.status === "Pending").length,
    "For Pick-Up": rentals.filter((r) => r.status === "For Pick-Up").length,
    Active: rentals.filter((r) => r.status === "Active").length,
    Returned: rentals.filter((r) => r.status === "Returned").length,
    Overdue: rentals.filter((r) => r.status === "Overdue").length,
  };

  // --- Filtering & Searching Logic ---
  const filteredRentals = rentals.filter((r) => {
    const matchFilter = filter ? r.status === filter : true;
    const matchSearch = search
      ? r.student_name.toLowerCase().includes(search.toLowerCase()) ||
        r.items.some((item) =>
          item.gadget_name.toLowerCase().includes(search.toLowerCase())
        )
      : true;
    return matchFilter && matchSearch;
  });

  // --- Action Handlers ---
  const updateStatus = (rental_id, newStatus) => {
    setRentals((prev) =>
      prev.map((r) =>
        r.rental_id === rental_id ? { ...r, status: newStatus } : r
      )
    );
  };

  const handleAssessDamage = (rental, item, condition, cost, notes) => {
    // create fine record
    const newFine = {
      rental_id: rental.rental_id,
      student_name: rental.student_name,
      item: item.gadget_name,
      type: condition === "Damaged" ? "Damage Fine" : "Lost Fine",
      amount: cost,
      notes,
      status: "Unpaid",
    };
    setFines((prev) => [...prev, newFine]);

    // update rental item condition
    const updated = rentals.map((r) => {
      if (r.rental_id === rental.rental_id) {
        return {
          ...r,
          items: r.items.map((i) =>
            i.serial === item.serial ? { ...i, condition } : i
          ),
        };
      }
      return r;
    });
    setRentals(updated);
    setDamageModal(null);
    alert("Damage assessment recorded and fine added!");
  };

  return (
    <div className="space-y-8 text-white">
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rentals Management</h1>
        <p className="text-sm text-gray-400">
          Manage and track all gadget rentals.
        </p>
      </div>

      {/* ---------- STATUS STATS ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Object.entries(stats).map(([label, value]) => (
          <SummaryCard key={label} title={label} value={value} />
        ))}
      </div>

      {/* ---------- FILTERS ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by student or gadget"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none w-60"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {Object.keys(stats).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ---------- RENTALS TABLE ---------- */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={[
            "Rental ID",
            "Student",
            "Status",
            "Rental Date",
            "Due Date",
            "Return Date",
            "Actions",
          ]}
          rows={filteredRentals.map((r) => [
            r.rental_id,
            r.student_name,
            <StatusBadge status={r.status} key={r.rental_id} />,
            r.rental_date,
            r.due_date,
            r.return_date ? r.return_date : "—",
            <ActionButtons
              rental={r}
              onUpdateStatus={updateStatus}
              onView={() => setSelected(r)}
              onAssess={() => setDamageModal(r)}
            />,
          ])}
        />
      </section>

      {/* ---------- RENTAL DETAILS MODAL ---------- */}
      {selected && (
        <Modal title={`Rental #${selected.rental_id}`} onClose={() => setSelected(null)}>
          <div className="space-y-3 text-sm">
            <p><b>Student:</b> {selected.student_name}</p>
            <p><b>Rental Date:</b> {selected.rental_date}</p>
            <p><b>Due Date:</b> {selected.due_date}</p>
            <p><b>Status:</b> <StatusBadge status={selected.status} /></p>

            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Rented Items</h4>
              <Table
                headers={["Serial", "Gadget Name", "Condition"]}
                rows={selected.items.map((i) => [
                  i.serial,
                  i.gadget_name,
                  i.condition,
                ])}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- DAMAGE ASSESSMENT MODAL ---------- */}
      {damageModal && (
        <DamageModal
          rental={damageModal}
          onClose={() => setDamageModal(null)}
          onAssess={handleAssessDamage}
        />
      )}
    </div>
  );
}

/* ---------- REUSABLE COMPONENTS ---------- */
function SummaryCard({ title, value }) {
  const colors = {
    Pending: "from-yellow-500 to-yellow-700",
    "For Pick-Up": "from-blue-500 to-blue-700",
    Active: "from-green-500 to-green-700",
    Returned: "from-purple-500 to-purple-700",
    Overdue: "from-red-500 to-red-700",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[title] || "from-gray-600 to-gray-800"} rounded-xl p-4 shadow-md flex flex-col justify-between`}
    >
      <p className="text-sm opacity-80">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            {headers.map((h) => (
              <th key={h} className="py-2 px-3 text-sm font-semibold text-gray-300">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="text-center py-3 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40">
                {r.map((cell, j) => (
                  <td key={j} className="py-2 px-3 text-sm">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActionButtons({ rental, onUpdateStatus, onView, onAssess }) {
  const { status, rental_id } = rental;

  switch (status) {
    case "Pending":
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onUpdateStatus(rental_id, "For Pick-Up")}
            className="text-green-400 hover:underline"
          >
            Approve
          </button>
          <button
            onClick={() => onUpdateStatus(rental_id, "Denied")}
            className="text-red-400 hover:underline"
          >
            Deny
          </button>
        </div>
      );

    case "For Pick-Up":
      return (
        <button
          onClick={() => onUpdateStatus(rental_id, "Active")}
          className="text-blue-400 hover:underline"
        >
          Mark Picked Up
        </button>
      );

    case "Active":
      return (
        <div className="flex gap-2">
          <button
            onClick={() => onUpdateStatus(rental_id, "Returned")}
            className="text-green-400 hover:underline"
          >
            Mark Returned
          </button>
          <button
            onClick={() => onAssess(rental, rental.items[0], "Lost", 500, "Lost item")}
            className="text-red-400 hover:underline"
          >
            Mark Lost
          </button>
        </div>
      );

    case "Returned":
      return (
        <button
          onClick={() => onAssess(rental)}
          className="text-yellow-400 hover:underline"
        >
          Assess Damage
        </button>
      );

    default:
      return (
        <button onClick={onView} className="text-blue-400 hover:underline">
          View
        </button>
      );
  }
}

function StatusBadge({ status }) {
  const color =
    status === "Active"
      ? "bg-green-600"
      : status === "Pending"
      ? "bg-yellow-600"
      : status === "Returned"
      ? "bg-blue-600"
      : status === "For Pick-Up"
      ? "bg-purple-600"
      : status === "Overdue"
      ? "bg-red-600"
      : "bg-gray-600";
  return (
    <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-2xl relative">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        {children}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function DamageModal({ rental, onClose, onAssess }) {
  const [selectedItem, setSelectedItem] = useState(rental.items[0]);
  const [condition, setCondition] = useState("Damaged");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Modal title={`Assess Damage - Rental #${rental.rental_id}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div>
          <label className="block mb-1 text-gray-400">Select Item</label>
          <select
            value={selectedItem.serial}
            onChange={(e) =>
              setSelectedItem(
                rental.items.find((i) => i.serial === e.target.value)
              )
            }
            className="bg-gray-800 rounded px-3 py-2 w-full"
          >
            {rental.items.map((i) => (
              <option key={i.serial} value={i.serial}>
                {i.gadget_name} ({i.serial})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-gray-400">Condition</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 w-full"
          >
            <option value="Damaged">Damaged</option>
            <option value="Lost">Lost</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-gray-400">Fee (₱)</label>
          <input
            type="number"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 w-full"
            placeholder="Enter fine amount"
          />
        </div>

        <div>
          <label className="block mb-1 text-gray-400">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 w-full"
            placeholder="Describe damage or loss"
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => onAssess(rental, selectedItem, condition, cost, notes)}
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded"
          >
            Save Assessment
          </button>
        </div>
      </div>
    </Modal>
  );
}
