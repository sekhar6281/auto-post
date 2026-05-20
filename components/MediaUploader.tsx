"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, ImageIcon, Film, CheckCircle2, Loader2, Plus, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { CloudinaryResource } from "@/lib/cloudinary";

const ACCEPTED = ["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/quicktime","video/mpeg"];
const MAX_IMG  = 10  * 1024 * 1024;
const MAX_VID  = 200 * 1024 * 1024;
const MAX_IMGS = 9;

interface UploadItem {
  file: File; preview: string;
  resource: CloudinaryResource | null;
  progress: number;
  status: "uploading" | "done" | "error";
  errorMsg?: string;
}
interface Props { onUploadComplete: (r: CloudinaryResource[]) => void }

const isVid = (f: File) => f.type.startsWith("video/");

export function MediaUploader({ onUploadComplete }: Props) {
  const [items, setItems]   = useState<UploadItem[]>([]);
  const [drag, setDrag]     = useState(false);
  const inputRef            = useRef<HTMLInputElement>(null);
  const notifiedRef         = useRef(false);

  const update = useCallback((idx: number, patch: Partial<UploadItem>) =>
    setItems(p => { const n = [...p]; n[idx] = { ...n[idx], ...patch }; return n; }), []);

  const validate = (f: File) => {
    if (!ACCEPTED.includes(f.type)) return "Unsupported format. Use JPG, PNG, WebP, GIF, MP4, MOV.";
    if (f.size > (isVid(f) ? MAX_VID : MAX_IMG)) return `Too large. Max ${isVid(f) ? "200 MB" : "10 MB"}.`;
    return null;
  };

  const upload = useCallback(async (file: File, idx: number) => {
    try {
      const sig  = await fetch("/api/upload");
      if (!sig.ok) throw new Error("Signature error");
      const { signature, timestamp, folder, cloudName, apiKey } = await sig.json();
      const rt   = isVid(file) ? "video" : "image";
      const fd   = new FormData();
      fd.append("file", file); fd.append("api_key", apiKey);
      fd.append("timestamp", String(timestamp)); fd.append("signature", signature);
      fd.append("folder", folder); fd.append("resource_type", rt);

      await new Promise<void>((res, rej) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener("progress", e => {
          if (e.lengthComputable) update(idx, { progress: Math.round(e.loaded / e.total * 100) });
        });
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            update(idx, { status: "done", resource: JSON.parse(xhr.responseText), progress: 100 });
            res();
          } else rej(new Error("Upload failed"));
        });
        xhr.addEventListener("error", () => rej(new Error("Network error")));
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${rt}/upload`);
        xhr.send(fd);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      update(idx, { status: "error", errorMsg: msg });
      toast.error(msg);
    }
  }, [update]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const arr          = Array.from(files);
    const existingVid  = items.length > 0 && isVid(items[0].file);
    const newVid       = arr.some(isVid);
    if (items.length > 0 && existingVid !== newVid) { toast.error("Can't mix images and videos."); return; }
    if (newVid && items.length + arr.length > 1)     { toast.error("Only 1 video per post.");      return; }
    if (!newVid && items.length + arr.length > MAX_IMGS) { toast.error(`Max ${MAX_IMGS} images.`); return; }

    const valid: UploadItem[] = [];
    for (const f of arr) {
      const e = validate(f);
      if (e) { toast.error(e); continue; }
      valid.push({ file: f, preview: URL.createObjectURL(f), resource: null, progress: 0, status: "uploading" });
    }
    if (!valid.length) return;

    setItems(prev => {
      const next = [...prev, ...valid];
      valid.forEach((_, i) => setTimeout(() => upload(valid[i].file, prev.length + i), 0));
      return next;
    });
  }, [items, upload]);

  const allDone = items.length > 0 && items.every(i => i.status === "done");
  useEffect(() => {
    if (!allDone) { notifiedRef.current = false; return; }
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    const done = items.map(i => i.resource).filter(Boolean) as CloudinaryResource[];
    onUploadComplete(done);
    toast.success(`${done.length} file${done.length > 1 ? "s" : ""} ready!`);
  }, [allDone, items, onUploadComplete]);

  const remove    = (idx: number) => setItems(p => p.filter((_, i) => i !== idx));
  const hasVideo  = items.some(i => isVid(i.file));
  const canAdd    = !hasVideo && items.length < MAX_IMGS;

  return (
    <div className="space-y-5">
      {/* Grid of uploaded items */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {items.map((item, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200/60 group">
              {isVid(item.file)
                ? <video src={item.preview} className="w-full h-full object-cover" muted />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={item.preview} alt="" className="w-full h-full object-cover" />}

              {/* Uploading overlay */}
              {item.status === "uploading" && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <span className="text-white text-base font-semibold">{item.progress}%</span>
                  <div className="w-2/3 bg-white/30 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-white h-full rounded-full transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              )}

              {/* Done badge */}
              {item.status === "done" && (
                <div className="absolute bottom-2 right-2 bg-emerald-500 rounded-full p-1 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              )}

              {/* Error */}
              {item.status === "error" && (
                <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center p-2">
                  <p className="text-white text-base text-center font-medium">{item.errorMsg}</p>
                </div>
              )}

              {/* Remove */}
              <button
                onClick={() => remove(idx)}
                className="absolute top-2 left-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}

          {/* Add more slot */}
          {canAdd && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-linkedin-500 hover:bg-linkedin-50 flex flex-col items-center justify-center gap-2 transition-all text-slate-400 hover:text-linkedin-500 group"
            >
              <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="text-base font-medium">{MAX_IMGS - items.length} left</span>
            </button>
          )}
        </div>
      )}

      {/* Drop zone */}
      {items.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all duration-300 overflow-hidden",
            drag
              ? "border-linkedin-500 bg-linkedin-50 scale-[1.01] shadow-brand"
              : "border-slate-200 bg-white hover:border-linkedin-400 hover:bg-linkedin-50/50 shadow-sm"
          )}
        >
          <div className={cn("transition-all duration-300", drag && "scale-110")}>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
                  <CloudUpload className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Film className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <p className="font-bold text-slate-800 text-2xl mb-2">
              {drag ? "Drop to upload!" : "Drag & drop your media"}
            </p>
            <p className="text-lg text-slate-500 mb-8">
              Up to 9 images or 1 video · JPG PNG GIF WebP MP4 MOV
            </p>

            <div className="inline-flex items-center gap-2 btn-primary px-8 py-4 text-lg">
              <Upload className="w-5 h-5" />
              Choose files
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 text-base text-slate-400">
              <span className="flex items-center gap-1.5"><ImageIcon className="w-4 h-4" />Images up to 10 MB</span>
              <span className="w-px h-4 bg-slate-200" />
              <span className="flex items-center gap-1.5"><Film className="w-4 h-4" />Videos up to 200 MB</span>
            </div>
          </div>
        </div>
      )}

      <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} multiple={!hasVideo} onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} className="hidden" />

      {items.length > 0 && (
        <p className="text-base text-center text-slate-400 font-medium">
          {items.filter(i => i.status === "done").length}/{items.length} uploaded
          {canAdd && ` · ${MAX_IMGS - items.length} more images allowed`}
        </p>
      )}
    </div>
  );
}
