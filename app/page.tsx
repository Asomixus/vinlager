import Link from "next/link";
import { listWines } from "@/lib/db";
import WineList from "./components/WineList";

export const dynamic = "force-dynamic";

export default function Home() {
  const wines = listWines();
  const bottleCount = wines.reduce((sum, wine) => sum + wine.quantity, 0);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 pt-6">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🍷 Vinlager</h1>
          <p className="mt-1 text-sm text-muted">
            {bottleCount === 1 ? "1 flaske" : `${bottleCount} flasker`} på lager
          </p>
        </div>
      </header>

      <WineList wines={wines} />

      <Link
        href="/ny"
        className="fixed bottom-6 right-6 flex h-14 items-center gap-2 rounded-full bg-accent px-6 text-lg font-semibold text-accent-foreground shadow-lg active:scale-95"
      >
        <span className="text-2xl leading-none">+</span> Ny vin
      </Link>
    </main>
  );
}
