"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaUploader } from "@/components/MediaUploader";
import { ArrowRight } from "lucide-react";
import type { CloudinaryResource } from "@/lib/cloudinary";

export default function UploadPage() {
  const router  = useRouter();
  const [media, setMedia] = useState<CloudinaryResource[]>([]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Upload your media</h1>
        <p className="mt-2 text-slate-500 text-lg">Up to 9 photos or 1 video to share on LinkedIn.</p>
      </div>

      <div className="card p-8">
        <MediaUploader onUploadComplete={r => { setMedia(r); sessionStorage.setItem("uploadedMedia", JSON.stringify(r)); }} />
      </div>

      {media.length > 0 && (
        <div className="mt-6 flex justify-end animate-slide-up">
          <button onClick={() => router.push("/caption")} className="btn-primary">
            Next: Generate Caption <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
