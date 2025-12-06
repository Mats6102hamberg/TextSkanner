"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Layers,
  PenLine,
  ShieldCheck,
  Sparkles
} from "lucide-react";

export default function TextscannerHome() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-300">
            <div className="flex flex-wrap gap-2">
              {["Dagbok", "Avtal", "Språk", "Minnesböcker"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs tracking-wide text-slate-300"
                >
                  {label}
                </span>
              ))}
            </div>
            <span className="flex items-center gap-2 text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Betrodd av skrivcoacher & mikroföretag
            </span>
          </div>

          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Textscanner / AI-verktygslåda
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight text-white md:text-5xl">
              Bygg din egen AI-baserade textpartner
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-300">
              Skanna dagböcker, analysera avtal, skapa språkvänlig text och bygg minnesböcker –
              allt i samma plattform. Behåll kontrollen över data och arbetsflöde samtidigt som AI
              tar hand om det repetitiva.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dagbok"
                className="flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-base font-semibold text-slate-900 shadow-lg shadow-emerald-500/20 hover:bg-emerald-300"
              >
                Kom igång med dagboksskannern
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/textscanner/contract"
                className="flex items-center gap-2 rounded-full border border-slate-700 px-6 py-3 text-base font-semibold text-white hover:border-white"
              >
                Testa avtalsanalys
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1fr,0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl shadow-slate-950/40">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Det här kan du göra
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-white">Din modulära verktygslåda</h2>
            <p className="mt-3 text-slate-300">
              Plattformen är designad för att du ska kunna kombinera flera verktyg i samma miljö.
              Välj en ingång – fortsätt bygga senare.
            </p>
            <ul className="mt-6 space-y-4 text-slate-200">
              {[
                "Bygga en dagboksscanner eller digital dagbok",
                "Skapa en avtalsanalys-AI som förklarar innehållet på enkel svenska",
                "Göra språkverktyg för begriplighet och tonalitet",
                "Skapa minnesböcker för personer, familjer eller verksamheter",
                "Paketera lösningar för både privatpersoner och företag"
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-slate-200">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
              Dina byggstenar
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-white">Välj en ingång</h3>
            <p className="mt-3 text-sm text-slate-400">
              Olika flöden – samma plattform. Hoppa mellan dem utan att tappa kontext.
            </p>

            <div className="mt-6 space-y-5">
              {[
                {
                  title: "Dagboksscanner",
                  body: "Skanna, tolka och strukturera dagbokstexter över tid. Perfekt för livsberättelser, terapidagböcker eller reflektion i vardagen.",
                  href: "/dagbok",
                  icon: <BookOpen className="h-10 w-10 text-emerald-300" />
                },
                {
                  title: "Avtalsanalys-AI",
                  body: "Få stöd att förstå vad avtal faktiskt betyder. Ladda upp avtal, få riskpunkter, sammanfattningar och maskeringsstöd.",
                  href: "/textscanner/contract",
                  icon: <FileText className="h-10 w-10 text-sky-300" />
                }
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 transition hover:border-emerald-300/60"
                >
                  {card.icon}
                  <div>
                    <p className="text-lg font-semibold text-white">{card.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{card.body}</p>
                    <span className="mt-3 inline-flex items-center text-sm font-semibold text-emerald-300">
                      Öppna {card.title.toLowerCase()} <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-slate-400">
                Lösningar för olika behov
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Samma kärna – olika upplevelser
              </h2>
            </div>
            <Link
              href="/minnen"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-white hover:border-white"
            >
              Se exempel på minnesprojekt
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Språkverktyg & begriplighet",
                desc: "Förvandla OCR-text till klarspråk. Spara versioner, dela med klienter eller använd i coaching.",
                icon: <PenLine className="h-8 w-8 text-rose-300" />,
                href: "/textscanner/diary"
              },
              {
                title: "Maskering & sekretess",
                desc: "Identifiera personnummer, adresser och andra känsliga uppgifter och maskera dem automatiskt.",
                icon: <ShieldCheck className="h-8 w-8 text-purple-300" />,
                href: "/textscanner/masking"
              },
              {
                title: "Minnesböcker & storytelling",
                desc: "Skapa kapitel, sammanfattningar och PDF-minnesböcker från valda dagboksinlägg.",
                icon: <Layers className="h-8 w-8 text-amber-300" />,
                href: "/minnen"
              }
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-3xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-emerald-300/60"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-slate-800/60 p-3">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-300">
                  Utforska <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
