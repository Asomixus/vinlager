export type Wine = {
  id: number;
  name: string;
  vintage: number | null;
  type: string;
  quantity: number;
  pairs_with: string | null;
  notes: string | null;
  image: string | null;
  vinmonopolet_id: string | null;
  created_at: string;
  updated_at: string;
};

export const WINE_TYPES = [
  "rødvin",
  "hvitvin",
  "musserende",
  "rosé",
  "dessertvin",
  "portvin",
  "annet",
] as const;

export const PAIRS_WITH_TAGS = [
  "frittstående",
  "lyst kjøtt",
  "storfe",
  "svin",
  "lam",
  "vilt",
  "fisk",
  "skalldyr",
  "ost",
  "vegetar",
  "dessert",
] as const;

// Resultatet av et oppslag mot Vinmonopolet (se lib/vinmonopolet.ts).
export type VinmonopoletInfo = {
  name: string;
  vintage: number | null;
  type: (typeof WINE_TYPES)[number];
  pairsWith: string[];
  imageDataUrl: string | null;
};

export const TYPE_LABELS: Record<string, string> = {
  rødvin: "Rødvin",
  hvitvin: "Hvitvin",
  musserende: "Musserende",
  rosé: "Rosé",
  dessertvin: "Dessertvin",
  portvin: "Portvin",
  annet: "Annet",
};
