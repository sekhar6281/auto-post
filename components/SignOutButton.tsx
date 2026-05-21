"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface Props {
  className?: string;
  /** "icon" = the small LogOut button in the nav bar
   *  "link" = the inline text link in the token-expired banner */
  variant?: "icon" | "link";
}

/**
 * Clears ALL local/session storage and cookies before signing out.
 * This removes cached credentials, post data, and session tokens from the browser.
 */
export function SignOutButton({ className, variant = "icon" }: Props) {
  const handleSignOut = () => {
    // Wipe every piece of data this site has stored in the browser
    try { localStorage.clear();   } catch {}
    try { sessionStorage.clear(); } catch {}

    // Clear any service-worker caches if present
    if ("caches" in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }

    signOut({ callbackUrl: "/login" });
  };

  if (variant === "link") {
    return (
      <button
        onClick={handleSignOut}
        className={className ?? "underline underline-offset-2 font-semibold hover:opacity-80"}
      >
        sign in again
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      title="Sign out — clears all session data from this browser"
      className={className ?? "p-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"}
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
