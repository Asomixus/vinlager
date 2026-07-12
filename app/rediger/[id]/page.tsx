import Link from "next/link";
import { notFound } from "next/navigation";
import { getWine } from "@/lib/db";
import WineForm from "../../components/WineForm";

export const dynamic = "force-dynamic";

export default async function EditWinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const wine = getWine(Number(id));
  if (!wine) notFound();

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
        <h1 className="truncate text-2xl font-bold tracking-tight">Rediger vin</h1>
      </header>

      <WineForm wine={wine} />
    </main>
  );
}
