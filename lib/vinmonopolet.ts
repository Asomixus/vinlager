import { PAIRS_WITH_TAGS, WINE_TYPES, type VinmonopoletInfo } from "./types";

// Henter produktdata ved å parse JSON-en Vinmonopolet embedder i produktsidens
// HTML (<script type="application/json">). Det offisielle API-et krever nøkkel,
// og søke-API-et mangler «passer til» og årgang — men strukturen her er
// uoffisiell og kan endre seg, så alle feil skal ende som `null` hos kalleren.

// Vinmonopolets «passer til»-koder (content.isGoodFor) → våre tags.
const PAIRS_WITH_BY_CODE: Record<string, (typeof PAIRS_WITH_TAGS)[number]> = {
  A: "frittstående", // Aperitiff
  B: "skalldyr",
  C: "fisk",
  D: "lyst kjøtt",
  E: "storfe",
  F: "lam", // Lam og sau
  G: "vilt", // Småvilt
  H: "vilt", // Storvilt
  L: "ost",
  N: "dessert",
  Q: "svin",
  R: "vegetar", // Grønnsaker
};

const TYPE_BY_CATEGORY: Record<string, (typeof WINE_TYPES)[number]> = {
  rødvin: "rødvin",
  hvitvin: "hvitvin",
  rosévin: "rosé",
  musserende_vin: "musserende",
  perlende_vin: "musserende",
};

type EmbeddedProduct = {
  code?: string;
  name?: string;
  year?: string;
  main_category?: { code?: string };
  main_sub_category?: { code?: string };
  content?: { isGoodFor?: { code?: string }[] };
  images?: { format?: string; url?: string }[];
};

export async function fetchVinmonopoletInfo(
  varenummer: string,
): Promise<VinmonopoletInfo | null> {
  if (!/^\d+$/.test(varenummer)) return null;

  const res = await fetch(`https://www.vinmonopolet.no/p/${varenummer}`, {
    headers: { "User-Agent": "Mozilla/5.0 (vinlager)" },
  });
  if (!res.ok) return null;

  const product = extractProduct(await res.text());
  if (!product?.name) return null;

  const vintage = /^\d{4}$/.test(product.year ?? "") ? Number(product.year) : null;

  const pairsWith = [
    ...new Set(
      (product.content?.isGoodFor ?? [])
        .map((entry) => PAIRS_WITH_BY_CODE[entry.code ?? ""])
        .filter((tag) => tag !== undefined),
    ),
  ];

  return {
    // Årgangen ligger også sist i navnet — stripp den, vi har eget felt.
    name: vintage ? product.name.replace(new RegExp(`\\s+${vintage}$`), "") : product.name,
    vintage,
    // Portvin ligger under hovedkategorien sterkvin (som også dekker sherry,
    // madeira osv. — de faller til «annet»).
    type:
      product.main_sub_category?.code === "sterkvin_portvin"
        ? "portvin"
        : (TYPE_BY_CATEGORY[product.main_category?.code ?? ""] ?? "annet"),
    pairsWith,
    imageDataUrl: await downloadImage(product.images),
  };
}

function extractProduct(html: string): EmbeddedProduct | null {
  for (const match of html.matchAll(
    /<script type="application\/json">([\s\S]*?)<\/script>/g,
  )) {
    try {
      const data: unknown = JSON.parse(match[1]);
      if (data && typeof data === "object" && "product" in data) {
        return (data as { product: EmbeddedProduct }).product;
      }
    } catch {
      // Ikke gyldig JSON — prøv neste blokk.
    }
  }
  return null;
}

// Lastes ned server-side (CORS stopper klienten) og sendes til skjemaet som
// data-URL, så bildet går gjennom samme opplastingsløype som kamerabilder.
async function downloadImage(
  images: EmbeddedProduct["images"],
): Promise<string | null> {
  const byFormat = (format: string) => images?.find((i) => i.format === format)?.url;
  const url = byFormat("superZoom") ?? byFormat("zoom") ?? byFormat("product");
  if (!url) return null;

  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (vinlager)" } });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${res.headers.get("content-type") ?? "image/jpeg"};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}
