"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PostPreview } from "@/components/PostPreview";
import {
  ArrowLeft, Send, Loader2, CheckCircle2, ExternalLink,
  RotateCcw, AlertCircle, Plus, LogOut, ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import type { CloudinaryResource } from "@/lib/cloudinary";

type Status = "idle" | "posting" | "success" | "error";

export default function PreviewPage() {
  const router                      = useRouter();
  const { data: session }           = useSession();
  const [mediaList,  setML]         = useState<CloudinaryResource[]>([]);
  const [caption,    setCaption]    = useState("");
  const [status,     setStatus]     = useState<Status>("idle");
  const [postUrl,    setPostUrl]    = useState("");
  const [errorMsg,   setError]      = useState("");
  const [autoSigningOut, setAutoSigningOut] = useState(false);
  const [countdown,  setCountdown]  = useState(3);

  useEffect(() => {
    const rm = sessionStorage.getItem("uploadedMedia");
    const rc = sessionStorage.getItem("generatedCaption");
    if (!rm || !rc) { router.replace("/upload"); return; }
    setML(JSON.parse(rm)); setCaption(rc);
  }, [router]);

  const post = async () => {
    if (!mediaList.length || !caption) return;
    setStatus("posting"); setError("");
    const isVideo   = mediaList[0].resource_type === "video";
    const mediaType = isVideo ? "video" : "image";
    try {
      const res  = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, mediaUrls: mediaList.map(m => m.secure_url), mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Post failed");
      setPostUrl(data.postUrl);
      setStatus("success");
      toast.success("Posted to LinkedIn! 🎉");
      // Clear post data from storage
      sessionStorage.removeItem("uploadedMedia");
      sessionStorage.removeItem("generatedCaption");

      // Auto sign-out if requested at login
      if (localStorage.getItem("autoLogoutAfterPost") === "true") {
        setAutoSigningOut(true);
        let secs = 3;
        const interval = setInterval(() => {
          secs -= 1;
          setCountdown(secs);
          if (secs <= 0) {
            clearInterval(interval);
            // Clear all browser data for this site
            try { localStorage.clear();   } catch {}
            try { sessionStorage.clear(); } catch {}
            signOut({ callbackUrl: "/login" });
          }
        }, 1000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setStatus("error"); setError(msg); toast.error(msg);
    }
  };

  const createNewPost = () => {
    // Clear ALL post data so the user starts completely fresh
    sessionStorage.clear();
    router.push("/upload");
  };

  if (!mediaList.length) return null;

  const mediaItems = mediaList.map(m => ({
    url:  m.secure_url,
    type: (m.resource_type === "video" ? "video" : "image") as "image" | "video",
  }));

  /* ── Success screen ───────────────────────────────────── */
  if (status === "success") return (
    <div className="animate-scale-in max-w-lg mx-auto text-center py-14">

      {/* Big check */}
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-3">
        You&apos;re live on LinkedIn! 🎉
      </h1>
      <p className="text-slate-500 text-lg mb-8">
        {mediaList.length > 1
          ? `Your post with ${mediaList.length} images is published.`
          : "Your post is published and visible to your network."}
      </p>

      {/* Security notice — always shown */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-400 bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 mb-8">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        Your post data has been cleared from this browser&apos;s storage.
      </div>

      {/* Auto sign-out countdown or action buttons */}
      {autoSigningOut ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-6 text-center">
          <LogOut className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-amber-700 mb-1">
            Signing you out in {countdown}…
          </p>
          <p className="text-base text-amber-600">
            All session data is being cleared for your security.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary justify-center"
          >
            View on LinkedIn <ExternalLink className="w-5 h-5" />
          </a>

          {/* Create post again — restarts the full flow from Step 1 */}
          <button
            onClick={createNewPost}
            className="btn-secondary justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create another post
          </button>

          <p className="text-sm text-slate-400 mt-1">
            "Create another post" clears all data and takes you back to Step 1 — Upload.
          </p>
        </div>
      )}
    </div>
  );

  /* ── Preview + post screen ────────────────────────────── */
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Preview your post</h1>
        <p className="mt-2 text-slate-500 text-lg">This is exactly how it will appear on LinkedIn.</p>
      </div>

      <PostPreview
        userName={session?.user?.name ?? "You"}
        userImage={session?.user?.image ?? undefined}
        caption={caption}
        mediaItems={mediaItems}
      />

      {status === "error" && (
        <div className="mt-5 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-base animate-slide-up">
          <AlertCircle className="w-5 h-5 mt-0.5 text-red-500 shrink-0" />
          <div>
            <p className="font-semibold text-red-700 text-lg">Post failed</p>
            <p className="text-red-600 text-base mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          disabled={status === "posting"}
          className="btn-secondary disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" /> Edit
        </button>
        <button
          onClick={post}
          disabled={status === "posting"}
          className="btn-primary disabled:opacity-50"
        >
          {status === "posting"
            ? <><Loader2 className="w-5 h-5 animate-spin" />Posting to LinkedIn…</>
            : <><Send className="w-5 h-5" />Post to LinkedIn</>}
        </button>
      </div>
    </div>
  );
}
