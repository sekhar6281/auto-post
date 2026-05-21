import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { SessionGuard }    from "@/components/SessionGuard";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "LinkedIn Auto Post — AI-powered posting",
  description: "Upload media, get an AI caption, and post to LinkedIn in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SessionGuard />
          {children}
        </SessionProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "18px",
              fontWeight: "500",
            },
            success: {
              style: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" },
              iconTheme: { primary: "#16a34a", secondary: "#f0fdf4" },
            },
            error: {
              style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" },
              iconTheme: { primary: "#dc2626", secondary: "#fef2f2" },
            },
          }}
        />
      </body>
    </html>
  );
}
