export default function DagbokPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto space-y-6 max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-900">📄 Dagboksskanner</h1>
        <p className="text-sm text-slate-600">
          Skanna handskrivna sidor och gör dem till text. Perfekt för dagböcker, minnen och berättelser. Texten kan sparas eller
          skickas vidare till Minnesboks-generatorn.
        </p>

        <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">👉 Ladda upp en bild eller PDF för att konvertera dagbokstext.</p>

          <input
            type="file"
            accept="image/*,.pdf"
            className="rounded-md text-sm file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white"
          />

          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Skanna dagbokssida
          </button>
        </div>
      </div>
    </main>
  );
}
