"use client";

import React from "react";
import { ThumbsUp, MessageSquare, Repeat2, Send, Globe, MoreHorizontal } from "lucide-react";
import Image from "next/image";

interface MediaItem { url: string; type: "image" | "video" }
interface Props { userName: string; userImage?: string; caption: string; mediaItems?: MediaItem[] }

function Img({ url, type, overlay }: { url: string; type: "image" | "video"; overlay?: React.ReactNode }) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100">
      {type === "video"
        ? <video src={url} muted className="w-full h-full object-cover" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={url} alt="" className="w-full h-full object-cover" />}
      {overlay}
    </div>
  );
}

function MediaGrid({ items }: { items: MediaItem[] }) {
  if (!items.length) return null;

  const more = Math.max(0, items.length - 4);
  const visible = items.slice(0, 4);

  // 1 — full width
  if (items.length === 1) {
    const { url, type } = items[0];
    return (
      <div className="border-y border-slate-100 bg-slate-50">
        {type === "video"
          ? <video src={url} controls className="w-full max-h-[420px] object-cover" />
          // eslint-disable-next-line @next/next/no-img-element
          : <img src={url} alt="" className="w-full max-h-[420px] object-cover" />}
      </div>
    );
  }

  // 2 — side by side
  if (items.length === 2) return (
    <div className="grid grid-cols-2 gap-0.5 border-y border-slate-100" style={{ height: 280 }}>
      {items.map((it, i) => <Img key={i} url={it.url} type={it.type} />)}
    </div>
  );

  // 3 — tall left + 2 stacked right
  if (items.length === 3) return (
    <div className="grid grid-cols-2 gap-0.5 border-y border-slate-100" style={{ height: 300 }}>
      <div className="row-span-2"><Img url={items[0].url} type={items[0].type} /></div>
      {items.slice(1).map((it, i) => (
        <div key={i} style={{ height: 150 }}><Img url={it.url} type={it.type} /></div>
      ))}
    </div>
  );

  // 4+ — big left + 3 stacked right (with +N overlay on last)
  return (
    <div className="grid grid-cols-2 gap-0.5 border-y border-slate-100" style={{ height: 320 }}>
      <div style={{ height: 320 }}><Img url={visible[0].url} type={visible[0].type} /></div>
      <div className="grid grid-rows-3 gap-0.5" style={{ height: 320 }}>
        {visible.slice(1).map((it, i) => (
          <Img
            key={i}
            url={it.url}
            type={it.type}
            overlay={i === 2 && more > 0
              ? <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">+{more}</span>
                </div>
              : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export function PostPreview({ userName, userImage, caption, mediaItems = [] }: Props) {
  const lines   = caption.split("\n");
  const preview = lines.slice(0, 3).join("\n");
  const more    = lines.length > 3;

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 gradient-brand flex items-center justify-center ring-2 ring-white shadow-sm">
            {userImage
              ? <Image src={userImage} alt={userName} width={56} height={56} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-xl">{userName.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 text-lg leading-tight">{userName}</p>
            <p className="text-base text-slate-500">LinkedIn Member · 1st</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-base text-slate-400">Just now ·</span>
              <Globe className="w-4 h-4 text-slate-400" />
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-lg text-slate-800 leading-relaxed whitespace-pre-line">
          {preview}
          {more && <span className="text-linkedin-500 cursor-pointer hover:underline"> …see more</span>}
        </p>
      </div>

      <MediaGrid items={mediaItems} />

      {/* Reactions */}
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between text-base text-slate-500">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-0.5">
              {["👍","❤️","🔥"].map(e => <span key={e} className="text-lg">{e}</span>)}
            </div>
            <span className="ml-1">Be the first to react</span>
          </div>
          <span>0 comments</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1.5 flex">
        {[
          { icon: ThumbsUp,      label: "Like"    },
          { icon: MessageSquare, label: "Comment" },
          { icon: Repeat2,       label: "Repost"  },
          { icon: Send,          label: "Send"    },
        ].map(({ icon: Icon, label }) => (
          <button key={label}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all text-lg font-medium"
          >
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
