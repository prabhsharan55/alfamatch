import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { inquiry_id, amount_inr } = await req.json();
    if (!inquiry_id || !amount_inr) throw new Error("inquiry_id and amount_inr required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify inquiry exists and is accepted
    const { data: inquiry, error: inqErr } = await supabase
      .from("inquiries")
      .select("id, status")
      .eq("id", inquiry_id)
      .single();

    if (inqErr || !inquiry) throw new Error("Inquiry not found");
    if (inquiry.status !== "accepted") throw new Error("Inquiry must be accepted before payment");

    // Check not already paid
    const { data: existing } = await supabase
      .from("escrow_payments")
      .select("id, status")
      .eq("inquiry_id", inquiry_id)
      .maybeSingle();

    if (existing && existing.status !== "pending") {
      throw new Error("Payment already initiated for this inquiry");
    }

    // 5% platform fee
    const platform_fee_inr = Math.round(amount_inr * 0.05);

    // In production: create real Razorpay order here
    // const razorpay_order_id = await createRazorpayOrder(amount_inr);
    // For now: mock order ID
    const razorpay_order_id = `order_mock_${Date.now()}`;

    if (existing) {
      // Update pending record
      await supabase
        .from("escrow_payments")
        .update({ amount_inr, platform_fee_inr, razorpay_order_id })
        .eq("id", existing.id);
    } else {
      // Insert new escrow record
      await supabase.from("escrow_payments").insert({
        inquiry_id,
        amount_inr,
        platform_fee_inr,
        razorpay_order_id,
        status: "pending",
      });
    }

    return new Response(
      JSON.stringify({
        order_id: razorpay_order_id,
        amount_inr,
        platform_fee_inr,
        total_inr: amount_inr + platform_fee_inr,
      }),
      { headers: { ...cors, "content-type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
