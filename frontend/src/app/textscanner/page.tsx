"use client";

import Link from "next/link";
import { BookOpen, FileText, ShieldCheck } from "lucide-react";

export default function TextscannerHome() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Textscanner – Din AI-baserade textpartner
        </h1>
        <p className="mb-10 text-lg text-gray-600">
          Skanna dagböcker, avtal, analyser, skapa språkvänlig text,
          minnesböcker och maskera känsliga uppgifter – allt i samma
          kraftfulla AI-plattform.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        {/* Dagboksscanner */}
        <div className="rounded-2xl bg-white p-8 shadow-md transition hover:shadow-lg">
          <BookOpen className="mb-4 h-10 w-10 text-blue-600" />
          <h2 className="mb-2 text-xl font-semibold">Dagboksscanner</h2>
          <p className="mb-6 text-gray-600">
            Förvandla handskriven eller fotograferad dagbok till ren text,
            berättelser eller minnesböcker.
          </p>
          <Link
            href="/textscanner/diary"
            className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
          >
            Öppna dagboksscannern
          </Link>
        </div>

        {/* Avtalsanalys */}
        <div className="rounded-2xl bg-white p-8 shadow-md transition hover:shadow-lg">
          <FileText className="mb-4 h-10 w-10 text-green-600" />
          <h2 className="mb-2 text-xl font-semibold">Avtalsanalys</h2>
          <p className="mb-6 text-gray-600">
            Ladda upp ett avtal och få sammanfattning, risker, otydligheter,
            maskeringsbehov och helhetsbild.
          </p>
          <Link
            href="/textscanner/contract"
            className="inline-block rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700"
          >
            Gå till avtalsanalys
          </Link>
        </div>

        {/* Maskering & minnesböcker */}
        <div className="rounded-2xl bg-white p-8 shadow-md transition hover:shadow-lg">
          <ShieldCheck className="mb-4 h-10 w-10 text-purple-600" />
          <h2 className="mb-2 text-xl font-semibold">
            Maskering & minnesböcker
          </h2>
          <p className="mb-6 text-gray-600">
            Maskera känsliga uppgifter, skapa språkvänlig text eller bygg en
            komplett minnesbok från dokument.
          </p>
          <Link
            href="/textscanner/masking"
            className="inline-block rounded-lg bg-purple-600 px-4 py-2 text-white font-medium hover:bg-purple-700"
          >
            Gå till maskering
          </Link>
        </div>
      </div>
    </main>
  );
}
