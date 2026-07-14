@AGENTS.md

# Vinlager

Mobilvennlig PWA for å holde oversikt over Auduns lokale vinlager. All kommunikasjon foregår på norsk.

## Status (per 2026-07-13)

**Iterasjon 1, 2 og 3 er ferdige, testet og committet.** Funksjonalitet: legge til vin med etikettbilde (kamera på mobil), oversikt med søk/filtrering, ta ut/legge tilbake flasker, slette tomme viner, redigere vin (✏️ på kortet → `/rediger/[id]`, samme skjema forhåndsutfylt), varenummer med lenke til `https://www.vinmonopolet.no/search?q=<varenummer>` (åpnes i ny fane), «passer til» som faste tags.

**Bildekomprimering (2026-07-12):** Kamerabilder på flere MB ga 413 mot server actions. `WineForm.tsx` komprimerer nå bildet på klienten før innsending (`compressPhoto`: canvas, maks 1600 px, JPEG 0.8 — gir typisk 200–500 KB; alle lagrede bilder heter `<uuid>.jpg`). `bodySizeLimit` er hevet til 3 MB i `next.config.ts` (under `experimental.serverActions`) som margin. Verifisert med ekte kamerabilde: 380 KB lagret.

**Bevisste datamodell-valg:** `producer` og `location` (hylleplass) er FJERNET — produsent kan stå i navnet. `pairs_with` er ikke fritekst lenger, men kommaseparerte tags fra `PAIRS_WITH_TAGS` i `lib/types.ts` (frittstående, lyst kjøtt, storfe, svin, lam, vilt, fisk, skalldyr, ost, vegetar, dessert); `addWine`/`updateWine` forkaster ukjente tags. Skjemaendringer håndteres med drop-migreringer ved oppstart i `lib/db.ts` (mønster: sjekk `pragma_table_info`, kjør `ALTER TABLE ... DROP COLUMN`). Vintypen «sterkvin» ble fjernet 2026-07-14 (erstattet av «portvin»); eksisterende rader migreres til «annet» ved oppstart.

**Vinmonopolet-oppslag (iterasjon 3, 2026-07-13):** 🍷-knapp ved varenummer-feltet fyller ut navn, årgang, type, «passer til» og etikettbilde. Løst UTEN det offisielle API-et (ingen nøkkel trengs): `lib/vinmonopolet.ts` henter produktsiden `vinmonopolet.no/p/<varenummer>` og parser JSON-en i `<script type="application/json">`-blokken med `product`-nøkkel. Der ligger alt: `year`, `content.isGoodFor` (kodene A–R mappes til våre tags i `PAIRS_WITH_BY_CODE`; f.eks. A=Aperitiff→frittstående, R=Grønnsaker→vegetar), `main_category.code` (mappes i `TYPE_BY_CATEGORY`; ukjente kategorier→annet, men `main_sub_category.code` `sterkvin_portvin`→portvin — resten av sterkvin-kategorien (sherry, madeira, vermut) blir annet) og bilde-URL-er (`bilder.vinmonopolet.no/cache/<størrelse>/<varenummer>-1.jpg`). Årgangen strippes fra slutten av navnet siden vi har eget felt. Bildet lastes ned server-side (CORS) og returneres som data-URL; klienten gjør det om til `File` så det går gjennom samme opplastingsløype som kamerabilder. Uoffisiell kilde — alle feil ender som `null`/«Fant ikke varen», aldri krasj. Søke-API-et (`/vmpws/v2/vmp/products/search?q=`) finnes også, men mangler årgang og «passer til». Det offisielle API-et (`VINMONOPOLET_API_KEY` i env-filen) er dermed ikke i bruk.

## Arkitektur

Next.js (App Router) + TypeScript + Tailwind 4, SQLite via better-sqlite3 (krever `serverExternalPackages` i next.config.ts).

- `lib/db.ts` — databaseoppsett, skjema, drop-migreringer og alle SQL-spørringer. DB og bilder under `data/` (gitignorert, overstyres med `VINLAGER_DATA_DIR`)
- `lib/actions.ts` — server actions: `addWine`/`updateWine` (multipart med bilde, delt parsing i `parseWineFields`/`savePhoto`; nytt bilde ved redigering sletter det gamle fra disk), `takeOut`, `putBack`, `removeWine`, `lookupVinmonopolet` (wrapper rundt `lib/vinmonopolet.ts`, svelger alle feil til `null`)
- `lib/vinmonopolet.ts` — scraper Vinmonopolets produktside og mapper til `VinmonopoletInfo` (se Status)
- `lib/types.ts` — `Wine`-typen, `WINE_TYPES`, `TYPE_LABELS`, `PAIRS_WITH_TAGS`. Klientkomponenter må importere herfra, ALDRI fra `lib/db.ts` (drar inn better-sqlite3/node:fs og knekker bygget)
- `app/page.tsx` — forsiden (server component, `force-dynamic`) + `app/components/WineList.tsx` (klient: søk, filter, ta ut/slett, rediger-lenke, Vinmonopolet-lenke)
- `app/ny/page.tsx` og `app/rediger/[id]/page.tsx` (`params` er en Promise som må awaites) + `app/components/WineForm.tsx` — delt skjema; `wine`-prop = redigeringsmodus. Kamerainput (`<input type="file" capture="environment">`) med klientside-komprimering før opplasting, «passer til» som checkbox-chips (`peer-checked`-styling)
- `app/api/images/[name]/route.ts` — serverer etikettbilder fra `data/images/` (path traversal-sikret med `path.basename`)
- `app/manifest.ts` + `public/icon.svg` — PWA-manifest for «legg til på hjemskjerm»

Uttak dekrementerer `quantity`; ved 0 vises vinen som «Utsolgt» bak et «Vis tomme»-filter der den kan slettes helt (sletter også bildet fra disk) eller økes igjen.

## Kommandoer

- `make build` / `make run` — bygg og start produksjonsserver (port 3000)
- `make dev` — utviklingsserver

## Hemmeligheter

API-nøkler o.l. ligger i `~/.config/vinlager/env` (chmod 600, utenfor repoet) og lastes som miljøvariabler av `make run`/`make dev`. Filen er deny-listet for Claude i `.claude/settings.json` — ikke forsøk å lese den, og be Audun redigere den selv (f.eks. `nano ~/.config/vinlager/env`). Per nå inneholder den `VINMONOPOLET_API_KEY` (placeholder til Audun har skaffet nøkkel).

## Testing av server actions via curl

Action-ID-er ligger i `.next/server/server-reference-manifest.json`. Enkleste vei er MPA-formatet: POST vanlige skjemafelter pluss et tomt felt `$ACTION_ID_<hash>` til siden som bruker action-en (gir 303 ved suksess). Flight-formatet (`Next-Action`-header) funker for actions uten FormData: `-H "Next-Action: <hash>" -H "Content-Type: text/plain" --data '[<args>]'`.

## Hosting og tilgang

Kjører på hjemme-PC-en, startes **manuelt** med `make run` — ingen autostart, ingen skyhosting, ingen passordbeskyttelse (bevisst valg: kun tilgang via hjemme-wifi). Mobilen når appen på `Network:`-adressen som printes ved oppstart (sist `http://192.168.68.64:3000`; IP-en er DHCP og kan endre seg).

**NordVPN-fallgruve:** VPN blokkerer LAN-trafikk som standard. På Linux-PC-en er det løst (`nordvpn set lan-discovery on`). På iPhonen er LAN-tilgang gjennom NordVPN i praksis ødelagt (bekreftet empirisk + NordVPNs egen dok); løsningen er hjemme-wifi som *trusted network* under Auto-connect i NordVPN-appen, så VPN pauser automatisk hjemme. Ikke bruk mer tid på Local Network Discovery-toggelen på iOS — den ga i verste fall ødelagt nett som krevde omstart av telefonen.
