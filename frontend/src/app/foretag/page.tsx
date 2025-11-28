"use client";

import { PageShell } from "@/components/layout/PageShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ForetagPage() {
  return (
    <PageShell
      title="Textskanner för verksamheter"
      subtitle="Avtalsanalys, dokumentstöd och smart skanning för socialt arbete, familjehemskonsulenter och andra professioner som arbetar nära barn och familjer."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "⚖ Avtals- & dokumentanalys",
            desc:
              "Ladda upp avtal, uppdragsbeskrivningar och överenskommelser. Få en sammanfattning i klarspråk, riskpunkter och förslag på sådant ni bör följa upp.",
            bullets: [
              "Kortfattad sammanfattning för möten och beslut.",
              "Markering av otydliga eller känsliga villkor.",
              "Möjlighet att bara göra snabbkoll – utan lagring."
            ]
          },
          {
            title: "📝 Journal- & anteckningsskanner",
            desc:
              "Skanna handskrivna anteckningar från hembesök, möten eller telefonsamtal. Gör dem till sökbar text och få korta sammanfattningar.",
            bullets: [
              "Stöd för dagboks-/anteckningssidor via Dagboksskannern.",
              "Klarspråkstöd för information till familjehem och vårdnadshavare.",
              "Komplement till befintligt journalsystem – inte en ersättare."
            ]
          },
          {
            title: "🌍 Språk & klarspråk",
            desc:
              "Gör svår text begriplig för familjer, barn och familjehem utan att ändra innebörden. Textskanner hjälper er att förklara beslut och riktlinjer på ett enkelt språk.",
            bullets: [
              "Förenkling av besluts- och informationsbrev.",
              "Sammanfattningar att använda i samtal och möten.",
              "Enkel engelskspråkig version vid behov."
            ]
          },
          {
            title: "🔐 Säkerhet & GDPR",
            desc: "Textskanner är byggd med barns integritet i fokus. Ni styr själva vad som sparas, hur länge och av vem.",
            bullets: [
              "Möjlighet att endast använda \"snabbkoll utan lagring\".",
              "Olika användarroller (t.ex. konsulent, admin) kan införas.",
              "Loggar och spårbarhet kan byggas ut vid behov."
            ]
          }
        ].map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[#4B5563]">
              <p>{card.desc}</p>
              <ul className="list-disc space-y-1 pl-5 text-[#1E293B]">
                {card.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>🎫 Licens för små team</CardTitle>
            <CardDescription>
              Passar verksamheter med 3–10 användare, till exempel familjehemsverksamheter, utredningsenheter eller behandlingshem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#4B5563]">
            <ul className="list-disc space-y-1 pl-5 text-[#1E293B]">
              <li>Gemensam åtkomst till plattformen – inget krångel med egna nycklar.</li>
              <li>Kontrollerad AI-kostnad per månad, förutsägbara utgifter.</li>
              <li>Stöd i uppstart: gemensam genomgång och riktlinjer för användning.</li>
            </ul>
            <div className="flex flex-col gap-3 border-t border-[#E2E6EB] pt-4 text-sm text-[#4B5563] md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold text-[#111111]">Intresserad av att testa i din verksamhet?</div>
                <p>Kontakta Mats Hamberg för demo, prisförslag och upplägg anpassat för er vardag.</p>
              </div>
              <Button size="md">Skicka intresseanmälan</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
