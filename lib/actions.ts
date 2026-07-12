"use server";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as db from "./db";
import { PAIRS_WITH_TAGS } from "./types";

export async function addWine(formData: FormData): Promise<void> {
  const fields = parseWineFields(formData);
  const image = await savePhoto(formData);

  db.insertWine({
    ...fields,
    quantity: Math.max(1, fields.quantity),
    image,
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateWine(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const existing = db.getWine(id);
  if (!existing) {
    throw new Error("Fant ikke vinen");
  }

  const fields = parseWineFields(formData);

  let image = existing.image;
  const newImage = await savePhoto(formData);
  if (newImage) {
    if (existing.image) {
      await fs.rm(path.join(db.IMAGE_DIR, existing.image), { force: true });
    }
    image = newImage;
  }

  db.updateWine({ id, ...fields, image });

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

function parseWineFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Vinen må ha et navn");
  }

  const vintageRaw = String(formData.get("vintage") ?? "").trim();
  const quantityRaw = Number(formData.get("quantity"));

  return {
    name,
    vintage: vintageRaw ? Number(vintageRaw) : null,
    type: String(formData.get("type") ?? "rødvin"),
    quantity: Number.isFinite(quantityRaw) ? Math.max(0, Math.floor(quantityRaw)) : 1,
    pairs_with: parsePairsWith(formData),
    notes: emptyToNull(formData.get("notes")),
    vinmonopolet_id: emptyToNull(formData.get("vinmonopolet_id")),
  };
}

async function savePhoto(formData: FormData): Promise<string | null> {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return null;
  const ext = path.extname(photo.name).toLowerCase() || ".jpg";
  const image = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await photo.arrayBuffer());
  await fs.writeFile(path.join(db.IMAGE_DIR, image), buffer);
  return image;
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
