import { useEffect, useState } from "react";

const mockData = {
  summary: {
    totalRentals: 24,
    pendingRentals: 4,
    activeRentals: 10,
    overdueRentals: 3,
    totalTransactions: 18,
    totalGadgets: 14,
  },
  recentRentals: [
    { rental_id: 101, student_name: "Juan Dela Cruz", status: "Pending", due_date: "2025-11-06" },
    { rental_id: 102, student_name: "Maria Santos", status: "Active", due_date: "2025-11-05" },
    { rental_id: 103, student_name: "John Lim", status: "Completed", due_date: "2025-11-01" },
  ],
  recentTransactions: [
    { transaction_id: 501, transaction_type: "Damage Fee", amount: 200, status: "Unpaid" },
    { transaction_id: 502, transaction_type: "Rental Payment", amount: 100, status: "Paid" },
  ],
  recentGadgets: [
    { gadget_id: 201, gadget_name: "ESP32 Kit", status: "Available" },
    { gadget_id: 202, gadget_name: "Arduino Starter Kit", status: "Rented" },
  ],
};

export default function Dashboard() {
  const [data, setData] = useState(mockData);

  useEffect(() => {
    setData(mockData);
  }, []);

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card title="Pending Rentals" value={data.summary.pendingRentals} color="bg-blue-600" />
        <Card title="Active Rentals" value={data.summary.activeRentals} color="bg-green-600" />
        <Card title="Overdue Rentals" value={data.summary.overdueRentals} color="bg-yellow-600" />
        <Card title="Total Rentals" value={data.summary.totalRentals} color="bg-indigo-600" />
        <Card title="Transactions" value={data.summary.totalTransactions} color="bg-purple-600" />
        <Card title="Gadgets" value={data.summary.totalGadgets} color="bg-gray-700" />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Recent Rentals">
          <Table
            headers={["Rental ID", "Student", "Status", "Due Date"]}
            rows={data.recentRentals.map(r => [r.rental_id, r.student_name, r.status, r.due_date])}
          />
        </Section>

        <Section title="Recent Transactions">
          <Table
            headers={["Transaction ID", "Type", "Amount", "Status"]}
            rows={data.recentTransactions.map(t => [t.transaction_id, t.transaction_type, `₱${t.amount}`, t.status])}
          />
        </Section>

        <Section title="Recent Gadgets Added">
          <Table
            headers={["Gadget ID", "Name", "Status"]}
            rows={data.recentGadgets.map(g => [g.gadget_id, g.gadget_name, g.status])}
          />
        </Section>
      </div>
    </div>
  );
}

/* Helper components */
function Card({ title, value, color }) {
  return (
    <div className={`${color} p-4 rounded-lg shadow text-center`}>
      <p className="text-sm opacity-80">{title}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      {children}
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
              <th key={h} className="py-2 px-3 text-sm font-semibold text-gray-300">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="text-center py-3 text-gray-500">No data</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
                {r.map((cell, j) => (
                  <td key={j} className="py-2 px-3 text-sm">{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
