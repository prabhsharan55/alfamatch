import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { campaignName, budget, brandName } = await req.json();

    const budgetLine = budget
      ? `Total budget: ₹${Number(budget).toLocaleString("en-IN")}`
      : "Budget: not specified";

    const prompt = `You are a professional campaign manager writing a creator brief for an Indian influencer marketing campaign.

Brand: ${brandName || "the brand"}
Campaign: ${campaignName}
${budgetLine}

Write a concise, actionable campaign brief. Use this exact format:

🎯 Goal
One sentence on what this campaign needs to achieve.

👥 Target Audience
Who we want to reach (age, interest, region if relevant).

📦 Deliverables
- [list 2–3 specific content deliverables, e.g. 1 Instagram Reel, 2 Stories]

✅ Do's
- [2–3 things creators should do or highlight]

❌ Don'ts
- [2 things to avoid]

🎨 Tone
One line describing the content style/vibe.

Keep everything short and practical. No fluff.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);

    const data = await res.json();
    const brief = data.content?.[0]?.text?.trim() ?? "";

    return new Response(JSON.stringify({ brief }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
