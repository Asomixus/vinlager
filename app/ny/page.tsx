import Link from "next/link";
import WineForm from "../components/WineForm";

export default function NewWinePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-12 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-card-border bg-card text-lg"
          aria-label="Tilbake"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Ny vin</h1>
      </header>

      <WineForm />
    </main>
  );
}
