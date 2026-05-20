"use client";

import { usePathname } from "next/navigation";
import { Check, ImagePlus, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Upload",   path: "/upload",  icon: ImagePlus, color: "from-blue-500 to-blue-600"     },
  { label: "Caption",  path: "/caption", icon: Sparkles,  color: "from-violet-500 to-violet-600" },
  { label: "Post",     path: "/preview", icon: Send,       color: "from-emerald-500 to-emerald-600" },
];

export function StepProgress() {
  const pathname   = usePathname();
  const currentIdx = STEPS.findIndex((s) => pathname.startsWith(s.path));
  if (currentIdx === -1) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const done   = idx < currentIdx;
          const active = idx === currentIdx;
          const Icon   = step.icon;

          return (
            <div key={step.path} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 shrink-0">
                {/* Circle */}
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    done   && `bg-gradient-to-br ${step.color} border-transparent shadow-sm`,
                    active && "bg-white border-linkedin-500 shadow-brand scale-110",
                    !done && !active && "bg-white border-slate-200"
                  )}
                >
                  {done ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className={cn("w-6 h-6", active ? "text-linkedin-500" : "text-slate-400")} />
                  )}
                </div>
                {/* Label */}
                <span className={cn(
                  "text-base font-semibold tracking-wide whitespace-nowrap",
                  active ? "text-linkedin-500" : done ? "text-slate-600" : "text-slate-400"
                )}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-4 mb-8 rounded-full overflow-hidden bg-slate-200">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      idx < currentIdx ? `bg-gradient-to-r ${step.color}` : "bg-transparent"
                    )}
                    style={{ width: idx < currentIdx ? "100%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
