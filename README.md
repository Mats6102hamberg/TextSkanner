# TextSkanner / Dagboksskanner 📘

En robust fullstack-app för att skanna dagboks-sidor (handskriven text) och göra dem digitala.

Appen är uppdelad i:

- **backend/** – Express + TypeScript, robust struktur, API för OCR (`/api/ocr`)
- **frontend/** – Next.js 14 + TypeScript, enkel UI för att skicka bilder/URL:er till backend

Just nu använder backend en **mockad OCR** (låtsas-svar) så att struktur, API och frontend kan testas utan extern OCR-tjänst. Senare kan riktig OCR kopplas på (t.ex. Gemini, Tesseract, etc).

---

## Struktur

```txt
TextSkanner/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       ├── routes/
│       │   ├── index.ts
│       │   └── ocr.routes.ts
│       ├── controllers/
│       │   ├── health.controller.ts
│       │   └── ocr.controller.ts
│       └── middleware/
│           ├── errorHandler.ts
│           └── notFound.ts
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── page.tsx          # startsida
        │   └── diary/
        │       └── page.tsx      # Dagboksskanner-sida
        ├── services/
        │   ├── apiClient.ts
        │   └── ocrApi.ts
        └── features/
            └── diary/
                └── DiaryScanner.tsx
```

## Kom igång

1. **Klona repot**
   ```bash
   git clone https://github.com/Mats6102hamberg/TextSkanner.git
   cd TextSkanner
   ```

2. **Starta backend**
   ```bash
   cd backend
   cp .env.example .env   # eller skapa .env manuellt
   npm install
   npm run dev
   ```

   Backend kör nu på:
   - http://localhost:4000
   - Healthcheck: http://localhost:4000/api/health
   - OCR-endpoint (mock): POST http://localhost:4000/api/ocr

3. **Starta frontend**
   Öppna en ny terminal:
   ```bash
   cd TextSkanner/frontend
   npm install
   npm run dev
   ```

   Next.js startar t.ex. på:
   - http://localhost:3000 eller http://localhost:3001 (om 3000 är upptagen)

## Användning

- **Startsida:**
  - http://localhost:3000 (eller 3001) visar en enkel välkomstsida.
- **Dagboksskanner:**
  - http://localhost:3000/diary (eller 3001/diary)
  - Här kan du:
    - Ladda upp en bild av en dagbokssida
    - Klicka på "Kör OCR"
    - Frontend anropar `/api/ocr` i backend
    - Backend svarar med mockad OCR-text:
      ```json
      {
        "text": "Det här är en test-text från OCR-mock...",
        "source": "imageUrl",
        "confidence": 0.42
      }
      ```

Senare kan denna mock ersättas med riktig OCR.

## Avtals- och dokumentanalys (Pro)

- Backend exponerar ett API `POST /contracts/analyze` som använder en LLM (OpenAI) för att ge en teknisk, automatisk analys av uppladdad avtalstext.
- Funktionen sammanfattar avtalet på flera nivåer, pekar ut riskområden och markerar viktiga sektioner, men **är inte juridisk rådgivning**.
- Resultatet returneras som strukturerad JSON enligt `ContractAnalysisResult`-typen.

## Stripe Webhook-mottagare

Backend har stöd för att ta emot och bearbeta Stripe webhooks för betalningar och prenumerationer.

### Funktioner

- **Signaturverifiering** – Alla webhooks verifieras automatiskt med Stripe webhook secret
- **Händelsetyper som hanteras:**
  - `payment_intent.succeeded` – Lyckad betalning
  - `payment_intent.payment_failed` – Misslyckad betalning
  - `checkout.session.completed` – Checkout-session klar
  - `customer.subscription.created` – Prenumeration skapad
  - `customer.subscription.updated` – Prenumeration uppdaterad
  - `customer.subscription.deleted` – Prenumeration avslutad
  - `invoice.paid` – Faktura betald
  - `invoice.payment_failed` – Faktura ej betald

### Endpoint

```
POST http://localhost:4000/api/stripe/webhook
```

### Konfiguration i Stripe Dashboard

1. Gå till **Developers** → **Webhooks**
2. Klicka på **Add endpoint**
3. Lägg till URL: `https://your-domain.com/api/stripe/webhook`
4. Välj events att lyssna på (se lista ovan)
5. Kopiera **Signing secret** (börjar med `whsec_`)
6. Lägg till i `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_din_webhook_secret
   ```

### Testa lokalt med Stripe CLI

```bash
# Installera Stripe CLI
brew install stripe/stripe-cli/stripe

# Logga in
stripe login

# Vidarebefordra webhooks till lokal server
stripe listen --forward-to localhost:4000/api/stripe/webhook

# Skicka test-event
stripe trigger payment_intent.succeeded
```

### Miljövariabler

Backend kräver följande nycklar (se `backend/.env.example`):

```
PORT=4000
OPENAI_API_KEY=sk-din-nyckel
CONTRACT_ANALYZER_MODEL=gpt-4.1-mini

# Stripe
STRIPE_SECRET_KEY=sk_test_din_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_din_webhook_secret
```

Frontend behöver motsvarande `NEXT_PUBLIC_BACKEND_URL` och `OPENAI_API_KEY` om du använder de inbyggda Next-rutterna (se `frontend/.env.example`).

### Testa kontraktsanalysen via curl

```bash
curl -X POST http://localhost:4000/api/contracts/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "KLISTRA_IN_EN_TESTAVTALSTEXT_HÄR",
    "language": "sv"
  }'
```

API:t svarar med ett JSON-objekt som innehåller `overallRisk`, `summaries`, `sections` och detekterade parter/datum/belopp.

## Teknikstack

**Backend**
- Node.js + TypeScript
- Express
- Zod (validering)
- CORS, .env, tydlig felhantering

**Frontend**
- Next.js 14 (App-router)
- React 18
- TypeScript
- Enkel service-lager (`apiClient.ts`, `ocrApi.ts`)

## Nästa steg / TODO

- [ ] Koppla riktig OCR-motor (t.ex. AI-tjänst eller Tesseract)
- [ ] Stöd för filuppladdning (inte bara bild-URL)
- [ ] Förbättrat UI (layout, responsiv design, styling)
- [ ] Spara OCR-resultat lokalt eller i databas (om juridik tillåter)
- [ ] Exportera dagbokstext till PDF/Word

## Licens

Den här koden är licensierad under MIT-licensen. Se `LICENSE` för detaljer.
