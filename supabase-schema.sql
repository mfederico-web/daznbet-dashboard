-- ═══════════════════════════════════════════════════════════════════════════════
-- DAZN BET DASHBOARD - SUPABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- Esegui questo script nel SQL Editor di Supabase per creare la tabella
-- necessaria per salvare i dati delle settimane.
--
-- 1. Vai su https://app.supabase.com
-- 2. Apri il tuo progetto
-- 3. Vai su "SQL Editor" nel menu a sinistra
-- 4. Clicca "New Query"
-- 5. Incolla tutto questo codice
-- 6. Clicca "Run" (o premi Ctrl+Enter)
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Elimina tabella se esiste (ATTENZIONE: cancella tutti i dati!)
-- DROP TABLE IF EXISTS weeks_data;

-- Crea tabella per i dati settimanali
CREATE TABLE IF NOT EXISTS weeks_data (
  id BIGSERIAL PRIMARY KEY,
  week_number INTEGER UNIQUE NOT NULL,
  date_range TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commenti sulla tabella
COMMENT ON TABLE weeks_data IS 'Dati settimanali DAZN Bet Trading Report';
COMMENT ON COLUMN weeks_data.week_number IS 'Numero della settimana (1, 2, 3, etc.)';
COMMENT ON COLUMN weeks_data.date_range IS 'Range date (es. "03 Feb - 09 Feb 2025")';
COMMENT ON COLUMN weeks_data.data IS 'Dati JSON processati dalla dashboard';

-- Indice per ricerche veloci per numero settimana
CREATE INDEX IF NOT EXISTS idx_weeks_data_week_number ON weeks_data(week_number);

-- Indice per ordinamento per data
CREATE INDEX IF NOT EXISTS idx_weeks_data_updated_at ON weeks_data(updated_at DESC);

-- Abilita Row Level Security
ALTER TABLE weeks_data ENABLE ROW LEVEL SECURITY;

-- Policy per permettere lettura a tutti (anon key)
CREATE POLICY "Allow public read" ON weeks_data
  FOR SELECT
  USING (true);

-- Policy per permettere inserimento a tutti (anon key)
CREATE POLICY "Allow public insert" ON weeks_data
  FOR INSERT
  WITH CHECK (true);

-- Policy per permettere aggiornamento a tutti (anon key)
CREATE POLICY "Allow public update" ON weeks_data
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy per permettere eliminazione a tutti (anon key)
CREATE POLICY "Allow public delete" ON weeks_data
  FOR DELETE
  USING (true);

-- Funzione per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornare updated_at automaticamente
DROP TRIGGER IF EXISTS update_weeks_data_updated_at ON weeks_data;
CREATE TRIGGER update_weeks_data_updated_at
  BEFORE UPDATE ON weeks_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Verifica che la tabella sia stata creata
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'weeks_data'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════════
-- QUERY UTILI (per debug)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Visualizza tutte le settimane
-- SELECT week_number, date_range, updated_at FROM weeks_data ORDER BY week_number DESC;

-- Visualizza dati di una settimana specifica
-- SELECT * FROM weeks_data WHERE week_number = 5;

-- Conta le settimane salvate
-- SELECT COUNT(*) as total_weeks FROM weeks_data;

-- Elimina una settimana specifica
-- DELETE FROM weeks_data WHERE week_number = X;

-- Elimina TUTTI i dati (ATTENZIONE!)
-- TRUNCATE weeks_data RESTART IDENTITY;
