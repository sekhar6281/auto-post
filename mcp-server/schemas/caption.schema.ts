import { z } from "zod";

export const CaptionInputSchema = z.object({
  context: z
    .string()
    .min(3, "Context too short")
    .max(300, "Context max 300 chars")
    .describe("One-line description of what the post is about"),

  tone: z
    .enum(["professional", "startup-founder", "technical", "motivational"])
    .default("professional")
    .describe("Writing tone for the caption"),

  media_type: z
    .enum(["image", "video"])
    .default("image")
    .describe("Type of media being posted"),

  media_url: z
    .string()
    .url()
    .optional()
    .describe("Optional Cloudinary URL of the uploaded media for context"),
});

export type CaptionInput = z.infer<typeof CaptionInputSchema>;

export const CaptionOutputSchema = z.object({
  hook:         z.string().describe("Scroll-stopping opening line"),
  body:         z.string().describe("Main caption body"),
  hashtags:     z.array(z.string()).describe("4–6 relevant hashtags"),
  full_caption: z.string().describe("Complete formatted caption ready to post"),
  tokens_used:  z.number().describe("DeepSeek tokens consumed"),
});

export type CaptionOutput = z.infer<typeof CaptionOutputSchema>;
