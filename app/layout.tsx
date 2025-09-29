import "./globals.css";

export const metadata = {
  title: "Mock Interview Coach — Offline",
  description: "Practice interviews with local transcription and heuristic coaching",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen header-gradient">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600" />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">Mock Interview Coach</h1>
                <p className="text-xs text-slate-500">Practice questions to crack PM interviews</p>
              </div>
            </div>
            <div className="hidden sm:block">
              
            </div>
          </header>
          {children}
          <footer className="mt-10 text-center text-xs text-slate-400">
            Built by Harshini Mangaleshkar - Next.js, Tailwind, and Vercel
          </footer>
        </div>
      </body>
    </html>
  );
}
