import { useState } from "react";

const initialRentals = [
  { rental_id: 1, student_name: "Juan Dela Cruz", gadget_name: "Arduino Kit", rental_status: "Pending", due_date: "2025-11-05" },
  { rental_id: 2, student_name: "Maria Santos", gadget_name: "ESP32 Board", rental_status: "Active", due_date: "2025-11-03" },
  { rental_id: 3, student_name: "John Lim", gadget_name: "Sensor Kit", rental_status: "Overdue", due_date: "2025-10-30" },
  { rental_id: 4, student_name: "Anna Reyes", gadget_name: "Raspberry Pi 4", rental_status: "Completed", due_date: "2025-10-25" },
];

export default function Rentals() {
  const [rentals, setRentals] = useState(initialRentals);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);

  const handleApprove = (id) => {
    setRentals(rentals.map(r => r.rental_id === id ? { ...r, rental_status: "Active" } : r));
    setModal(null);
  };

  const handleReject = (id) => {
    setRentals(rentals.map(r => r.rental_id === id ? { ...r, rental_status: "Rejected" } : r));
    setModal(null);
  };

  const handleReturn = (id) => {
    setSelected(rentals.find(r => r.rental_id === id));
    setModal("inspection");
  };

  const handleInspection = (result) => {
    if (result === "OK") {
      setRentals(rentals.map(r => r.rental_id === selected.rental_id ? { ...r, rental_status: "Completed" } : r));
      setModal(null);
      setSelected(null);
    } else {
      // Damage/Lost triggers fee modal
      setModal("applyFee");
    }
  };

  const handleApplyFee = (amount, feeType) => {
    // Simulate Damage_Assessment + Transaction creation
    console.log(`Applied ${feeType} fee ₱${amount} for rental ${selected.rental_id}`);
    setRentals(rentals.map(r =>
      r.rental_id === selected.rental_id
        ? { ...r, rental_status: feeType === "Lost" ? "Lost" : "Damaged" }
        : r
    ));
    setModal(null);
    setSelected(null);
  };

  const filtered = {
    Pending: rentals.filter(r => r.rental_status === "Pending"),
    Active: rentals.filter(r => r.rental_status === "Active"),
    Overdue: rentals.filter(r => r.rental_status === "Overdue"),
    Completed: rentals.filter(r => ["Completed", "Lost", "Damaged", "Rejected"].includes(r.rental_status)),
  };

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Rentals Management</h1>

      {Object.entries(filtered).map(([status, list]) => (
        <Section key={status} title={`${status} Rentals`}>
          <Table
            headers={["Rental ID", "Student", "Gadget", "Due Date", "Status", "Actions"]}
            rows={list.map(r => [
              r.rental_id,
              r.student_name,
              r.gadget_name,
              r.due_date,
              r.rental_status,
              <div className="space-x-2" key={r.rental_id}>
                {r.rental_status === "Pending" && (
                  <>
                    <Button color="green" label="Approve" onClick={() => { setSelected(r); setModal("approve"); }} />
                    <Button color="red" label="Reject" onClick={() => { setSelected(r); setModal("reject"); }} />
                  </>
                )}
                {r.rental_status === "Active" && (
                  <Button color="blue" label="Mark Returned" onClick={() => handleReturn(r.rental_id)} />
                )}
              </div>
            ])}
          />
        </Section>
      ))}

      {/* APPROVE MODAL */}
      {modal === "approve" && selected && (
        <Modal title="Approve Rental Request" onClose={() => setModal(null)}>
          <p>Approve <b>{selected.student_name}</b>’s rental for <b>{selected.gadget_name}</b>?</p>
          <ActionRow
            onCancel={() => setModal(null)}
            onConfirm={() => handleApprove(selected.rental_id)}
            confirmLabel="Approve"
            confirmColor="green"
          />
        </Modal>
      )}

      {/* REJECT MODAL */}
      {modal === "reject" && selected && (
        <Modal title="Reject Rental Request" onClose={() => setModal(null)}>
          <p>Reject <b>{selected.student_name}</b>’s rental for <b>{selected.gadget_name}</b>?</p>
          <ActionRow
            onCancel={() => setModal(null)}
            onConfirm={() => handleReject(selected.rental_id)}
            confirmLabel="Reject"
            confirmColor="red"
          />
        </Modal>
      )}

      {/* INSPECTION MODAL */}
      {modal === "inspection" && selected && (
        <Modal title="Inspect Returned Gadget" onClose={() => setModal(null)}>
          <p><b>{selected.student_name}</b> returned <b>{selected.gadget_name}</b>.</p>
          <p className="text-sm text-gray-400 mt-1">Select inspection result:</p>
          <div className="mt-4 flex justify-between">
            <Button color="green" label="OK" onClick={() => handleInspection("OK")} />
            <Button color="yellow" label="Damaged" onClick={() => handleInspection("Damaged")} />
            <Button color="red" label="Lost" onClick={() => handleInspection("Lost")} />
          </div>
        </Modal>
      )}

      {/* APPLY FEE MODAL */}
      {modal === "applyFee" && selected && (
        <ApplyFeeModal selected={selected} onApply={handleApplyFee} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

/* --- Helper Components --- */
function Section({ title, children }) {
  return (
    <div className="mb-8 bg-gray-900 p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
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
              {r.map((cell, j) => <td key={j} className="py-2 px-3 text-sm">{cell}</td>)}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function Button({ color, label, onClick }) {
  const colors = {
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    yellow: "bg-yellow-600 hover:bg-yellow-700",
  };
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded text-sm ${colors[color]}`}>{label}</button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md relative">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        {children}
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
      </div>
    </div>
  );
}

function ActionRow({ onCancel, onConfirm, confirmLabel, confirmColor }) {
  const colors = {
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-600 hover:bg-red-700",
  };
  return (
    <div className="mt-4 flex justify-end gap-2">
      <button onClick={onCancel} className="px-3 py-1 bg-gray-700 rounded">Cancel</button>
      <button onClick={onConfirm} className={`px-3 py-1 rounded ${colors[confirmColor]}`}>{confirmLabel}</button>
    </div>
  );
}

/* --- Apply Fee Modal --- */
function ApplyFeeModal({ selected, onApply, onClose }) {
  const [amount, setAmount] = useState("");
  const [feeType, setFeeType] = useState("Damage");

  return (
    <Modal title="Apply Fee" onClose={onClose}>
      <p>Apply a fee for <b>{selected.student_name}</b>’s rental of <b>{selected.gadget_name}</b>.</p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-sm text-gray-400">Fee Type:</label>
          <select
            value={feeType}
            onChange={(e) => setFeeType(e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="Damage">Damage Fee</option>
            <option value="Lost">Lost Fee</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">Amount (₱):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-700 rounded">Cancel</button>
          <button
            onClick={() => onApply(amount, feeType)}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
          >
            Apply Fee
          </button>
        </div>
      </div>
    </Modal>
  );
}
