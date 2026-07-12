"use client";

import { useMemo, useState, useTransition } from "react";
import { TYPE_LABELS, WINE_TYPES, type Wine } from "@/lib/types";
import { putBack, removeWine, takeOut } from "@/lib/actions";

export default function WineList({ wines }: { wines: Wine[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showEmpty, setShowEmpty] = useState(false);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    return wines.filter((wine) => {
      if (!showEmpty && wine.quantity === 0) return false;
      if (typeFilter && wine.type !== typeFilter) return false;
      if (!query) return true;
      return [wine.name, wine.producer, wine.pairs_with, wine.location, wine.vinmonopolet_id]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));
    });
  }, [wines, search, typeFilter, showEmpty]);

  const emptyCount = wines.filter((wine) => wine.quantity === 0).length;

  return (
    <div>
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Søk i lageret …"
        className="w-full rounded-xl border border-card-border bg-card px-4 py-3 text-base outline-none focus:border-accent"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <FilterChip
          label="Alle"
          active={typeFilter === null}
          onClick={() => setTypeFilter(null)}
        />
        {WINE_TYPES.map((type) => (
          <FilterChip
            key={type}
            label={TYPE_LABELS[type]}
            active={typeFilter === type}
            onClick={() => setTypeFilter(typeFilter === type ? null : type)}
          />
        ))}
      </div>

      {emptyCount > 0 && (
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showEmpty}
            onChange={(event) => setShowEmpty(event.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Vis tomme ({emptyCount})
        </label>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {filtered.map((wine) => (
          <WineCard key={wine.id} wine={wine} />
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-muted">
          {wines.length === 0
            ? "Lageret er tomt. Legg til din første vin!"
            : "Ingen viner matcher filteret."}
        </p>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-card-border bg-card text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function WineCard({ wine }: { wine: Wine }) {
  const [isPending, startTransition] = useTransition();
  const isEmpty = wine.quantity === 0;

  return (
    <li
      className={`flex gap-3 rounded-2xl border border-card-border bg-card p-3 shadow-sm ${
        isEmpty ? "opacity-60" : ""
      }`}
    >
      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-background">
        {wine.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/images/${wine.image}`}
            alt={`Etikett: ${wine.name}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            🍾
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-semibold leading-tight">{wine.name}</h2>
            <p className="truncate text-sm text-muted">
              {[wine.producer, wine.vintage].filter(Boolean).join(" · ") || " "}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-card-border px-2 py-0.5 text-xs text-muted">
            {TYPE_LABELS[wine.type] ?? wine.type}
          </span>
        </div>

        {wine.pairs_with && (
          <p className="mt-1 line-clamp-2 text-sm">
            <span className="text-muted">Passer til:</span> {wine.pairs_with}
          </p>
        )}
        {wine.location && (
          <p className="mt-0.5 text-xs text-muted">📍 {wine.location}</p>
        )}
        {wine.vinmonopolet_id && (
          <p className="mt-0.5 text-xs">
            <a
              href={`https://www.vinmonopolet.no/search?q=${encodeURIComponent(wine.vinmonopolet_id)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2"
            >
              Se på Vinmonopolet ({wine.vinmonopolet_id}) ↗
            </a>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-medium">
            {isEmpty ? "Utsolgt" : wine.quantity === 1 ? "1 flaske" : `${wine.quantity} flasker`}
          </span>
          <div className="flex items-center gap-2">
            {isEmpty ? (
              <>
                <ActionButton
                  label="+1"
                  disabled={isPending}
                  onClick={() => startTransition(() => putBack(wine.id))}
                />
                <ActionButton
                  label="Slett"
                  destructive
                  disabled={isPending}
                  onClick={() => {
                    if (confirm(`Slette «${wine.name}» fra lageret?`)) {
                      startTransition(() => removeWine(wine.id));
                    }
                  }}
                />
              </>
            ) : (
              <>
                <ActionButton
                  label="+1"
                  disabled={isPending}
                  onClick={() => startTransition(() => putBack(wine.id))}
                />
                <button
                  disabled={isPending}
                  onClick={() => startTransition(() => takeOut(wine.id))}
                  className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground active:scale-95 disabled:opacity-50"
                >
                  Ta ut
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium active:scale-95 disabled:opacity-50 ${
        destructive
          ? "border-red-300 text-red-600 dark:border-red-900 dark:text-red-400"
          : "border-card-border"
      }`}
    >
      {label}
    </button>
  );
}
