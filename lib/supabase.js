import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Crea client solo se le variabili sono configurate
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Verifica connessione
export const checkConnection = async () => {
  if (!supabase) return { connected: false, error: 'Supabase non configurato' }
  try {
    const { error } = await supabase.from('weeks_data').select('count').limit(1)
    return { connected: !error, error: error?.message }
  } catch (e) {
    return { connected: false, error: e.message }
  }
}

// Salva dati settimana
export const saveWeekData = async (weekData) => {
  if (!supabase) return { success: false, error: 'Supabase non configurato' }
  try {
    const { data, error } = await supabase
      .from('weeks_data')
      .upsert({ 
        week_number: weekData.weekNumber, 
        data: weekData,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'week_number' 
      })
      .select()
    
    if (error) throw error
    return { success: true, data }
  } catch (e) {
    console.error('Errore salvataggio:', e)
    return { success: false, error: e.message }
  }
}

// Carica tutte le settimane
export const loadAllWeeksData = async () => {
  if (!supabase) return { data: {}, error: 'Supabase non configurato' }
  try {
    const { data, error } = await supabase
      .from('weeks_data')
      .select('*')
      .order('week_number', { ascending: true })
    
    if (error) throw error
    
    // Converte array in oggetto { weekNumber: data }
    const weeksObj = {}
    data.forEach(row => {
      weeksObj[row.week_number] = row.data
    })
    
    return { data: weeksObj }
  } catch (e) {
    console.error('Errore caricamento:', e)
    return { data: {}, error: e.message }
  }
}

// Elimina settimana
export const deleteWeekData = async (weekNumber) => {
  if (!supabase) return { success: false, error: 'Supabase non configurato' }
  try {
    const { error } = await supabase
      .from('weeks_data')
      .delete()
      .eq('week_number', weekNumber)
    
    if (error) throw error
    return { success: true }
  } catch (e) {
    console.error('Errore eliminazione:', e)
    return { success: false, error: e.message }
  }
}

export default supabase
