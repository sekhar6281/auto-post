import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { StepProgress } from "@/components/StepProgress";

export default async function UploadLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={session.user} />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <StepProgress />
        {children}
      </main>
    </div>
  );
}
