export type Tone =
  | "professional"
  | "startup-founder"
  | "technical"
  | "motivational";

export interface CaptionRequest {
  context: string;
  tone: Tone;
  mediaType: "image" | "video";
  mediaUrl?: string;
}

export interface StructuredCaption {
  hook: string;       // First scroll-stopping line
  body: string;       // Main caption body (no hook, no hashtags)
  hashtags: string[]; // e.g. ["#AI", "#LinkedIn", "#SaaS"]
  fullCaption: string; // hook + "\n\n" + body + "\n\n" + hashtags joined
  tokensUsed: number;
}

// ── Tone personality guides ──────────────────────────────────
const TONE_GUIDES: Record<Tone, string> = {
  professional:
    "Authoritative and polished. Use industry language, data-driven insights, " +
    "and a confident executive voice. Suitable for corporate professionals.",

  "startup-founder":
    "Raw, authentic founder energy. Share behind-the-scenes struggles, wins, " +
    "lessons learned building a company. Relatable to other founders and builders. " +
    "Use 'we' and 'our team' naturally.",

  technical:
    "Precise and insightful for a developer/engineering audience. Reference " +
    "technical concepts naturally, share architectural decisions or lessons, " +
    "use concise language. Respect the reader's intelligence.",

  motivational:
    "High-energy and inspiring. Focus on growth mindset, overcoming challenges, " +
    "and empowering the reader to take action. Use punchy short sentences. " +
    "End with a powerful call-to-action.",
};

// ── System prompt ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an elite LinkedIn content strategist who has grown profiles to 100k+ followers.

You write captions that stop the scroll, drive engagement, and build personal brands.

Rules:
- Hook: ONE powerful opening line (max 12 words). No "Excited to share". No "I'm pleased to".
- Body: 100–200 words. Short paragraphs (1–3 lines). Insight, story, or lesson.
- Hashtags: exactly 4–6 relevant hashtags.
- Never use bullet points with "•" or "-" in the body.
- No markdown formatting (no **, no ##).
- Match the tone exactly as instructed.

You MUST respond with valid JSON only. No extra text. No code blocks. Just the raw JSON object.

JSON format:
{
  "hook": "The single opening line",
  "body": "The main caption body without the hook and without hashtags",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4"]
}`;

// ── Build user prompt ────────────────────────────────────────
function buildUserPrompt(req: CaptionRequest): string {
  return `Generate a LinkedIn caption.

Context: ${req.context}
Tone style: ${TONE_GUIDES[req.tone]}
Media type: ${req.mediaType === "video" ? "Video post" : "Image post"}

Return only the JSON object.`;
}

// ── Main export ──────────────────────────────────────────────
export async function generateCaption(
  req: CaptionRequest
): Promise<StructuredCaption> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(req) },
      ],
      max_tokens: 700,
      temperature: 0.85,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty response from DeepSeek");

  // Strip markdown code fences if the model wrapped the JSON anyway
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Parse structured JSON
  let parsed: { hook: string; body: string; hashtags: string[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("DeepSeek returned invalid JSON — please regenerate");
  }

  const { hook, body, hashtags } = parsed;

  if (!hook || !body || !Array.isArray(hashtags)) {
    throw new Error("Incomplete caption data — please regenerate");
  }

  const fullCaption = `${hook}\n\n${body}\n\n${hashtags.join(" ")}`;

  return {
    hook,
    body,
    hashtags,
    fullCaption,
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
}
