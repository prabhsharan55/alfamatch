import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { brandName, creatorName, creatorNiche, campaignContext } = await req.json();

    const prompt = `You are a professional brand manager at "${brandName || "a brand"}" reaching out to an Indian social media creator for a paid collaboration.

Write a concise, warm inquiry message to "${creatorName}", a ${creatorNiche || "lifestyle"} creator.

Campaign context: ${campaignContext || "product promotion campaign"}

Rules:
- 3–4 sentences only
- Warm, genuine tone — not salesy or generic
- Mention their niche naturally in one sentence
- End by asking if they're open to discussing
- First person, no subject line, just the message body
- Write in English`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 220,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error: ${err}`);
    }

    const data = await res.json();
    const message = data.content?.[0]?.text?.trim() ?? "";

    return new Response(JSON.stringify({ message }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
