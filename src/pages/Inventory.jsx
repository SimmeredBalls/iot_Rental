import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SummaryCard, Table, StatusBadge, Modal } from "../components/ui/CommonUI";


export default function Inventory() {
  const [units, setUnits] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);


  useEffect(() => {
    fetchData();
    fetchTypes();
  }, []);

  async function handleDelete(gadget) {
    if (!gadget) return;

    setDeleting(true);

    // Step 1: Check if gadget is linked to any rental
    const { data: rentals, error: checkError } = await supabase
      .from("rental_items")
      .select("rental_item_id, rental_id")
      .eq("gadget_id", gadget.gadget_id)
      .limit(1);

    if (checkError) {
      console.error("Error checking gadget rentals:", checkError);
      alert("Failed to verify gadget usage before deletion.");
      setDeleting(false);
      return;
    }

    // Step 2: Prevent deletion if it's linked
    if (rentals && rentals.length > 0) {
      alert(
        "⚠️ This gadget cannot be deleted because it is linked to a rental record. " +
          "You can mark it as 'Lost' or 'Unavailable' instead."
      );
      setDeleting(false);
      setDeleteTarget(null);
      return;
    }

    // Step 3: Proceed with deletion
    const { error } = await supabase
      .from("gadgets")
      .delete()
      .eq("gadget_id", gadget.gadget_id);

    setDeleting(false);

    if (error) {
      console.error("Error deleting gadget:", error);
      alert("Failed to delete gadget: " + error.message);
    } else {
      alert("✅ Gadget deleted successfully!");
      setDeleteTarget(null);
      fetchData(); // refresh table
    }
  }

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("gadgets")
      .select(`
        gadget_id,
        serial_number,
        gadget_name,
        description,
        status,
        price_per_day,
        image_url,
        gadget_types (type_name)
      `)
      .order("gadget_name");

    if (error) console.error("Error loading gadgets:", error);
    else {
      const formatted = data.map((g) => ({
        ...g,
        type_name: g.gadget_types?.type_name || "Unknown",
      }));
      setUnits(formatted);
    }
    setLoading(false);
  }

  async function fetchTypes() {
    const { data, error } = await supabase
      .from("gadget_types")
      .select("type_id, type_name")
      .order("type_name");
    if (error) console.error("Error loading types:", error);
    else setTypes(data);
  }

  const stats = useMemo(() => {
    const total = units.length;
    const available = units.filter((u) => u.status === "Available").length;
    const inUse = units.filter((u) => u.status === "In Use").length;
    const inRepair = units.filter((u) => u.status === "In Repair").length;
    return { total, available, inUse, inRepair };
  }, [units]);

  const filteredUnits = units.filter((u) => {
    const matchType = filterType ? u.type_name === filterType : true;
    const matchStatus = filterStatus ? u.status === filterStatus : true;
    const matchSearch = search
      ? u.gadget_name.toLowerCase().includes(search.toLowerCase()) ||
        u.serial_number.toLowerCase().includes(search.toLowerCase()) ||
        u.description?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchType && matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        Loading gadgets...
      </div>
    );
  }


  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-sm text-gray-400">Connected to Supabase.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Add Gadget
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Gadgets" value={stats.total} color="blue" />
        <SummaryCard title="Available" value={stats.available} color="green" />
        <SummaryCard title="In Use" value={stats.inUse} color="yellow" />
        <SummaryCard title="In Repair" value={stats.inRepair} color="red" />
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-900 p-4 rounded-lg">
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {[...new Set(units.map((u) => u.type_name))].map((type) => (
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
            <option value="Lost">Lost</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Search gadget name, serial, or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none w-full sm:w-72"
        />
      </div>

      {/* Table */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={[
            "Serial Number",
            "Gadget Name",
            "Description",
            "Type",
            "Price/Day",
            "Status",
            "Actions",
          ]}
          rows={filteredUnits.map((u) => [
              u.serial_number,
              u.gadget_name,
              u.description,
              u.type_name,
              `₱${u.price_per_day || 0}`,
              <StatusBadge key={u.gadget_id} status={u.status} />,
              <div key={`actions-${u.gadget_id}`} className="flex gap-3">
                <button
                  onClick={() => setSelected(u)}
                  className="text-blue-400 hover:underline"
                >
                  View
                </button>
              <button
                onClick={() => setEditTarget(u)}
                className="text-yellow-400 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => u.status === "In Use" ? alert("You cannot delete a gadget currently in use.") : setDeleteTarget(u)}
                className={`${
                  u.status === "In Use"
                    ? "text-gray-500 cursor-not-allowed"
                    : "text-red-400 hover:underline"
                }`}
                disabled={u.status === "In Use"}
              >
                Delete
              </button>
            </div>,
          ])}
        />
      </section>

      {/* View Gadget Modal */}
      {selected && (
        <Modal
          title={`Details for ${selected.serial_number}`}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-2 text-sm">
            <p><b>Serial:</b> {selected.serial_number}</p>
            <p><b>Gadget:</b> {selected.gadget_name}</p>
            <p><b>Type:</b> {selected.type_name}</p>
            <p><b>Description:</b> {selected.description}</p>
            <p><b>Status:</b> {selected.status}</p>
            <p><b>Price per Day:</b> ₱{selected.price_per_day || 0}</p>
            <div className="mt-4">
              <label className="block text-gray-300 mb-2 font-semibold">Image</label>
              {selected.image_url ? (
                <img
                  src={selected.image_url}
                  alt={selected.gadget_name}
                  className="rounded-xl object-cover w-64 h-64 border border-gray-700 shadow-md"
                />
              ) : (
                <p className="text-gray-500 italic">No image available</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Gadget Modal */}
      {showAddModal && (
        <AddOrEditGadgetModal
          onClose={() => setShowAddModal(false)}
          onSaved={fetchData}
          types={types}
          mode="add"
          onTypeCreated={fetchTypes}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          title="Confirm Delete"
          onClose={() => setDeleteTarget(null)}
        >
          <p className="text-sm text-gray-300 mb-4">
            Are you sure you want to delete{" "}
            <b>{deleteTarget.gadget_name}</b> (Serial: {deleteTarget.serial_number})?
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteTarget)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Gadget Modal */}
      {editTarget && (
        <AddOrEditGadgetModal
          onClose={() => setEditTarget(null)}
          onSaved={fetchData}
          types={types}
          mode="edit"
          existing={editTarget}
          onTypeCreated={fetchTypes}
        />
      )}
    </div>
  );
}

/* ---------- Add/Edit Gadget Modal ---------- */
function AddOrEditGadgetModal({ onClose, onSaved, types = [], mode = "add", existing = {}, onTypeCreated }) {
  const [form, setForm] = useState({
    serial_number: existing.serial_number || "",
    gadget_name: existing.gadget_name || "",
    description: existing.description || "",
    status: existing.status || "Available",
    type_id: "",
    price_per_day: existing.price_per_day || 0,
    image_url: existing.image_url || "",
  });
  const [loading, setLoading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  useEffect(() => {
    if (existing?.type_name) {
      const foundType = types.find((t) => t.type_name === existing.type_name);
      if (foundType) setForm((prev) => ({ ...prev, type_id: foundType.type_id }));
    }
  }, [existing, types]);

  async function handleImageUpload(file) {
    if (!file) return;

    // --- Simple Validation ---
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 2 * 1024 * 1024; // 2MB limit

    if (!validTypes.includes(file.type)) {
      alert("❌ Only JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > maxSize) {
      alert("⚠️ Image size should not exceed 2MB.");
      return;
    }

    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("gadgets")
      .upload(fileName, file, { upsert: true });

    if (error) {
      alert("❌ Image upload failed: " + error.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("gadgets")
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // ✅ Update form state
    setForm((prev) => ({ ...prev, image_url: imageUrl }));

    // ✅ If editing, save immediately to DB
    if (mode === "edit" && existing?.gadget_id) {
      await supabase
        .from("gadgets")
        .update({ image_url: imageUrl })
        .eq("gadget_id", existing.gadget_id);
    }

    alert("✅ Image uploaded successfully!");
  }




  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.type_id) {
      alert("Please select a gadget type.");
      return;
    }

    setLoading(true);
    const payload = {
      serial_number: form.serial_number,
      gadget_name: form.gadget_name,
      description: form.description,
      status: form.status,
      type_id: form.type_id,
      price_per_day: Number(form.price_per_day) || 0,
      image_url: form.image_url || null,
    };

    const query =
      mode === "add"
        ? supabase.from("gadgets").insert([payload])
        : supabase.from("gadgets").update(payload).eq("gadget_id", existing.gadget_id);

    const { error } = await query;
    setLoading(false);

    if (error) {
      console.error("Error saving gadget:", error);
      alert("Error saving gadget: " + error.message);
    } else {
      alert(`Gadget ${mode === "add" ? "added" : "updated"} successfully!`);
      onSaved();
      onClose();
    }
  }

  return (
    <>
      <Modal title={mode === "add" ? "Add New Gadget" : "Edit Gadget"} onClose={onClose}>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <Input label="Serial Number" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} required />
          <Input label="Gadget Name" value={form.gadget_name} onChange={(e) => setForm({ ...form, gadget_name: e.target.value })} required />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div>
            <label className="block text-gray-400 mb-1">Type</label>
            <div className="flex gap-2">
              <select
                value={form.type_id}
                onChange={(e) => setForm({ ...form, type_id: e.target.value })}
                className="flex-1 bg-gray-800 rounded px-3 py-2"
              >
                <option value="">Select type</option>
                {types.map((t) => (
                  <option key={t.type_id} value={t.type_id}>
                    {t.type_name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => setShowTypeModal(true)} className="bg-gray-700 hover:bg-gray-600 text-sm px-2 rounded">
                + New Type
              </button>
            </div>
          </div>
          <Input
            label="Price per Day (₱)"
            type="number"
            value={form.price_per_day}
            onChange={(e) => setForm({ ...form, price_per_day: e.target.value })}
          />

          <div>
            <label className="block text-gray-400 mb-1">Gadget Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0])}
              className="w-full bg-gray-800 rounded px-3 py-2"
          />
            {form.image_url && (
              <img
                src={form.image_url}
                alt="Preview"
                className="mt-2 rounded-lg w-32 h-32 object-cover"
              />
            )}
          </div>

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={["Available", "Reserved", "In Use", "In Repair", "Lost"]}
          />


          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              {loading ? "Saving..." : mode === "add" ? "Save" : "Update"}
            </button>
          </div>
        </form>
      </Modal>

      {showTypeModal && <AddTypeModal onClose={() => setShowTypeModal(false)} onCreated={onTypeCreated} />}
    </>
  );
}

/* ---------- Add Type Modal ---------- */
function AddTypeModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ type_name: "", description: "" });
  const [loading, setLoading] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    const name = form.type_name.trim();
    if (!name) return alert("Type name is required.");

    setLoading(true);
    const { data: existing } = await supabase
      .from("gadget_types")
      .select("type_id")
      .ilike("type_name", name);

    if (existing?.length) {
      alert("That type already exists.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("gadget_types").insert([{ type_name: name, description: form.description }]);
    setLoading(false);

    if (error) alert("Error adding type: " + error.message);
    else {
      alert("Type added successfully!");
      onCreated();
      onClose();
    }
  }

  return (
    <Modal title="Add Gadget Type" onClose={onClose}>
      <form onSubmit={handleCreate} className="space-y-3 text-sm">
        <Input label="Type Name" value={form.type_name} onChange={(e) => setForm({ ...form, type_name: e.target.value })} required />
        <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            {loading ? "Adding..." : "Add Type"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Small Reusable Components ---------- */
function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-gray-400 mb-1">{label}</label>
      <input {...props} className="w-full bg-gray-800 rounded px-3 py-2" />
    </div>
  );
}

function Textarea({ label, ...props }) {
  return (
    <div>
      <label className="block text-gray-400 mb-1">{label}</label>
      <textarea {...props} className="w-full bg-gray-800 rounded px-3 py-2" />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div>
      <label className="block text-gray-400 mb-1">{label}</label>
      <select {...props} className="w-full bg-gray-800 rounded px-3 py-2">
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
