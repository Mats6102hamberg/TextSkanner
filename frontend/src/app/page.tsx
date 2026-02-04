import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";

const products = [
  {
    title: "Dagboksscannern",
    description: "Skanna dagböcker, förtydliga text och skapa berättelser. Här hittar du även Minnesböcker och SläktMagi.",
    href: "/dagbok"
  },
  {
    title: "Avtalsscannern",
    description: "Tolka avtal och försäkringar, flagga risktext och gör avtalet begripligt.",
    href: "/avtal"
  },
  {
    title: "Maskeringsverktyget",
    description: "Maskera personnummer, adresser och känslig information innan du delar dokument vidare.",
    href: "/maskering"
  }
];

export default function HomePage() {
  return (
    <PageShell fullWidth>
      <section className="bg-[#EAF5FF] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4F46E5]">
              Textscanner
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Digitala lösningar som{" "}
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#0EA5E9] bg-clip-text text-transparent">
                förenklar
              </span>
              <br />
              vardagen
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
              Textscanner innehåller ett flertal funktioner.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/dagbok"
                className="inline-flex items-center justify-center rounded-xl bg-[#4F46E5] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA]"
              >
                Dagboksscannern
              </Link>
              <Link
                href="/avtal"
                className="inline-flex items-center justify-center rounded-xl border border-[#4F46E5] bg-white px-5 py-3 text-sm font-semibold text-[#4F46E5] shadow-sm transition hover:bg-[#EEF2FF]"
              >
                Avtalsscannern
              </Link>
              <Link
                href="/maskering"
                className="inline-flex items-center justify-center rounded-xl border border-[#4F46E5] bg-white px-5 py-3 text-sm font-semibold text-[#4F46E5] shadow-sm transition hover:bg-[#EEF2FF]"
              >
                Maskeringsverktyget
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0B1220] py-10 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 sm:grid-cols-4">
          {[
            { value: "3", label: "Produkter" },
            { value: "Flera", label: "Språk" },
            { value: "OCR", label: "Skanning" },
            { value: "AI", label: "Tolkning" }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-extrabold tracking-tight text-[#38BDF8] sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-slate-300 sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#4F46E5]">
              Våra produkter
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Funktioner i Textscanner
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {products.map((product) => (
              <Link
                key={product.href}
                href={product.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{product.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                  </div>
                  <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#4F46E5]">
                    Öppna →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
