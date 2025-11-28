"use client";

import Link from "next/link";

export default function DashboardPage() {
  const modules = [
    {
      title: "📄 Dagboksskanner",
      desc: "Skanna handskrivna eller tryckta dagbokssidor. Spara minnen eller skapa berättelser.",
      link: "/dagbok",
      audience: "Privatpersoner & familjer"
    },
    {
      title: "⚖ Avtals- & dokumentanalys",
      desc: "Ladda upp avtal, kontrakt eller PDF:er. Få sammanfattning, riskanalys och nyckelvillkor.",
      link: "/avtal",
      audience: "Företag, familjehem, konsulenter"
    },
    {
      title: "🌍 Språk & översättning",
      desc: "Förenkla text, översätt mellan språk, skriv om och sammanfatta.",
      link: "/sprak",
      audience: "Alla användare"
    },
    {
      title: "📚 Minnesbokgenerering",
      desc: "Dagbok → Text → Layout → Bok. Exportera som PDF eller tryckoriginal.",
      link: "/minnesbok",
      audience: "Privata minnesprojekt"
    },
    {
      title: "🏢 Företagsversion",
      desc: "Teamkonton, GDPR-lagring, loggar, support, delade filer & åtkomstkontroll.",
      link: "/foretag",
      audience: "Organisationer & professioner"
    }
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        padding: "3rem 1.5rem",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto"
        }}
      >
        <header style={{ marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "#0f172a",
              margin: 0,
              marginBottom: "0.75rem"
            }}
          >
            Textskanner V2
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 600,
              color: "#475569",
              fontSize: "1rem",
              lineHeight: 1.5
            }}
          >
            En plattform för skanning, analys, skrivande och bevarande av text. Väx med dina behov — från dagbok till avtal och
            företagsstöd.
          </p>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem"
          }}
        >
          {modules.map((m) => (
            <Link key={m.title} href={m.link} style={{ textDecoration: "none" }}>
              <article
                style={{
                  borderRadius: 18,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  padding: "1.25rem 1.4rem",
                  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  const card = e.currentTarget as HTMLDivElement;
                  card.style.transform = "translateY(-2px)";
                  card.style.boxShadow = "0 22px 50px rgba(15,23,42,0.12)";
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget as HTMLDivElement;
                  card.style.transform = "translateY(0)";
                  card.style.boxShadow = "0 18px 40px rgba(15,23,42,0.08)";
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    marginBottom: "0.5rem",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#0f172a"
                  }}
                >
                  {m.title}
                </h2>
                <p
                  style={{
                    margin: 0,
                    marginBottom: "0.75rem",
                    fontSize: "0.9rem",
                    color: "#475569",
                    lineHeight: 1.5
                  }}
                >
                  {m.desc}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#2563eb"
                  }}
                >
                  → {m.audience}
                </p>
              </article>
            </Link>
          ))}
        </section>

        <footer
          style={{
            marginTop: "2.5rem",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "#94a3b8"
          }}
        >
          Du bygger nu den nya generationens Textskanner. Funktionerna kan växa, precis som användarna.
        </footer>
      </div>
    </main>
  );
}
