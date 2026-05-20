import { z } from "zod";

export const PostInputSchema = z.object({
  caption: z
    .string()
    .min(1)
    .max(3000)
    .describe("Full LinkedIn post caption (hook + body + hashtags)"),

  media_urls: z
    .array(z.string().url())
    .min(0)
    .max(9)
    .default([])
    .describe("Cloudinary URLs of media to attach (1–9 images OR 1 video)"),

  media_type: z
    .enum(["image", "video"])
    .optional()
    .describe("Type of media being posted"),

  access_token: z
    .string()
    .min(1)
    .describe("LinkedIn OAuth access token for the user"),

  linkedin_id: z
    .string()
    .min(1)
    .describe("LinkedIn person URN ID (from OAuth profile)"),
});

export type PostInput = z.infer<typeof PostInputSchema>;

export const PostOutputSchema = z.object({
  post_url:        z.string().describe("Live LinkedIn post URL"),
  assets_uploaded: z.number().describe("Number of media assets uploaded to LinkedIn"),
});

export type PostOutput = z.infer<typeof PostOutputSchema>;
