"use client";

export default function ForetagPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-3">
          <h1 className="flex items-center gap-2 text-3xl font-bold text-slate-900 md:text-4xl">
            <span>🏢</span>
            <span>Textskanner för verksamheter</span>
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 md:text-base">
            Avtalsanalys, dokumentstöd och smart skanning för socialt arbete, familjehemskonsulenter och andra professioner som arbetar nära barn och familjer. Enkelt att komma igång, lätt att förklara för kollegor.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">⚖ Avtals- & dokumentanalys</h2>
            <p className="text-sm text-slate-600">
              Ladda upp avtal, uppdragsbeskrivningar och överenskommelser. Få en sammanfattning i klarspråk, riskpunkter och förslag på sådant ni bör följa upp.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Kortfattad sammanfattning för möten och beslut.</li>
              <li>Markering av otydliga eller känsliga villkor.</li>
              <li>Möjlighet att bara göra snabbkoll – utan lagring.</li>
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">📝 Journal- & anteckningsskanner</h2>
            <p className="text-sm text-slate-600">
              Skanna handskrivna anteckningar från hembesök, möten eller telefonsamtal. Gör dem till sökbar text och få korta sammanfattningar.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Stöd för dagboks-/anteckningssidor via Dagboksskannern.</li>
              <li>Klarspråkstöd för information till familjehem och vårdnadshavare.</li>
              <li>Komplement till befintligt journalsystem – inte en ersättare.</li>
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">🌍 Språk & klarspråk</h2>
            <p className="text-sm text-slate-600">
              Gör svår text begriplig för familjer, barn och familjehem utan att ändra innebörden. Textskanner hjälper er att förklara beslut och riktlinjer på ett enkelt språk.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Förenkling av besluts- och informationsbrev.</li>
              <li>Sammanfattningar att använda i samtal och möten.</li>
              <li>Enkel engelskspråkig version vid behov.</li>
            </ul>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">🔐 Säkerhet & GDPR</h2>
            <p className="text-sm text-slate-600">
              Textskanner är byggd med barns integritet i fokus. Ni styr själva vad som sparas, hur länge och av vem.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Möjlighet att endast använda “snabbkoll utan lagring”.</li>
              <li>Olika användarroller (t.ex. konsulent, admin) kan införas.</li>
              <li>Loggar och spårbarhet kan byggas ut vid behov.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">🎫 Licens för små team</h2>
          <p className="text-sm text-slate-600">
            Textskanner passar särskilt bra för verksamheter med 3–10 användare, till exempel familjehemsverksamheter, mindre utredningsenheter eller behandlingshem.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Gemensam åtkomst till plattformen – inget krångel med egna nycklar.</li>
            <li>Kontrollerad AI-kostnad per månad, förutsägbara utgifter.</li>
            <li>Stöd i uppstart: gemensam genomgång och riktlinjer för användning.</li>
          </ul>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600">
              <div className="font-semibold text-slate-900">Intresserad av att testa i din verksamhet?</div>
              <p>Kontakta Mats Hamberg för demo, prisförslag och upplägg anpassat för er vardag.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Skicka intresseanmälan
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
