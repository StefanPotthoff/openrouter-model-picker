# OpenRouter Model Picker

Lokale Webanwendung zum Vergleichen von OpenRouter-Modellen anhand **aktueller Preise** und **Benchmark-Werten**.
Keine Datenbank, keine Benutzerverwaltung, keine Authentifizierung – die Daten kommen live von OpenRouter.

## Architektur

```
React + TypeScript (Vite)  --GET /api/models-->  ASP.NET Core Minimal API  --GET /api/v1/models-->  OpenRouter
```

* Der OpenRouter-API-Key liegt **ausschließlich** im Backend (optional, siehe unten) – der Browser sieht ihn nie.
* Es gibt **keine Datenbank und keine statischen Modelldaten**; das Backend hält die Antwort nur 60 Sekunden im Speicher.

## Voraussetzungen

* .NET SDK 10 (getestet mit 10.0.400)
* Node.js 20+ (getestet mit 24.21.0)

## Start (2 Schritte)

```powershell
# Terminal 1 – Backend (http://localhost:5080)
dotnet run --project backend/OpenRouterModelPicker.Api

# Terminal 2 – Frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Danach <http://localhost:5173> im Browser öffnen. Alternativ startet `./start.ps1` beides auf einmal
(Backend in neuem Fenster, danach Frontend-Dev-Server).

### Variante mit einem Prozess/Port

```powershell
cd frontend
npm run build          # schreibt nach backend/OpenRouterModelPicker.Api/wwwroot
cd ..
dotnet run --project backend/OpenRouterModelPicker.Api
```

Das Backend erkennt den Ordner `wwwroot` automatisch und liefert das gebaute Frontend unter
<http://localhost:5080> aus.

## API-Endpunkte

| Endpunkt | Beschreibung |
| --- | --- |
| `GET /api/models?refresh=false` | Alle verfügbaren Modelle mit Preisen, Context Length und Benchmark-Werten |
| `GET /api/benchmarks?refresh=false` | Nur Modelle, für die mindestens ein Benchmark-Wert existiert |
| `GET /api/health` | Erreichbarkeitsprüfung |

Mit `?refresh=true` wird der 60-Sekunden-Cache des Backends umgangen (das nutzt der Button **Aktualisieren** im Frontend).

Beispielantwort (gekürzt):

```json
{
  "models": [
    {
      "id": "anthropic/claude-sonnet-5.5",
      "name": "Anthropic: Claude Sonnet 5.5",
      "author": "anthropic",
      "contextLength": 1000000,
      "inputPricePerMillion": 2,
      "outputPricePerMillion": 10,
      "coding": null,
      "agentic": null,
      "intelligence": 56,
      "isVariant": false,
      "variantSuffix": null,
      "isFree": false,
      "hasPricing": true,
      "openRouterUrl": "https://openrouter.ai/anthropic/claude-sonnet-5.5"
    }
  ],
  "totalCount": 464,
  "benchmarkCount": 193,
  "fetchedAt": "2026-09-30T06:07:32.2371327+00:00"
}
```

## Konfiguration

`backend/OpenRouterModelPicker.Api/appsettings.json`:

```json
{
  "OpenRouter": {
    "BaseUrl": "https://openrouter.ai/api/v1/",
    "ApiKey": "",
    "CacheSeconds": 60
  }
}
```

* **Der API-Key ist optional.** `GET /api/v1/models` ist öffentlich; ein Key erhöht nur die Rate Limits.
  Der Key kann per Environment Variable `OPENROUTER_API_KEY` oder über `OpenRouter:ApiKey` gesetzt werden
  und wird ausschließlich serverseitig verwendet.
* `CacheSeconds` verhindert, dass das Frontend OpenRouter bei jedem Klick auf „Aktualisieren" direkt trifft.

## Funktionen im Frontend

* Tabelle aller Modelle, Spalten: Modell, Input $/1M, Output $/1M, Coding, Agentic, Intelligence, Context Length, **Kosten für Aufgabe**
* Sortierung per Klick auf jeden Spaltenkopf (fehlende Werte stehen immer am Ende)
* Filter (alle Angaben Min/Max-Bereiche, beliebig kombinierbar – jedes gesetzte Feld schränkt weiter ein):
  * Modellname/Slug sowie „Nur Modelle mit Benchmark-Werten" und „Varianten und Router-Modelle anzeigen"
  * Auf-/zuklappbarer Bereich **Erweitert** mit:
    * Preise: Input-Preis und Output-Preis in $ pro 1M Tokens (jeweils Min und Max)
    * Benchmarks: Coding, Agentic, Intelligence (jeweils Min und Max)
    * Context Length in Tokens (Min und Max)
  * „Erweitert" ist zugeklappt und öffnet sich automatisch, sobald dort ein Filter gesetzt wird;
    ein Badge an der Überschrift zeigt die Anzahl der aktiven Filter darin
  * Leere Felder bedeuten „nicht einschränken"; jedes Min/Max-Paar lässt sich einzeln zurücksetzen
* Kostenrechner: Input-Tokens (Standard 100.000) und Output-Tokens (Standard 20.000) –
  die Kostenspalte und der Vergleich „günstigstes/teuerstes Modell" rechnen live mit
* Button **Aktualisieren** lädt die Daten neu und zeigt „Stand …" an

## Datenquelle (geprüft am 30.09.2026)

* `GET https://openrouter.ai/api/v1/models?limit=1000` – ohne Auth-Header erreichbar, lieferte 464 Modelle.
* Preise stehen als String in **USD pro Token** (`"prompt": "0.000002"`), das Backend rechnet auf **USD pro 1 Mio. Tokens** um.
  Bei Router-Modellen liefert OpenRouter `-1` – das wird zu `null` (Anzeige „n/a") und `hasPricing: false`.
* Benchmark-Werte stecken im Feld `benchmarks.artificial_analysis` (`intelligence_index`, `coding_index`, `agentic_index`).
  Die Werte sind einzeln `null`, Modelle ohne Daten haben kein `benchmarks`-Objekt → alles wird nullable verarbeitet.
  Ein separater `GET /api/v1/benchmarks` existiert ebenfalls, verlangt aber einen API-Key; deshalb wird er nicht verwendet.
* Katalog-Varianten (`:free`, `:batch`) sind eigene Einträge mit eigenem Preis/Kontext; sie sind im Frontend
  standardmäßig ausgeblendet und werden als Badge gekennzeichnet.

## Projektstruktur

```
backend/OpenRouterModelPicker.Api/
  Program.cs                     Minimal-API-Endpunkte, DI, CORS
  Contracts/ModelInfoDto.cs      Antwort-DTOs für das Frontend
  OpenRouter/OpenRouterModels.cs Deserialisierung der OpenRouter-Antwort
  OpenRouter/OpenRouterClient.cs Abruf, Mapping, Kurzzeit-Cache
  OpenRouter/OpenRouterOptions.cs Konfiguration
frontend/
  src/App.tsx                    Zustand (Filter, Sortierung, Kosteneingaben)
  src/modelLogic.ts              Filter, Sortierung, Kostenberechnung (pure Funktionen)
  src/components/                Filters, CostCalculator, ModelTable
  src/format.ts                  Anzeigeformatierung (en-US, damit Preise eindeutig sind)
  checks/logic-check.mts         Konsolen-Checks für Kostenrechner, Filter und Sortierung
```

## Logik-Checks

```powershell
cd frontend
npm run check          # prüft Kostenrechner, Filter, Sortierung und Formatierung
```

Node führt die TypeScript-Datei direkt aus (Type Stripping) – dafür ist kein Test-Framework nötig.

## Hinweise / Grenzen

* Für viele Modelle liefert OpenRouter keinen Coding-/Agentic-Wert; diese Zeilen fehlen bei gesetzten
  Mindestfiltern und stehen bei Sortierung am Ende.
* Die Beispielwerte „Coding 84 / Agentic 93" aus der Aufgabenstellung sind reine Beispiele: die realen
  Wertebereiche liegen aktuell bei Coding 2,7–81,6, Agentic 0,1–57,9 und Intelligence 3,8–57,6.
* Preise und Benchmarks ändern sich laufend; verbindlich sind die Werte der OpenRouter-API zum Abrufzeitpunkt.
