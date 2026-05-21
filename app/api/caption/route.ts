import { auth } from "@/lib/auth";
import { generateCaption } from "@/lib/groq";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  context:   z.string().max(500).optional().default(""),
  summitUrl: z.string().url().optional(),
  tone:      z.enum(["professional", "startup-founder", "technical", "motivational"]),
  mediaType: z.enum(["image", "video"]),
  mediaUrl:  z.string().url().optional(),
}).refine(
  d => (d.context && d.context.length >= 3) || d.summitUrl,
  { message: "Please enter a summit URL or a short description", path: ["context"] }
);

async function fetchSummitContext(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(tid);
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ").replace(/&#\d+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 3500);
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, retryAfter } = rateLimit(
    `caption:${session.linkedinId}`,
    { windowMs: 60_000, max: 10 }
  );
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  let summitContext: string | undefined;
  if (parsed.data.summitUrl) {
    summitContext = await fetchSummitContext(parsed.data.summitUrl);
  }

  try {
    const result = await generateCaption({ ...parsed.data, summitContext });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Caption generation failed. Please try again.";
    console.error("[caption] Groq error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
