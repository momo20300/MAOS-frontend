import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center bg-[#0d0f11] text-[#d1d8dd]">
      <img src="/logo_darkmode.png" alt="MAOS Logo" className="w-[170px] mb-8" />
      <h1 className="text-4xl font-bold mb-4">MAOS</h1>
      <p className="text-gray-400 mb-8">
        Multi-Agent Operating System<br/>
        Talk to your company like a CEO
      </p>
      <Link href="/login" className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700">
        Start with MAOS
      </Link>
    </main>
  );
}
