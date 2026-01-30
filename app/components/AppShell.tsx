import Link from "next/link";

const navItems = [
  { href: "/", label: "Search" },
  { href: "/upload", label: "Upload" },
  { href: "/stats", label: "Stats" },
  { href: "/settings", label: "Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-slate-900 [background:radial-gradient(1200px_circle_at_10%_-10%,#e0f2fe,transparent_40%),radial-gradient(900px_circle_at_90%_0%,#dbeafe,transparent_35%),linear-gradient(180deg,#f8fafc,rgba(248,250,252,0.2))]">
      <header className="border-b border-slate-200/70 bg-white/80 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-400 text-sm font-semibold text-white">
              MN
            </div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Mini Notes Search
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/70 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
