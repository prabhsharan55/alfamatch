import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { isBrand, status, otherName, offerInr, messages } = await req.json();

    const role = isBrand ? "brand" : "creator";
    const otherRole = isBrand ? "creator" : "brand";

    const history = (messages as { body: string; isMine: boolean }[])
      .map((m) => `${m.isMine ? "You" : otherName}: ${m.body}`)
      .join("\n");

    const offerLine = offerInr
      ? `Current offer on the table: ₹${Number(offerInr).toLocaleString("en-IN")}.`
      : "";

    const prompt = `You are helping a ${role} respond in an Indian influencer marketing negotiation.

The other party is: ${otherName} (${otherRole})
Inquiry status: ${status}
${offerLine}

Conversation so far:
${history}

Write a short, professional reply (2–4 sentences) as the ${role}. Be warm but purposeful.
${status === "negotiating" ? "Since it's a negotiation, address terms, timeline, or deliverables naturally." : ""}
${status === "new" ? "This is an early stage — keep it welcoming and ask a clarifying question." : ""}
${status === "replied" ? "Move the conversation forward — show interest or ask about next steps." : ""}

Just the message body. No greeting prefix like 'Hi,' unless it flows naturally.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Anthropic error: ${await res.text()}`);

    const data = await res.json();
    const reply = data.content?.[0]?.text?.trim() ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
