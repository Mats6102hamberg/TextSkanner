// src/app/textscanner/page.tsx

import Link from "next/link";

const primaryCtas = [
  {
    label: "Kom igång med dagboksscanner",
    href: "/dagbok",
    className:
      "bg-indigo-600 text-white hover:bg-indigo-700"
  },
  {
    label: "Testa avtalsanalys",
    href: "/avtalskollen",
    className:
      "bg-emerald-600 text-white hover:bg-emerald-700"
  },
  {
    label: "Testa maskering",
    href: "/maskering",
    className:
      "bg-slate-900 text-white hover:bg-slate-800"
  },
  {
    label: "Skapa minnesbok",
    href: "/minnesbok",
    className:
      "bg-amber-600 text-white hover:bg-amber-700"
  },
  {
    label: "Öppna Prospero",
    href: "https://prospero.example.com",
    className:
      "bg-slate-900 text-white hover:bg-slate-800",
    external: true
  }
];

export default function TextscannerPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Textskanner · Dagbok, avtal, språk & minnen
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          Bygg din egen AI-baserade textpartner
        </h1>
        <p className="text-sm text-gray-600">
          Skanna dagböcker, analysera avtal, skapa språkhjälp och minnesböcker
          – i samma plattform. För både privatpersoner och företag.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {primaryCtas.map((cta) => (
            <Link
              key={cta.href}
              href={cta.href}
              target={cta.external ? "_blank" : undefined}
              rel={cta.external ? "noopener noreferrer" : undefined}
              className={`inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold transition ${cta.className}`}
            >
              {cta.label}
            </Link>
          ))}
        </div>
      </header>

      <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Dina byggstenar</h2>
        <p className="text-xs text-gray-600">
          Välj en ingång – du kan alltid bygga vidare senare.
        </p>

        <div className="space-y-3">
          {/* Dagboksskanner */}
          <div className="rounded-xl border bg-gray-50 p-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Dagboksskanner
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Skanna, tolka och strukturera dagbokstexter över tid. Perfekt för
              livsberättelser, terapidagböcker eller reflektion i vardagen.
            </p>
            <Link
              href="/dagbok"
              className="mt-2 inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Öppna dagboksskanner
            </Link>
          </div>

          {/* Avtalsanalys */}
          <div className="rounded-xl border bg-gray-50 p-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Avtalsanalys-AI
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Få stöd att förstå vad avtalet faktiskt betyder. Ladda upp avtal,
              få en pedagogisk genomgång, riskpunkter och sammanfattning.
            </p>
            <Link
              href="/avtal"
              className="mt-2 inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              Gå till avtalsanalys
            </Link>
          </div>

          {/* Språkverktyg */}
          <div className="rounded-xl border bg-gray-50 p-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Språkverktyg
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Förenkla, förtydliga eller förbättra texter. Bra för
              myndighetsbrev, viktiga mejl, ansökningar eller berättelser.
            </p>
            <Link
              href="/sprak"
              className="mt-2 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Öppna språkverktyg
            </Link>
          </div>

          {/* Maskeringsverktyg */}
          <div className="rounded-xl border bg-gray-50 p-3">
            <h3 className="text-sm font-semibold text-gray-900">Maskeringsverktyg</h3>
            <p className="mt-1 text-xs text-gray-600">
              Maskera personnummer, adresser och annan känslig information i dokument innan du delar dem.
            </p>
            <Link
              href="/maskering"
              className="mt-2 inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
            >
              Gå till maskering
            </Link>
          </div>

          {/* Minnesbok */}
          <div className="rounded-xl border bg-gray-50 p-3">
            <h3 className="text-sm font-semibold text-gray-900">Minnesbok</h3>
            <p className="mt-1 text-xs text-gray-600">
              Skapa en strukturerad minnesbok av dagboksanteckningar – med kapitel, tidslinje, personer och teman.
            </p>
            <Link
              href="/minnesbok"
              className="mt-2 inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              Öppna Minnesboken
            </Link>
          </div>

          {/* Prospero */}
          <div className="rounded-xl border bg-white p-4 text-sm">
            <h3 className="text-sm font-semibold text-gray-900">
              Prospero – ekonomiplanering
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Simulera hur avtal, inkomster och sparande påverkar din framtida ekonomi. Prospero hjälper dig att fatta lugna, genomtänkta beslut.
            </p>
            <Link
              href="https://prospero.example.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Öppna Prospero
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
