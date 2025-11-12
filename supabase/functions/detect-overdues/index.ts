import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async () => {
  try {
    const now = new Date().toISOString();

    // 1️⃣ Fetch overdue rentals
    const { data: overdueRentals, error: fetchError } = await supabase
      .from("rentals")
      .select("rental_id, student_id, due_date")
      .eq("rental_status", "Ongoing")
      .lt("due_date", now);

    if (fetchError) throw fetchError;
    if (!overdueRentals?.length)
      return new Response("✅ No overdue rentals found", { status: 200 });

    console.log(`Found ${overdueRentals.length} overdue rentals`);

    // 2️⃣ Mark as overdue
    const overdueIds = overdueRentals.map((r) => r.rental_id);
    const { error: updateError } = await supabase
      .from("rentals")
      .update({ rental_status: "Overdue" })
      .in("rental_id", overdueIds);
    if (updateError) throw updateError;

    // 3️⃣ Create overdue fine if not exists
    for (const rental of overdueRentals) {
      const daysOverdue =
        Math.ceil(
          (new Date().getTime() - new Date(rental.due_date).getTime()) /
            (1000 * 60 * 60 * 24)
        ) || 1;

      const fineAmount = 20 * daysOverdue; // ₱20/day

      const { data: existingFine } = await supabase
        .from("transactions")
        .select("transaction_id")
        .eq("rental_id", rental.rental_id)
        .eq("transaction_type", "Overdue Fine")
        .maybeSingle();

      if (!existingFine) {
        await supabase.from("transactions").insert([
          {
            student_id: rental.student_id,
            rental_id: rental.rental_id,
            transaction_type: "Overdue Fine",
            amount: fineAmount,
            status: "Unpaid",
            transaction_date: new Date().toISOString(),
          },
        ]);
        console.log(
          `💸 Created fine for rental #${rental.rental_id} — ₱${fineAmount}`
        );
      }
    }

    return new Response("✅ Overdue detection complete", { status: 200 });
  } catch (error) {
    console.error("❌ Error in overdue detection:", error);
    return new Response("❌ Error processing overdue rentals", { status: 500 });
  }
});
