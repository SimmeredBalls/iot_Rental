import { useState } from "react";

export default function Transactions() {
  // --- Mock Transaction Data (Replace with Supabase fetch later) ---
  const [transactions, setTransactions] = useState([
    {
      id: 1,
      rental_id: 1001,
      student_name: "John Doe",
      type: "Damage Fine",
      amount: 250,
      status: "Paid",
      date: "2025-11-01",
      notes: "Broken Arduino pin",
    },
    {
      id: 2,
      rental_id: 1003,
      student_name: "Mike Johnson",
      type: "Lost Fine",
      amount: 500,
      status: "Unpaid",
      date: "2025-11-03",
      notes: "Lost multimeter",
    },
    {
      id: 3,
      rental_id: 1004,
      student_name: "Lisa Brown",
      type: "Late Fine",
      amount: 100,
      status: "Paid",
      date: "2025-10-29",
      notes: "Returned 2 days late",
    },
    {
      id: 4,
      rental_id: 1005,
      student_name: "Alex Lee",
      type: "Damage Fine",
      amount: 300,
      status: "Unpaid",
      date: "2025-11-02",
      notes: "Cracked case on ESP32",
    },
  ]);

  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // --- Stats for Summary Cards ---
  const totalFines = transactions.length;
  const totalPaid = transactions.filter((t) => t.status === "Paid").length;
  const totalUnpaid = transactions.filter((t) => t.status === "Unpaid").length;
  const totalCollected = transactions
    .filter((t) => t.status === "Paid")
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = [
    { title: "Total Fines", value: totalFines },
    { title: "Paid", value: totalPaid },
    { title: "Unpaid", value: totalUnpaid },
    { title: "Collected (₱)", value: totalCollected },
  ];

  // --- Filtering & Search ---
  const filteredTransactions = transactions.filter((t) => {
    const matchFilter = filter ? t.status === filter : true;
    const matchSearch = search
      ? t.student_name.toLowerCase().includes(search.toLowerCase()) ||
        t.type.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchFilter && matchSearch;
  });

  // --- Mark Payment Handler ---
  const handleMarkPaid = (id) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "Paid" } : t
      )
    );
  };

  return (
    <div className="space-y-8 text-white">
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-sm text-gray-400">
          Manage all fines and payment records.
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
            placeholder="Search by student or type"
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
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* ---------- TRANSACTIONS TABLE ---------- */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={["ID", "Student", "Type", "Amount", "Status", "Date", "Actions"]}
          rows={filteredTransactions.map((t) => [
            t.id,
            t.student_name,
            t.type,
            `₱${t.amount}`,
            <StatusBadge status={t.status} key={t.id} />,
            t.date,
            <div key={t.id} className="flex gap-2">
              {t.status === "Unpaid" && (
                <button
                  onClick={() => handleMarkPaid(t.id)}
                  className="text-green-400 hover:underline"
                >
                  Mark Paid
                </button>
              )}
              <button
                onClick={() => setSelected(t)}
                className="text-blue-400 hover:underline"
              >
                View
              </button>
            </div>,
          ])}
        />
      </section>

      {/* ---------- TRANSACTION DETAILS MODAL ---------- */}
      {selected && (
        <Modal title={`Transaction #${selected.id}`} onClose={() => setSelected(null)}>
          <div className="space-y-2 text-sm">
            <p><b>Student:</b> {selected.student_name}</p>
            <p><b>Rental ID:</b> {selected.rental_id}</p>
            <p><b>Type:</b> {selected.type}</p>
            <p><b>Amount:</b> ₱{selected.amount}</p>
            <p><b>Status:</b> <StatusBadge status={selected.status} /></p>
            <p><b>Date:</b> {selected.date}</p>
            <p><b>Notes:</b> {selected.notes}</p>

            {selected.status === "Unpaid" && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    handleMarkPaid(selected.id);
                    setSelected(null);
                  }}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                >
                  Mark as Paid
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- UI COMPONENTS ---------- */
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
                No transactions found
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
    status === "Paid"
      ? "bg-green-600"
      : status === "Unpaid"
      ? "bg-red-600"
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
