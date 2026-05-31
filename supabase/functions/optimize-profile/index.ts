import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { displayName, currentHeadline, currentBio, categories, city } = await req.json();

    const context = [
      displayName && `Creator name: ${displayName}`,
      categories?.length && `Niche/categories: ${categories.join(", ")}`,
      city && `Based in: ${city}`,
      currentHeadline && `Current headline: ${currentHeadline}`,
      currentBio && `Current bio: ${currentBio}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are helping an Indian social media creator improve their marketplace profile to attract brand deals.

${context}

Write two things:
1. HEADLINE: A punchy one-liner (max 10 words) — niche + city or unique angle. No quotes.
2. BIO: 2–3 sentences. What they create, who their audience is, what kind of brands they love working with. Natural, confident, not generic.

Respond in exactly this format (no extra text):
HEADLINE: <headline here>
BIO: <bio here>`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);

    const data = await res.json();
    const text: string = data.content?.[0]?.text?.trim() ?? "";

    const headlineMatch = text.match(/HEADLINE:\s*(.+)/);
    const bioMatch      = text.match(/BIO:\s*([\s\S]+)/);

    return new Response(JSON.stringify({
      headline: headlineMatch?.[1]?.trim() ?? "",
      bio:      bioMatch?.[1]?.trim() ?? "",
    }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
