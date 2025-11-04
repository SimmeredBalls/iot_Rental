import { useState, useEffect } from "react";

export default function Dashboard() {
  // --- Mock Data (to be replaced with Supabase later) ---
  const [stats, setStats] = useState({
    totalRentals: 42,
    activeRentals: 16,
    overdueRentals: 4,
    totalStudents: 58,
    inventoryItems: 27,
    damagedUnits: 3, // NEW: gadget units currently marked as damaged
    pendingAssessments: 2, // NEW: unresolved damage assessments
  });

  const [rentals, setRentals] = useState([
    {
      rental_id: 1001,
      student_name: "John Doe",
      item_name: "Arduino Uno",
      status: "Active",
      due_date: "2025-11-10",
    },
    {
      rental_id: 1002,
      student_name: "Jane Smith",
      item_name: "ESP32 Dev Board",
      status: "Pending",
      due_date: "2025-11-04",
    },
  ]);

  // --- NEW: Mock Damage Assessments data ---
  const [assessments, setAssessments] = useState([
    {
      assessment_id: 1,
      gadget_name: "Arduino Uno - SN A001",
      rental_id: 1001,
      fine_amount: 250,
      status: "Paid",
      date_flagged: "2025-10-28",
    },
    {
      assessment_id: 2,
      gadget_name: "ESP32 Dev Board - SN A004",
      rental_id: 1005,
      fine_amount: 500,
      status: "Pending",
      date_flagged: "2025-11-01",
    },
  ]);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // Filter & Search logic for rentals
  const filteredRentals = rentals.filter((r) => {
    const matchFilter = filter ? r.status === filter : true;
    const matchSearch = search
      ? r.student_name.toLowerCase().includes(search.toLowerCase()) ||
        r.item_name.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-8 text-white">
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-400">
          Welcome back, Admin — here’s an overview of the system today.
        </p>
      </div>

      {/* ---------- SUMMARY CARDS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard title="Total Rentals" value={stats.totalRentals} color="blue" />
        <SummaryCard title="Active Rentals" value={stats.activeRentals} color="green" />
        <SummaryCard title="Overdue Rentals" value={stats.overdueRentals} color="red" />
        <SummaryCard title="Damaged Units" value={stats.damagedUnits} color="orange" />
        <SummaryCard title="Pending Assessments" value={stats.pendingAssessments} color="purple" />
      </div>

      {/* ---------- RENTALS OVERVIEW ---------- */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h2 className="text-xl font-semibold mb-2 sm:mb-0">Recent Rentals</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by student or item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none w-48"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 rounded px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Returned">Returned</option>
            </select>
          </div>
        </div>

        <Table
          headers={["Rental ID", "Student", "Item", "Status", "Due Date", "Action"]}
          rows={filteredRentals.map((r) => [
            r.rental_id,
            r.student_name,
            r.item_name,
            <StatusBadge status={r.status} key={r.rental_id} />,
            r.due_date,
            <button
              key={`view-${r.rental_id}`}
              onClick={() => setSelected(r)}
              className="text-blue-400 hover:underline"
            >
              View
            </button>,
          ])}
        />
      </section>

      {/* ---------- DAMAGE ASSESSMENTS OVERVIEW ---------- */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Damage Assessments</h2>
          <button className="text-sm text-blue-400 hover:underline">
            View All →
          </button>
        </div>

        <Table
          headers={["Assessment ID", "Gadget", "Rental ID", "Fine", "Status", "Date Flagged"]}
          rows={assessments.map((a) => [
            a.assessment_id,
            a.gadget_name,
            a.rental_id,
            `₱${a.fine_amount}`,
            <StatusBadge
              status={a.status === "Paid" ? "Active" : "Pending"}
              key={a.assessment_id}
            />,
            a.date_flagged,
          ])}
        />
      </section>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */
function SummaryCard({ title, value, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-700",
    green: "from-green-500 to-green-700",
    red: "from-red-500 to-red-700",
    orange: "from-orange-500 to-orange-700",
    purple: "from-purple-500 to-purple-700",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 shadow-md flex flex-col justify-between`}
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

function StatusBadge({ status }) {
  const color =
    status === "Active"
      ? "bg-green-600"
      : status === "Pending"
      ? "bg-yellow-600"
      : "bg-gray-600";
  return (
    <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>
  );
}
