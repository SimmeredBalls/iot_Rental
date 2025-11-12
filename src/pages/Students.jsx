import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SummaryCard, Table, StatusBadge, Modal } from "../components/ui/CommonUI";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, sortBy]);


  async function fetchStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("student_id, name, email, phone_number, major, year, account_status")
      .order("name");

    if (error) console.error("Error loading students:", error);
    else setStudents(data || []);
    setLoading(false);
  }

  async function handleDelete(student) {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;
    const { error } = await supabase.from("students").delete().eq("student_id", student.student_id);
    if (error) alert("❌ Error deleting student: " + error.message);
    else {
      alert("✅ Student deleted successfully!");
      fetchStudents();
    }
  }

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.account_status === "Active").length;
    const suspended = students.filter((s) => s.account_status === "Suspended").length;
    const pending = students.filter((s) => s.account_status === "Pending").length;
    return { total, active, suspended, pending };
  }, [students]);

  const filtered = students.filter((s) => {
    const matchSearch =
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? s.account_status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  if (loading)
    return <div className="text-gray-400 text-center mt-10">Loading students...</div>;


  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "year") return (a.year || 0) - (b.year || 0);
    if (sortBy === "status")
      return a.account_status.localeCompare(b.account_status, undefined, { sensitivity: "base" });
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginatedStudents = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );



  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-sm text-gray-400">Manage student accounts and profiles.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Student
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Students" value={stats.total} color="blue" />
        <SummaryCard title="Active" value={stats.active} color="green" />
        <SummaryCard title="Pending" value={stats.pending} color="yellow" />
        <SummaryCard title="Suspended" value={stats.suspended} color="red" />
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-900 p-4 rounded-lg">
        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="year">Sort by Year</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none w-full sm:w-72"
        />
      </div>


      {/* Students Table */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={["Name", "Email", "Phone", "Major", "Year", "Status", "Actions"]}
          rows={paginatedStudents.map((s) => [
            s.name,
            s.email,
            s.phone_number || "—",
            s.major || "—",
            s.year || "—",
            <StatusBadge key={s.student_id} status={s.account_status} />,
            <div key={`actions-${s.student_id}`} className="flex gap-3">
              <button
                onClick={() => setSelected(s)}
                className="text-blue-400 hover:underline"
              >
                View
              </button>
              <button
                onClick={() => setEditTarget(s)}
                className="text-yellow-400 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(s)}
                className="text-red-400 hover:underline"
              >
                Delete
              </button>
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

      {/* View Modal */}
      {selected && (
        <Modal title={`Details for ${selected.name}`} onClose={() => setSelected(null)}>
          <div className="space-y-2 text-sm">
            <p><b>Name:</b> {selected.name}</p>
            <p><b>Email:</b> {selected.email}</p>
            <p><b>Phone:</b> {selected.phone_number}</p>
            <p><b>Major:</b> {selected.major}</p>
            <p><b>Year:</b> {selected.year}</p>
            <p><b>Status:</b> {selected.account_status}</p>
          </div>

          <hr className="my-3 border-gray-700" />
          <StudentRentalsModal student={selected} />
        </Modal>
      )}



      {/* Add/Edit Modal */}
      {(showAddModal || editTarget) && (
        <AddOrEditStudentModal
          mode={editTarget ? "edit" : "add"}
          existing={editTarget}
          onClose={() => {
            setShowAddModal(false);
            setEditTarget(null);
          }}
          onSaved={fetchStudents}
        />
      )}
    </div>
  );
}

/* ---------- Student Rentals Modal ---------- */
function StudentRentalsModal({ student, onClose }) {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentRentals();
  }, []);

  async function fetchStudentRentals() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rentals")
      .select(`
        rental_id,
        rental_date,
        due_date,
        rental_status,
        rental_items ( quantity )
      `)
      .eq("student_id", student.student_id)
      .order("rental_date", { ascending: false });

    if (error) console.error("Error fetching student rentals:", error);
    else setRentals(data || []);
    setLoading(false);
  }

  return (
    <Modal title={`Rentals for ${student.name}`} onClose={onClose}>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading rentals...</div>
      ) : rentals.length === 0 ? (
        <div className="text-gray-400 text-sm">No rentals found.</div>
      ) : (
        <div className="space-y-3 text-sm">
          {rentals.map((r) => (
            <div
              key={r.rental_id}
              className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"
            >
              <div>
                <p><b>ID:</b> {r.rental_id}</p>
                <p><b>Status:</b> <StatusBadge status={r.rental_status} /></p>
                <p>
                  <b>Rented:</b> {new Date(r.rental_date).toLocaleDateString()}
                </p>
                <p>
                  <b>Due:</b> {new Date(r.due_date).toLocaleDateString()}
                </p>
                <p>
                  <b>Items:</b> {r.rental_items?.length || 0}
                </p>
              </div>
              <button
                className="text-blue-400 hover:underline"
                onClick={() => alert("This could open full rental details later")}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ---------- Add/Edit Student Modal ---------- */
function AddOrEditStudentModal({ mode = "add", existing = {}, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: existing.name || "",
    email: existing.email || "",
    phone_number: existing.phone_number || "",
    major: existing.major || "",
    year: existing.year || "",
    account_status: existing.account_status || "Active",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.email) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    const payload = {
      name: form.name,
      email: form.email,
      phone_number: form.phone_number,
      major: form.major,
      year: Number(form.year),
      account_status: form.account_status,
    };

    const query =
      mode === "add"
        ? supabase.from("students").insert([payload])
        : supabase.from("students").update(payload).eq("student_id", existing.student_id);

    const { error } = await query;
    setLoading(false);

    if (error) {
      alert("❌ Error saving student: " + error.message);
      console.error(error);
    } else {
      alert(`✅ Student ${mode === "add" ? "added" : "updated"} successfully!`);
      onSaved?.();
      onClose();
    }
  }

  return (
    <Modal
      title={mode === "add" ? "Add New Student" : "Edit Student"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-sm">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Phone Number" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
        <Input label="Major" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
        <Input
          label="Year"
          type="number"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        />

        <Select
          label="Account Status"
          value={form.account_status}
          onChange={(e) => setForm({ ...form, account_status: e.target.value })}
          options={["Active", "Pending", "Suspended"]}
        />

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
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            {loading ? "Saving..." : mode === "add" ? "Add" : "Update"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Small Input Components ---------- */
function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-gray-400 mb-1">{label}</label>
      <input {...props} className="w-full bg-gray-800 rounded px-3 py-2" />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-gray-400 mb-1">{label}</label>
      <select {...props} className="w-full bg-gray-800 rounded px-3 py-2">
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
