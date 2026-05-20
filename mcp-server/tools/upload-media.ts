import { v2 as cloudinary } from "cloudinary";
import type { UploadInput, UploadOutput } from "../schemas/upload.schema.js";

function initCloudinary() {
  const cloudName  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey     = process.env.CLOUDINARY_API_KEY;
  const apiSecret  = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars not configured");
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

export async function uploadMediaTool(input: UploadInput): Promise<UploadOutput> {
  initCloudinary();

  const result = await cloudinary.uploader.upload(input.source_url, {
    folder:        input.folder,
    resource_type: input.resource_type,
  });

  return {
    cloudinary_url: result.secure_url,
    public_id:      result.public_id,
    resource_type:  result.resource_type,
    format:         result.format,
    bytes:          result.bytes,
    width:          result.width,
    height:         result.height,
  };
}
