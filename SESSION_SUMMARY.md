# SESSION_SUMMARY.md – TextScanner

## Projektöversikt
TextScanner är en fullstack-applikation för att skanna och bearbeta text från bilder. Tre huvudprodukter:
1. **Dagboksscannern** – OCR, spara dagboksinlägg, Minnesbok, SläktMagi
2. **Avtalsscannern** – Tolka avtal, flagga risker
3. **Maskeringsverktyget** – Maskera PII (personnummer, e-post, telefon)

## Teknisk Stack

### Frontend
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL (Neon)
- lucide-react, zod

### Backend
- Node.js + Express + TypeScript
- OpenAI API
- Stripe (betalningar)
- Zod (validering)
- Jest (testning)

## Filstruktur

### Backend (`/backend`)
```
src/
  server.ts, app.ts
  routes/ – ocr, contracts, masking, stripe, language
  controllers/ – health, ocr, stripe, language
  services/ – contractAnalyzer, llmAdapter, masking, languageProcessor
  middleware/ – errorHandler, notFound
```

### Frontend (`/frontend`)
```
src/
  app/ – Next.js routes
    dagbok/ – Diary scanner + historik
    avtal/ – Contract analyzer
    maskering/ – PII masking
    minnesbok/ – Memory books
    slaktmagin/ – Family tree/timeline
    api/ – Next.js API routes
  components/ – UI components
  features/ – diary/, contracts/
```

## Databas Schema (Prisma)

### Models
- **DiaryEntry** – dagboksinlägg (text, imageUrl, mood, tags, summary)
- **ContractDocument** – avtalsråtext
- **ContractAnalysis** – AI-analysresultat
- **MemoryBookChapter** – minnesbokskapitel
- **FamilyEntityDraft** – släktdata (personer, platser, händelser)

## Miljövariabler

### Frontend (.env)
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
```

### Backend (.env)
```
PORT=4000
OPENAI_API_KEY=sk-...
CONTRACT_ANALYZER_MODEL=gpt-4.1-mini
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## API Routes

### Backend (localhost:4000)
- `GET /api/health` – Healthcheck
- `POST /api/ocr` – OCR + mock/AI
- `POST /api/masking/process` – Maskera PII
- `POST /api/contracts/analyze` – Analysera avtal
- `POST /api/stripe/webhook` – Stripe webhooks

### Frontend API (Next.js)
- `POST/GET /api/diary/save` – Spara/hämta dagbok
- `POST/GET /api/memorybook/chapters` – Minnesbok
- `POST /api/family/extract-entities` – Släktdata
- `POST /api/contracts/analyze` – Avtalsanalys
- `POST /api/mask` – Maskering

## GitHub & Deployment

- **GitHub:** https://github.com/Mats6102hamberg/TextSkanner
- **Lokal path:** `/Users/admin/TextSkanner`
- **Deployment:** Vercel (frontend + backend)

## Nästa steg / TODO
1. Koppla riktig OCR-motor (Gemini/Tesseract)
2. Filuppladdning (inte bara URL)
3. PDF/Word-export
4. GEDCOM-export för släktdata
5. Interaktivt släktträd

## Kommandon

```bash
# Starta backend
cd backend && npm install && npm run dev

# Starta frontend
cd frontend && npm install && npm run dev

# Prisma (frontend)
cd frontend && npx prisma generate

# Stripe CLI test
stripe listen --forward-to localhost:4000/api/stripe/webhook
```

## Status
- Backend mock-OCR fungerar
- Frontend UI komplett
- Databasmodeller klara
- Stripe webhook implementerad
- PII-maskering fungerar
- **Vercel deployment fungerar** (fixat 2026-02-04)

## Vercel Deployment Fix (2026-02-04)

### Problem
Sidan visade 404 på Vercel trots att bygget lyckades.

### Orsaker
1. **Saknade miljövariabler** i Vercel (OPENAI_API_KEY, DATABASE_URL)
2. **Root Directory** var inte konfigurerat till `frontend`

### Lösning
1. Lade till miljövariabler via Vercel CLI:
   ```bash
   vercel env add OPENAI_API_KEY production
   vercel env add DATABASE_URL production
   ```
2. Konfigurerade Root Directory i Vercel Dashboard:
   - Settings → General → Root Directory → `frontend`
3. La till `frontend/src/app/not-found.tsx` för bättre 404-hantering
4. Flyttade `vercel.json` till `frontend/`

### Vercel-inställningar
- **Root Directory:** `frontend`
- **Framework:** Next.js (auto-detected)
- **Build Command:** `next build`
- **Environment Variables:** OPENAI_API_KEY, DATABASE_URL

Senast uppdaterad: 2026-02-04
