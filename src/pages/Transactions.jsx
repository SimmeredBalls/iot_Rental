import { useState } from "react";

const initialTransactions = [
  {
    transaction_id: 1,
    transaction_type: "Rental Payment",
    amount: 150,
    status: "Paid",
    transaction_date: "2025-11-01",
    student_name: "Juan Dela Cruz",
    payment_method: "Cash",
    payment_reference_id: "TRX001",
  },
  {
    transaction_id: 2,
    transaction_type: "Damage Fee",
    amount: 200,
    status: "Unpaid",
    transaction_date: "2025-11-02",
    student_name: "Maria Santos",
    payment_method: "Online",
    payment_reference_id: "-",
  },
  {
    transaction_id: 3,
    transaction_type: "Extension Fee",
    amount: 50,
    status: "Paid",
    transaction_date: "2025-11-01",
    student_name: "John Lim",
    payment_method: "Cash",
    payment_reference_id: "TRX002",
  },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);

  const handleMarkPaid = (id) => {
    setTransactions(transactions.map(t =>
      t.transaction_id === id ? { ...t, status: "Paid" } : t
    ));
    setModal(null);
  };

  const handleNewTransaction = () => {
    setModal("addTransaction");
  };

  const handleAddTransaction = (newTxn) => {
    const newEntry = {
      transaction_id: transactions.length + 1,
      transaction_date: new Date().toISOString().split("T")[0],
      ...newTxn,
    };
    setTransactions([...transactions, newEntry]);
    setModal(null);
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <button
          onClick={handleNewTransaction}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          + New Transaction
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg shadow">
        <Table
          headers={[
            "Transaction ID",
            "Type",
            "Amount",
            "Status",
            "Date",
            "Student",
            "Payment Method",
            "Reference ID",
            "Actions",
          ]}
          rows={transactions.map(t => [
            t.transaction_id,
            t.transaction_type,
            `₱${t.amount}`,
            <StatusBadge status={t.status} key={t.transaction_id} />,
            t.transaction_date,
            t.student_name,
            t.payment_method,
            t.payment_reference_id,
            <div className="space-x-2" key={`btn-${t.transaction_id}`}>
              {t.status === "Unpaid" && (
                <Button
                  color="blue"
                  label="Mark as Paid"
                  onClick={() => {
                    setSelected(t);
                    setModal("markPaid");
                  }}
                />
              )}
            </div>,
          ])}
        />
      </div>

      {/* MARK AS PAID MODAL */}
      {modal === "markPaid" && selected && (
        <Modal title="Mark Transaction as Paid" onClose={() => setModal(null)}>
          <p>
            Mark <b>{selected.student_name}</b>’s <b>{selected.transaction_type}</b> as paid?
          </p>
          <ActionRow
            onCancel={() => setModal(null)}
            onConfirm={() => handleMarkPaid(selected.transaction_id)}
            confirmLabel="Mark Paid"
            confirmColor="blue"
          />
        </Modal>
      )}

      {/* ADD TRANSACTION MODAL */}
      {modal === "addTransaction" && (
        <AddTransactionModal
          onAdd={handleAddTransaction}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/* Helper Components */
function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            {headers.map(h => (
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
                No transactions
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800">
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

function Button({ color, label, onClick }) {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
  };
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded text-sm ${colors[color]}`}>
      {label}
    </button>
  );
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

function ActionRow({ onCancel, onConfirm, confirmLabel, confirmColor }) {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
  };
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button onClick={onCancel} className="px-3 py-1 bg-gray-700 rounded">
        Cancel
      </button>
      <button onClick={onConfirm} className={`px-3 py-1 rounded ${colors[confirmColor]}`}>
        {confirmLabel}
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const color =
    status === "Paid"
      ? "bg-green-600"
      : status === "Unpaid"
      ? "bg-red-600"
      : "bg-gray-700";
  return (
    <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>
  );
}

/* --- Add Transaction Modal --- */
function AddTransactionModal({ onAdd, onClose }) {
  const [transaction_type, setType] = useState("Rental Payment");
  const [student_name, setStudent] = useState("");
  const [amount, setAmount] = useState("");
  const [payment_method, setMethod] = useState("Cash");

  const handleSubmit = () => {
    if (!student_name || !amount) return alert("Please fill all fields");
    onAdd({
      transaction_type,
      student_name,
      amount: Number(amount),
      status: "Unpaid",
      payment_method,
      payment_reference_id: "-",
    });
  };

  return (
    <Modal title="Add New Transaction" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400">Type:</label>
          <select
            value={transaction_type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option>Rental Payment</option>
            <option>Extension Fee</option>
            <option>Damage Fee</option>
            <option>Lost Fee</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">Student Name:</label>
          <input
            type="text"
            value={student_name}
            onChange={(e) => setStudent(e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Amount (₱):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Payment Method:</label>
          <select
            value={payment_method}
            onChange={(e) => setMethod(e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option>Cash</option>
            <option>Online</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-700 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
          >
            Add Transaction
          </button>
        </div>
      </div>
    </Modal>
  );
}
