# Vinlager 🍷

Mobilvennlig webapp (PWA) for å holde oversikt over det lokale vinlageret.

- **Legg til vin** med bilde av etiketten (kamera på mobil) — bildet komprimeres automatisk i nettleseren før opplasting
- **Varenummer** fra Vinmonopolet kan registreres — kortet får da en lenke som åpner vinen på vinmonopolet.no
- **«Passer til»** velges som tags fra en fast liste (lyst kjøtt, storfe, fisk, skalldyr m.fl.) så dataene holder seg konsistente
- **Oversikt** med søk (navn, tags, varenummer) og filtrering på vintype
- **Ta ut flasker** med ett trykk — antallet telles ned, og tomme viner kan slettes
- **Rediger** en vin via ✏️ på kortet — alle felter, inkludert antall og nytt etikettbilde

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
2. ✅ Varenummer med søkelenke til vinmonopolet.no, «passer til» som tags, redigering av vin
3. ⬜ Eventuelt: integrasjon mot [Vinmonopolets API](https://api.vinmonopolet.no/apis) — hente pris og detaljer automatisk fra varenummeret (krever API-nøkkel)
