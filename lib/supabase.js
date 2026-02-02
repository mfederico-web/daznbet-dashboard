import { createClient } from '@supabase/supabase-js'

// Environment variables (set in Vercel dashboard)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create Supabase client (if configured)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// =============================================================================
// DATABASE FUNCTIONS
// =============================================================================

/**
 * Save week data
 */
export const saveWeekData = async (weekData) => {
  if (!supabase) {
    // Fallback to localStorage if Supabase is not configured
    if (typeof window !== 'undefined') {
      const allData = JSON.parse(localStorage.getItem('daznbet-weeks') || '{}')
      allData[weekData.weekNumber] = weekData
      localStorage.setItem('daznbet-weeks', JSON.stringify(allData))
    }
    return { success: true, source: 'localStorage' }
  }

  try {
    const { data, error } = await supabase
      .from('weeks_data')
      .upsert({
        week_number: weekData.weekNumber,
        date_range: weekData.dateRange,
        data: weekData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'week_number'
      })

    if (error) throw error
    return { success: true, source: 'supabase' }
  } catch (error) {
    console.error('Supabase save error:', error)
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const allData = JSON.parse(localStorage.getItem('daznbet-weeks') || '{}')
      allData[weekData.weekNumber] = weekData
      localStorage.setItem('daznbet-weeks', JSON.stringify(allData))
    }
    return { success: true, source: 'localStorage (fallback)' }
  }
}

/**
 * Load all weeks data
 */
export const loadAllWeeksData = async () => {
  if (!supabase) {
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const data = JSON.parse(localStorage.getItem('daznbet-weeks') || '{}')
      return { data, source: 'localStorage' }
    }
    return { data: {}, source: 'none' }
  }

  try {
    const { data, error } = await supabase
      .from('weeks_data')
      .select('*')
      .order('week_number', { ascending: false })

    if (error) throw error

    // Convert array to object keyed by week_number
    const weeksObj = {}
    data.forEach(row => {
      weeksObj[row.week_number] = row.data
    })
    
    return { data: weeksObj, source: 'supabase' }
  } catch (error) {
    console.error('Supabase load error:', error)
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const data = JSON.parse(localStorage.getItem('daznbet-weeks') || '{}')
      return { data, source: 'localStorage (fallback)' }
    }
    return { data: {}, source: 'none' }
  }
}

/**
 * Delete a week
 */
export const deleteWeekData = async (weekNumber) => {
  if (!supabase) {
    if (typeof window !== 'undefined') {
      const allData = JSON.parse(localStorage.getItem('daznbet-weeks') || '{}')
      delete allData[weekNumber]
      localStorage.setItem('daznbet-weeks', JSON.stringify(allData))
    }
    return { success: true, source: 'localStorage' }
  }

  try {
    const { error } = await supabase
      .from('weeks_data')
      .delete()
      .eq('week_number', weekNumber)

    if (error) throw error
    return { success: true, source: 'supabase' }
  } catch (error) {
    console.error('Supabase delete error:', error)
    // Fallback
    if (typeof window !== 'undefined') {
      const allData = JSON.parse(localStorage.getItem('daznbet-weeks') || '{}')
      delete allData[weekNumber]
      localStorage.setItem('daznbet-weeks', JSON.stringify(allData))
    }
    return { success: true, source: 'localStorage (fallback)' }
  }
}

/**
 * Check Supabase connection
 */
export const checkConnection = async () => {
  if (!supabase) {
    return { connected: false, message: 'Supabase non configurato - usando localStorage' }
  }

  try {
    const { error } = await supabase.from('weeks_data').select('week_number').limit(1)
    if (error) throw error
    return { connected: true, message: 'Connesso a Supabase' }
  } catch (error) {
    return { connected: false, message: `Errore: ${error.message}` }
  }
}
