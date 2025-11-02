import { useState } from "react";

const initialTypes = [
  { type_id: 1, type_name: "Microcontroller", description: "Arduino, ESP32, etc." },
  { type_id: 2, type_name: "Sensor Kit", description: "Temperature, Motion, and Light sensors" },
  { type_id: 3, type_name: "Raspberry Pi", description: "Raspberry Pi boards and accessories" },
];

const initialGadgets = [
  {
    gadget_id: 1,
    serial_number: "ARD-001",
    gadget_name: "Arduino Uno",
    description: "Microcontroller for prototyping",
    status: "Available",
    type_id: 1,
    quantity_total: 10,
    quantity_available: 7,
  },
  {
    gadget_id: 2,
    serial_number: "ESP-101",
    gadget_name: "ESP32 Dev Board",
    description: "WiFi-enabled microcontroller board",
    status: "Rented",
    type_id: 1,
    quantity_total: 8,
    quantity_available: 3,
  },
  {
    gadget_id: 3,
    serial_number: "SNS-050",
    gadget_name: "Basic Sensor Kit",
    description: "Contains IR, Temp, and Motion sensors",
    status: "Available",
    type_id: 2,
    quantity_total: 5,
    quantity_available: 5,
  },
];

export default function Inventory() {
  const [gadgets, setGadgets] = useState(initialGadgets);
  const [types] = useState(initialTypes);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleAddGadget = (gadget) => {
    const newGadget = {
      gadget_id: gadgets.length + 1,
      ...gadget,
      quantity_available: gadget.quantity_total,
    };
    setGadgets([...gadgets, newGadget]);
    setModal(null);
  };

  const handleEditGadget = (gadget) => {
    setGadgets(gadgets.map(g => g.gadget_id === gadget.gadget_id ? gadget : g));
    setModal(null);
  };

  const handleDelete = (id) => {
    setGadgets(gadgets.filter(g => g.gadget_id !== id));
    setModal(null);
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <button
          onClick={() => setModal("add")}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          + Add Gadget
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg shadow">
        <Table
          headers={[
            "ID",
            "Serial Number",
            "Name",
            "Type",
            "Status",
            "Total Qty",
            "Available",
            "Actions",
          ]}
          rows={gadgets.map((g) => [
            g.gadget_id,
            g.serial_number,
            g.gadget_name,
            types.find((t) => t.type_id === g.type_id)?.type_name || "-",
            <StatusBadge status={g.status} key={g.gadget_id} />,
            g.quantity_total,
            g.quantity_available,
            <div className="space-x-2" key={`btn-${g.gadget_id}`}>
              <Button
                color="blue"
                label="Edit"
                onClick={() => {
                  setSelected(g);
                  setModal("edit");
                }}
              />
              <Button
                color="red"
                label="Delete"
                onClick={() => {
                  setSelected(g);
                  setModal("delete");
                }}
              />
            </div>,
          ])}
        />
      </div>

      {/* ADD GADGET MODAL */}
      {modal === "add" && (
        <GadgetModal
          title="Add New Gadget"
          types={types}
          onSave={handleAddGadget}
          onClose={() => setModal(null)}
        />
      )}

      {/* EDIT GADGET MODAL */}
      {modal === "edit" && selected && (
        <GadgetModal
          title="Edit Gadget"
          types={types}
          gadget={selected}
          onSave={handleEditGadget}
          onClose={() => setModal(null)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modal === "delete" && selected && (
        <Modal title="Delete Gadget" onClose={() => setModal(null)}>
          <p>
            Are you sure you want to delete <b>{selected.gadget_name}</b>?
          </p>
          <ActionRow
            onCancel={() => setModal(null)}
            onConfirm={() => handleDelete(selected.gadget_id)}
            confirmLabel="Delete"
            confirmColor="red"
          />
        </Modal>
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
                className="text-center py-3 text-gray-500"
              >
                No gadgets
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-gray-800 hover:bg-gray-800"
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
      <button
        onClick={onConfirm}
        className={`px-3 py-1 rounded ${colors[confirmColor]}`}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

function StatusBadge({ status }) {
  const color =
    status === "Available"
      ? "bg-green-600"
      : status === "Rented"
      ? "bg-blue-600"
      : "bg-yellow-600";
  return (
    <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>
  );
}

/* --- Gadget Add/Edit Modal --- */
function GadgetModal({ title, types, gadget, onSave, onClose }) {
  const [form, setForm] = useState(
    gadget || {
      serial_number: "",
      gadget_name: "",
      description: "",
      type_id: types[0]?.type_id || 1,
      status: "Available",
      quantity_total: 1,
    }
  );

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (!form.gadget_name || !form.serial_number)
      return alert("Please fill in all required fields");
    onSave(form);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400">Serial Number:</label>
          <input
            value={form.serial_number}
            onChange={(e) => handleChange("serial_number", e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Gadget Name:</label>
          <input
            value={form.gadget_name}
            onChange={(e) => handleChange("gadget_name", e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Description:</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Type:</label>
          <select
            value={form.type_id}
            onChange={(e) => handleChange("type_id", parseInt(e.target.value))}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            {types.map((t) => (
              <option key={t.type_id} value={t.type_id}>
                {t.type_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">Status:</label>
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option>Available</option>
            <option>Rented</option>
            <option>Maintenance</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-400">Total Quantity:</label>
          <input
            type="number"
            min="1"
            value={form.quantity_total}
            onChange={(e) =>
              handleChange("quantity_total", parseInt(e.target.value))
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
            Save Gadget
          </button>
        </div>
      </div>
    </Modal>
  );
}
