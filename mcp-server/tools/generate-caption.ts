import type { CaptionInput, CaptionOutput } from "../schemas/caption.schema.js";

const TONE_GUIDES: Record<string, string> = {
  professional:
    "Authoritative and polished. Industry language, data-driven insights, confident executive voice.",
  "startup-founder":
    "Raw, authentic founder energy. Behind-the-scenes struggles, wins, lessons from building.",
  technical:
    "Precise and insightful for developers. Reference technical concepts, architectural decisions.",
  motivational:
    "High-energy and inspiring. Growth mindset, overcoming challenges, punchy short sentences.",
};

const SYSTEM_PROMPT = `You are an elite LinkedIn content strategist who has grown profiles to 100k+ followers.

Rules:
- Hook: ONE powerful opening line (max 12 words). Never start with "Excited to share" or "I am pleased to".
- Body: 100–200 words. Short paragraphs (1–3 lines). Insight, story, or lesson.
- Hashtags: exactly 4–6 relevant hashtags.
- No markdown (no **, no ##, no bullets).
- Match tone exactly.

Respond with valid JSON ONLY:
{
  "hook": "single opening line",
  "body": "main caption body (no hook, no hashtags)",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"]
}`;

export async function generateCaptionTool(
  input: CaptionInput
): Promise<CaptionOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const userPrompt = `Generate a LinkedIn caption.

Context: ${input.context}
Tone: ${TONE_GUIDES[input.tone]}
Media type: ${input.media_type === "video" ? "Video post" : "Image post"}
${input.media_url ? `Media URL: ${input.media_url}` : ""}

Return JSON only.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userPrompt },
      ],
      max_tokens: 700,
      temperature: 0.85,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
  };
  const raw  = data.choices?.[0]?.message?.content?.trim();
  if (!raw)  throw new Error("Empty response from Groq");

  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed = JSON.parse(jsonStr) as {
    hook: string;
    body: string;
    hashtags: string[];
  };

  if (!parsed.hook || !parsed.body || !Array.isArray(parsed.hashtags)) {
    throw new Error("Malformed caption response — please retry");
  }

  const full_caption = `${parsed.hook}\n\n${parsed.body}\n\n${parsed.hashtags.join(" ")}`;

  return {
    hook:         parsed.hook,
    body:         parsed.body,
    hashtags:     parsed.hashtags,
    full_caption,
    tokens_used:  data.usage?.total_tokens ?? 0,
  };
}
