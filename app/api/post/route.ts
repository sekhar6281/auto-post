import { auth } from "@/lib/auth";
import { postToLinkedIn } from "@/lib/linkedin";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/** Validates that a URL is hosted on Cloudinary — prevents SSRF via mediaUrls */
function isCloudinaryUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

const PostSchema = z.object({
  caption: z
    .string()
    .min(1, "Caption is required")
    .max(3000, "Caption exceeds LinkedIn's 3000-character limit"),

  // Each URL must be an HTTPS Cloudinary URL — no arbitrary server-side fetches
  mediaUrls: z
    .array(
      z.string()
        .url("Invalid media URL")
        .refine(isCloudinaryUrl, { message: "Media must be uploaded through this app." })
    )
    .min(0)
    .max(9, "LinkedIn supports up to 9 images per post")
    .optional(),

  mediaType: z.enum(["image", "video"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || !session?.linkedinId) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again" },
      { status: 401 }
    );
  }

  // Verify the request comes from our own frontend (CSRF / origin check)
  const origin = req.headers.get("origin");
  const host   = req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 5 posts per user per hour
  const { allowed, retryAfter } = rateLimit(
    `post:${session.linkedinId}`,
    { windowMs: 60 * 60_000, max: 5 }
  );
  if (!allowed) {
    return NextResponse.json(
      { error: `Post limit reached. Try again in ${retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { caption, mediaUrls = [], mediaType } = parsed.data;

  // Videos must be single file only
  if (mediaType === "video" && mediaUrls.length > 1) {
    return NextResponse.json(
      { error: "Only one video per post is supported." },
      { status: 400 }
    );
  }

  try {
    const result = await postToLinkedIn({
      accessToken: session.accessToken,
      linkedinId:  session.linkedinId,
      caption,
      mediaUrls,
      mediaType,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error
      ? err.message
      : "Failed to post to LinkedIn.";
    // Redact any tokens that may appear in error messages before logging
    console.error("[post] Error:", message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]"));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
