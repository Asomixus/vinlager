# Vinlager 🍷

Mobilvennlig webapp (PWA) for å holde oversikt over det lokale vinlageret.

- **Legg til vin** med bilde av etiketten (kamera på mobil)
- **Oversikt** med søk og filtrering på vintype, «passer til» og hylleplass
- **Ta ut flasker** med ett trykk — antallet telles ned, og tomme viner kan slettes

## Teknologi

Next.js (App Router) + TypeScript + Tailwind, med SQLite (better-sqlite3) som database.
Databasen og etikettbildene lagres under `data/` (kan overstyres med `VINLAGER_DATA_DIR`).

## Kjøring

```bash
npm install
npm run dev        # utvikling på http://localhost:3000
```

Produksjon (f.eks. på hjemmeserver):

```bash
npm run build
npm start          # lytter på port 3000, også på lokalnettet
```

Åpne adressen på mobilen (samme nettverk) og velg «Legg til på startskjermen» for å få den som app.

## Iterasjoner

1. ✅ Legge til vin (med etikettbilde), oversikt, ta ut flasker
2. ⬜ Integrasjon mot [Vinmonopolets API](https://api.vinmonopolet.no/apis) — hente «passer til», pris m.m. (datamodellen har `vinmonopolet_id` klart)
