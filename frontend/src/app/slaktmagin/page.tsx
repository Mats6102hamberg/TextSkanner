import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";

export default function SlaktmaginIndex() {
  return (
    <PageShell fullWidth>
      {/* Hero Section */}
      <section className="bg-[#EAF5FF] py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4F46E5]">
              Textscanner
            </p>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#0EA5E9] bg-clip-text text-transparent">
                SläktMagi
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
              SläktMagi hör till Dagboksscannern.
            </p>
            <div className="mt-6">
              <Link
                href="/dagbok"
                className="inline-flex items-center rounded-xl border border-[#4F46E5] bg-white px-4 py-2 text-sm font-semibold text-[#4F46E5] shadow-sm hover:bg-[#EEF2FF]"
              >
                ← Till Dagboksscannern
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <section className="mx-auto max-w-3xl rounded-3xl border border-black/5 bg-white p-6 shadow-xl sm:p-8">
          <p className="text-sm text-slate-600">Välj vad du vill arbeta med:</p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Link
              href="/slaktmagin/slakttrad"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-900 transition hover:-translate-y-1 hover:shadow-md"
            >
              🌳 Släktträd
            </Link>
            <Link
              href="/slaktmagin/tidslinje"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-900 transition hover:-translate-y-1 hover:shadow-md"
            >
              🗓️ Tidslinje
            </Link>
            <Link
              href="/slaktmagin/utkast"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-900 transition hover:-translate-y-1 hover:shadow-md"
            >
              ✍️ Utkast
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
