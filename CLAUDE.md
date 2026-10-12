# cursus – Website

Marketing-Website für **cursus**, eine KI-Planungsschicht für die Disposition im Strassengüterverkehr
("die beste nächste Ladung für jeden LKW"). Pre-Launch: Es gibt noch kein Produkt, der Pilot startet
ab Februar 2027. Die Seite soll in Sekunden klar machen, was cursus tut, und zu einem **Erstgespräch**
führen. Vorbild für die Einfachheit: GoStudent. Grundlage für alle Zahlen: das Pitch-Deck (Okt 2026).

Kontext, bisherige Entscheidungen und nächste Schritte stehen in [HANDOVER.md](HANDOVER.md).

## Befehle

```bash
npm install            # einmalig; danach package-lock.json committen
npm run dev            # Dev-Server mit Live-Reload: http://localhost:5173
npm run build          # Produktion nach dist/ (Netlify: netlify.toml ist fertig)
npm run build:artifact # Einzeldatei-Vorschau artifact/cursus.html (für den claude.ai-Livebuild)
npm run typecheck      # tsc --noEmit
npm run map -- <pfad>/ne_50m_admin_0_countries.geojson   # Karte neu erzeugen (selten nötig)
```

Gebaut wird mit **esbuild** über `scripts/build.mjs`, nicht mit Vite. Grund: Der erste Build entstand in
einer Umgebung ohne npm-Zugriff, esbuild war vorhanden und ist für diese Seite völlig ausreichend.
Ein Wechsel auf Vite oder Astro ist möglich, wenn SEO-Prerendering gebraucht wird (siehe offene Punkte).

**Wichtig:** `npm run typecheck` lief in der Build-Umgebung nicht (keine @types/react verfügbar).
Beim ersten Arbeiten am Projekt zuerst `npm install && npm run typecheck` ausführen und eventuelle
Typfehler beheben.

## Zielgruppen und Tonalität

- Primär **Speditionen**, die Subunternehmer-LKW planen (wie der Design-Partner), daneben **Frächter**
  mit eigener Flotte. Die Perspektive bleibt der LKW: "für jeden LKW, den Sie planen – eigene Flotte
  oder Subunternehmer".
- Sprachen: **Deutsch (Standard) und Englisch**. Texte liegen ausschliesslich in `src/i18n/de.ts` und
  `src/i18n/en.ts`; keine Texte hart in Komponenten schreiben. Neue Keys immer in beiden Dateien anlegen
  (`en.ts` ist gegen den Typ von `de.ts` geprüft).
- Deutsch: Kunden werden mit **"Sie"** angesprochen, Schreibweise de-DE/AT mit ß (Zielmarkt AT + DE).
- Kurze, aktive Sätze. Keine Superlative ohne Beleg. Zahlen immer mit Quelle oder als Beispiel markiert.

## Inhaltliche Regeln (nicht ohne Rücksprache ändern)

- **Kein Skyscanner-Vergleich** im Text (Skyscanner verdient an Vermittlung, cursus ausdrücklich nicht).
- **TIMOCOM / Trans.eu** nur als Text, **keine Logos**. Anbindung heisst "beantragt", nie "verbunden".
- **Design-Partner anonym**: "österreichische Spedition, rund 1.000 LKW im Monat". Name "Vertex" nicht
  verwenden, bis er schriftlich freigegeben ist.
- **Keine Listenpreise**. Preise und Pilot-Konditionen gibt es im Erstgespräch.
- Alle Karten- und Ladungsdaten sind **Beispieldaten** und als solche gekennzeichnet.
- Wirtschaftlichkeit konservativ: **1 % weniger Kilometer**, 50 % der Suchzeit, 30 €/h (wie im Deck).
- Datenschutz-Aussagen nur als "geplant" formulieren, solange Hosting und AV-Vertrag nicht stehen.

## Struktur

```
src/
  App.tsx                  Reihenfolge der Sektionen
  i18n/                    de.ts (Quelle + Typ), en.ts, index.tsx (Provider, useI18n, fill)
  components/
    Nav, Hero (+ DispatchCard, AmbientMap), Problem, Compare, HowItWorks,
    PartLoads, Roi, Pilot, Team, Faq, Booking, Footer
    EuropeMap.tsx          SVG-Europakarte mit animiertem viewBox (fitView, Labels ohne Überlappung)
    OptionCard.tsx         Karte für eine gerankte Ladung (Hero + Live-Karte)
    livemap/               LiveMap (4 Szenen), DecideScene (Szene 1 + 2), FleetScene, AlertsScene, RouteLayer
  lib/
    network.ts             Städte, Autobahn-Korridore, Dijkstra, Polylinien, Track (Animation)
    hos.ts                 Lenk- und Ruhezeiten (vereinfacht nach VO (EG) 561/2006)
    loads.ts               Ladungstypen, kuratiertes Lyon-Beispiel, Generator (seeded)
    ranking.ts             Bewertung: Marge = Fracht − 1,50 €/km, Fenster, Zusammenladung, Teilladungen kombinieren
    sim.ts                 Flottensimulation "ohne / mit Cursus" (gleicher Markt, 72 h)
    roi.ts                 Rechner, Formeln 1:1 aus dem Deck (Anhang A)
    lead.ts                Absenden des Buchungsformulars (LEAD_ENDPOINT)
  data/
    cities.json            53 Städte (Name DE/EN, Koordinaten, Hub-Grösse)
    map.generated.ts       vorprojizierte Karte (Natural Earth 1:50m), nicht von Hand ändern
  styles/global.css        Design-Tokens und alle Styles
supabase/                  Migration für Tabelle `leads` + Edge Function `lead` (Speichern + Mail via Resend)
scripts/                   build.mjs (esbuild), build-map.mjs (Karte)
```

## Design-System

- Ein fester Look, kein Dark/Light-Umschalten: **Navy** für Hero, Live-Karte und Buchung, helles
  "Planungsbrett"-Papier für den Rest. Einziger Akzent: **Orange `#ec6a2c`**.
- Tokens stehen oben in `global.css` (`--ink`, `--paper`, `--orange`, …). Keine neuen Farben ohne Token.
- Schriften: **Barlow** (Display, stammt aus Autobahnschildern), **IBM Plex Sans** (Text),
  **IBM Plex Mono** (Daten, Uhrzeiten, Eyebrows). Geladen über Google Fonts.
- Primär-Buttons: Orange mit **dunkler** Schrift (Kontrast). Weisse Schrift auf Orange ist zu schwach.
- Fachdetails sind Gestaltungsmittel: EU-Kennzeichen für LKW-Nummern, Lademeter-Balken (13,6 ldm),
  Lenkzeit, Leer-km gestrichelt, beladen orange.
- Bewegung sparsam und mit `prefers-reduced-motion` abschaltbar; Animationen pausieren ausserhalb
  des Viewports (`useInView`).

## Datenlogik, die stimmen muss

- Das **Lyon-Beispiel** (LKW 14, frei 15:00, 4 h 10 min Lenkzeit) ist kuratiert und deckt sich mit
  Deck und Website-Texten: München 690 km, Marge 412 €; beste Wahl = Basel + Zürich kombiniert
  (12,0 ldm, 674 €); Lebensmittel + Gefahrgut wird abgelehnt. Wer `LYON_LOADS` ändert, prüft auch
  `compare.cursusSteps` in den Texten ("11 Angebote und 3 Kombinationen").
- ROI-Defaults reproduzieren das Deck: Frächter 25 LKW → 60.180 €, Spedition 433 Ladungen → 127.197 €.
- Flottensimulation: Leerfahrt-Anteil ca. 19 % ohne vs. 15 % mit Cursus. Das ist ein Modell, kein
  Versprechen; die Bildunterschrift sagt das und verweist auf die 1-%-Annahme.

## Buchungsformular

Ohne `LEAD_ENDPOINT` läuft das Formular im Vorschau-Modus und sendet nichts (die Bestätigung sagt das).
Produktiv schalten:

1. Supabase-Projekt anlegen, Migration in `supabase/migrations` anwenden.
2. `supabase functions deploy lead --no-verify-jwt`
3. Secrets setzen: `RESEND_API_KEY`, `LEAD_NOTIFY_TO`, `LEAD_FROM` (verifizierte Absender-Domain bei
   Resend), `ALLOWED_ORIGIN` (Website-Domain).
4. In Netlify `LEAD_ENDPOINT=https://<projekt>.supabase.co/functions/v1/lead` setzen und neu bauen.

## Offen vor dem Launch

- [ ] **Impressum und Datenschutzerklärung** (Pflicht in AT, DE, CH; braucht eine Rechtsperson). Links im Footer sind Platzhalter.
- [ ] Domain sichern, Markenname "cursus" prüfen (Kollisionen in Logistik/Software).
- [ ] Team: Namen, Rollen, Fotos (`src/i18n/*` → `team.members`, Fotos nach `public/team/`).
- [ ] Buchungs-Backend deployen (siehe oben); optional Kalender (z. B. Cal.com) statt Wunschterminen.
- [ ] `npm install` + `package-lock.json` committen; `npm run typecheck` grün.
- [ ] OG-Bild (1200×630) und Favicon-Varianten.
- [ ] SEO: Die Seite ist eine Client-SPA. Für gute Indexierung Prerendering ergänzen oder auf Astro
      wechseln (Inhalte liegen schon getrennt in `i18n`, Komponenten können Inseln werden).
- [ ] Analytics ohne Cookies (z. B. Plausible), damit kein Consent-Banner nötig ist.
- [ ] Lighthouse- und Accessibility-Check (Kontraste, Tastatur, Screenreader) auf echtem Gerät.
- [ ] Freigabe Design-Partner für Namensnennung einholen (dann Text in `pilot.partner` anpassen).
