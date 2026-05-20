import { z } from "zod";
export declare const PostInputSchema: z.ZodObject<{
    caption: z.ZodString;
    media_urls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    media_type: z.ZodOptional<z.ZodEnum<["image", "video"]>>;
    access_token: z.ZodString;
    linkedin_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    caption: string;
    media_urls: string[];
    access_token: string;
    linkedin_id: string;
    media_type?: "image" | "video" | undefined;
}, {
    caption: string;
    access_token: string;
    linkedin_id: string;
    media_type?: "image" | "video" | undefined;
    media_urls?: string[] | undefined;
}>;
export type PostInput = z.infer<typeof PostInputSchema>;
export declare const PostOutputSchema: z.ZodObject<{
    post_url: z.ZodString;
    assets_uploaded: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    post_url: string;
    assets_uploaded: number;
}, {
    post_url: string;
    assets_uploaded: number;
}>;
export type PostOutput = z.infer<typeof PostOutputSchema>;
//# sourceMappingURL=post.schema.d.ts.map