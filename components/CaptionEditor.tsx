"use client";

import { useState } from "react";
import {
  Sparkles, RefreshCw, Copy, CheckCheck, Loader2,
  Zap, Hash, AlignLeft, Link2, CheckCircle2, AlertCircle, StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Tone, StructuredCaption } from "@/lib/groq";

const TONES: { value: Tone; label: string; emoji: string; desc: string }[] = [
  { value: "professional",    label: "Professional",    emoji: "💼", desc: "Executive voice"   },
  { value: "startup-founder", label: "Startup Founder", emoji: "🚀", desc: "Authentic builder" },
  { value: "technical",       label: "Technical",       emoji: "⚙️", desc: "Dev-focused"       },
  { value: "motivational",    label: "Motivational",    emoji: "🔥", desc: "High energy"       },
];

interface Props {
  mediaUrl: string;
  mediaType: "image" | "video";
  onCaptionReady: (caption: string) => void;
}

export function CaptionEditor({ mediaUrl, mediaType, onCaptionReady }: Props) {
  const [summitUrl, setSummitUrl] = useState("");
  const [context,   setContext]   = useState("");
  const [tone,      setTone]      = useState<Tone>("professional");
  const [result,    setResult]    = useState<StructuredCaption | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [urlOk,     setUrlOk]     = useState<boolean | null>(null);
  const [copiedKey, setCK]        = useState<string | null>(null);
  const [hook, setHook]           = useState("");
  const [body, setBody]           = useState("");
  const [tags, setTags]           = useState<string[]>([]);
  const [newTag, setNewTag]       = useState("");

  const full = (h: string, b: string, t: string[]) => `${h}\n\n${b}\n\n${t.join(" ")}`;

  const isValidUrl = (v: string) => {
    try { new URL(v); return true; } catch { return false; }
  };

  const generate = async () => {
    if (!summitUrl && !context.trim()) {
      setError("Please enter a summit URL or a short description.");
      return;
    }
    if (summitUrl && !isValidUrl(summitUrl)) {
      setError("Please enter a valid URL (e.g. https://example.com).");
      return;
    }
    setError(null);
    setLoading(true);
    setUrlOk(null);
    try {
      const res  = await fetch("/api/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summitUrl: summitUrl || undefined, context, tone, mediaType, mediaUrl }),
      });
      const data = await res.json() as StructuredCaption & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setUrlOk(!!summitUrl);
      setResult(data);
      setHook(data.hook);
      setBody(data.body);
      setTags(data.hashtags);
      onCaptionReady(full(data.hook, data.body, data.hashtags));
      toast.success("Caption generated!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onChange  = (h: string, b: string, t: string[]) => onCaptionReady(full(h, b, t));
  const copy      = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCK(key);
    toast.success("Copied!");
    setTimeout(() => setCK(null), 2000);
  };
  const addTag    = () => {
    if (!newTag.trim()) return;
    const f = newTag.startsWith("#") ? newTag.trim() : `#${newTag.trim()}`;
    if (tags.includes(f)) return;
    const u = [...tags, f]; setTags(u); setNewTag(""); onChange(hook, body, u);
  };
  const removeTag = (t: string) => { const u = tags.filter(x => x !== t); setTags(u); onChange(hook, body, u); };
  const chars     = full(hook, body, tags).length;

  return (
    <div className="space-y-6">

      {/* ── Summit / Event URL ─────────────────────────── */}
      <div>
        <label className="block text-lg font-semibold text-slate-700 mb-2.5">
          Official Summit / Event URL
          <span className="ml-2 text-sm font-normal text-slate-400">(paste the event website link)</span>
        </label>
        <div className="relative">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            value={summitUrl}
            onChange={e => { setSummitUrl(e.target.value); setUrlOk(null); }}
            placeholder="https://summitname.com  or  https://lu.ma/event/..."
            className={cn(
              "input-base pl-12 pr-12",
              summitUrl && !isValidUrl(summitUrl) && "border-red-300 focus:border-red-400 focus:ring-red-200"
            )}
          />
          {summitUrl && isValidUrl(summitUrl) && urlOk === null && (
            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          )}
          {urlOk === true && (
            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
          )}
        </div>
        {summitUrl && isValidUrl(summitUrl) && (
          <p className="mt-1.5 text-sm text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Website will be read automatically when you generate the caption
          </p>
        )}
      </div>

      {/* ── Additional context (optional) ───────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-slate-400" />
            Additional notes
            <span className="text-sm font-normal text-slate-400">(optional)</span>
          </label>
          <span className="text-base text-slate-400 tabular-nums">{context.length}/300</span>
        </div>
        <input
          value={context}
          onChange={e => setContext(e.target.value)}
          onKeyDown={e => e.key === "Enter" && generate()}
          placeholder="e.g. met 3 speakers, loved the AI panel, first time attending…"
          maxLength={300}
          className="input-base"
        />
      </div>

      {/* ── Tone ─────────────────────────────────────────── */}
      <div>
        <label className="block text-lg font-semibold text-slate-700 mb-3">Tone</label>
        <div className="grid grid-cols-2 gap-3">
          {TONES.map(t => (
            <button key={t.value} onClick={() => setTone(t.value)}
              className={cn(
                "flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left transition-all duration-150",
                tone === t.value
                  ? "border-linkedin-500 bg-linkedin-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <span className="text-2xl shrink-0">{t.emoji}</span>
              <div>
                <p className={cn("text-lg font-semibold leading-tight", tone === t.value ? "text-linkedin-600" : "text-slate-700")}>{t.label}</p>
                <p className="text-sm text-slate-400 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Generate button ───────────────────────────────── */}
      <button
        onClick={generate}
        disabled={loading || (!summitUrl && !context.trim())}
        className={cn("w-full btn-primary py-4",
          (loading || (!summitUrl && !context.trim())) && "opacity-50 cursor-not-allowed shadow-none"
        )}
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" />{summitUrl ? "Reading website & generating…" : "Generating with Groq…"}</>
          : result
          ? <><RefreshCw className="w-5 h-5" />Regenerate Caption</>
          : <><Sparkles className="w-5 h-5" />Generate Caption</>}
      </button>

      {/* ── URL fetch notice ──────────────────────────────── */}
      {loading && summitUrl && (
        <div className="flex items-center gap-3 text-base text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 animate-fade-in">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Fetching summit info from the website, this may take a few seconds…
        </div>
      )}

      {/* ── Error ────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 text-lg text-red-600 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          {error}
        </div>
      )}

      {/* ── Output sections ──────────────────────────────── */}
      {result && (
        <div className="space-y-4 animate-slide-up">

          {urlOk && (
            <div className="flex items-center gap-2 text-base text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Caption generated using real summit info from the website
            </div>
          )}

          {/* Hook */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-b border-amber-100">
              <div className="flex items-center gap-2 text-amber-700 text-base font-bold uppercase tracking-wider">
                <Zap className="w-4 h-4" /> Hook
              </div>
              <button onClick={() => copy(hook, "hook")} className="text-amber-500 hover:text-amber-700 transition-colors">
                {copiedKey === "hook" ? <CheckCheck className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <textarea
              value={hook}
              onChange={e => { setHook(e.target.value); onChange(e.target.value, body, tags); }}
              rows={2}
              className="w-full px-5 py-4 text-lg font-semibold text-slate-800 leading-relaxed focus:outline-none resize-none bg-white"
            />
          </div>

          {/* Body */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 text-base font-bold uppercase tracking-wider">
                <AlignLeft className="w-4 h-4" /> Body
              </div>
              <button onClick={() => copy(body, "body")} className="text-blue-500 hover:text-blue-700 transition-colors">
                {copiedKey === "body" ? <CheckCheck className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <textarea
              value={body}
              onChange={e => { setBody(e.target.value); onChange(hook, e.target.value, tags); }}
              rows={8}
              className="w-full px-5 py-4 text-lg text-slate-800 leading-relaxed focus:outline-none resize-none bg-white"
            />
          </div>

          {/* Hashtags */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-violet-50 border-b border-violet-100">
              <div className="flex items-center gap-2 text-violet-700 text-base font-bold uppercase tracking-wider">
                <Hash className="w-4 h-4" /> Hashtags ({tags.length})
              </div>
              <button onClick={() => copy(tags.join(" "), "tags")} className="text-violet-500 hover:text-violet-700 transition-colors">
                {copiedKey === "tags" ? <CheckCheck className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="px-5 py-4 space-y-4 bg-white">
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 text-base font-medium px-3 py-1.5 rounded-full">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-violet-400 hover:text-violet-700 font-bold leading-none ml-0.5 text-lg">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTag()}
                  placeholder="Add hashtag…"
                  className="flex-1 text-base px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white"
                />
                <button onClick={addTag} className="text-base px-4 py-2.5 bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold rounded-lg transition-colors">Add</button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-1">
            <p className="text-base font-medium">
              {chars > 3000
                ? <span className="text-red-500">Too long ({chars}/3000)</span>
                : <span className="text-emerald-600">✓ {chars}/3000 — ready to post</span>}
            </p>
            <button
              onClick={() => copy(full(hook, body, tags), "full")}
              className="flex items-center gap-2 text-base font-medium text-slate-500 hover:text-linkedin-500 transition-colors"
            >
              {copiedKey === "full"
                ? <><CheckCheck className="w-4 h-4 text-emerald-500" />Copied!</>
                : <><Copy className="w-4 h-4" />Copy full caption</>}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
