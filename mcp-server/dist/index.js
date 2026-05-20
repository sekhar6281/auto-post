#!/usr/bin/env node
"use strict";
/**
 * LinkedIn AutoPost — MCP Server
 * Exposes 3 tools to any MCP client (Claude Desktop, Claude Code, etc.)
 *
 * Tools:
 *   generate_caption     — AI caption via DeepSeek
 *   upload_media         — Upload to Cloudinary
 *   publish_linkedin_post — Post to LinkedIn
 *
 * Transport: stdio (default for local/Claude Desktop)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
// Load .env.local from project root
(0, dotenv_1.config)({ path: (0, path_1.resolve)(process.cwd(), ".env.local") });
const generate_caption_js_1 = require("./tools/generate-caption.js");
const upload_media_js_1 = require("./tools/upload-media.js");
const publish_post_js_1 = require("./tools/publish-post.js");
const caption_schema_js_1 = require("./schemas/caption.schema.js");
const upload_schema_js_1 = require("./schemas/upload.schema.js");
const post_schema_js_1 = require("./schemas/post.schema.js");
// ── Tool definitions (shown to MCP clients) ──────────────────
const TOOLS = [
    {
        name: "generate_caption",
        description: "Generate a professional LinkedIn caption using DeepSeek AI. " +
            "Returns structured output with hook, body, hashtags, and full caption.",
        inputSchema: {
            type: "object",
            properties: {
                context: {
                    type: "string",
                    description: "One-line description of what the post is about (max 300 chars)",
                },
                tone: {
                    type: "string",
                    enum: ["professional", "startup-founder", "technical", "motivational"],
                    description: "Writing tone for the caption",
                    default: "professional",
                },
                media_type: {
                    type: "string",
                    enum: ["image", "video"],
                    description: "Type of media being posted",
                    default: "image",
                },
                media_url: {
                    type: "string",
                    description: "Optional Cloudinary URL for additional context",
                },
            },
            required: ["context"],
        },
    },
    {
        name: "upload_media",
        description: "Upload an image or video from any public URL to Cloudinary. " +
            "Returns a secure CDN URL ready for LinkedIn posting.",
        inputSchema: {
            type: "object",
            properties: {
                source_url: {
                    type: "string",
                    description: "Public URL of the media file to upload",
                },
                resource_type: {
                    type: "string",
                    enum: ["image", "video"],
                    description: "Type of media",
                    default: "image",
                },
                folder: {
                    type: "string",
                    description: "Cloudinary folder name",
                    default: "linkedin-posts",
                },
            },
            required: ["source_url"],
        },
    },
    {
        name: "publish_linkedin_post",
        description: "Publish a post to LinkedIn. Supports text-only, single image, " +
            "multiple images (up to 9), and video. Handles upload + retry automatically.",
        inputSchema: {
            type: "object",
            properties: {
                caption: {
                    type: "string",
                    description: "Full post caption (max 3000 chars)",
                },
                media_urls: {
                    type: "array",
                    items: { type: "string" },
                    description: "Cloudinary URLs of media to attach (0–9 images or 1 video)",
                    default: [],
                },
                media_type: {
                    type: "string",
                    enum: ["image", "video"],
                    description: "Type of media",
                },
                access_token: {
                    type: "string",
                    description: "LinkedIn OAuth access token",
                },
                linkedin_id: {
                    type: "string",
                    description: "LinkedIn person URN ID",
                },
            },
            required: ["caption", "access_token", "linkedin_id"],
        },
    },
];
// ── Create server ─────────────────────────────────────────────
const server = new index_js_1.Server({ name: "linkedin-autopost", version: "1.0.0" }, { capabilities: { tools: {} } });
// ── List tools handler ────────────────────────────────────────
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({ tools: TOOLS }));
// ── Call tool handler ─────────────────────────────────────────
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    try {
        switch (name) {
            case "generate_caption": {
                const input = caption_schema_js_1.CaptionInputSchema.parse(args);
                const result = await (0, generate_caption_js_1.generateCaptionTool)(input);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case "upload_media": {
                const input = upload_schema_js_1.UploadInputSchema.parse(args);
                const result = await (0, upload_media_js_1.uploadMediaTool)(input);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case "publish_linkedin_post": {
                const input = post_schema_js_1.PostInputSchema.parse(args);
                const result = await (0, publish_post_js_1.publishPostTool)(input);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Tool execution failed";
        return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
        };
    }
});
// ── Start server ──────────────────────────────────────────────
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // Log to stderr so it doesn't interfere with stdio MCP protocol
    console.error("[MCP] LinkedIn AutoPost server running on stdio");
}
main().catch((err) => {
    console.error("[MCP] Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map