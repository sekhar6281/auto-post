import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

export type CloudinaryResource = {
  public_id:     string;
  secure_url:    string;
  resource_type: "image" | "video" | "raw";
  format:        string;
  bytes:         number;
  width?:        number;
  height?:       number;
  duration?:     number;
};

// Allowed file extensions — enforced server-side by Cloudinary (cannot be bypassed client-side)
const ALLOWED_IMAGE_FORMATS = "jpg,jpeg,png,gif,webp,avif";
const ALLOWED_VIDEO_FORMATS = "mp4,mov,webm,avi,mkv";
const ALLOWED_FORMATS       = `${ALLOWED_IMAGE_FORMATS},${ALLOWED_VIDEO_FORMATS}`;

// 100 MB max upload size — enforced by Cloudinary when the signed params are verified
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * Generates a short-lived signed upload token for the browser.
 * The API *secret* never leaves the server.
 * The signature includes format and size restrictions so Cloudinary
 * rejects any upload that violates them, even if the client tampers
 * with the request.
 */
export function generateUploadSignature(folder = "linkedin-posts") {
  const timestamp = Math.round(Date.now() / 1000);

  // All params included here are enforced by the signature —
  // Cloudinary will reject uploads that don't match these exactly.
  const params = {
    folder,
    timestamp,
    allowed_formats: ALLOWED_FORMATS,
    max_bytes:       MAX_BYTES,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    folder,
    allowedFormats: ALLOWED_FORMATS,
    maxBytes:       MAX_BYTES,
    cloudName:      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey:         process.env.CLOUDINARY_API_KEY!,
  };
}

export default cloudinary;
