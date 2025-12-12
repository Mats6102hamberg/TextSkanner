# Database Setup för TextSkanner

## Problem
Vi behöver PostgreSQL för att köra Prisma migrations och testa `/api/diary/save`.

## Lösningar

### Option 1: Vercel Postgres (Rekommenderat för produktion)
1. Gå till Vercel Dashboard → Storage → Create Database → Postgres
2. Kopiera `DATABASE_URL` från "Connection String"
3. Lägg till i `frontend/.env`:
   ```
   DATABASE_URL="postgres://default:xxx@xxx.vercel-storage.com:5432/verceldb"
   ```
4. Kör migrations:
   ```bash
   cd frontend
   npx prisma migrate deploy
   ```

### Option 2: Neon.tech (Gratis serverless PostgreSQL)
1. Gå till https://neon.tech
2. Skapa gratis konto
3. Skapa nytt projekt
4. Kopiera connection string
5. Lägg till i `frontend/.env`:
   ```
   DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
6. Kör migrations:
   ```bash
   cd frontend
   npx prisma migrate dev --name add_diary_mood_and_metadata
   ```

### Option 3: Supabase (Gratis PostgreSQL med UI)
1. Gå till https://supabase.com
2. Skapa nytt projekt
3. Gå till Settings → Database → Connection string (Transaction mode)
4. Lägg till i `frontend/.env`:
   ```
   DATABASE_URL="postgresql://postgres.xxx:pass@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
   ```
5. Kör migrations:
   ```bash
   cd frontend
   npx prisma migrate dev --name add_diary_mood_and_metadata
   ```

### Option 4: Lokal PostgreSQL med Docker
```bash
cd frontend
docker-compose up -d
npx prisma migrate dev --name add_diary_mood_and_metadata
```

## Migration som behöver köras

Filen `prisma/schema.prisma` innehåller nu:
- `clarifiedText String?`
- `storyText String?`
- `entryDate DateTime?`
- `detectedMood String?`
- `moodScore Float?`
- `tags String[]`
- `summary String?`
- `updatedAt DateTime @updatedAt`

När du kör `npx prisma migrate dev`, skapas en ny migration som lägger till dessa kolumner i DiaryEntry-tabellen.

## Verifiering

Efter migrations, testa:
```bash
# POST
curl -X POST http://localhost:3000/api/diary/save \
  -H "Content-Type: application/json" \
  -d '{"originalText":"Test","detectedMood":"glad","moodScore":0.75}'

# GET
curl http://localhost:3000/api/diary/save
```

Förväntat resultat: 200 OK
