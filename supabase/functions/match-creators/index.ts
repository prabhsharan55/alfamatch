import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CreatorSummary = {
  id: string;
  name: string;
  niche: string;
  tier: string;
  followers: string;
  engagement: string;
  city: string;
  categories: string[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { query, creators }: { query: string; creators: CreatorSummary[] } = await req.json();

    if (!query?.trim() || !creators?.length) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const creatorList = creators.map((c, i) =>
      `[${i}] ${c.name} | ${c.niche} | ${c.tier} | ${c.followers} followers | ${c.engagement} engagement | ${c.city} | categories: ${(c.categories ?? []).join(", ")}`
    ).join("\n");

    const prompt = `You are a talent matching expert for an Indian influencer marketplace.

Brand requirement: "${query}"

Available creators:
${creatorList}

Pick the top 5 best matches for this brand requirement. For each, give a short one-sentence reason why they're a good fit.

Respond in exactly this JSON format (no extra text, just valid JSON):
{
  "matches": [
    { "index": 0, "score": 95, "reason": "..." },
    { "index": 2, "score": 88, "reason": "..." }
  ]
}

Score 0–100. Only include creators that are genuinely relevant. If fewer than 5 are relevant, return fewer.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() ?? "{}";

    // Extract JSON safely
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { matches: [] };

    // Attach creator data to each match
    const enriched = (parsed.matches ?? []).map((m: { index: number; score: number; reason: string }) => ({
      creator: creators[m.index],
      score: m.score,
      reason: m.reason,
    })).filter((m: { creator: CreatorSummary }) => m.creator);

    return new Response(JSON.stringify({ matches: enriched }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
