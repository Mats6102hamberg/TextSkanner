"use client";

import Link from "next/link";

const modules = [
  {
    title: "📄 Dagboksskanner",
    desc: "Skanna handskrivna eller tryckta dagbokssidor. Spara minnen eller skapa berättelser.",
    link: "/dagbok",
    audience: "Privatpersoner & familjer"
  },
  {
    title: "⚖ Avtals- & dokumentanalys",
    desc: "Ladda upp avtal, kontrakt eller PDF:er. Få sammanfattning, riskanalys och nyckelvillkor.",
    link: "/avtal",
    audience: "Företag, familjehem, konsulenter"
  },
  {
    title: "🌍 Språk & översättning",
    desc: "Förenkla text, översätt mellan språk, skriv om och sammanfatta.",
    link: "/sprak",
    audience: "Alla användare"
  },
  {
    title: "📚 Minnesbokgenerering",
    desc: "Dagbok → Text → Layout → Bok. Exportera som PDF eller tryckoriginal.",
    link: "/minnesbok",
    audience: "Privata minnesprojekt"
  },
  {
    title: "🏢 Företagsversion",
    desc: "Teamkonton, GDPR-lagring, loggar, support, delade filer & åtkomstkontroll.",
    link: "/foretag",
    audience: "Organisationer & professioner"
  }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold text-slate-900">Textskanner V2</h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            En plattform för skanning, analys, skrivande och bevarande av text. Väx med dina behov — från dagbok till
            avtal och företagsstöd.
          </p>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.link}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50 transition hover:border-blue-500 hover:shadow-md"
            >
              <h2 className="mb-2 text-xl font-semibold">{module.title}</h2>
              <p className="mb-3 text-sm text-slate-600">{module.desc}</p>
              <p className="text-xs font-medium text-blue-600 group-hover:underline">→ {module.audience}</p>
            </Link>
          ))}
        </section>

        <footer className="pt-6 text-center text-sm text-slate-500">
          Du bygger nu den nya generationens Textskanner. Funktionerna kan växa, precis som användarna.
        </footer>
      </div>
    </main>
  );
}
