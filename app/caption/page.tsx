"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CaptionEditor } from "@/components/CaptionEditor";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CloudinaryResource } from "@/lib/cloudinary";

export default function CaptionPage() {
  const router              = useRouter();
  const [mediaList, setML]  = useState<CloudinaryResource[]>([]);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("uploadedMedia");
    if (!raw) { router.replace("/upload"); return; }
    const parsed: CloudinaryResource[] = JSON.parse(raw);
    if (!parsed.length) { router.replace("/upload"); return; }
    setML(parsed);
  }, [router]);

  const save = (text: string) => { setCaption(text); sessionStorage.setItem("generatedCaption", text); };
  if (!mediaList.length) return null;

  const primary   = mediaList[0];
  const mediaType = primary.resource_type === "video" ? "video" : "image";

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Generate AI caption</h1>
        <p className="mt-2 text-slate-500 text-lg">Describe your post in one line — DeepSeek writes the rest.</p>
      </div>

      {/* Thumbnails */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
        {mediaList.map((m, i) => (
          <div key={i} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
            {m.resource_type === "video"
              ? <video src={m.secure_url} className="w-full h-full object-cover" muted />
              // eslint-disable-next-line @next/next/no-img-element
              : <img src={m.secure_url} alt="" className="w-full h-full object-cover" />}
          </div>
        ))}
        <div className="shrink-0 ml-2">
          <p className="text-base font-semibold text-slate-600">
            {mediaList.length === 1 ? mediaType.charAt(0).toUpperCase() + mediaType.slice(1) : `${mediaList.length} images`}
          </p>
          <p className="text-sm text-slate-400">
            {(mediaList.reduce((s, m) => s + m.bytes, 0) / 1024 / 1024).toFixed(1)} MB
          </p>
        </div>
      </div>

      <div className="card p-8">
        <CaptionEditor mediaUrl={primary.secure_url} mediaType={mediaType} onCaptionReady={save} />
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button onClick={() => router.back()} className="btn-secondary text-lg py-3 px-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        {caption && (
          <button onClick={() => router.push("/preview")} className="btn-primary animate-scale-in">
            Preview & Post <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
