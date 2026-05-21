"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * Signs the user out automatically if they open a new tab/window without
 * an active session marker. sessionStorage is cleared when the browser tab
 * is closed, so a missing marker means the user re-opened from scratch.
 */
export function SessionGuard() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const active = sessionStorage.getItem("sessionActive");
    if (!active) {
      // Tab was closed and reopened — wipe all local data and sign out
      try { localStorage.clear();   } catch {}
      try { sessionStorage.clear(); } catch {}
      signOut({ callbackUrl: "/login" });
      return;
    }

    // Mark this tab as active for the rest of its life
    sessionStorage.setItem("sessionActive", "1");
  }, [status]);

  return null;
}
