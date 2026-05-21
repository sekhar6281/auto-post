"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CaptionEditor } from "@/components/CaptionEditor";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CloudinaryResource } from "@/lib/cloudinary";

export default function CaptionPage() {
  const router                    = useRouter();
  const [mediaList, setMediaList] = useState<CloudinaryResource[]>([]);
  const [caption,   setCaption]   = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("uploadedMedia");
    if (!raw) { router.replace("/upload"); return; }
    const parsed: CloudinaryResource[] = JSON.parse(raw);
    if (!parsed.length) { router.replace("/upload"); return; }
    setMediaList(parsed);
  }, [router]);

  const save = (text: string) => {
    setCaption(text);
    sessionStorage.setItem("generatedCaption", text);
  };

  const deleteMedia = (idx: number) => {
    const updated = mediaList.filter((_, i) => i !== idx);
    if (!updated.length) { router.replace("/upload"); return; }
    setMediaList(updated);
    sessionStorage.setItem("uploadedMedia", JSON.stringify(updated));
  };

  if (!mediaList.length) return null;

  const primary   = mediaList[0];
  const mediaType = primary.resource_type === "video" ? "video" : "image";

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Generate AI caption</h1>
        <p className="mt-2 text-slate-500 text-lg">
          Paste the summit website URL — AI reads it and writes an accurate caption with speakers &amp; organizers.
        </p>
      </div>

      <div className="card p-8">
        <CaptionEditor
          mediaUrl={primary.secure_url}
          mediaType={mediaType}
          mediaItems={mediaList}
          onDeleteMedia={deleteMedia}
          onCaptionReady={save}
        />
      </div>

      <div className="mt-6 flex justify-between items-center">
        <button onClick={() => router.back()} className="btn-secondary text-lg py-3 px-6">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        {caption && (
          <button onClick={() => router.push("/preview")} className="btn-primary animate-scale-in">
            Preview &amp; Post <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
