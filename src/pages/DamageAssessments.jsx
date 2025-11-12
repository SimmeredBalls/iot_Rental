// src/pages/DamageAssessments.jsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { SummaryCard, Table, StatusBadge, Modal } from "../components/ui/CommonUI";

export default function DamageAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchAssessments();

    // 👂 Subscribe to real-time updates from Supabase
    const channel = supabase
      .channel("damage-assessments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "damage_assessments" },
        (payload) => {
          console.log("Damage assessment change detected:", payload);
          fetchAssessments(); // 🔄 refresh automatically
        }
      )
      .subscribe();

    // 🧹 Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  // ✅ Fetch Assessments with student and rental info
  async function fetchAssessments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("damage_assessments")
      .select(`
        assessment_id,
        initial_notes,
        date_flagged,
        final_notes,
        fine_amount,
        status,
        rentals (
          rental_id,
          students (
            student_id,
            name,
            email
          ),
          rental_items (
            gadgets (
              gadget_name,
              serial_number
            )
          )
        )
      `)
      .order("date_flagged", { ascending: false });

    if (error) console.error("Error fetching assessments:", error);
    else setAssessments(data || []);
    setLoading(false);
  }

  // ✅ Mark as Resolved
  async function markResolved(assessment_id) {
    const confirmAction = confirm("Mark this assessment as resolved?");
    if (!confirmAction) return;

    const { error } = await supabase
      .from("damage_assessments")
      .update({ status: "Resolved" })
      .eq("assessment_id", assessment_id);

    if (error) {
      console.error(error);
      alert("❌ Failed to mark as resolved.");
    } else {
      alert("✅ Assessment marked as resolved!");
      fetchAssessments();
    }
  }

  // ✅ Create Fine (Transaction)
  async function createFine(a) {
    if (!a.fine_amount || !a.rentals?.students?.student_id) {
      alert("Missing fine amount or student info.");
      return;
    }

    const confirmFine = confirm(`Create fine ₱${a.fine_amount} for ${a.rentals.students.name}?`);
    if (!confirmFine) return;

    const { error } = await supabase.from("transactions").insert([
      {
        student_id: a.rentals.students.student_id,
        rental_id: a.rentals.rental_id,
        transaction_type: a.final_notice?.toLowerCase().includes("lost") ? "Lost Fine" : "Damage Fine",
        amount: a.fine_amount,
        status: "Unpaid",
        transaction_date: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error creating fine:", error);
      alert("❌ Failed to create fine.");
    } else {
      alert("✅ Fine transaction created!");
      markResolved(a.assessment_id);
    }
  }

  // ✅ Stats
  const stats = useMemo(() => {
    const total = assessments.length;
    const pending = assessments.filter((a) => a.status === "Pending").length;
    const resolved = assessments.filter((a) => a.status === "Resolved").length;
    const totalFines = assessments.reduce((sum, a) => sum + (a.fine_amount || 0), 0);
    return { total, pending, resolved, totalFines };
  }, [assessments]);

  // ✅ Filtering and Search
  const filtered = useMemo(() => {
    return assessments.filter((a) => {
      const student = a.rentals?.students?.name?.toLowerCase() || "";
      const gadget =
        a.rentals?.rental_items?.[0]?.gadgets?.gadget_name?.toLowerCase() || "";
      const serial =
        a.rentals?.rental_items?.[0]?.gadgets?.serial_number?.toLowerCase() || "";
      const matchFilter = filter ? a.status === filter : true;
      const matchSearch = search
        ? student.includes(search.toLowerCase()) ||
          gadget.includes(search.toLowerCase()) ||
          serial.includes(search.toLowerCase())
        : true;
      return matchFilter && matchSearch;
    });
  }, [assessments, filter, search]);

  if (loading) return <div className="text-gray-400">Loading assessments...</div>;

  return (
    <div className="space-y-8 text-white">
      {/* ---------- HEADER ---------- */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Damage Assessments</h1>
        <p className="text-sm text-gray-400">
          Review and manage all damaged or lost gadget reports.
        </p>
      </div>

      {/* ---------- STATS ---------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard title="Total Reports" value={stats.total} />
        <SummaryCard title="Pending" value={stats.pending} />
        <SummaryCard title="Resolved" value={stats.resolved} />
        <SummaryCard title="Total Fines (₱)" value={stats.totalFines} />
      </div>

      {/* ---------- FILTERS ---------- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by student, gadget, or serial"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none w-60"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* ---------- TABLE ---------- */}
      <section className="bg-gray-900 rounded-xl p-6 shadow-lg">
        <Table
          headers={[
            "ID",
            "Student",
            "Gadget",
            "Serial",
            "Date Flagged",
            "Fine (₱)",
            "Status",
            "Actions",
          ]}
          rows={filtered.map((a) => [
            a.assessment_id,
            a.rentals?.students?.name || "Unknown",
            a.rentals?.rental_items?.[0]?.gadgets?.gadget_name || "N/A",
            a.rentals?.rental_items?.[0]?.gadgets?.serial_number || "—",
            new Date(a.date_flagged).toLocaleDateString(),
            a.fine_amount || "—",
            <StatusBadge status={a.status} key={a.assessment_id} />,
            <div key={a.assessment_id} className="flex gap-2">
              {a.status === "Pending" ? (
                <>
                  <button
                    onClick={() => createFine(a)}
                    className="text-green-400 hover:underline"
                  >
                    Create Fine
                  </button>
                  <button
                    onClick={() => setSelected(a)}
                    className="text-blue-400 hover:underline"
                  >
                    View
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelected(a)}
                  className="text-gray-400 hover:underline"
                >
                  View
                </button>
              )}
            </div>,
          ])}
        />
      </section>

      {/* ---------- MODAL ---------- */}
      {selected && (
        <Modal
          title={`Assessment #${selected.assessment_id}`}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-3 text-sm">
            <p><b>Student:</b> {selected.rentals?.students?.name}</p>
            <p><b>Rental ID:</b> {selected.rentals?.rental_id}</p>
            <p><b>Initial Notes:</b> {selected.initial_notes || "—"}</p>
            <p><b>Final Notes:</b> {selected.final_notes || "—"}</p>
            <p><b>Fine Amount:</b> ₱{selected.fine_amount || "—"}</p>
            <p><b>Status:</b> <StatusBadge status={selected.status} /></p>
            <p><b>Date Flagged:</b> {new Date(selected.date_flagged).toLocaleString()}</p>

            {selected.status === "Pending" && (
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    createFine(selected);
                    setSelected(null);
                  }}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                >
                  Create Fine
                </button>
                <button
                  onClick={() => {
                    markResolved(selected.assessment_id);
                    setSelected(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
