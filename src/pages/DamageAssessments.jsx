import { useState } from "react";

const initialAssessments = [
  {
    assessment_id: 1,
    rental_id: 1005,
    initial_notes: "Cracked sensor casing",
    date_logged: "2025-10-28",
    final_notes: "",
    fine_amount: 200,
    status: "With Fine",
  },
  {
    assessment_id: 2,
    rental_id: 1008,
    initial_notes: "Minor scratches, still functional",
    date_logged: "2025-10-20",
    final_notes: "No fee applied",
    fine_amount: 0,
    status: "Cleared",
  },
];

export default function DamageAssessments() {
  const [assessments, setAssessments] = useState(initialAssessments);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleAdd = (a) => {
    const entry = {
      assessment_id: assessments.length + 1,
      date_logged: new Date().toISOString().slice(0, 10),
      ...a,
    };
    setAssessments([...assessments, entry]);
    setModal(null);
  };

  const handleUpdate = (updated) => {
    setAssessments(
      assessments.map((a) =>
        a.assessment_id === updated.assessment_id ? updated : a
      )
    );
    setModal(null);
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Damage Assessments</h1>
        <button
          onClick={() => setModal("add")}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          + Log Damage
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg shadow">
        <Table
          headers={[
            "Assessment ID",
            "Rental ID",
            "Date Logged",
            "Initial Notes",
            "Fine (₱)",
            "Status",
            "Actions",
          ]}
          rows={assessments.map((a) => [
            a.assessment_id,
            a.rental_id,
            a.date_logged,
            a.initial_notes,
            a.fine_amount > 0 ? `₱${a.fine_amount}` : "-",
            <StatusBadge key={a.assessment_id} status={a.status} />,
            <div key={`actions-${a.assessment_id}`} className="space-x-2">
              <Button
                color="blue"
                label="View/Edit"
                onClick={() => {
                  setSelected(a);
                  setModal("edit");
                }}
              />
            </div>,
          ])}
        />
      </div>

      {modal === "add" && (
        <AddAssessmentModal
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "edit" && selected && (
        <EditAssessmentModal
          assessment={selected}
          onSave={handleUpdate}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/* ---------- Reusable UI Components ---------- */

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
                No damage assessments logged
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
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-sm ${colors[color]}`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const color =
    status === "Cleared"
      ? "bg-green-600"
      : status === "Pending"
      ? "bg-yellow-600"
      : "bg-red-600";
  return (
    <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>
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

/* ---------- Add Modal ---------- */
function AddAssessmentModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    rental_id: "",
    initial_notes: "",
    fine_amount: 0,
    status: "Pending",
  });

  const handleSubmit = () => {
    if (!form.rental_id || !form.initial_notes) {
      alert("Please fill out all required fields.");
      return;
    }
    onSave(form);
  };

  return (
    <Modal title="Log New Damage Assessment" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400">Rental ID:</label>
          <input
            value={form.rental_id}
            onChange={(e) => setForm({ ...form, rental_id: e.target.value })}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400">Initial Notes:</label>
          <textarea
            value={form.initial_notes}
            onChange={(e) => setForm({ ...form, initial_notes: e.target.value })}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm h-20"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400">Fine Amount (₱):</label>
          <input
            type="number"
            value={form.fine_amount}
            onChange={(e) =>
              setForm({ ...form, fine_amount: Number(e.target.value) })
            }
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-700 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Edit Modal ---------- */
function EditAssessmentModal({ assessment, onSave, onClose }) {
  const [form, setForm] = useState({ ...assessment });

  const handleSubmit = () => {
    if (!form.final_notes) {
      alert("Please add final notes before saving.");
      return;
    }
    onSave(form);
  };

  return (
    <Modal title="Edit Damage Assessment" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          <b>Rental ID:</b> {form.rental_id}
        </p>

        <div>
          <label className="text-sm text-gray-400">Initial Notes:</label>
          <p className="bg-gray-800 rounded px-3 py-2 text-sm mt-1">
            {form.initial_notes}
          </p>
        </div>

        <div>
          <label className="text-sm text-gray-400">Final Notes:</label>
          <textarea
            value={form.final_notes}
            onChange={(e) => setForm({ ...form, final_notes: e.target.value })}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm h-20"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Fine Amount (₱):</label>
          <input
            type="number"
            value={form.fine_amount}
            onChange={(e) =>
              setForm({ ...form, fine_amount: Number(e.target.value) })
            }
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Status:</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option>Pending</option>
            <option>With Fine</option>
            <option>Cleared</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-700 rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
