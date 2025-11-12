// src/pages/Transactions.jsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SummaryCard, Table, StatusBadge, Modal } from "../components/ui/CommonUI";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ✅ Fetch from Supabase
  async function fetchTransactions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        transaction_id,
        transaction_type,
        amount,
        status,
        transaction_date,
        payment_method,
        payment_reference_id,
        students (name, email),
        rentals (rental_id)
      `)
      .order("transaction_date", { ascending: false });

    if (error) console.error("Error fetching transactions:", error);
    else setTransactions(data || []);
    setLoading(false);
  }

  // ✅ Mark as Paid
  async function handleMarkPaid(transaction_id) {
    const confirmPay = confirm("Mark this transaction as paid?");
    if (!confirmPay) return;

    const { error } = await supabase
      .from("transactions")
      .update({ status: "Paid" })
      .eq("transaction_id", transaction_id);

    if (error) {
      console.error("Error updating payment status:", error);
      alert("Failed to mark as paid.");
      return;
    }

    alert("✅ Transaction marked as paid!");
    fetchTransactions();
  }

  // ✅ Derived Stats
  const stats = useMemo(() => {
    const total = transactions.length;
    const paid = transactions.filter((t) => t.status === "Paid").length;
    const unpaid = transactions.filter((t) => t.status === "Unpaid").length;
    const collected = transactions
      .filter((t) => t.status === "Paid")
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    return { total, paid, unpaid, collected };
  }, [transactions]);

  // ✅ Filters + Search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchFilter = filter ? t.status === filter : true;
      const matchSearch = search
        ? t.students?.name?.toLowerCase().includes(search.toLowerCase()) ||
          t.transaction_type?.toLowerCase().includes(search.toLowerCase())
        : true;
      return matchFilter && matchSearch;
    });
  }, [transactions, filter, search]);

  if (loading) return <div className="text-gray-400">Loading transactions...</div>;

  return (
    <div className="space-y-8 text-white">
      {/* ---------- HEADER ---------- */}
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-sm text-gray-400">
          View and manage all system-generated fines and payments.
        </p>
      </div>

      {/* ---------- SUMMARY CARDS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Transactions" value={stats.total} color="blue" />
        <SummaryCard title="Paid" value={stats.paid} color="green" />
        <SummaryCard title="Unpaid" value={stats.unpaid} color="red" />
        <SummaryCard title="Collected (₱)" value={stats.collected} color="yellow" />
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

      {/* ---------- TABLE ---------- */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={[
            "Transaction ID",
            "Student",
            "Type",
            "Amount",
            "Status",
            "Date",
            "Actions",
          ]}
          rows={filteredTransactions.map((t) => [
            t.transaction_id,
            t.students?.name || "Unknown",
            t.transaction_type,
            `₱${t.amount}`,
            <StatusBadge status={t.status} key={t.transaction_id} />,
            new Date(t.transaction_date).toLocaleDateString(),
            <div key={`actions-${t.transaction_id}`} className="flex gap-2">
              {t.status === "Unpaid" && (
                <button
                  onClick={() => handleMarkPaid(t.transaction_id)}
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

      {/* ---------- MODAL ---------- */}
      {selected && (
        <Modal
          title={`Transaction #${selected.transaction_id}`}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-2 text-sm">
            <p><b>Student:</b> {selected.students?.name}</p>
            <p><b>Email:</b> {selected.students?.email}</p>
            <p><b>Rental ID:</b> {selected.rentals?.rental_id || "N/A"}</p>
            <p><b>Type:</b> {selected.transaction_type}</p>
            <p><b>Amount:</b> ₱{selected.amount}</p>
            <p><b>Status:</b> <StatusBadge status={selected.status} /></p>
            <p><b>Date:</b> {new Date(selected.transaction_date).toLocaleString()}</p>
            <p><b>Payment Method:</b> {selected.payment_method || "N/A"}</p>
            <p><b>Reference ID:</b> {selected.payment_reference_id || "—"}</p>
          </div>

          {selected.status === "Unpaid" && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  handleMarkPaid(selected.transaction_id);
                  setSelected(null);
                }}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
              >
                Mark as Paid
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
