"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PostPreview } from "@/components/PostPreview";
import { ArrowLeft, Send, Loader2, CheckCircle2, ExternalLink, RotateCcw, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { CloudinaryResource } from "@/lib/cloudinary";

type Status = "idle" | "posting" | "success" | "error";

export default function PreviewPage() {
  const router            = useRouter();
  const { data: session } = useSession();
  const [mediaList, setML]    = useState<CloudinaryResource[]>([]);
  const [caption, setCaption] = useState("");
  const [status, setStatus]   = useState<Status>("idle");
  const [postUrl, setPostUrl] = useState("");
  const [errorMsg, setError]  = useState("");

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
      const res  = await fetch("/api/post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption, mediaUrls: mediaList.map(m => m.secure_url), mediaType }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Post failed");
      setPostUrl(data.postUrl); setStatus("success");
      toast.success("Posted to LinkedIn! 🎉");
      sessionStorage.removeItem("uploadedMedia"); sessionStorage.removeItem("generatedCaption");

      // Auto sign-out if the user requested it at login
      if (localStorage.getItem("autoLogoutAfterPost") === "true") {
        localStorage.removeItem("autoLogoutAfterPost");
        localStorage.removeItem("rememberMe");
        sessionStorage.clear();
        setTimeout(() => signOut({ callbackUrl: "/login" }), 3000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setStatus("error"); setError(msg); toast.error(msg);
    }
  };

  if (!mediaList.length) return null;

  const mediaItems = mediaList.map(m => ({ url: m.secure_url, type: (m.resource_type === "video" ? "video" : "image") as "image" | "video" }));

  if (status === "success") return (
    <div className="animate-scale-in max-w-lg mx-auto text-center py-14">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-3">You&apos;re live on LinkedIn! 🎉</h1>
      <p className="text-slate-500 text-lg mb-10">{mediaList.length > 1 ? `Your post with ${mediaList.length} images is published.` : "Your post is published and visible to your network."}</p>
      <div className="flex flex-col gap-4">
        <a href={postUrl} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
          View on LinkedIn <ExternalLink className="w-5 h-5" />
        </a>
        <button onClick={() => { sessionStorage.clear(); router.push("/upload"); }} className="btn-secondary justify-center">
          <RotateCcw className="w-5 h-5" /> Create another post
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Preview your post</h1>
        <p className="mt-2 text-slate-500 text-lg">This is exactly how it will appear on LinkedIn.</p>
      </div>

      <PostPreview userName={session?.user?.name ?? "You"} userImage={session?.user?.image ?? undefined} caption={caption} mediaItems={mediaItems} />

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
        <button onClick={() => router.back()} disabled={status === "posting"} className="btn-secondary disabled:opacity-50">
          <ArrowLeft className="w-5 h-5" /> Edit
        </button>
        <button onClick={post} disabled={status === "posting"} className="btn-primary disabled:opacity-50">
          {status === "posting"
            ? <><Loader2 className="w-5 h-5 animate-spin" />Posting to LinkedIn…</>
            : <><Send className="w-5 h-5" />Post to LinkedIn</>}
        </button>
      </div>
    </div>
  );
}
