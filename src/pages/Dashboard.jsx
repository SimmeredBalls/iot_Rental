// src/pages/Dashboard.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SummaryCard, Table, StatusBadge } from "../components/ui/CommonUI";

export default function Dashboard() {
  const [gadgets, setGadgets] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);

    const [gadgetsRes, rentalsRes, transactionsRes, studentsRes] = await Promise.all([
      supabase.from("gadgets").select("status"),
      supabase.from("rentals").select("rental_status, due_date"),
      supabase.from("transactions").select("status, amount, transaction_type, transaction_date, students (name)"),
      supabase.from("students").select("student_id"),
    ]);

    if (gadgetsRes.error) console.error(gadgetsRes.error);
    if (rentalsRes.error) console.error(rentalsRes.error);
    if (transactionsRes.error) console.error(transactionsRes.error);
    if (studentsRes.error) console.error(studentsRes.error);

    setGadgets(gadgetsRes.data || []);
    setRentals(rentalsRes.data || []);
    setTransactions(transactionsRes.data || []);
    setStudents(studentsRes.data || []);
    setLoading(false);
  }

  // Derived stats
  const stats = useMemo(() => {
    const totalGadgets = gadgets.length;
    const available = gadgets.filter((g) => g.status === "Available").length;
    const inUse = gadgets.filter((g) => g.status === "In Use").length;
    const lost = gadgets.filter((g) => g.status === "Lost").length;

    const totalRentals = rentals.length;
    const ongoing = rentals.filter((r) => r.rental_status === "Ongoing").length;
    const overdue = rentals.filter(
      (r) => r.rental_status === "Ongoing" && new Date(r.due_date) < new Date()
    ).length;

    const unpaidTransactions = transactions.filter((t) => t.status === "Unpaid");
    const unpaidTotal = unpaidTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const paidTotal = transactions
      .filter((t) => t.status === "Paid")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalStudents = students.length;

    return {
      totalGadgets,
      available,
      inUse,
      lost,
      totalRentals,
      ongoing,
      overdue,
      totalStudents,
      unpaidTotal,
      paidTotal,
    };
  }, [gadgets, rentals, transactions, students]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
      .slice(0, 5);
  }, [transactions]);

  if (loading) return <div className="text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-400">
          Overview of your inventory, rentals, and payments.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Gadgets" value={stats.totalGadgets} color="blue" />
        <SummaryCard title="Available" value={stats.available} color="green" />
        <SummaryCard title="In Use" value={stats.inUse} color="yellow" />
        <SummaryCard title="Lost" value={stats.lost} color="red" />

        <SummaryCard title="Total Rentals" value={stats.totalRentals} color="purple" />
        <SummaryCard title="Ongoing" value={stats.ongoing} color="cyan" />
        <SummaryCard title="Overdue" value={stats.overdue} color="orange" />

        <SummaryCard title="Students" value={stats.totalStudents} color="teal" />
        <SummaryCard title="Unpaid Fines (₱)" value={stats.unpaidTotal} color="red" />
        <SummaryCard title="Collected (₱)" value={stats.paidTotal} color="yellow" />
      </div>

      {/* Recent Transactions */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-400 text-sm">No transactions yet.</p>
        ) : (
          <Table
            headers={["Student", "Type", "Amount", "Status", "Date"]}
            rows={recentTransactions.map((t) => [
              t.students?.name || "Unknown",
              t.transaction_type,
              `₱${t.amount}`,
              <StatusBadge status={t.status} key={t.transaction_id} />,
              new Date(t.transaction_date).toLocaleDateString(),
            ])}
          />
        )}
      </section>
    </div>
  );
}
