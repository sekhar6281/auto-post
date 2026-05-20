"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishPostTool = publishPostTool;
const LI_API = "https://api.linkedin.com/v2";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function withRetry(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    }
    catch (err) {
        if (retries === 0)
            throw err;
        await sleep(delay + Math.random() * 300);
        return withRetry(fn, retries - 1, delay * 2);
    }
}
function liHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    };
}
function categoriseError(status, body) {
    if (status === 401)
        return new Error("LinkedIn session expired — please re-authenticate.");
    if (status === 403)
        return new Error("Permission denied — ensure 'Share on LinkedIn' is active.");
    if (status === 422)
        return new Error("LinkedIn rejected content — edit your caption and retry.");
    if (status === 429)
        return new Error("LinkedIn rate limit hit — wait a few minutes.");
    if (status >= 500)
        return new Error("LinkedIn server error — please retry shortly.");
    return new Error(`LinkedIn API ${status}: ${body.slice(0, 100)}`);
}
async function registerUpload(token, personUrn, mediaType) {
    const recipe = mediaType === "video"
        ? "urn:li:digitalmediaRecipe:feedshare-video"
        : "urn:li:digitalmediaRecipe:feedshare-image";
    const res = await fetch(`${LI_API}/assets?action=registerUpload`, {
        method: "POST",
        headers: liHeaders(token),
        body: JSON.stringify({
            registerUploadRequest: {
                recipes: [recipe],
                owner: `urn:li:person:${personUrn}`,
                serviceRelationships: [
                    { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
                ],
            },
        }),
    });
    if (!res.ok)
        throw categoriseError(res.status, await res.text());
    const data = await res.json();
    const uploadUrl = data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    return { uploadUrl, asset: data.value.asset };
}
async function uploadBinary(uploadUrl, token, url) {
    const mediaRes = await fetch(url);
    if (!mediaRes.ok)
        throw new Error(`Could not fetch media (${mediaRes.status})`);
    const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
        body: await mediaRes.arrayBuffer(),
    });
    if (res.status !== 200 && res.status !== 201) {
        throw new Error(`LinkedIn binary upload failed (${res.status})`);
    }
}
async function waitForVideo(asset, token) {
    for (let i = 0; i < 12; i++) {
        await sleep(5000);
        const res = await fetch(`${LI_API}/assets/${encodeURIComponent(asset)}`, {
            headers: liHeaders(token),
        });
        if (!res.ok)
            continue;
        const assetData = await res.json();
        const status = assetData.recipes?.[0]?.status ?? "PROCESSING";
        if (status === "AVAILABLE")
            return;
        if (status === "FAILED")
            throw new Error("LinkedIn video processing failed.");
    }
    throw new Error("Video processing timed out (60s).");
}
async function uploadAsset(token, personUrn, url, mediaType) {
    const { uploadUrl, asset } = await withRetry(() => registerUpload(token, personUrn, mediaType));
    await withRetry(() => uploadBinary(uploadUrl, token, url));
    if (mediaType === "video")
        await waitForVideo(asset, token);
    return asset;
}
async function createUgcPost(token, personUrn, caption, assets, mediaType) {
    const hasMedia = assets.length > 0;
    const mediaCategory = hasMedia
        ? mediaType === "video" ? "VIDEO" : "IMAGE"
        : "NONE";
    const res = await fetch(`${LI_API}/ugcPosts`, {
        method: "POST",
        headers: liHeaders(token),
        body: JSON.stringify({
            author: `urn:li:person:${personUrn}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: { text: caption },
                    shareMediaCategory: mediaCategory,
                    ...(hasMedia && {
                        media: assets.map((a) => ({
                            status: "READY",
                            description: { text: "Post media" },
                            media: a,
                        })),
                    }),
                },
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
        }),
    });
    if (!res.ok)
        throw categoriseError(res.status, await res.text());
    const data = await res.json();
    const urn = data.id ?? "";
    return `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}/`;
}
async function publishPostTool(input) {
    const { access_token, linkedin_id, caption, media_urls, media_type } = input;
    if (!media_urls.length) {
        const postUrl = await withRetry(() => createUgcPost(access_token, linkedin_id, caption, []));
        return { post_url: postUrl, assets_uploaded: 0 };
    }
    // Parallel asset upload
    const assetUrns = await Promise.all(media_urls.map((url) => uploadAsset(access_token, linkedin_id, url, media_type ?? "image")));
    const post_url = await withRetry(() => createUgcPost(access_token, linkedin_id, caption, assetUrns, media_type));
    return { post_url, assets_uploaded: assetUrns.length };
}
//# sourceMappingURL=publish-post.js.map