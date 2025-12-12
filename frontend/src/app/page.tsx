export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">

        <header className="mb-10 space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            Textscanner
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Välkommen till Textscanner
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Ladda upp dagböcker, avtal och dokument och få AI-genererade 
            sammanfattningar, minnesböcker och avtalsanalyser.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">

          <a href="/dagbok"
            className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">
              📘 Dagboksscanner
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Skanna dagbokssidor, spara med AI-detekterade känslor och datum.
            </p>
            <p className="mt-2 text-xs text-sky-600">
              → <a href="/dagbok/historik" className="hover:underline">Visa historik</a>
            </p>
          </a>

          <a href="/avtal"
            className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">
              📄 Avtalskollen
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Få sammanfattningar, riskbedömning och nyckelparagrafer.
            </p>
          </a>

          <a href="/maskering"
            className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">
              🛡️ Maskering
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Maskera känsliga personuppgifter innan delning.
            </p>
          </a>

        </section>

      </div>
    </main>
  );
}
