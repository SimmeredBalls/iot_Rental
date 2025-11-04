import { useState } from "react";

export default function AdminSettings() {
  const [admins, setAdmins] = useState([
    { id: 1, name: "Juan Dela Cruz", email: "juan@example.com", role: "Super Admin", status: "Active" },
    { id: 2, name: "Maria Santos", email: "maria@example.com", role: "Staff Admin", status: "Active" },
  ]);

  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Mock stats
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.status === "Active").length;

  const handleAddAdmin = (newAdmin) => {
    setAdmins([...admins, { id: Date.now(), ...newAdmin }]);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-8 text-white">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
        >
          + Add Admin
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard title="Total Admins" value={totalAdmins} color="blue" />
        <SummaryCard title="Active Admins" value={activeAdmins} color="green" />
      </div>

      {/* TABLE */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={["Name", "Email", "Role", "Status", "Actions"]}
          rows={admins.map((a) => [
            a.name,
            a.email,
            a.role,
            <StatusBadge status={a.status} key={a.id} />,
            <div key={`actions-${a.id}`} className="flex gap-2">
              <button
                onClick={() => setSelected(a)}
                className="text-blue-400 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="text-yellow-400 hover:underline"
              >
                Change Password
              </button>
            </div>,
          ])}
        />
      </section>

      {/* MODALS */}
      {showAddModal && (
        <Modal title="Add Admin" onClose={() => setShowAddModal(false)}>
          <AddAdminForm onSave={handleAddAdmin} />
        </Modal>
      )}

      {selected && (
        <Modal title={`Edit Admin - ${selected.name}`} onClose={() => setSelected(null)}>
          <EditAdminForm admin={selected} onSave={(updated) => {
            setAdmins(admins.map((a) => (a.id === selected.id ? updated : a)));
            setSelected(null);
          }} />
        </Modal>
      )}

      {showPasswordModal && (
        <Modal title="Change Password" onClose={() => setShowPasswordModal(false)}>
          <ChangePasswordForm onSave={() => setShowPasswordModal(false)} />
        </Modal>
      )}
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function SummaryCard({ title, value, color }) {
  const colors = {
    blue: "from-blue-500 to-blue-700",
    green: "from-green-500 to-green-700",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 shadow-md`}>
      <p className="text-sm opacity-80">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
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
              <th key={h} className="py-2 px-3 text-sm font-semibold text-gray-300">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40">
              {r.map((cell, j) => (
                <td key={j} className="py-2 px-3 text-sm">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const color = status === "Active" ? "bg-green-600" : "bg-red-600";
  return <span className={`px-2 py-1 rounded text-xs ${color}`}>{status}</span>;
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

/* ---------- FORMS ---------- */

function AddAdminForm({ onSave }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Staff Admin",
    password: "",
  });

  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <input
        placeholder="Full Name"
        className="bg-gray-800 rounded px-3 py-2 w-full"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <input
        placeholder="Email"
        type="email"
        className="bg-gray-800 rounded px-3 py-2 w-full"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        placeholder="Password"
        type="password"
        className="bg-gray-800 rounded px-3 py-2 w-full"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <select
        className="bg-gray-800 rounded px-3 py-2 w-full"
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option>Super Admin</option>
        <option>Staff Admin</option>
      </select>
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full"
      >
        Add Admin
      </button>
    </form>
  );
}

function EditAdminForm({ admin, onSave }) {
  const [form, setForm] = useState({ ...admin });
  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <input
        value={form.name}
        className="bg-gray-800 rounded px-3 py-2 w-full"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        value={form.email}
        className="bg-gray-800 rounded px-3 py-2 w-full"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <select
        className="bg-gray-800 rounded px-3 py-2 w-full"
        value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option>Super Admin</option>
        <option>Staff Admin</option>
      </select>
      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded w-full"
      >
        Save Changes
      </button>
    </form>
  );
}

function ChangePasswordForm({ onSave }) {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  return (
    <form
      className="space-y-3 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
          alert("Passwords do not match!");
          return;
        }
        alert("Password successfully updated!");
        onSave();
      }}
    >
      <input
        placeholder="Old Password"
        type="password"
        className="bg-gray-800 rounded px-3 py-2 w-full"
        onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
        required
      />
      <input
        placeholder="New Password"
        type="password"
        className="bg-gray-800 rounded px-3 py-2 w-full"
        onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
        required
      />
      <input
        placeholder="Confirm New Password"
        type="password"
        className="bg-gray-800 rounded px-3 py-2 w-full"
        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
        required
      />
      <button
        type="submit"
        className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded w-full"
      >
        Change Password
      </button>
    </form>
  );
}
