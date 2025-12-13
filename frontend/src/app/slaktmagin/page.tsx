import Link from "next/link";

export default function SlaktmaginIndex() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Släktmagi</h1>
      <p>Välj vad du vill arbeta med:</p>
      <ul>
        <li><Link href="/slaktmagin/slakttrad">Släktträd</Link></li>
        <li><Link href="/slaktmagin/tidslinje">Tidslinje</Link></li>
        <li><Link href="/slaktmagin/utkast">Utkast</Link></li>
      </ul>
    </main>
  );
}
