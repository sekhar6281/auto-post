import { z } from "zod";

export const UploadInputSchema = z.object({
  source_url: z
    .string()
    .url()
    .describe("Public URL of the media to upload to Cloudinary"),

  resource_type: z
    .enum(["image", "video"])
    .default("image")
    .describe("Type of media"),

  folder: z
    .string()
    .default("linkedin-posts")
    .describe("Cloudinary folder to upload into"),
});

export type UploadInput = z.infer<typeof UploadInputSchema>;

export const UploadOutputSchema = z.object({
  cloudinary_url: z.string().describe("Secure CDN URL of the uploaded media"),
  public_id:      z.string().describe("Cloudinary asset public ID"),
  resource_type:  z.string().describe("image or video"),
  format:         z.string().describe("File format e.g. jpg, mp4"),
  bytes:          z.number().describe("File size in bytes"),
  width:          z.number().optional(),
  height:         z.number().optional(),
});

export type UploadOutput = z.infer<typeof UploadOutputSchema>;
