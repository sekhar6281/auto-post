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

/**
 * Generates a short-lived signed upload token for the browser.
 * The API *secret* never leaves the server.
 * File-type and size validation is enforced client-side in MediaUploader.tsx.
 */
export function generateUploadSignature(folder = "linkedin-posts") {
  const timestamp = Math.round(Date.now() / 1000);
  const params    = { folder, timestamp };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    folder,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey:    process.env.CLOUDINARY_API_KEY!,
  };
}

export default cloudinary;
