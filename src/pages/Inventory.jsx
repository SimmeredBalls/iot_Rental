import { useState, useMemo } from "react";

export default function Inventory() {
  // --- Mock Data (replace with Supabase later) ---
  const [units, setUnits] = useState([
    {
      unit_id: 101,
      serial_number: "SN-A001",
      gadget_name: "Arduino Uno",
      description: "Basic microcontroller board",
      status: "Available",
      condition: "Good",
      type_name: "Microcontrollers",
    },
    {
      unit_id: 102,
      serial_number: "SN-A002",
      gadget_name: "Arduino Uno",
      description: "Basic microcontroller board",
      status: "In Use",
      condition: "Fair",
      type_name: "Microcontrollers",
    },
    {
      unit_id: 103,
      serial_number: "SN-B015",
      gadget_name: "ESP32 Dev Board",
      description: "WiFi + Bluetooth microcontroller",
      status: "Available",
      condition: "Good",
      type_name: "Microcontrollers",
    },
    {
      unit_id: 104,
      serial_number: "SN-C005",
      gadget_name: "Ultrasonic Sensor",
      description: "Distance measurement sensor",
      status: "In Repair",
      condition: "Good",
      type_name: "Sensors",
    },
  ]);

  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // --- Compute summary stats ---
  const stats = useMemo(() => {
    const total = units.length;
    const available = units.filter((u) => u.status === "Available").length;
    const inUse = units.filter((u) => u.status === "In Use").length;
    const inRepair = units.filter((u) => u.status === "In Repair").length;
    return { total, available, inUse, inRepair };
  }, [units]);

  // --- Filtering logic ---
  const filteredUnits = units.filter((u) => {
    const matchType = filterType ? u.type_name === filterType : true;
    const matchStatus = filterStatus ? u.status === filterStatus : true;
    const matchSearch = search
      ? u.gadget_name.toLowerCase().includes(search.toLowerCase()) ||
        u.serial_number.toLowerCase().includes(search.toLowerCase()) ||
        u.condition.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchType && matchStatus && matchSearch;
  });

  // --- Unique type list for filter dropdown ---
  const uniqueTypes = [...new Set(units.map((u) => u.type_name))];

  return (
    <div className="space-y-8 text-white">
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-sm text-gray-400">
          Overview of all gadget units and their statuses.
        </p>
      </div>

      {/* ---------- SUMMARY CARDS ---------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Gadgets" value={stats.total} color="blue" />
        <SummaryCard title="Available" value={stats.available} color="green" />
        <SummaryCard title="In Use" value={stats.inUse} color="yellow" />
        <SummaryCard title="In Repair" value={stats.inRepair} color="red" />
      </div>

      {/* ---------- FILTER + SEARCH ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-900 p-4 rounded-lg">
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="In Use">In Use</option>
            <option value="In Repair">In Repair</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search by gadget name, serial, or condition"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none w-full sm:w-72"
        />
      </div>

      {/* ---------- INVENTORY TABLE ---------- */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={[
            "Serial Number",
            "Gadget Name",
            "Description",
            "Type",
            "Condition",
            "Status",
            "Actions",
          ]}
          rows={filteredUnits.map((u) => [
            u.serial_number,
            u.gadget_name,
            u.description,
            u.type_name,
            u.condition,
            <StatusBadge key={u.unit_id} status={u.status} />,
            <button
              key={`view-${u.unit_id}`}
              onClick={() => setSelected(u)}
              className="text-blue-400 hover:underline"
            >
              View
            </button>,
          ])}
        />
      </section>

      {/* ---------- MODAL FOR UNIT DETAILS ---------- */}
      {selected && (
        <Modal title={`Details for ${selected.serial_number}`} onClose={() => setSelected(null)}>
          <div className="space-y-2 text-sm">
            <p><b>Serial:</b> {selected.serial_number}</p>
            <p><b>Gadget:</b> {selected.gadget_name}</p>
            <p><b>Type:</b> {selected.type_name}</p>
            <p><b>Description:</b> {selected.description}</p>
            <p><b>Condition:</b> {selected.condition}</p>
            <p><b>Status:</b> {selected.status}</p>
            <div className="flex gap-2 mt-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
                onClick={() => alert("Edit gadget unit feature coming soon")}
              >
                Edit
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                onClick={() => alert("Mark as damaged / lost process will go here")}
              >
                Mark Issue
              </button>
            </div>
          </div>
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
    red: "from-red-500 to-red-700",
    yellow: "from-yellow-500 to-yellow-700",
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 shadow-md flex flex-col justify-between`}
    >
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
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="text-center py-3 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40">
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

function StatusBadge({ status }) {
  const color =
    status === "Available"
      ? "bg-green-600"
      : status === "In Use"
      ? "bg-yellow-600"
      : status === "In Repair"
      ? "bg-red-600"
      : "bg-gray-600";
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
