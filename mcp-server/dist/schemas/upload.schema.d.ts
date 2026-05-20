import { z } from "zod";
export declare const UploadInputSchema: z.ZodObject<{
    source_url: z.ZodString;
    resource_type: z.ZodDefault<z.ZodEnum<["image", "video"]>>;
    folder: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    source_url: string;
    resource_type: "image" | "video";
    folder: string;
}, {
    source_url: string;
    resource_type?: "image" | "video" | undefined;
    folder?: string | undefined;
}>;
export type UploadInput = z.infer<typeof UploadInputSchema>;
export declare const UploadOutputSchema: z.ZodObject<{
    cloudinary_url: z.ZodString;
    public_id: z.ZodString;
    resource_type: z.ZodString;
    format: z.ZodString;
    bytes: z.ZodNumber;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    resource_type: string;
    cloudinary_url: string;
    public_id: string;
    format: string;
    bytes: number;
    width?: number | undefined;
    height?: number | undefined;
}, {
    resource_type: string;
    cloudinary_url: string;
    public_id: string;
    format: string;
    bytes: number;
    width?: number | undefined;
    height?: number | undefined;
}>;
export type UploadOutput = z.infer<typeof UploadOutputSchema>;
//# sourceMappingURL=upload.schema.d.ts.map