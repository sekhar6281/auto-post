import { auth } from "@/lib/auth";
import { generateCaption } from "@/lib/deepseek";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  context: z
    .string()
    .min(3, "Context too short — add more detail")
    .max(300, "Context too long (max 300 chars)"),
  tone: z.enum(["professional", "startup-founder", "technical", "motivational"]),
  mediaType: z.enum(["image", "video"]),
  mediaUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 10 caption generations per user per minute
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

  try {
    const result = await generateCaption(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[caption] DeepSeek error:", err);
    return NextResponse.json(
      { error: "Caption generation failed. Please try again." },
      { status: 500 }
    );
  }
}
