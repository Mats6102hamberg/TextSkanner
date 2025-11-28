import * as React from "react";
import Link from "next/link";

interface PageShellProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111111]">
      <header className="border-b border-[#E2E6EB] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E4A7A] text-sm font-bold text-white">TS</div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Textskanner</span>
              <span className="text-xs text-[#6B7280]">Dagbok, avtal, språk & minnen</span>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-sm text-[#4B5563]">
            <Link href="/dagbok" className="hover:text-[#1E4A7A]">
              Dagboksskanner
            </Link>
            <Link href="/avtal" className="hover:text-[#1E4A7A]">
              Avtalsanalys
            </Link>
            <Link href="/sprak" className="hover:text-[#1E4A7A]">
              Språkverktyg
            </Link>
            <Link href="/minnesbok" className="hover:text-[#1E4A7A]">
              Minnesböcker
            </Link>
            <Link href="/foretag" className="hover:text-[#1E4A7A]">
              Företag
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
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
