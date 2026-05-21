// LinkedIn UGC Posts API — production-ready implementation
// Supports: single image, multiple images (up to 9), video, text-only
// Features: retry with exponential backoff, video status polling, error categorisation

const LI_API = "https://api.linkedin.com/v2";

// Request timeout for all LinkedIn API calls
const LINKEDIN_TIMEOUT_MS = 20_000; // 20 seconds
// Timeout for fetching media from Cloudinary before forwarding to LinkedIn
const MEDIA_FETCH_TIMEOUT_MS = 30_000; // 30 seconds

const BASE_HEADERS = (token: string) => ({
  Authorization:               `Bearer ${token}`,
  "Content-Type":              "application/json",
  "X-Restli-Protocol-Version": "2.0.0",
});

// ── Utilities ────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch() with an AbortController timeout */
function timedFetch(
  url: string,
  opts: RequestInit = {},
  timeoutMs = LINKEDIN_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal })
    .finally(() => clearTimeout(tid));
}

/** Exponential backoff retry wrapper */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
  label   = "LinkedIn API"
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    const wait = delayMs + Math.random() * 500; // jitter
    // Only log retry attempts — do NOT log tokens or request bodies
    console.warn(`[${label}] Retrying in ${Math.round(wait)}ms… (${retries} left)`);
    await sleep(wait);
    return withRetry(fn, retries - 1, delayMs * 2, label);
  }
}

/** Map LinkedIn API status codes to user-friendly messages (no raw body leaked) */
function categoriseError(status: number, body: string): Error {
  // Log full body server-side only — never forward to the client
  console.error(`[linkedin] API error ${status}:`, body.slice(0, 300));

  if (status === 401)
    return new Error("LinkedIn session expired. Please sign in again.");
  if (status === 403)
    return new Error(
      "Permission denied. Make sure 'Share on LinkedIn' product is active on your developer app."
    );
  if (status === 422)
    return new Error("LinkedIn rejected the post content. Please edit your caption and try again.");
  if (status === 429)
    return new Error("LinkedIn rate limit reached. Please wait a few minutes and try again.");
  if (status >= 500)
    return new Error("LinkedIn servers are having issues. Please try again shortly.");
  // Safe catch-all — status code only, no raw body
  return new Error(`Post failed (code ${status}). Please try again.`);
}

// ── Step 1: Register upload ──────────────────────────────────

async function registerUpload(
  token:     string,
  personUrn: string,
  mediaType: "image" | "video"
): Promise<{ uploadUrl: string; asset: string }> {
  const recipeMap = {
    image: "urn:li:digitalmediaRecipe:feedshare-image",
    video: "urn:li:digitalmediaRecipe:feedshare-video",
  };

  const res = await timedFetch(`${LI_API}/assets?action=registerUpload`, {
    method:  "POST",
    headers: BASE_HEADERS(token),
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: [recipeMap[mediaType]],
        owner:   `urn:li:person:${personUrn}`,
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw categoriseError(res.status, body);
  }

  const data      = await res.json();
  const uploadUrl = data.value.uploadMechanism[
    "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
  ].uploadUrl;
  return { uploadUrl, asset: data.value.asset };
}

// ── Step 2a: Upload binary from Cloudinary URL ───────────────

async function uploadBinary(
  uploadUrl:     string,
  token:         string,
  cloudinaryUrl: string
): Promise<void> {
  // Fetch the media from Cloudinary with a timeout
  const mediaRes = await timedFetch(cloudinaryUrl, {}, MEDIA_FETCH_TIMEOUT_MS);
  if (!mediaRes.ok)
    throw new Error(`Failed to fetch media (${mediaRes.status}). Please try again.`);

  const buffer = await mediaRes.arrayBuffer();

  const res = await timedFetch(uploadUrl, {
    method:  "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  }, MEDIA_FETCH_TIMEOUT_MS);

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Media upload failed (${res.status}). Please try again.`);
  }
}

// ── Step 2b: Poll video asset until AVAILABLE ────────────────

async function waitForVideoReady(
  asset:       string,
  token:       string,
  maxAttempts  = 12,
  intervalMs   = 5000
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await timedFetch(
      `${LI_API}/assets/${encodeURIComponent(asset)}`,
      { headers: BASE_HEADERS(token) }
    );

    if (!res.ok) {
      await sleep(intervalMs);
      continue;
    }

    const data = await res.json();
    const status: string =
      data.recipes?.[0]?.status ?? data.status ?? "PROCESSING";

    if (status === "AVAILABLE") return;
    if (status === "FAILED")
      throw new Error("LinkedIn video processing failed. Please try a different video file.");

    // Log status without leaking asset URNs or tokens
    console.info(`[video] Processing… attempt ${i + 1}/${maxAttempts}`);
    await sleep(intervalMs);
  }
  throw new Error("Video processing timed out. Please try again.");
}

// ── Step 3: Upload one media asset (image or video) ──────────

async function uploadAsset(
  token:         string,
  personUrn:     string,
  cloudinaryUrl: string,
  mediaType:     "image" | "video"
): Promise<string> {
  const { uploadUrl, asset } = await withRetry(
    () => registerUpload(token, personUrn, mediaType),
    3, 1000, "registerUpload"
  );

  await withRetry(
    () => uploadBinary(uploadUrl, token, cloudinaryUrl),
    3, 1000, "uploadBinary"
  );

  if (mediaType === "video") {
    await waitForVideoReady(asset, token);
  }

  return asset;
}

// ── Step 4: Create UGC post ──────────────────────────────────

async function createPost(
  token:      string,
  personUrn:  string,
  caption:    string,
  assets:     string[],          // empty = text-only
  mediaType?: "image" | "video"
): Promise<string> {
  const hasMedia      = assets.length > 0;
  const mediaCategory = hasMedia
    ? mediaType === "video" ? "VIDEO" : "IMAGE"
    : "NONE";

  const payload = {
    author:         `urn:li:person:${personUrn}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary:    { text: caption },
        shareMediaCategory: mediaCategory,
        ...(hasMedia && {
          media: assets.map((asset) => ({
            status:      "READY",
            description: { text: "Post media" },
            media:       asset,
          })),
        }),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };

  const res = await timedFetch(`${LI_API}/ugcPosts`, {
    method:  "POST",
    headers: BASE_HEADERS(token),
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw categoriseError(res.status, body);
  }

  const data    = await res.json();
  const postUrn: string = data.id ?? "";
  return `https://www.linkedin.com/feed/update/${encodeURIComponent(postUrn)}/`;
}

// ── Public API ───────────────────────────────────────────────

export interface PostOptions {
  accessToken: string;
  linkedinId:  string;
  caption:     string;
  mediaUrls?:  string[];       // 1 video OR 1–9 images
  mediaType?:  "image" | "video";
}

export interface PostResult {
  postUrl:        string;
  assetsUploaded: number;
}

export async function postToLinkedIn(opts: PostOptions): Promise<PostResult> {
  const { accessToken, linkedinId, caption, mediaUrls = [], mediaType } = opts;

  if (mediaUrls.length === 0) {
    // Text-only post
    const postUrl = await withRetry(
      () => createPost(accessToken, linkedinId, caption, []),
      3, 1500, "createPost"
    );
    return { postUrl, assetsUploaded: 0 };
  }

  // Upload each media file and collect asset URNs
  const assetUrns = await Promise.all(
    mediaUrls.map((url) =>
      uploadAsset(accessToken, linkedinId, url, mediaType ?? "image")
    )
  );

  const postUrl = await withRetry(
    () => createPost(accessToken, linkedinId, caption, assetUrns, mediaType),
    3, 1500, "createPost"
  );

  return { postUrl, assetsUploaded: assetUrns.length };
}
