"use client";

import { useRef, useState, useTransition } from "react";
import { PAIRS_WITH_TAGS, TYPE_LABELS, WINE_TYPES, type Wine } from "@/lib/types";
import { addWine, updateWine } from "@/lib/actions";

export default function WineForm({ wine }: { wine?: Wine }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = wine !== undefined;
  const imageSrc = preview ?? (wine?.image ? `/api/images/${wine.image}` : null);
  const selectedTags = wine?.pairs_with?.split(", ") ?? [];

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    if (!file) {
      setPhoto(null);
      setPreview(null);
      return;
    }
    setIsCompressing(true);
    const compressed = await compressPhoto(file).catch(() => file);
    setPhoto(compressed);
    setPreview(URL.createObjectURL(compressed));
    setIsCompressing(false);
  }

  return (
    <form
      action={(formData) => {
        if (photo) formData.set("photo", photo, photo.name);
        startTransition(() => (isEdit ? updateWine(formData) : addWine(formData)));
      }}
      className="flex flex-col gap-4"
    >
      {isEdit && <input type="hidden" name="id" value={wine.id} />}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex min-h-40 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-card-border bg-card p-2"
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="Forhåndsvisning av etikett"
            className="max-h-64 rounded-xl object-contain"
          />
        ) : (
          <>
            <span className="text-4xl">📷</span>
            <span className="font-medium">Ta bilde av etiketten</span>
            <span className="text-sm text-muted">eller velg fra galleriet</span>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        name="photo"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
      />

      <Field label="Navn *">
        <input
          name="name"
          required
          defaultValue={wine?.name}
          placeholder="F.eks. Barolo Riserva"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Type">
          <select name="type" className={inputClass} defaultValue={wine?.type ?? "rødvin"}>
            {WINE_TYPES.map((type) => (
              <option key={type} value={type}>
                {TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Antall flasker">
          <input
            name="quantity"
            type="number"
            inputMode="numeric"
            min={isEdit ? 0 : 1}
            defaultValue={wine?.quantity ?? 1}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Årgang">
          <input
            name="vintage"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            defaultValue={wine?.vintage ?? undefined}
            placeholder="2021"
            className={inputClass}
          />
        </Field>
        <Field label="Varenummer">
          <input
            name="vinmonopolet_id"
            inputMode="numeric"
            defaultValue={wine?.vinmonopolet_id ?? undefined}
            placeholder="F.eks. 9921801"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-muted">Passer til</span>
        <div className="flex flex-wrap gap-2">
          {PAIRS_WITH_TAGS.map((tag) => (
            <label key={tag} className="cursor-pointer">
              <input
                type="checkbox"
                name="pairs_with"
                value={tag}
                defaultChecked={selectedTags.includes(tag)}
                className="peer sr-only"
              />
              <span className="block rounded-full border border-card-border bg-card px-3 py-1.5 text-sm font-medium first-letter:uppercase transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground">
                {tag}
              </span>
            </label>
          ))}
        </div>
      </div>

      <Field label="Notater">
        <textarea name="notes" rows={3} defaultValue={wine?.notes ?? undefined} className={inputClass} />
      </Field>

      <button
        type="submit"
        disabled={isPending || isCompressing}
        className="mt-2 rounded-xl bg-accent py-3.5 text-lg font-semibold text-accent-foreground active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Lagrer …" : isEdit ? "Lagre endringer" : "Legg til i lageret"}
      </button>
    </form>
  );
}

// Server actions har en grense på request-størrelse, og kamerabilder er gjerne
// flere MB — skaler ned og re-enkod som JPEG før opplasting.
const MAX_DIMENSION = 1600;

async function compressPhoto(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8),
    );
    if (!blob) throw new Error("Kunne ikke komprimere bildet");
    return new File([blob], "etikett.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const inputClass =
  "w-full rounded-xl border border-card-border bg-card px-4 py-3 text-base outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
