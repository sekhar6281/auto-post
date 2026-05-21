"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { Sparkles, ImagePlus, Send, Shield, Lock } from "lucide-react";

const FEATURES = [
  { icon: ImagePlus, text: "Upload photos & videos"             },
  { icon: Sparkles,  text: "AI-generated captions"              },
  { icon: Send,      text: "Auto-post to LinkedIn"               },
  { icon: Shield,    text: "Secure OAuth — no password stored"  },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setLoading(true);
    signIn("linkedin", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand relative overflow-hidden flex-col justify-between p-14">
        <div className="absolute inset-0 bg-grid-white opacity-100" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
              <LinkedInIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">AutoPost AI</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight mb-5">
            Turn moments into<br />
            <span className="text-blue-200">LinkedIn influence</span>
          </h1>
          <p className="text-blue-100 text-xl leading-relaxed mb-14 max-w-sm">
            Upload media, get an AI-crafted caption, and publish to your LinkedIn profile in under 60 seconds.
          </p>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center border border-white/20 shrink-0">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-50 text-lg font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-8">
          <div className="flex items-center gap-2 text-blue-100 text-base">
            <Lock className="w-4 h-4 shrink-0" />
            Your data stays on your device. We never store your LinkedIn credentials or personal information on our servers.
          </div>
        </div>
      </div>

      {/* ── Right login panel ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-14 bg-slate-50">
        <div className="w-full max-w-lg animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 gradient-brand rounded-lg flex items-center justify-center">
              <LinkedInIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-xl">AutoPost AI</span>
          </div>

          <div className="card p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Welcome back 👋</h2>
              <p className="text-slate-500 text-lg leading-relaxed">
                Sign in with your LinkedIn account to create and publish AI-powered posts.
              </p>
            </div>

            {/* Sign-in button */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="btn-primary w-full shine disabled:opacity-70"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Redirecting to LinkedIn…
                  </span>
                : <span className="flex items-center justify-center gap-2">
                    <LinkedInIcon className="w-6 h-6" />
                    Continue with LinkedIn
                  </span>}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-base text-slate-400 font-medium">SECURE LOGIN</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "OAuth 2.0",   sub: "Secure"  },
                { label: "No Password", sub: "Stored"  },
                { label: "Revoke",      sub: "Anytime" },
              ].map(b => (
                <div key={b.label} className="text-center py-4 px-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-base font-semibold text-slate-700">{b.label}</p>
                  <p className="text-sm text-slate-400 mt-1">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div className="mt-5 flex items-start gap-3 bg-white border border-slate-100 rounded-xl px-5 py-4 shadow-sm">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-600">Your email &amp; password never touch this site.</span>{" "}
              You log in directly on LinkedIn&apos;s secure servers — we only receive a temporary access token.
              For extra privacy on shared computers, use your browser&apos;s <span className="font-medium">Incognito / Private</span> mode.
            </p>
          </div>

          <p className="text-center text-base text-slate-400 mt-5 leading-relaxed">
            By signing in you allow AutoPost AI to post on your behalf.<br />
            Revoke access anytime from LinkedIn Settings → Security.
          </p>
        </div>
      </div>
    </div>
  );
}
