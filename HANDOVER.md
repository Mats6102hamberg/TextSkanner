# HANDOVER.md – TextScanner

## Snabbstart för ny utvecklare/AI

### 1. Projektstruktur
```
/Users/admin/TextSkanner/
├── backend/          # Express API (port 4000)
│   ├── src/
│   │   ├── routes/     # API endpoints
│   │   ├── controllers/# Route handlers
│   │   └── services/   # Business logic
│   └── .env.example    # Kopiera till .env
│
├── frontend/         # Next.js 14 (port 3000)
│   ├── src/
│   │   ├── app/        # Next.js App Router
│   │   ├── components/ # React components
│   │   └── features/   # Feature modules
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── .env.example    # Kopiera till .env
│
└── experiments/      # Legacy/test code
```

### 2. Kom igång på 5 minuter

```bash
# 1. Klona (om ny dator)
git clone https://github.com/Mats6102hamberg/TextSkanner.git
cd TextSkanner

# 2. Backend

cd backend
cp .env.example .env
# Fyll i OPENAI_API_KEY, STRIPE keys
npm install
npm run dev

# 3. Frontend (ny terminal)
cd frontend
cp .env.example .env
# Fyll in DATABASE_URL, OPENAI_API_KEY
npm install
npx prisma generate
npm run dev
```

### 3. Viktiga filer att känna till

| Syfte | Fil |
|-------|-----|
| Databasmodeller | `frontend/prisma/schema.prisma` |
| OCR endpoint | `backend/src/routes/ocr.routes.ts` |
| Diary UI | `frontend/src/app/dagbok/page.tsx` |
| Contract UI | `frontend/src/app/avtal/page.tsx` |
| API routes | `frontend/src/app/api/*/route.ts` |

### 4. Arkitektur-beslut

- **Database:** Neon PostgreSQL (alltid behålla!)
- **Frontend:** Next.js 14 App Router
- **Backend:** Express separat (kan slås ihop senare)
- **AI:** OpenAI API (GPT-4.1-mini för avtal)
- **Betaling:** Stripe med webhooks
- **OCR:** Mockad nu → ska bli riktig sen

### 5. Vanliga kommandon

```bash
# Prisma migration
cd frontend && npx prisma migrate dev --name beskrivning

# Stripe webhook test
stripe listen --forward-to localhost:4000/api/stripe/webhook

# Build
npm run build        # i frontend eller backend
```

### 6. Miljövariabler checklist

**Frontend:**
- [ ] `NEXT_PUBLIC_BACKEND_URL`
- [ ] `DATABASE_URL` (Neon Postgres)
- [ ] `OPENAI_API_KEY`

**Backend:**
- [ ] `PORT=4000`
- [ ] `OPENAI_API_KEY`
- [ ] `CONTRACT_ANALYZER_MODEL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### 7. Kända begränsningar

1. OCR är mockad (låtsas-svar)
2. Ingen filuppladdning (endast URL)
3. Ingen auth ännu
4. Släktträdet är ej interaktivt

### 8. Kontakt/GitHub

- **Repo:** https://github.com/Mats6102hamberg/TextSkanner
- **Ägare:** Mats Hamberg (@Mats6102hamberg)
- **Mats pratar svenska** – svara alltid på svenska

---
Skapad: 2026-02-04
