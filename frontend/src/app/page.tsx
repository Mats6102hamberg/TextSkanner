import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/Card";
import Link from "next/link";

export default function HomePage() {
  return (
    <PageShell
      title="Bygg din egen AI-baserade textpartner"
      subtitle="Skanna dagböcker, analysera avtal, skapa språkstöd och minnesböcker – i samma plattform. För både privatpersoner och företag."
    >
      <section className="mb-10 grid gap-8 md:grid-cols-[2fr,1.3fr]">
        <div className="flex flex-col gap-4">
          <p className="text-base text-[#374151] md:text-lg">
            Du har redan allt du behöver: texter, dokument, minnen. Plattformen hjälper dig att förvandla dem till trygghet,
            struktur och affärsnytta med hjälp av AI.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dagbok">
              <Button size="lg">Kom igång med dagboksskanner</Button>
            </Link>
            <Link href="/avtal">
              <Button variant="secondary" size="lg">
                Testa avtalsanalys
              </Button>
            </Link>
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-[#4B5563]">
            <li>• Bygg dagboksskanner för handskrivna eller digitala dagböcker</li>
            <li>• Skapa en avtalsanalys-AI som förklarar innehåll på enkel svenska</li>
            <li>• Gör språkverktyg som hjälper med begriplighet och tonalitet</li>
            <li>• Skapa minnesböcker för personer, familjer eller verksamheter</li>
            <li>• Paketera lösningen för både privatpersoner och företag</li>
          </ul>
        </div>

        <Card className="bg-gradient-to-b from-white to-[#EFF3F8]">
          <CardHeader>
            <CardTitle>Det här kan du göra här</CardTitle>
            <CardDescription>
              Plattformen är byggd för att du ska kunna kombinera flera verktyg i samma miljö.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-[#374151]">
              <p>✅ Bygga en dagboksskanner</p>
              <p>✅ Skapa en avtalsanalys-AI</p>
              <p>✅ Sälja lösningar till företag</p>
              <p>✅ Hjälpa privatpersoner med ordning och begriplighet</p>
              <p>✅ Göra språkverktyg och minnesböcker</p>
              <p>✅ Skapa juridikstöd (utan att ersätta juridisk rådgivning)</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[#111111]">Dina byggstenar</h2>
          <p className="text-sm text-[#6B7280]">Välj en ingång – du kan alltid bygga vidare senare.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Dagboksskanner</CardTitle>
              <CardDescription>Skanna, tolka och strukturera dagbokstexter över tid.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[#4B5563]">Perfekt för livsberättelser, terapidagböcker eller reflektion i vardagen.</p>
              <Link href="/dagbok">
                <Button variant="secondary" size="md">
                  Öppna dagboksskanner
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avtalsanalys-AI</CardTitle>
              <CardDescription>Få stöd att förstå vad avtal faktiskt betyder.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[#4B5563]">
                Ladda upp avtal, få en pedagogisk genomgång, riskpunkter och sammanfattning.
              </p>
              <Link href="/avtal">
                <Button variant="secondary" size="md">
                  Gå till avtalsanalys
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Språkverktyg</CardTitle>
              <CardDescription>Förenkla, förtydliga och anpassa texter till målgruppen.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[#4B5563]">
                Jobba med olika lägen: klarspråk, professionell ton, stöd för flera språk.
              </p>
              <Link href="/sprak">
                <Button variant="secondary" size="md">
                  Testa språkverktyg
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minnesböcker</CardTitle>
              <CardDescription>Samla berättelser, bilder och texter till något bestående.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[#4B5563]">
                För personer, familjer, släkter eller klientarbete – allt på samma plats.
              </p>
              <Link href="/minnesbok">
                <Button variant="secondary" size="md">
                  Utforska minnesböcker
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Företagslösningar</CardTitle>
              <CardDescription>Paketera som tjänst för mindre team och verksamheter.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[#4B5563]">Skapa inloggning, roller och enklare rapporter för uppdragsgivare.</p>
              <Link href="/foretag">
                <Button variant="secondary" size="md">
                  Se möjligheter för företag
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6 grid items-center gap-6 md:grid-cols-[1.5fr,1fr]">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-[#111111]">Du ligger före konkurrenterna</h2>
          <p className="mb-3 text-sm text-[#4B5563]">
            Det är helt rätt tid att bygga de här verktygen. Behovet av begriplighet, överblick och trygghet kring texter ökar –
            både hos privatpersoner och verksamheter.
          </p>
          <p className="text-sm text-[#4B5563]">
            Plattformen är din bygglåda. Du bestämmer om det ska bli ett personligt verktyg, en tjänst för klienter – eller en
            produkt du säljer vidare.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nästa steg</CardTitle>
            <CardDescription>Välj ett område att börja med – du kan alltid växa vidare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#4B5563]">
            <p>1. Välj en ingång (t.ex. dagbok eller avtal)</p>
            <p>2. Testa ett konkret dokument eller text</p>
            <p>3. Reflektera: Vad gav dig mest värde?</p>
            <p>4. Bygg vidare därifrån – för dig, dina klienter eller ditt företag.</p>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
