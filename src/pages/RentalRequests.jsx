// src/pages/RentalRequests.jsx
import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SummaryCard, Table, StatusBadge, Modal } from "../components/ui/CommonUI";

export default function RentalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("rental_requests_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "rentals" }, fetchRequests)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rentals")
      .select(`
        rental_id,
        rental_date,
        due_date,
        rental_status,
        students (name, email, major)
      `)
      .eq("rental_status", "Pending") // only show pending requests
      .order("rental_date", { ascending: false });

    if (error) {
      console.error("Error loading rental requests:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }

  async function handleApprove(rental) {
    try {
      // Step 1: Update rental status and add pickup_date
      const pickupDate = new Date().toISOString();

      const { error: rentalError } = await supabase
        .from("rentals")
        .update({
          rental_status: "Approved",
          pickup_date: pickupDate, // optional new column if you have it
        })
        .eq("rental_id", rental.rental_id);

      if (rentalError) throw rentalError;

      // Step 2: Get all gadget IDs from rental_items
      const { data: rentalItems, error: itemsError } = await supabase
        .from("rental_items")
        .select("gadget_id")
        .eq("rental_id", rental.rental_id);

      if (itemsError) throw itemsError;

      // Step 3: Mark all those gadgets as Reserved
      if (rentalItems?.length) {
        const gadgetIds = rentalItems.map((item) => item.gadget_id);
        const { error: gadgetError } = await supabase
          .from("gadgets")
          .update({ status: "Reserved" })
          .in("gadget_id", gadgetIds);

        if (gadgetError) throw gadgetError;
      }

      alert("Request approved and gadgets reserved successfully!");
      fetchRequests();
      setSelected(null);
    } catch (error) {
      console.error("Error approving request:", error.message);
      alert("Error approving request.");
    }
  }


  async function handleReject(rental) {
    try {
      const { error } = await supabase
        .from("rentals")
        .update({ rental_status: "Rejected" })
        .eq("rental_id", rental.rental_id);

      if (error) throw error;

      alert("Request rejected.");
      fetchRequests();
      setSelected(null);
    } catch (error) {
      console.error("Error rejecting request:", error.message);
      alert("Error rejecting request.");
    }
  }


  const stats = useMemo(() => {
    const total = requests.length;
    return { total };
  }, [requests]);

  if (loading) return <div className="text-gray-400">Loading rental requests...</div>;

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rental Requests</h1>
          <p className="text-sm text-gray-400">Review and manage pending requests.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Pending Requests" value={stats.total} color="yellow" />
      </div>

      {/* Table */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={["Student", "Email", "Major", "Request Date", "Status", "Actions"]}
          rows={requests.map((r) => [
            r.students?.name || "Unknown",
            r.students?.email || "N/A",
            r.students?.major || "N/A",
            new Date(r.rental_date).toLocaleDateString(),
            <StatusBadge key={r.rental_id} status={r.rental_status} />,
            <div key={`actions-${r.rental_id}`} className="flex gap-3">
              <button
                onClick={() => setSelected(r)}
                className="text-blue-400 hover:underline"
              >
                View
              </button>
            </div>,
          ])}
        />
      </section>

      {/* View Modal */}
      {selected && (
        <Modal
          title={`Request by ${selected.students?.name || "Unknown"}`}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-3 text-sm">
            <p><b>Email:</b> {selected.students?.email}</p>
            <p><b>Major:</b> {selected.students?.major}</p>
            <p><b>Requested On:</b> {new Date(selected.rental_date).toLocaleString()}</p>
            <p><b>Status:</b> {selected.rental_status}</p>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setSelected(null)}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
            >
              Close
            </button>
            <button
              onClick={() => handleApprove(selected)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(selected)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Reject
            </button>

          </div>
        </Modal>
      )}
    </div>
  );
}
