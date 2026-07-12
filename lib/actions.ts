"use server";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as db from "./db";
import { PAIRS_WITH_TAGS } from "./types";

export async function addWine(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Vinen må ha et navn");
  }

  const vintageRaw = String(formData.get("vintage") ?? "").trim();
  const quantityRaw = Number(formData.get("quantity") ?? 1);

  let image: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    const ext = path.extname(photo.name).toLowerCase() || ".jpg";
    image = `${crypto.randomUUID()}${ext}`;
    const buffer = Buffer.from(await photo.arrayBuffer());
    await fs.writeFile(path.join(db.IMAGE_DIR, image), buffer);
  }

  db.insertWine({
    name,
    producer: emptyToNull(formData.get("producer")),
    vintage: vintageRaw ? Number(vintageRaw) : null,
    type: String(formData.get("type") ?? "rødvin"),
    quantity: Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1,
    pairs_with: parsePairsWith(formData),
    notes: emptyToNull(formData.get("notes")),
    image,
    vinmonopolet_id: emptyToNull(formData.get("vinmonopolet_id")),
  });

  revalidatePath("/");
  redirect("/");
}

export async function takeOut(id: number): Promise<void> {
  db.adjustQuantity(id, -1);
  revalidatePath("/");
}

export async function putBack(id: number): Promise<void> {
  db.adjustQuantity(id, 1);
  revalidatePath("/");
}

export async function removeWine(id: number): Promise<void> {
  db.deleteWine(id);
  revalidatePath("/");
}

function parsePairsWith(formData: FormData): string | null {
  const tags = formData
    .getAll("pairs_with")
    .map(String)
    .filter((tag) => (PAIRS_WITH_TAGS as readonly string[]).includes(tag));
  return tags.length > 0 ? tags.join(", ") : null;
}

function emptyToNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}
