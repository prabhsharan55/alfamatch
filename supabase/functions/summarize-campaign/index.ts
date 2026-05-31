import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const {
      brandName,
      campaignName,
      status,
      budgetInr,
      brief,
      inquiriesSent,
      creatorsBooked,
      createdAt,
    } = await req.json();

    const budgetLine   = budgetInr   ? `Budget: ₹${Number(budgetInr).toLocaleString("en-IN")}` : "Budget: not specified";
    const briefLine    = brief       ? `Campaign brief: ${brief}` : "";
    const daysRunning  = createdAt
      ? Math.ceil((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
      : null;
    const daysLine     = daysRunning ? `Running for: ${daysRunning} days` : "";

    const prompt = `You are writing a professional campaign performance report for an Indian influencer marketing campaign.

Brand: ${brandName || "the brand"}
Campaign: ${campaignName}
Status: ${status}
${budgetLine}
${briefLine}
Inquiries sent to creators: ${inquiriesSent ?? 0}
Creators booked/accepted: ${creatorsBooked ?? 0}
${daysLine}

Write a concise campaign summary report. Use this exact format:

## Campaign Summary

One paragraph overview of the campaign's progress and status.

## Key Numbers
- **Creators Reached:** ${inquiriesSent ?? 0} inquiries sent
- **Creators Booked:** ${creatorsBooked ?? 0} confirmed
- **Booking Rate:** [calculate as % of inquiries]
- **Budget Allocated:** ${budgetInr ? `₹${Number(budgetInr).toLocaleString("en-IN")}` : "Not set"}
- **Estimated Cost Per Creator:** [calculate if budget and bookings available, else "—"]

## What's Working
2 bullet points on positives based on the data.

## Recommendations
2 bullet points on what to do next or improve.

## Next Steps
One clear action item.

Keep it factual, professional, and useful. Don't invent metrics you don't have.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);

    const data = await res.json();
    const summary = data.content?.[0]?.text?.trim() ?? "";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
