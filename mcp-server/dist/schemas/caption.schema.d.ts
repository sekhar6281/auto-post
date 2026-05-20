import { z } from "zod";
export declare const CaptionInputSchema: z.ZodObject<{
    context: z.ZodString;
    tone: z.ZodDefault<z.ZodEnum<["professional", "startup-founder", "technical", "motivational"]>>;
    media_type: z.ZodDefault<z.ZodEnum<["image", "video"]>>;
    media_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    context: string;
    tone: "professional" | "startup-founder" | "technical" | "motivational";
    media_type: "image" | "video";
    media_url?: string | undefined;
}, {
    context: string;
    tone?: "professional" | "startup-founder" | "technical" | "motivational" | undefined;
    media_type?: "image" | "video" | undefined;
    media_url?: string | undefined;
}>;
export type CaptionInput = z.infer<typeof CaptionInputSchema>;
export declare const CaptionOutputSchema: z.ZodObject<{
    hook: z.ZodString;
    body: z.ZodString;
    hashtags: z.ZodArray<z.ZodString, "many">;
    full_caption: z.ZodString;
    tokens_used: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    hook: string;
    body: string;
    hashtags: string[];
    full_caption: string;
    tokens_used: number;
}, {
    hook: string;
    body: string;
    hashtags: string[];
    full_caption: string;
    tokens_used: number;
}>;
export type CaptionOutput = z.infer<typeof CaptionOutputSchema>;
//# sourceMappingURL=caption.schema.d.ts.map