export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-linkedin-blue animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading...</p>
      </div>
    </div>
  );
}
