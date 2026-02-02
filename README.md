# 🎯 DAZN Bet - Weekly Trading Report Dashboard

Dashboard per il report settimanale di DAZN Bet Italia.

![DAZN Bet](https://img.shields.io/badge/DAZN-BET-E3FF00?style=for-the-badge&logo=dazn&logoColor=black)

## 🚀 Quick Start

### 1. Deploy su Vercel (2 minuti)

1. **Fork/Push su GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TUO-USERNAME/daznbet-dashboard.git
   git push -u origin main
   ```

2. **Collega a Vercel**
   - Vai su [vercel.com](https://vercel.com)
   - Clicca "Add New Project"
   - Importa il repository da GitHub
   - Clicca "Deploy"

**🎉 Done! La dashboard funzionerà con localStorage (senza database)**

---

## 🗄️ Setup Database (Opzionale)

Per salvare i dati in modo permanente, configura Supabase:

### Step 1: Crea progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea account gratuito
2. Clicca "New Project"
3. Scegli un nome (es. `daznbet-dashboard`)
4. Genera una password per il database
5. Seleziona la regione più vicina (es. Frankfurt)
6. Attendi 2 minuti per la creazione

### Step 2: Crea la tabella

1. Nel progetto Supabase, vai su **SQL Editor**
2. Clicca "New Query"
3. Incolla questo SQL:

```sql
-- Crea tabella per i dati settimanali
CREATE TABLE weeks_data (
  id BIGSERIAL PRIMARY KEY,
  week_number INTEGER UNIQUE NOT NULL,
  date_range TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per ricerche veloci
CREATE INDEX idx_weeks_data_week_number ON weeks_data(week_number);

-- Abilita Row Level Security
ALTER TABLE weeks_data ENABLE ROW LEVEL SECURITY;

-- Policy per permettere tutte le operazioni (per semplicità)
CREATE POLICY "Allow all operations" ON weeks_data
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Clicca "Run" (o Ctrl+Enter)

### Step 3: Ottieni le chiavi API

1. Vai su **Settings** → **API**
2. Copia:
   - **Project URL** (es. `https://xxxx.supabase.co`)
   - **anon public** key

### Step 4: Configura Vercel

1. Vai sul tuo progetto Vercel
2. **Settings** → **Environment Variables**
3. Aggiungi:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` (la chiave anon) |

4. **Redeploy** il progetto (Settings → Deployments → Redeploy)

**✅ Fatto! I dati saranno salvati nel database.**

---

## 📁 File Excel Richiesti (10 file)

Per caricare una settimana servono questi 10 file dal Back Office:

| File | Percorso BO |
|------|-------------|
| `Anagrafica.xlsx` | Modifica Conto Telematico → Ricerca Avanzata → Ricerca anagrafica |
| `Anagrafica2.xlsx` | Statistica Conti |
| `Anagrafica_TOTAL.xlsx` | Stats Multilivello → tutti i prodotti → GRID senza selezioni |
| `Anagrafica_CATEGORIA.xlsx` | Stats Multilivello → tutti i prodotti → GRID Categoria |
| `Anagrafica_DAZNBET.xlsx` | Stats Multilivello → DAZNBET SKIN → GRID senza selezioni |
| `Anagrafica_ORGANIC.xlsx` | Stats Multilivello → DAZNBET SKIN, PV: www.daznbet.it → GRID Categoria |
| `Anagrafica_ORGANIC_TOTAL.xlsx` | Stats Multilivello → DAZNBET SKIN, PV: www.daznbet.it → GRID senza selezioni |
| `Anagrafica_SKIN.xlsx` | Stats Multilivello → tutti i prodotti → GRID SKIN e Categoria |
| `Anagrafica_SKIN_TOTAL.xlsx` | Stats Multilivello → tutti i prodotti → GRID SKIN |
| `Anagrafica_ACCADEMY_TOTAL.xlsx` | Stats Multilivello → VIVABET SKIN, Promoter: Academy → GRID senza selezioni |

---

## 🎨 Funzionalità

### 📊 Weekly Report
- Trading Summary con KPIs
- Acquisition & Daily Trend
- Quality Acquisition per Channel
- Performance by Channel
- Performance by Product
- Financial Health
- Deep Dive (ultime 5 settimane)

### 📅 Monthly Summary
- Totali aggregati
- Grafici trend settimanali
- Tabella comparativa

### ⚙️ Admin / Upload
- Upload 10 file Excel per settimana
- Gestione settimane caricate
- Istruzioni percorsi BO

---

## 🛠️ Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Avvia server sviluppo
npm run dev

# Build produzione
npm run build
```

---

## 📝 Note

- I dati sono processati client-side (nessun dato sensibile sul server)
- Il database salva solo i dati aggregati, non i file Excel originali
- Senza database, i dati sono salvati nel browser (localStorage)

---

## 🤝 Supporto

Per problemi o richieste, contatta il team di sviluppo.

---

Made with 💛 for DAZN Bet Italy
