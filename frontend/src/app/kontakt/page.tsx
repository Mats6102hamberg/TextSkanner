import Link from "next/link";

import { PageShell } from "@/components/layout/PageShell";

export default function KontaktPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const hasEmail = Boolean(email && email.trim());
  const mailtoHref = hasEmail ? `mailto:${email}` : "mailto:";

  return (
    <PageShell title="Kontakt" subtitle="Kontakta oss via e-post.">
      <section className="mx-auto max-w-3xl rounded-3xl border border-black/5 bg-white p-6 shadow-xl sm:p-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">E-post</div>
            {hasEmail ? (
              <a
                href={mailtoHref}
                className="inline-flex items-center rounded-xl bg-[#4F46E5] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA]"
              >
                {email}
              </a>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                Ingen e-postadress är konfigurerad.
                <div className="mt-2 text-xs text-amber-800">
                  Sätt <code className="rounded bg-white/70 px-1">NEXT_PUBLIC_CONTACT_EMAIL</code> i{" "}
                  <code className="rounded bg-white/70 px-1">.env.local</code>.
                </div>
              </div>
            )}
          </div>

          <div className="text-sm text-slate-600">
            <Link href="/" className="font-semibold text-[#4F46E5] hover:text-[#4338CA]">
              ← Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
