import Link from "next/link";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center max-w-md w-full">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 mb-4">
          <SearchX className="w-7 h-7 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Page not found</h2>
        <p className="text-slate-500 text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-linkedin-blue hover:bg-linkedin-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
