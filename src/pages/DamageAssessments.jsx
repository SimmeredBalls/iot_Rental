import { useState } from "react";

export default function DamageAssessments() {
  const [assessments, setAssessments] = useState([
    {
      id: 1,
      rental_id: 1001,
      student_name: "John Doe",
      gadget_name: "Arduino Uno",
      serial: "SN-A001",
      issue: "Broken pin and casing",
      condition: "Damaged",
      date_reported: "2025-11-01",
      fine_amount: 250,
      status: "Pending",
    },
    {
      id: 2,
      rental_id: 1003,
      student_name: "Mike Johnson",
      gadget_name: "Digital Multimeter",
      serial: "SN-M020",
      issue: "Lost item - not returned",
      condition: "Lost",
      date_reported: "2025-11-03",
      fine_amount: 500,
      status: "Resolved",
    },
    {
      id: 3,
      rental_id: 1005,
      student_name: "Alex Lee",
      gadget_name: "ESP32 Dev Board",
      serial: "SN-E003",
      issue: "Cracked board, short circuit",
      condition: "Damaged",
      date_reported: "2025-11-02",
      fine_amount: 300,
      status: "Pending",
    },
  ]);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // --- Stats ---
  const total = assessments.length;
  const pending = assessments.filter((a) => a.status === "Pending").length;
  const resolved = assessments.filter((a) => a.status === "Resolved").length;
  const totalFines = assessments.reduce((sum, a) => sum + a.fine_amount, 0);

  const stats = [
    { title: "Total Reports", value: total },
    { title: "Pending", value: pending },
    { title: "Resolved", value: resolved },
    { title: "Total Fines (₱)", value: totalFines },
  ];

  // --- Filters ---
  const filteredAssessments = assessments.filter((a) => {
    const matchFilter = filter ? a.status === filter : true;
    const matchSearch = search
      ? a.student_name.toLowerCase().includes(search.toLowerCase()) ||
        a.gadget_name.toLowerCase().includes(search.toLowerCase()) ||
        a.serial.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchFilter && matchSearch;
  });

  // --- Actions ---
  const markResolved = (id) => {
    setAssessments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "Resolved" } : a
      )
    );
  };

  const createFine = (assessment) => {
    alert(`Fine created for ${assessment.student_name}: ₱${assessment.fine_amount}`);
    markResolved(assessment.id);
  };

  return (
    <div className="space-y-8 text-white">
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Damage Assessments</h1>
        <p className="text-sm text-gray-400">
          Review and manage all damaged or lost gadget reports.
        </p>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <SummaryCard key={s.title} title={s.title} value={s.value} />
        ))}
      </div>

      {/* ---------- FILTERS ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by student, gadget, or serial"
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
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* ---------- TABLE ---------- */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={[
            "ID",
            "Student",
            "Gadget",
            "Serial",
            "Condition",
            "Date Reported",
            "Fine (₱)",
            "Status",
            "Actions",
          ]}
          rows={filteredAssessments.map((a) => [
            a.id,
            a.student_name,
            a.gadget_name,
            a.serial,
            a.condition,
            a.date_reported,
            a.fine_amount,
            <StatusBadge status={a.status} key={a.id} />,
            <div key={a.id} className="flex gap-2">
              {a.status === "Pending" && (
                <>
                  <button
                    onClick={() => createFine(a)}
                    className="text-green-400 hover:underline"
                  >
                    Create Fine
                  </button>
                  <button
                    onClick={() => setSelected(a)}
                    className="text-blue-400 hover:underline"
                  >
                    View
                  </button>
                </>
              )}
              {a.status === "Resolved" && (
                <button
                  onClick={() => setSelected(a)}
                  className="text-gray-400 hover:underline"
                >
                  View
                </button>
              )}
            </div>,
          ])}
        />
      </section>

      {/* ---------- MODAL ---------- */}
      {selected && (
        <Modal title={`Assessment #${selected.id}`} onClose={() => setSelected(null)}>
          <div className="space-y-3 text-sm">
            <p><b>Student:</b> {selected.student_name}</p>
            <p><b>Rental ID:</b> {selected.rental_id}</p>
            <p><b>Gadget:</b> {selected.gadget_name}</p>
            <p><b>Serial:</b> {selected.serial}</p>
            <p><b>Condition:</b> {selected.condition}</p>
            <p><b>Issue:</b> {selected.issue}</p>
            <p><b>Date Reported:</b> {selected.date_reported}</p>
            <p><b>Fine Amount:</b> ₱{selected.fine_amount}</p>
            <p><b>Status:</b> <StatusBadge status={selected.status} /></p>

            {selected.status === "Pending" && (
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    createFine(selected);
                    setSelected(null);
                  }}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                >
                  Create Fine
                </button>
                <button
                  onClick={() => {
                    markResolved(selected.id);
                    setSelected(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- COMPONENTS ---------- */
function SummaryCard({ title, value }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-md text-center">
      <p className="text-sm text-gray-400">{title}</p>
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
                No reports found
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
    status === "Pending"
      ? "bg-yellow-600"
      : status === "Resolved"
      ? "bg-green-600"
      : "bg-gray-600";
  return <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md relative">
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
