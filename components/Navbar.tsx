import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { LinkedInIcon }  from "@/components/icons/LinkedInIcon";
import Image from "next/image";
import Link  from "next/link";
import { AlertTriangle } from "lucide-react";
import type { User } from "next-auth";

interface NavbarProps { user?: User }

export async function Navbar({ user }: NavbarProps) {
  const session      = await auth();
  const tokenExpired = session?.error === "TokenExpired";

  return (
    <header className="sticky top-0 z-50">
      {tokenExpired && (
        <div className="bg-amber-500 px-6 py-3.5 flex items-center justify-center gap-2 text-xl text-white font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          Session expired —&nbsp;
          <SignOutButton
            variant="link"
            className="underline underline-offset-2 font-semibold hover:opacity-80"
          />
        </div>
      )}

      <nav className="glass border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between" style={{ height: "76px" }}>

          {/* Brand */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center shadow-brand group-hover:scale-105 transition-transform">
              <LinkedInIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-xl tracking-tight">AutoPost AI</span>
          </Link>

          {/* Nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { href: "/upload",  label: "Upload"  },
              { href: "/caption", label: "Caption" },
              { href: "/preview", label: "Preview" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-5 py-2.5 rounded-lg text-lg font-medium text-slate-500 hover:text-linkedin-500 hover:bg-linkedin-50 transition-all duration-150"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* User + sign-out */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? ""}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:block text-lg font-medium text-slate-700 max-w-[180px] truncate">
                {user?.name}
              </span>
            </div>

            {/* Client-side sign-out: clears localStorage + sessionStorage + caches */}
            <SignOutButton />
          </div>
        </div>
      </nav>
    </header>
  );
}
