// src/app/textscanner/page.tsx

import Link from "next/link";

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

          {/* Minnesböcker */}
          <div className="rounded-xl border bg-gray-50 p-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Minnesböcker & Släktmagi
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Förvandla dagböcker till strukturerade minnesböcker med kapitel,
              släktöversikt och PDF-export. Perfekt för livsberättelser och
              släktprojekt.
            </p>
            <Link
              href="/minnesbok"
              className="mt-2 inline-flex items-center rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
            >
              Gå till minnesböcker
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
