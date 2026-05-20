import { auth } from "@/lib/auth";
import Link from "next/link";
import { ArrowRight, ImagePlus, Sparkles, Send, Zap } from "lucide-react";

const STEPS = [
  {
    step: "01", icon: ImagePlus,
    title: "Upload Media",
    desc: "Drag & drop up to 9 photos or 1 video.",
    href: "/upload",
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50", ring: "ring-blue-100",
  },
  {
    step: "02", icon: Sparkles,
    title: "AI Caption",
    desc: "One line of context — AI writes the rest.",
    href: "/caption",
    gradient: "from-violet-500 to-violet-600",
    bg: "bg-violet-50", ring: "ring-violet-100",
  },
  {
    step: "03", icon: Send,
    title: "Post to LinkedIn",
    desc: "Preview your post and publish instantly.",
    href: "/preview",
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-50", ring: "ring-emerald-100",
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const name    = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="animate-fade-in">

      {/* ── Hero banner ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl gradient-brand p-10 mb-10 shadow-brand">
        <div className="absolute inset-0 bg-grid-white opacity-100" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-base text-blue-100 font-medium mb-4">
              <Zap className="w-4 h-4" />
              AI-powered posting
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Hey, {name}! 👋
            </h1>
            <p className="text-blue-100 text-xl">
              Create your next LinkedIn post in under 60 seconds.
            </p>
          </div>

          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-white text-linkedin-600 font-semibold
                       px-7 py-4 rounded-xl shadow-sm hover:shadow-md
                       hover:bg-blue-50 active:scale-95 transition-all shrink-0 text-xl"
          >
            Start new post
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* ── How it works ─────────────────────────────── */}
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-400 uppercase tracking-widest mb-5">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {STEPS.map(({ step, icon: Icon, title, desc, href, gradient, bg, ring }) => (
            <Link
              key={step}
              href={href}
              className="card-hover group p-8 cursor-pointer"
            >
              <div className={`inline-flex p-4 rounded-xl ${bg} ring-1 ${ring} mb-5`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="text-xs font-bold text-slate-300 tracking-widest mb-2">
                STEP {step}
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-linkedin-500 transition-colors">
                {title}
              </h3>
              <p className="text-lg text-slate-500 leading-relaxed">{desc}</p>

              <div className="mt-5 flex items-center gap-1.5 text-base font-medium text-slate-400 group-hover:text-linkedin-500 transition-colors">
                Go to step
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
