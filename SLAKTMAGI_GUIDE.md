# 🌳 Släktmagi – Kom igång-guide

## Vad är Släktmagi?

Släktmagi är en AI-driven funktion i TextScanner som analyserar dina dagboksinlägg och automatiskt extraherar:
- **Personer** (familjemedlemmar, vänner)
- **Platser** (städer, hem, resmål)
- **Datum** (specifika datum och tidsreferenser)
- **Händelser** (möten, resor, minnen)
- **Relationer** (familjekopplingar som mormor, kusin, farbror)

Resultatet visualiseras i tidslinjer och kan exporteras för backup eller analys.

---

## 🚀 Kom igång på 5 minuter

### Steg 1: Gå till TextScanner
```
https://text-skanner.vercel.app/slaktmagin
```

### Steg 2: Skapa dagboksinlägg
1. Klicka på **"Dagboksscannern"** eller gå till `/dagbok`
2. Skriv 2-3 dagboksinlägg om din familj och vänner

**Exempel på text att skriva:**
```
Idag var en fantastisk dag! Jag och mormor Elsa åkte till Liseberg i Göteborg. 
Vi träffade min kusin Anna där med hennes två barn, Leo och Maya. 
Mormor berättade om när hon träffade morfar Sven på ett tåg till Stockholm 1952.
```

### Steg 3: Extrahera entiteter
1. När du sparat dina inlägg, klicka på **"Extrahera entiteter"**
2. AI:n analyserar din text (tar ca 30 sekunder)
3. Resultatet sparas automatiskt som ett "utkast"

### Steg 4: Utforska ditt Släktmagi
- **Utkast:** `/slaktmagin/utkast` – se alla analyser
- **Tidslinje:** `/slaktmagin/tidslinje` – se kronologisk visualisering
- **Släktträd:** `/slaktmagin/slakttrad` – se relationer (kommer snart)

---

## 🎯 Hur AI:n fungerar

### Vad AI:n letar efter:
- **Personnamn** – Mats, Elsa, Anna, Leo, Maya, etc.
- **Familjerelationer** – mormor, farbror, kusin, make, maka
- **Platser** – Stockholm, Göteborg, Liseberg, hemmet
- **Datum** – "2024-07-15", "i somras", "nästa månad"
- **Händelser** – besök, resor, möten, minnen

### Exempel på resultat:
```json
{
  "persons": [
    {"name": "Mats", "description": "Författaren av dagboken", "confidence": 0.95},
    {"name": "Elsa", "description": "Mormor till Mats", "confidence": 0.95},
    {"name": "Anna", "description": "Kusin till Mats", "confidence": 0.95}
  ],
  "places": [
    {"name": "Liseberg", "description": "En nöjespark i Göteborg", "confidence": 0.9}
  ],
  "relationships": [
    {"person1": "Mats", "person2": "Elsa", "type": "mormor", "confidence": 0.95}
  ]
}
```

---

## 📤 Exportera ditt Släktmagi

### Från Utkast-sidan:
1. Gå till `/slaktmagin/utkast`
2. Klicka på ett utkast för att se detaljer
3. Klicka **"📄 Exportera JSON"**
4. Filen `slaktmagin-YYYY-MM-DD.json` laddas ner

### Från Tidslinje-sidan:
1. Gå till `/slaktmagin/tidslinje`
2. Klicka **"📄 JSON"** för fullständig data
3. Klicka **"📊 CSV"** för Excel-format
4. Filerna laddas ner automatiskt

### Vad du kan göra med exportfilerna:
- **JSON:** Använd för backup, import till andra system
- **CSV:** Öppna i Excel, Google Sheets för analys
- **Delning:** Skicka till familjemedlemmar

---

## 💡 Tips för bästa resultat

### Skriv bra dagboksinlägg:
✅ **Var specifik** – "Mats och mormor Elsa åkte till Liseberg"  
✅ **Använd namn** – "Anna", "Elsa", "Lars" istället för "hon", "han"  
✅ **Inkludera platser** – "Göteborg", "Stockholm", "hemma"  
✅ **Nämn datum** – "2024-07-15", "i somras", "förra veckan"  
✅ **Beskriv relationer** – "min kusin Anna", "mormor Elsa"

### Exempel-text att testa med:
```
Besökte farbror Lars på hans gård utanför Linköping. Han visade gamla foton 
från 1960-talet där jag såg min pappa Erik som liten pojke. Farmor Karin 
fanns med på många bilder, hon dog tyvärr 2018. Min kusin Peter och hans fru 
Maria var också där med sin dotter Emma.
```

---

## 🎨 Vad du får ut

### Visualiseringar:
- **Tidslinje** – Kronologisk ordning av alla händelser
- **Person-lista** – Alla identifierade personer med beskrivningar
- **Plats-karta** – Geografisk översikt av platser
- **Relations-nätverk** – Hur personer är kopplade

### Data:
- **14+ personer** i testexemplet
- **7+ platser** med geografisk kontext
- **6+ datum** med tidsreferenser
- **9+ relationer** (mormor, kusin, farbror, etc.)
- **AI-confidence** – Hur säker AI:n är på varje extrahering

---

## 🌐 Allt är gratis och online

- **Ingen registrering** krävs
- **Ingen installation** – allt i webbläsaren
- **Ingen kostnad** – helt gratis att använda
- **Direkt tillgängligt** – gå bara till länken och börja

---

## 🎉 Börja idag!

**Startlänk:** https://text-skanner.vercel.app/slaktmagin

1. Skriv 2-3 dagboksinlägg om din familj
2. Låt AI:n extrahera entiteter
3. Utforska din visualiserade släkthistoria
4. Exportera resultatet för backup eller delning

**Lycka till med att utforska din släkthistoria med AI!** 🌳✨

---

*Från din vän Mats Hamberg – skapare av TextScanner och Släktmagi*
