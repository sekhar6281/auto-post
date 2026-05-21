export type Tone =
  | "professional"
  | "startup-founder"
  | "technical"
  | "motivational";

export interface CaptionRequest {
  context?:      string;
  tone:          Tone;
  mediaType:     "image" | "video";
  mediaUrl?:     string;
  summitContext?: string;
}

export interface StructuredCaption {
  hook:        string;    // First scroll-stopping line
  body:        string;    // Main caption body (no hook, no hashtags)
  hashtags:    string[];  // e.g. ["#AI", "#LinkedIn", "#SaaS"]
  fullCaption: string;    // hook + "\n\n" + body + "\n\n" + hashtags joined
  tokensUsed:  number;
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
  const parts: string[] = ["Generate a LinkedIn caption."];

  if (req.summitContext) {
    parts.push(`\nOFFICIAL EVENT WEBSITE CONTENT:\n${req.summitContext}`);
    parts.push(`\nUsing the above event content you MUST:
- Use the exact event/summit name
- Mention keynote speakers or panelists by name if listed
- Mention the organizer or host organization if listed
- Reference key topics or themes from the event
- Write from first-person perspective of an attendee`);
  }

  if (req.context) {
    parts.push(`\nAdditional context from attendee: ${req.context}`);
  }

  parts.push(`\nTone style: ${TONE_GUIDES[req.tone]}`);
  parts.push(`Media type: ${req.mediaType === "video" ? "Video post" : "Image post"}`);
  parts.push(`\nReturn only the JSON object.`);

  return parts.join("\n");
}

// ── Main export ──────────────────────────────────────────────
export async function generateCaption(
  req: CaptionRequest
): Promise<StructuredCaption> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Caption service is not configured. Please contact support.");

  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:           "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: buildUserPrompt(req) },
        ],
        max_tokens:      700,
        temperature:     0.85,
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    // Network-level error — don't expose internal details
    throw new Error("Caption service is temporarily unreachable. Please try again.");
  }

  if (!response.ok) {
    // Log full error server-side but return a safe message to the client
    const rawErr = await response.text().catch(() => "");
    console.error(`[groq] API error ${response.status}:`, rawErr.slice(0, 200));

    if (response.status === 429) {
      throw new Error("Caption service is busy. Please wait a moment and try again.");
    }
    if (response.status >= 500) {
      throw new Error("Caption service is temporarily unavailable. Please try again shortly.");
    }
    throw new Error("Caption generation failed. Please try again.");
  }

  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty response from caption service. Please regenerate.");

  // Strip markdown code fences if the model wrapped the JSON anyway
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Parse structured JSON
  let parsed: { hook: string; body: string; hashtags: string[] };
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Caption format error — please regenerate.");
  }

  const { hook, body, hashtags } = parsed;

  if (!hook || !body || !Array.isArray(hashtags)) {
    throw new Error("Incomplete caption data — please regenerate.");
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
