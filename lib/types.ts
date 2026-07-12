export type Wine = {
  id: number;
  name: string;
  producer: string | null;
  vintage: number | null;
  type: string;
  quantity: number;
  location: string | null;
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
  "annet",
] as const;

export const TYPE_LABELS: Record<string, string> = {
  rødvin: "Rødvin",
  hvitvin: "Hvitvin",
  musserende: "Musserende",
  rosé: "Rosé",
  dessertvin: "Dessertvin",
  annet: "Annet",
};
