"use client";

import { useRef, useState, useTransition } from "react";
import { TYPE_LABELS, WINE_TYPES } from "@/lib/types";
import { addWine } from "@/lib/actions";

export default function WineForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form
      action={(formData) => startTransition(() => addWine(formData))}
      className="flex flex-col gap-4"
    >
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex min-h-40 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-card-border bg-card p-2"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
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
          placeholder="F.eks. Barolo Riserva"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Produsent">
          <input name="producer" className={inputClass} />
        </Field>
        <Field label="Årgang">
          <input
            name="vintage"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2100}
            placeholder="2021"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Type">
          <select name="type" className={inputClass} defaultValue="rødvin">
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
            min={1}
            defaultValue={1}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Hylleplass">
        <input name="location" placeholder="F.eks. hylle B3" className={inputClass} />
      </Field>

      <Field label="Passer til">
        <input
          name="pairs_with"
          placeholder="F.eks. lam, storfe, modne oster"
          className={inputClass}
        />
      </Field>

      <Field label="Notater">
        <textarea name="notes" rows={3} className={inputClass} />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-xl bg-accent py-3.5 text-lg font-semibold text-accent-foreground active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Lagrer …" : "Legg til i lageret"}
      </button>
    </form>
  );
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
