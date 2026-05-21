"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PostPreview } from "@/components/PostPreview";
import {
  ArrowLeft, Send, Loader2, CheckCircle2, ExternalLink,
  AlertCircle, Plus, LogOut, ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import type { CloudinaryResource } from "@/lib/cloudinary";

type Status = "idle" | "posting" | "success" | "error";

/** Wipe every piece of data this site has stored — tokens, emails, cache, everything */
function clearAllBrowserData() {
  try { localStorage.clear();   } catch {}
  try { sessionStorage.clear(); } catch {}
  if (typeof window !== "undefined" && "caches" in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
}

export default function PreviewPage() {
  const router            = useRouter();
  const { data: session } = useSession();
  const [mediaList, setML]    = useState<CloudinaryResource[]>([]);
  const [caption,   setCaption] = useState("");
  const [status,    setStatus]  = useState<Status>("idle");
  const [postUrl,   setPostUrl] = useState("");
  const [errorMsg,  setError]   = useState("");
  const [countdown, setCountdown] = useState(15);

  // Interval ref for the countdown timer
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  // Set to true the moment the user clicks "Create another post" — prevents
  // the countdown's last tick from calling signOut after navigation begins
  const cancelledRef   = useRef(false);

  useEffect(() => {
    const rm = sessionStorage.getItem("uploadedMedia");
    const rc = sessionStorage.getItem("generatedCaption");
    if (!rm || !rc) { router.replace("/upload"); return; }
    setML(JSON.parse(rm)); setCaption(rc);
  }, [router]);

  // Always clear the interval when this page unmounts (navigation away)
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const post = async () => {
    if (!mediaList.length || !caption) return;
    setStatus("posting"); setError("");
    cancelledRef.current = false;

    const isVideo   = mediaList[0].resource_type === "video";
    const mediaType = isVideo ? "video" : "image";
    try {
      const res  = await fetch("/api/post", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ caption, mediaUrls: mediaList.map(m => m.secure_url), mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Post failed");

      setPostUrl(data.postUrl);
      setStatus("success");
      toast.success("Posted to LinkedIn! 🎉");

      // Clear post data immediately after a successful post
      sessionStorage.removeItem("uploadedMedia");
      sessionStorage.removeItem("generatedCaption");

      // Start 15-second auto sign-out countdown.
      // Clicking "Create another post" sets cancelledRef = true and clears
      // the interval, so the signOut below is never reached.
      let secs = 15;
      setCountdown(secs);
      intervalRef.current = setInterval(() => {
        // If the user already clicked "Create another post", stop immediately
        if (cancelledRef.current) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return;
        }
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          clearAllBrowserData();
          signOut({ callbackUrl: "/login" });
        }
      }, 1000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setStatus("error"); setError(msg); toast.error(msg);
    }
  };

  const createNewPost = () => {
    // Mark as cancelled FIRST — stops any in-flight interval tick from calling signOut
    cancelledRef.current = true;
    // Then clear the interval
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    // Only remove the post-related keys — leave everything else intact
    sessionStorage.removeItem("uploadedMedia");
    sessionStorage.removeItem("generatedCaption");
    router.push("/upload");
  };

  if (!mediaList.length) return null;

  const mediaItems = mediaList.map(m => ({
    url:  m.secure_url,
    type: (m.resource_type === "video" ? "video" : "image") as "image" | "video",
  }));

  /* ── Success screen ───────────────────────────────────── */
  if (status === "success") return (
    <div className="animate-scale-in max-w-lg mx-auto text-center py-12">

      {/* Big check */}
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-3">
        You&apos;re live on LinkedIn! 🎉
      </h1>
      <p className="text-slate-500 text-lg mb-6">
        {mediaList.length > 1
          ? `Your post with ${mediaList.length} images is published.`
          : "Your post is published and visible to your network."}
      </p>

      {/* Security notice */}
      <div className="flex items-start justify-center gap-2.5 text-sm text-slate-500 bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3.5 mb-7 text-left">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <span>
          <span className="font-semibold text-emerald-700">All data cleared.</span>{" "}
          Your post data, session token, and any account info stored in this browser have been removed.
          Your LinkedIn email &amp; password were never stored here — they go directly to LinkedIn&apos;s secure servers.
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 mb-7">
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary justify-center"
        >
          View on LinkedIn <ExternalLink className="w-5 h-5" />
        </a>

        <button
          onClick={createNewPost}
          className="btn-secondary justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create another post
        </button>
      </div>

      {/* Auto sign-out countdown */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-6 py-6">
        <LogOut className="w-7 h-7 text-amber-500 mx-auto mb-3" />

        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="text-5xl font-bold tabular-nums text-amber-600 leading-none">
            {countdown}
          </span>
          <span className="text-lg font-medium text-amber-600">sec</span>
        </div>

        <p className="text-base font-semibold text-amber-700 mb-1">
          Signing out automatically for your security
        </p>
        <p className="text-sm text-amber-500">
          Click &quot;Create another post&quot; above to cancel and start a new post instead.
        </p>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 15) * 100}%` }}
          />
        </div>
      </div>

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
