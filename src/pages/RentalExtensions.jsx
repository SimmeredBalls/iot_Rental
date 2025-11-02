import { useState } from "react";

const initialExtensions = [
  {
    extension_id: 1,
    rental_id: 1001,
    admin_id: null,
    request_date: "2025-10-25",
    new_due_date: "2025-11-05",
    status: "Pending",
  },
  {
    extension_id: 2,
    rental_id: 1002,
    admin_id: 1,
    request_date: "2025-10-20",
    new_due_date: "2025-10-30",
    status: "Approved",
  },
  {
    extension_id: 3,
    rental_id: 1003,
    admin_id: 1,
    request_date: "2025-09-30",
    new_due_date: "2025-10-15",
    status: "Rejected",
  },
];

export default function RentalExtensions() {
  const [extensions, setExtensions] = useState(initialExtensions);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleAdd = (newExt) => {
    const entry = {
      extension_id: extensions.length + 1,
      admin_id: null,
      status: "Pending",
      ...newExt,
    };
    setExtensions([...extensions, entry]);
    setModal(null);
  };

  const handleUpdateStatus = (ext, newStatus) => {
    setExtensions(
      extensions.map((e) =>
        e.extension_id === ext.extension_id
          ? { ...e, status: newStatus, admin_id: 1 }
          : e
      )
    );
    setModal(null);
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rental Extensions</h1>
        <button
          onClick={() => setModal("add")}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          + New Extension
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg shadow">
        <Table
          headers={[
            "Extension ID",
            "Rental ID",
            "Admin ID",
            "Request Date",
            "New Due Date",
            "Status",
            "Actions",
          ]}
          rows={extensions.map((e) => [
            e.extension_id,
            e.rental_id,
            e.admin_id ? e.admin_id : "-",
            e.request_date,
            e.new_due_date,
            <StatusBadge key={e.extension_id} status={e.status} />,
            <div key={`actions-${e.extension_id}`} className="space-x-2">
              <Button
                color="blue"
                label="View"
                onClick={() => {
                  setSelected(e);
                  setModal("view");
                }}
              />
              {e.status === "Pending" && (
                <>
                  <Button
                    color="green"
                    label="Approve"
                    onClick={() => handleUpdateStatus(e, "Approved")}
                  />
                  <Button
                    color="red"
                    label="Reject"
                    onClick={() => handleUpdateStatus(e, "Rejected")}
                  />
                </>
              )}
            </div>,
          ])}
        />
      </div>

      {/* Add New Request */}
      {modal === "add" && (
        <AddExtensionModal
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {/* View Details */}
      {modal === "view" && selected && (
        <Modal title="Extension Details" onClose={() => setModal(null)}>
          <div className="space-y-2 text-sm">
            <p><b>ID:</b> {selected.extension_id}</p>
            <p><b>Rental ID:</b> {selected.rental_id}</p>
            <p><b>Admin ID:</b> {selected.admin_id || "Unassigned"}</p>
            <p><b>Request Date:</b> {selected.request_date}</p>
            <p><b>New Due Date:</b> {selected.new_due_date}</p>
            <p><b>Status:</b> {selected.status}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- UI Components ---------- */

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
                No extension requests found
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

function StatusBadge({ status }) {
  const color =
    status === "Approved"
      ? "bg-green-600"
      : status === "Pending"
      ? "bg-yellow-600"
      : "bg-red-600";
  return (
    <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>
  );
}

function AddExtensionModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    rental_id: "",
    request_date: new Date().toISOString().slice(0, 10),
    new_due_date: "",
  });

  const handleSubmit = () => {
    if (!form.rental_id || !form.new_due_date) {
      alert("Rental ID and new due date are required.");
      return;
    }
    onSave(form);
  };

  return (
    <Modal title="New Rental Extension Request" onClose={onClose}>
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
          <label className="text-sm text-gray-400">Request Date:</label>
          <input
            type="date"
            value={form.request_date}
            onChange={(e) =>
              setForm({ ...form, request_date: e.target.value })
            }
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">New Due Date:</label>
          <input
            type="date"
            value={form.new_due_date}
            onChange={(e) =>
              setForm({ ...form, new_due_date: e.target.value })
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
            Submit Request
          </button>
        </div>
      </div>
    </Modal>
  );
}
