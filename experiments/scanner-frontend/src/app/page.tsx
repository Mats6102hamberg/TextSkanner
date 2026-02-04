import Link from "next/link";

type Cta = {
  label: string;
  href: string;
  className: string;
  external?: boolean;
  hint?: string;
};

const primaryCtas: Cta[] = [
  {
    label: "Kom igång med dagboksscanner",
    href: "/dagbok",
    className: "bg-indigo-600 text-white hover:bg-indigo-700",
    hint: "OCR + klargöring + berättelse"
  },
  {
    label: "Testa avtalsanalys",
    href: "/avtalskollen",
    className: "bg-emerald-600 text-white hover:bg-emerald-700",
    hint: "Sammanfattning + riskpunkter + nästa steg"
  },
  {
    label: "Testa maskering",
    href: "/maskering",
    className: "bg-slate-900 text-white hover:bg-slate-800",
    hint: "Ta bort personuppgifter i text"
  },
  {
    label: "Skapa minnesbok",
    href: "/minnesbok",
    className: "bg-amber-600 text-white hover:bg-amber-700",
    hint: "Kapitel + struktur + export"
  },
  {
    label: "Öppna Prospero",
    href: "https://prospero.example.com",
    className: "bg-slate-900 text-white hover:bg-slate-800",
    external: true,
    hint: "Planering & simulering"
  }
];

function CtaButton({ cta }: { cta: Cta }) {
  const base =
    "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-300";

  const content = (
    <>
      <span>{cta.label}</span>
      <span aria-hidden className="text-white/80">
        →
      </span>
    </>
  );

  if (cta.external) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noreferrer"
        className={`${base} ${cta.className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={cta.href} className={`${base} ${cta.className}`}>
      {content}
    </Link>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* top bar */}
      <div className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              TS
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">TextScanner</p>
              <p className="text-xs text-slate-500">Dagbok • Avtal • Maskering • Minnesbok</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/dagbok"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Dagbok
            </Link>
            <Link
              href="/avtalskollen"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Avtalskollen
            </Link>
            <Link
              href="/maskering"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Maskering
            </Link>
            <Link
              href="/minnesbok"
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Minnesbok
            </Link>
          </div>
        </div>
      </div>

      {/* hero */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Redo att scanna och strukturera på riktigt
            </p>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Skanna. Klargör. Förädla.
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              TextScanner gör det enkelt att ta handskrivet och rörigt material hela vägen till
              tydlig text, sammanfattningar och färdiga kapitel. Perfekt när du vill jobba snabbt
              men ändå få kvalitet.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {primaryCtas.map((cta) => (
                <CtaButton key={cta.label} cta={cta} />
              ))}
            </div>

            <div className="mt-6 text-sm text-slate-500">
              Tips, Mats: börja med <span className="font-semibold text-slate-700">Dagboksscanner</span> →
              när du ser att flödet sitter, kopplar vi på Minnesbok + Släktmagi som ditt paket.
            </div>
          </div>

          {/* feature card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Så här jobbar du (enkelt flöde)</h2>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-900">1) Skanna / importera</p>
                <p className="mt-1 text-sm text-slate-600">
                  Bild, PDF eller text → vi hämtar ut innehållet.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-900">2) Klargör och strukturera</p>
                <p className="mt-1 text-sm text-slate-600">
                  Gör det läsbart och logiskt, utan att tappa din röst.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-900">3) Skapa output</p>
                <p className="mt-1 text-sm text-slate-600">
                  Sammanfattning, avtalspunkter, maskad text eller minnesbokskapitel.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Pro-tip</p>
              <p className="mt-1 text-sm text-amber-900/80">
                När sidan sitter: då lägger vi på “Senast arbetade dokument” och ett tydligt
                whitelabel-läge för företag.
              </p>
            </div>
          </div>
        </div>

        {/* quick links grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Dagbok",
              desc: "Scanna och förvandla handskrivet till text.",
              href: "/dagbok"
            },
            {
              title: "Avtalskollen",
              desc: "Få punkter, risker och rekommendationer.",
              href: "/avtalskollen"
            },
            {
              title: "Maskering",
              desc: "Rensa bort personuppgifter innan delning.",
              href: "/maskering"
            },
            {
              title: "Minnesbok",
              desc: "Skapa kapitel och struktur för export.",
              href: "/minnesbok"
            }
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-bold text-slate-900">{card.title}</p>
              <p className="mt-2 text-sm text-slate-600">{card.desc}</p>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                Öppna <span className="text-slate-400 group-hover:text-slate-700">→</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">TextScanner</span> — byggt för att göra
          röriga dokument till tydliga resultat.
        </div>
      </footer>
    </main>
  );
}
