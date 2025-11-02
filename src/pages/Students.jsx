import { useState } from "react";

const initialStudents = [
  {
    student_id: 1,
    name: "Alice Garcia",
    email: "alice.garcia@university.edu",
    phone_number: "09171234567",
    major: "Computer Engineering",
    year: "4th Year",
    account_state: "Active",
  },
  {
    student_id: 2,
    name: "Mark Reyes",
    email: "mark.reyes@university.edu",
    phone_number: "09234567890",
    major: "Information Technology",
    year: "3rd Year",
    account_state: "Suspended",
  },
  {
    student_id: 3,
    name: "Sarah Cruz",
    email: "sarah.cruz@university.edu",
    phone_number: "09361239876",
    major: "Electronics Engineering",
    year: "2nd Year",
    account_state: "Active",
  },
];

export default function Students() {
  const [students, setStudents] = useState(initialStudents);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleAdd = (student) => {
    const newStudent = {
      student_id: students.length + 1,
      ...student,
    };
    setStudents([...students, newStudent]);
    setModal(null);
  };

  const handleEdit = (student) => {
    setStudents(
      students.map((s) =>
        s.student_id === student.student_id ? student : s
      )
    );
    setModal(null);
  };

  const handleDelete = (id) => {
    setStudents(students.filter((s) => s.student_id !== id));
    setModal(null);
  };

  const handleToggleState = (student) => {
    setStudents(
      students.map((s) =>
        s.student_id === student.student_id
          ? {
              ...s,
              account_state:
                s.account_state === "Active" ? "Suspended" : "Active",
            }
          : s
      )
    );
  };

  return (
    <div className="text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Students Management</h1>
        <button
          onClick={() => setModal("add")}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
        >
          + Add Student
        </button>
      </div>

      <div className="bg-gray-900 p-4 rounded-lg shadow">
        <Table
          headers={[
            "ID",
            "Name",
            "Email",
            "Major",
            "Year",
            "Phone",
            "Status",
            "Actions",
          ]}
          rows={students.map((s) => [
            s.student_id,
            s.name,
            s.email,
            s.major,
            s.year,
            s.phone_number,
            <StatusBadge key={s.student_id} status={s.account_state} />,
            <div key={`btn-${s.student_id}`} className="space-x-2">
              <Button
                color="blue"
                label="View"
                onClick={() => {
                  setSelected(s);
                  setModal("view");
                }}
              />
              <Button
                color="yellow"
                label="Edit"
                onClick={() => {
                  setSelected(s);
                  setModal("edit");
                }}
              />
              <Button
                color={s.account_state === "Active" ? "red" : "green"}
                label={s.account_state === "Active" ? "Suspend" : "Activate"}
                onClick={() => handleToggleState(s)}
              />
              <Button
                color="red"
                label="Delete"
                onClick={() => {
                  setSelected(s);
                  setModal("delete");
                }}
              />
            </div>,
          ])}
        />
      </div>

      {/* Add Modal */}
      {modal === "add" && (
        <StudentModal
          title="Add New Student"
          onSave={handleAdd}
          onClose={() => setModal(null)}
        />
      )}

      {/* Edit Modal */}
      {modal === "edit" && selected && (
        <StudentModal
          title="Edit Student"
          student={selected}
          onSave={handleEdit}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirmation */}
      {modal === "delete" && selected && (
        <Modal title="Delete Student" onClose={() => setModal(null)}>
          <p>
            Are you sure you want to delete{" "}
            <b>{selected.name}</b> from the system?
          </p>
          <ActionRow
            onCancel={() => setModal(null)}
            onConfirm={() => handleDelete(selected.student_id)}
            confirmLabel="Delete"
            confirmColor="red"
          />
        </Modal>
      )}

      {/* View Student Details */}
      {modal === "view" && selected && (
        <Modal title="Student Details" onClose={() => setModal(null)}>
          <div className="space-y-2 text-sm">
            <p><b>ID:</b> {selected.student_id}</p>
            <p><b>Name:</b> {selected.name}</p>
            <p><b>Email:</b> {selected.email}</p>
            <p><b>Phone:</b> {selected.phone_number}</p>
            <p><b>Major:</b> {selected.major}</p>
            <p><b>Year:</b> {selected.year}</p>
            <p><b>Status:</b> {selected.account_state}</p>
          </div>

          <div className="mt-4">
            <p className="text-gray-400 text-sm mb-2">
              (Simulated) Recent Rentals:
            </p>
            <ul className="bg-gray-800 rounded p-2 text-xs text-gray-300 space-y-1">
              <li>• Rental #1021 - Arduino Uno - Returned</li>
              <li>• Rental #1045 - ESP32 Kit - Active</li>
              <li>• Rental #1060 - Sensor Kit - Overdue</li>
            </ul>
          </div>

          <div className="mt-3">
            <p className="text-gray-400 text-sm mb-2">
              (Simulated) Transactions:
            </p>
            <ul className="bg-gray-800 rounded p-2 text-xs text-gray-300 space-y-1">
              <li>• ₱50.00 - Overdue Fee (Paid)</li>
              <li>• ₱250.00 - Damage Fee (Unpaid)</li>
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Shared UI Components ---------- */

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
              <td
                colSpan={headers.length}
                className="text-center py-3 text-gray-500"
              >
                No students found
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
    yellow: "bg-yellow-500 hover:bg-yellow-600 text-black",
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
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
    red: "bg-red-600 hover:bg-red-700",
    green: "bg-green-600 hover:bg-green-700",
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
    status === "Active"
      ? "bg-green-600"
      : status === "Suspended"
      ? "bg-red-600"
      : "bg-yellow-600";
  return (
    <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>
  );
}

function StudentModal({ title, student, onSave, onClose }) {
  const [form, setForm] = useState(
    student || {
      name: "",
      email: "",
      phone_number: "",
      major: "",
      year: "",
      account_state: "Active",
    }
  );

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      alert("Name and email are required.");
      return;
    }
    onSave(form);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400">Name:</label>
          <input
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Email:</label>
          <input
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Phone Number:</label>
          <input
            value={form.phone_number}
            onChange={(e) => handleChange("phone_number", e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Major:</label>
          <input
            value={form.major}
            onChange={(e) => handleChange("major", e.target.value)}
            className="mt-1 w-full bg-gray-800 rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Year:</label>
          <input
            value={form.year}
            onChange={(e) => handleChange("year", e.target.value)}
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
            Save Student
          </button>
        </div>
      </div>
    </Modal>
  );
}
