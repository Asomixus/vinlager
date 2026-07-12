import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const DATA_DIR = process.env.VINLAGER_DATA_DIR ?? path.join(process.cwd(), "data");
export const IMAGE_DIR = path.join(DATA_DIR, "images");

fs.mkdirSync(IMAGE_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "vinlager.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS wines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    producer TEXT,
    vintage INTEGER,
    type TEXT NOT NULL DEFAULT 'rødvin',
    quantity INTEGER NOT NULL DEFAULT 1,
    pairs_with TEXT,
    notes TEXT,
    image TEXT,
    vinmonopolet_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Migrering: dropp location-kolonnen fra databaser opprettet før den ble fjernet
if (db.prepare("SELECT 1 FROM pragma_table_info('wines') WHERE name = 'location'").get()) {
  db.exec("ALTER TABLE wines DROP COLUMN location");
}

import type { Wine } from "./types";

export type { Wine };

export function listWines(): Wine[] {
  return db
    .prepare("SELECT * FROM wines ORDER BY quantity = 0, name COLLATE NOCASE")
    .all() as Wine[];
}

export function getWine(id: number): Wine | undefined {
  return db.prepare("SELECT * FROM wines WHERE id = ?").get(id) as Wine | undefined;
}

export function insertWine(wine: {
  name: string;
  producer: string | null;
  vintage: number | null;
  type: string;
  quantity: number;
  pairs_with: string | null;
  notes: string | null;
  image: string | null;
  vinmonopolet_id: string | null;
}): number {
  const result = db
    .prepare(
      `INSERT INTO wines (name, producer, vintage, type, quantity, pairs_with, notes, image, vinmonopolet_id)
       VALUES (@name, @producer, @vintage, @type, @quantity, @pairs_with, @notes, @image, @vinmonopolet_id)`
    )
    .run(wine);
  return Number(result.lastInsertRowid);
}

export function adjustQuantity(id: number, delta: number): void {
  db.prepare(
    `UPDATE wines
     SET quantity = MAX(0, quantity + ?), updated_at = datetime('now')
     WHERE id = ?`
  ).run(delta, id);
}

export function deleteWine(id: number): void {
  const wine = getWine(id);
  db.prepare("DELETE FROM wines WHERE id = ?").run(id);
  if (wine?.image) {
    const imagePath = path.join(IMAGE_DIR, wine.image);
    fs.rmSync(imagePath, { force: true });
  }
}
