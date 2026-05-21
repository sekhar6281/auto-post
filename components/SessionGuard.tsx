"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * Enforces "don't save login info" by signing the user out when they open a
 * new tab/window. sessionStorage is cleared when the browser tab is closed,
 * so if it has no activity marker the user must have re-opened from scratch.
 */
export function SessionGuard() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const rememberMe = localStorage.getItem("rememberMe") !== "false"; // default: true

    if (!rememberMe) {
      const active = sessionStorage.getItem("sessionActive");
      if (!active) {
        // Tab was closed and reopened — wipe all local data and sign out
        try { localStorage.clear();   } catch {}
        try { sessionStorage.clear(); } catch {}
        signOut({ callbackUrl: "/login" });
        return;
      }
    }

    // Mark this tab as active for the rest of its life
    sessionStorage.setItem("sessionActive", "1");
  }, [status]);

  return null;
}
