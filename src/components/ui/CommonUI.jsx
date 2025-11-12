// src/components/ui/CommonUI.jsx
import React from "react";

/* SummaryCard */
export function SummaryCard({ title, value, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-700",
    green: "from-green-500 to-green-700",
    red: "from-red-500 to-red-700",
    yellow: "from-yellow-500 to-yellow-700",
    gray: "from-gray-500 to-gray-700",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color] || colors.gray} rounded-xl p-4 shadow-md`}
    >
      <p className="text-sm opacity-80">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}

/* Table */
export function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            {headers.map((h) => (
              <th
                key={h}
                className="py-2 px-3 text-sm font-semibold text-gray-300"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="text-center py-6 text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-gray-800 hover:bg-gray-800/40"
              >
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

/* StatusBadge */
export function StatusBadge({ status }) {
  const color =
    status === "Available"
      ? "bg-green-600"
      : status === "Reserved"
      ? "bg-blue-600"
      : status === "Ongoing"
      ? "bg-emerald-600"
      : status === "Pending"
      ? "bg-yellow-600"
      : status === "Overdue"
      ? "bg-orange-600"
      : status === "In Repair"
      ? "bg-red-600"
      : status === "Lost"
      ? "bg-gray-700"
      : "bg-gray-600";


  return <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>;
}

/* Modal */
export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-2xl relative">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
    