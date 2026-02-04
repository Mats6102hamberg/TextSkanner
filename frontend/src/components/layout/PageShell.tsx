import * as React from "react";
import Link from "next/link";

interface PageShellProps {
  title?: string;
  subtitle?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, fullWidth, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111111]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E4A7A] text-sm font-bold text-white">
              TS
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-900">Textscanner</span>
              <span className="text-xs text-slate-500">Dagbok, avtal, språk & minnen</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link href="/" className="hover:text-slate-900">
              Produkter
            </Link>
            <Link href="/foretag" className="hover:text-slate-900">
              Om oss
            </Link>
            <Link href="/kontakt" className="hover:text-slate-900">
              Kontakt
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA]"
            >
              Kontakta oss
            </Link>
          </div>
        </div>
      </header>

      <main className={fullWidth ? "w-full" : "mx-auto max-w-6xl px-4 py-10"}>
        {(title || subtitle) && (
          <div className="mb-8 max-w-3xl">
            {title && (
              <h1 className="mb-2 text-3xl font-semibold text-[#111111] md:text-4xl">
                {title}
              </h1>
            )}
            {subtitle && <p className="text-sm text-[#4B5563] md:text-base">{subtitle}</p>}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
