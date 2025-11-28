"use client";

export default function MinnesbokPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">📚 Minnesbokgenerering</h1>
          <p className="text-sm text-slate-600">
            Här kommer du kunna omvandla dagboksanteckningar och texter till en sammanhängande minnesbok – med kapitel,
            rubriker och färdig layout för PDF eller tryck.
          </p>
          <p className="text-xs text-slate-500">Just nu är detta en förhandsvy. Funktionerna byggs steg för steg.</p>
        </header>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">Snart kan du:</p>
          <ul className="space-y-1 list-disc pl-5 text-sm text-slate-700">
            <li>Klistra in dagbokstext eller importera från Dagboksskannern</li>
            <li>Få förslag på kapitel och rubriker</li>
            <li>Generera ett första utkast till minnesbok</li>
          </ul>
          <p className="text-xs text-slate-500">
            Nästa steg blir att koppla hit en AI-funktion som föreslår kapitel och struktur utifrån dina texter.
          </p>
        </section>
      </div>
    </main>
  );
}
