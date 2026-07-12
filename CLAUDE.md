@AGENTS.md

# Vinlager

Mobilvennlig PWA for å holde oversikt over Auduns lokale vinlager. All kommunikasjon foregår på norsk.

## Status (per 2026-07-12)

**Iterasjon 1 er ferdig, testet og committet:** legge til vin med etikettbilde (kamera på mobil), oversikt med søk/filtrering, ta ut/legge tilbake flasker, slette tomme viner.

**Iterasjon 2 er neste:** integrasjon mot Vinmonopolets API (https://api.vinmonopolet.no/apis) for å hente «passer til», pris og vindetaljer automatisk. Ønsket flyt: ta bilde → søk opp vinen hos Vinmonopolet → fyll feltene automatisk. API-et krever registrering og API-nøkkel — sjekk med Audun om han har skaffet nøkkel. Datamodellen er forberedt med `vinmonopolet_id` (nullable) og `pairs_with`-feltet som API-et kan fylle.

## Arkitektur

Next.js (App Router) + TypeScript + Tailwind 4, SQLite via better-sqlite3 (krever `serverExternalPackages` i next.config.ts).

- `lib/db.ts` — databaseoppsett, skjema og alle SQL-spørringer. DB og bilder under `data/` (gitignorert, overstyres med `VINLAGER_DATA_DIR`)
- `lib/actions.ts` — server actions: `addWine` (multipart med bilde), `takeOut`, `putBack`, `removeWine`
- `lib/types.ts` — `Wine`-typen, `WINE_TYPES`, `TYPE_LABELS`. Klientkomponenter må importere herfra, ALDRI fra `lib/db.ts` (drar inn better-sqlite3/node:fs og knekker bygget)
- `app/page.tsx` — forsiden (server component, `force-dynamic`) + `app/components/WineList.tsx` (klient: søk, filter, ta ut/slett)
- `app/ny/page.tsx` + `app/components/WineForm.tsx` — skjema med kamerainput (`<input type="file" capture="environment">`)
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
