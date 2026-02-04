import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#4F46E5]">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-900">
          Sidan hittades inte
        </h2>
        <p className="mt-2 text-slate-600">
          Sidan du letar efter finns inte eller har flyttats.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#4F46E5] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338CA]"
        >
          Tillbaka till startsidan
        </Link>
      </div>
    </div>
  );
}
