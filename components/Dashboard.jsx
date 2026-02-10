'use client'

import React, { useState, useEffect, useRef } from 'react'
import * as XLSX from 'xlsx'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line, ComposedChart } from 'recharts'
import { saveWeekData, loadAllWeeksData, deleteWeekData, checkConnection } from '../lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════════
// DAZN BET - DUAL THEME
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  dark: {
    primary: '#f7ff1a',       // Sfondo bottoni, barre, progress
    primaryText: '#000000',   // Testo SU sfondo giallo (bottoni)
    accent: '#f7ff1a',        // Testo accento (giallo su nero = leggibile)
    bg: '#000000',
    card: '#0a0a0a',
    border: '#1a1a1a',
    text: '#FFFFFF',
    textSec: '#999999',
    textMuted: '#666666',
    success: '#00D26A',
    successDim: 'rgba(0,210,106,0.15)',
    danger: '#FF4757',
    dangerDim: 'rgba(255,71,87,0.15)',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    orange: '#F59E0B',
    cyan: '#06B6D4',
    hover: '#1a1a1a',         // Hover righe tabella (grigio scuro)
    chart: ['#f7ff1a', '#00D26A', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#F97316']
  },
  light: {
    primary: '#1a1a1a',       // Sfondo bottoni (nero DAZN)
    primaryText: '#FFFFFF',   // Testo SU sfondo nero
    accent: '#1a1a1a',        // Testo accento (nero = leggibile su bianco)
    bg: '#FFFFFF',
    card: '#F8F8F8',
    border: '#E0E0E0',
    text: '#000000',
    textSec: '#444444',
    textMuted: '#888888',
    hover: '#F0F0F0',         // Hover righe tabella (grigio chiaro)
    success: '#00A854',
    successDim: 'rgba(0,168,84,0.1)',
    danger: '#D93025',
    dangerDim: 'rgba(217,48,37,0.1)',
    blue: '#1A73E8',
    purple: '#7C3AED',
    orange: '#EA8600',
    cyan: '#0891B2',
    chart: ['#1a1a1a', '#00A854', '#1A73E8', '#7C3AED', '#EA8600', '#0891B2', '#DB2777', '#EA580C']
  }
}

const DASHBOARD_PASSWORD = 'daznbet2026'
const UPLOAD_PASSWORD = 'soloperpochi2026'

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIVE HOOK
// ═══════════════════════════════════════════════════════════════════════════════
const useWindowWidth = () => {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const h = () => setW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return w
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const FILES = [
  { key: 'anagrafica', name: 'Anagrafica.xlsx', path: 'Edit Account → Advanced Search' },
  { key: 'anagrafica2', name: 'Anagrafica2.xlsx', path: 'Account Statistics' },
  { key: 'total', name: 'Anagrafica_TOTAL.xlsx', path: 'Stats Multi-level → GRID no filters' },
  { key: 'categoria', name: 'Anagrafica_CATEGORIA.xlsx', path: 'Stats Multi-level → GRID Category' },
  { key: 'daznbet', name: 'Anagrafica_DAZNBET.xlsx', path: 'Stats Multi-level → DAZNBET SKIN per account' },
  { key: 'organic', name: 'Anagrafica_ORGANIC.xlsx', path: 'DAZNBET SKIN, PV: www.daznbet.it → GRID Category' },
  { key: 'organicTotal', name: 'Anagrafica_ORGANIC_TOTAL.xlsx', path: 'DAZNBET SKIN, PV: www.daznbet.it' },
  { key: 'skin', name: 'Anagrafica_SKIN.xlsx', path: 'Stats Multi-level → GRID SKIN & Category' },
  { key: 'skinTotal', name: 'Anagrafica_SKIN_TOTAL.xlsx', path: 'Stats Multi-level → GRID SKIN' },
  { key: 'academyTotal', name: 'Anagrafica_ACCADEMY_TOTAL.xlsx', path: 'VIVABET SKIN, Promoter: sbozza' }
]

const CASINO_FILES = [
  { key: 'casinoTotal', name: 'Casino_Total.xlsx', path: 'Stats Multilivello → GRID all casino' },
  { key: 'casinoTotalEta', name: 'Casino_Total_età.xlsx', path: 'Stats Multi-level → GRID casino → account' },
  { key: 'casinoPiattaforme', name: 'Casino_Piattaforme.xlsx', path: 'Stats Multi-level → GRID casino → platform & game' },
  { key: 'casinoCategoria', name: 'Casino_Categoria.xlsx', path: 'Stats Multi-level → GRID casino → category' },
  { key: 'casinoSkinTotal', name: 'Anagrafica_SKIN_TOTALCASINO.xlsx', path: 'SKIN Total Casino' },
  { key: 'casinoAcademyTotal', name: 'Anagrafica_ACCADEMY_TOTALCASINO.xlsx', path: 'Academy Total Casino' },
  { key: 'casinoOrganicTotal', name: 'Anagrafica_ORGANIC_TOTALCASINO.xlsx', path: 'Organic Total Casino' },
  { key: 'casinoDaznbet', name: 'Anagrafica_DAZNBETCASINO.xlsx', path: 'DAZNBET Casino' },
  { key: 'casinoSessioni', name: 'SessioniCasino.xlsx', path: 'Report Sessioni Casino (ticket-level)' }
]

const SPORT_FILES = [
  { key: 'sportTotal', name: 'Sport_Total.xlsx', path: 'Bookmaker → Export GRID completo' },
  { key: 'sportTotalEta', name: 'SPORT_Total_età.xlsx', path: 'Stats Multilivello → SCOMMESSE → per conto' },
  { key: 'sportManifestazione', name: 'Sport_Manifestazione.xlsx', path: 'Bookmaker → Report Sport → Manifestazioni' },
  { key: 'sportNumEventi', name: 'Sport_NumEventi.xlsx', path: 'Bookmaker → Report Sport → Num Eventi' },
  { key: 'sportScommesse', name: 'Sport_Scommesse.xlsx', path: 'Bookmaker → Report Sport → Scommesse' },
  { key: 'sportPuntoVendita', name: 'Sport_PuntoVendita.xlsx', path: 'Bookmaker → Report Sport → Punti Vendita' },
  { key: 'sportSkin', name: 'SKIN_Total_Sport.xlsx', path: 'Stats Multilivello → SCOMMESSE → GRID Skin' },
  { key: 'sportAcademyTotal', name: 'Anagrafica_ACCADEMY_TOTAL.xlsx', path: 'Stats Multi → vivabet promoter' },
  { key: 'sportOrganicTotal', name: 'Anagrafica_ORGANIC_TOTAL.xlsx', path: 'Stats Multi → daznbet www.daznbet.it' },
  { key: 'sportDaznbet', name: 'Anagrafica_DAZNBET.xlsx', path: 'Stats Multi → daznbet per conto' }
]

const DAILY_FILES = [
  { key: 'meseTotal', name: 'Anagrafica_Mese_Total.xlsx', path: 'Stats Multilivello + Data' },
  { key: 'meseTotalPadre', name: 'Anagrafica_Mese_Total_Padre.xlsx', path: 'Stats Multilivello + Data + Padre' },
  { key: 'mese2', name: 'Anagrafica_Mese_2.xlsx', path: 'Statistica Conti (mensile)' }
]

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL CONFIG — Allowlist dei Cod Punto DAZN Direct (canali proprietari DAZN)
// ─────────────────────────────────────────────────────────────────────────────
// Quando appare un NUOVO Cod Punto nelle settimane future:
//   • Se è un canale DAZN-owned (IntReg, Herobanner, nuova app, ecc.)
//     → aggiungerlo qui sotto
//   • Se è un affiliato/partner (Raccoon, One Click, nuova agenzia, ecc.)
//     → NON aggiungerlo, finirà automaticamente in AFFILIATES
//   • I Cod Punto DAZN_* vengono matchati anche per prefisso (vedi classifyChannel)
// ═══════════════════════════════════════════════════════════════════════════════
const DAZN_DIRECT_COD_PUNTI = new Set([
  'DAZN_SUPERPRONOSTICO',
  'DAZN_INTREG',
  'DAZN_HEROBANNER',
  'DAZN_STATS',
  'DAZN_APP',
  'IG_STORIES',
  'SISAL_REG'
])

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
const parseNum = v => {
  if (v === null || v === undefined || v === '') return 0
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    let cleaned = v.replace(/\s/g, '')
    if (cleaned.includes(',') && cleaned.includes('.')) cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    else if (cleaned.includes(',')) cleaned = cleaned.replace(',', '.')
    return parseFloat(cleaned.replace(/[^\d.-]/g, '')) || 0
  }
  return 0
}

const fmtCurrency = (v, c = true) => {
  if (!v || isNaN(v)) return '€0'
  if (c) {
    if (Math.abs(v) >= 1e6) return `€${(v / 1e6).toFixed(2)}M`
    if (Math.abs(v) >= 1e3) return `€${(v / 1e3).toFixed(0)}K`
  }
  return `€${v.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const fmtNum = v => (!v || isNaN(v)) ? '0' : Math.round(v).toLocaleString('it-IT')
const calcChange = (cur, prev) => (!prev || prev === 0) ? null : ((cur - prev) / prev * 100).toFixed(1)

const normalizeDate = (dateVal) => {
  if (!dateVal) return null
  try {
    let d
    if (dateVal instanceof Date) d = dateVal
    else if (typeof dateVal === 'number') d = new Date((dateVal - 25569) * 86400 * 1000)
    else if (typeof dateVal === 'string') {
      if (dateVal.includes('/')) {
        const parts = dateVal.split(/[\s\/]/)
        if (parts.length >= 3) d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      } else d = new Date(dateVal)
    }
    if (!d || isNaN(d.getTime())) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  } catch { return null }
}

const formatDateLabel = (dateKey) => {
  if (!dateKey) return ''
  try { return new Date(dateKey).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }
  catch { return dateKey }
}

// Estrae mese dalla data di INIZIO settimana (es. "26 Jan - 01 Feb 2026" → January 2026)
const getMonthFromDateRange = (dateRange) => {
  if (!dateRange) return { name: '', key: '' }
  const months = { 'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April', 'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August', 'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December' }
  const monthMatch = dateRange.match(/([A-Z][a-z]{2})/)
  const yearMatch = dateRange.match(/(\d{4})/)
  if (monthMatch && yearMatch && months[monthMatch[1]]) return { name: `${months[monthMatch[1]]} ${yearMatch[1]}`, key: `${yearMatch[1]}-${monthMatch[1]}` }
  return { name: dateRange, key: dateRange }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
const classifyChannel = row => {
  const skin = String(row["Skin"] || "").toUpperCase().trim()
  const promoter = String(row["Promoter"] || "").toLowerCase().trim()
  const puntoVendita = String(row["Punto vendita"] || "").toLowerCase().trim()
  const codPunto = String(row["Cod Punto"] || "").toUpperCase().trim()

  // ── VIVABET-SKIN ──
  if (skin.includes("VIVABET")) {
    if (promoter.includes("nsg social web")) return "VIVABET/GLAD"
    return "Tipster Academy"
  }

  // ── DAZNBET-SKIN ──
  if (skin.includes("DAZNBET")) {
    if (puntoVendita.includes("www.daznbet.it")) return "DAZNBET Organic"
    if (codPunto.startsWith("DAZN_") || DAZN_DIRECT_COD_PUNTI.has(codPunto)) return "DAZN Direct"
    return "AFFILIATES"
  }

  // ── SCOMMETTENDO-SKIN → PVR (rete retail, NON affiliati) ──
  if (skin.includes("SCOMMETTENDO")) return "PVR"

  // ── Tutte le altre SKIN → PVR ──
  return "PVR"
}

// Channel classification for Padre file (uses Skin + Cod liv 1 hierarchy)
const classifyChannelPadre = row => {
  const skin = String(row["Skin"] || "").toUpperCase().trim()
  const codLiv1 = String(row["Cod liv 1"] || "").toUpperCase().trim()

  if (skin.includes("VIVABET")) {
    if (["ILGLADIATORE", "VIVABET"].includes(codLiv1) || codLiv1.includes("GLADIATORE")) return "VIVABET/GLAD"
    return "Tipster Academy"
  }
  if (skin.includes("DAZNBET")) {
    if (codLiv1 === "DAZNBET") return "DAZNBET Organic"
    if (codLiv1.startsWith("DAZN_") || DAZN_DIRECT_COD_PUNTI.has(codLiv1)) return "DAZN Direct"
    return "AFFILIATES"
  }
  if (skin.includes("SCOMMETTENDO")) return "PVR"
  return "PVR"
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════════
const processData = (files, weekNum, dateRange) => {
  const ana = files.anagrafica || []
  const ana2 = files.anagrafica2 || []
  const total = files.total || []
  const cat = files.categoria || []
  const skinTotal = files.skinTotal || []
  const academyTotal = files.academyTotal || []
  const organicTotal = files.organicTotal || []
  const daznbet = files.daznbet || []

  const reg = ana2.reduce((s, r) => s + (parseNum(r["Registrati AAMS"]) || 0) + (parseNum(r["Registrazioni non attive"]) || 0), 0)
  
  const daily = ana2.map(r => {
    const dateKey = normalizeDate(r["Data"])
    return {
      date: formatDateLabel(dateKey), dateKey,
      registrations: (parseNum(r["Registrati AAMS"]) || 0) + (parseNum(r["Registrazioni non attive"]) || 0),
      ftds: parseNum(r["Primo deposito"]) || 0,
      deposits: parseNum(r["Importo depositi"]) || 0,
      withdrawals: parseNum(r["Importo prelievi processati"]) || 0,
      bonus: parseNum(r["Importo bonus"]) || 0,
      logins: parseNum(r["Login"]) || 0
    }
  }).filter(d => d.date && d.dateKey).sort((a, b) => (a.dateKey || '').localeCompare(b.dateKey || ''))

  const ftds = ana2.reduce((s, r) => s + (parseNum(r["Primo deposito"]) || 0), 0)
  const totalDep = ana2.reduce((s, r) => s + (parseNum(r["Importo depositi"]) || 0), 0)
  const totalWit = ana2.reduce((s, r) => s + (parseNum(r["Importo prelievi processati"]) || 0), 0)
  const totalBonus = ana2.reduce((s, r) => s + (parseNum(r["Importo bonus"]) || 0), 0)
  const totalLogins = ana2.reduce((s, r) => s + (parseNum(r["Login"]) || 0), 0)
  const avgFirstDepSum = ana2.reduce((s, r) => s + (parseNum(r["Importo primo deposito"]) || 0), 0)
  const totalDepCount = ana2.reduce((s, r) => s + (parseNum(r["Depositi"]) || 0), 0)
  const totalUniqueDep = ana2.reduce((s, r) => s + (parseNum(r["Depositanti unici"]) || 0), 0)

  const totRow = total[0] || {}
  const turnover = parseNum(totRow["Giocato"]) || 0
  const ggr = parseNum(totRow["rake"]) || parseNum(totRow["ggr"]) || 0
  const actives = parseNum(totRow["conti attivi"]) || 0

  const top3Products = ['Scommesse', 'Casino', 'Casino Live'].map(prodName => {
    const row = cat.find(r => String(r["Categoria"] || "").toLowerCase().includes(prodName.toLowerCase()))
    return { name: prodName, actives: row ? parseNum(row["conti attivi"]) : 0 }
  })

  // Quality Acquisition con calcolo TOTALI corretto
  const channelGroups = {}
  ana.forEach(r => {
    const ch = classifyChannel(r)
    if (!channelGroups[ch]) channelGroups[ch] = { rows: [], ages: [], ftds: 0, activated: 0 }
    channelGroups[ch].rows.push(r)
    if (r["Nato il"]) channelGroups[ch].ages.push(r["Nato il"])
    if (r["Primo deposito"]) channelGroups[ch].ftds++
    if (String(r["Stato conto"] || "").toUpperCase().includes("ATTIVATO")) channelGroups[ch].activated++
  })

  const qualityAcq = Object.entries(channelGroups).map(([ch, d]) => {
    const r = d.rows.length, f = d.ftds, act = d.activated
    const avgAge = d.ages.length ? Math.round(d.ages.map(x => (new Date() - new Date(x)) / (365.25 * 24 * 60 * 60 * 1000)).reduce((a, b) => a + b, 0) / d.ages.length) : 0
    return { channel: ch, reg: r, ftds: f, conv: r > 0 ? parseFloat((f / r * 100).toFixed(1)) : 0, activated: r > 0 ? Math.round(act / r * 100) : 0, avgAge, _activatedCount: act, _ageSum: d.ages.map(x => (new Date() - new Date(x)) / (365.25 * 24 * 60 * 60 * 1000)).reduce((a, b) => a + b, 0), _ageCount: d.ages.length }
  }).filter(c => c.channel !== "OTHER").sort((a, b) => b.reg - a.reg)

  // Calcolo TOTALI con medie corrette
  const totalReg = qualityAcq.reduce((s, c) => s + c.reg, 0)
  const totalFtds = qualityAcq.reduce((s, c) => s + c.ftds, 0)
  const totalActivatedCount = qualityAcq.reduce((s, c) => s + c._activatedCount, 0)
  const totalAgeSum = qualityAcq.reduce((s, c) => s + c._ageSum, 0)
  const totalAgeCount = qualityAcq.reduce((s, c) => s + c._ageCount, 0)

  const totalsRow = {
    channel: 'TOTALI', isTotal: true,
    reg: totalReg,
    ftds: totalFtds,
    conv: totalReg > 0 ? parseFloat((totalFtds / totalReg * 100).toFixed(1)) : 0,
    activated: totalReg > 0 ? Math.round(totalActivatedCount / totalReg * 100) : 0,
    avgAge: totalAgeCount > 0 ? Math.round(totalAgeSum / totalAgeCount) : 0
  }
  qualityAcq.push(totalsRow)

  // Channel Performance
  const chanPerf = []
  let totGgr = 0

  let pvrT = 0, pvrG = 0, pvrA = 0
  skinTotal.forEach(r => {
    const s = String(r["Skin"] || "").toUpperCase()
    if (s && !s.includes("VIVABET") && !s.includes("DAZNBET") && !s.includes("NAN")) {
      pvrT += parseNum(r["Giocato"]); pvrG += parseNum(r["rake"]) || parseNum(r["ggr"]); pvrA += parseNum(r["conti attivi"])
    }
  })
  if (pvrT > 0 || pvrA > 0) { chanPerf.push({ channel: 'PVR', turnover: pvrT, ggr: pvrG, gwm: pvrT > 0 ? parseFloat((pvrG / pvrT * 100).toFixed(1)) : 0, actives: pvrA }); totGgr += pvrG }

  const vivRow = skinTotal.find(r => String(r["Skin"] || "").toUpperCase().includes("VIVABET"))
  const acadRow = academyTotal[0]
  if (vivRow) {
    const vT = parseNum(vivRow["Giocato"]), vG = parseNum(vivRow["rake"]) || parseNum(vivRow["ggr"]), vA = parseNum(vivRow["conti attivi"])
    const aT = acadRow ? parseNum(acadRow["Giocato"]) : 0, aG = acadRow ? parseNum(acadRow["rake"]) : 0, aA = acadRow ? parseNum(acadRow["conti attivi"]) : 0
    if ((vT - aT) > 0) { chanPerf.push({ channel: 'VIVABET/GLAD', turnover: vT - aT, ggr: vG - aG, gwm: (vT - aT) > 0 ? parseFloat(((vG - aG) / (vT - aT) * 100).toFixed(1)) : 0, actives: vA - aA }); totGgr += vG - aG }
    if (aT > 0) { chanPerf.push({ channel: 'Tipster Academy', turnover: aT, ggr: aG, gwm: aT > 0 ? parseFloat((aG / aT * 100).toFixed(1)) : 0, actives: aA }); totGgr += aG }
  }

  const orgRow = organicTotal[0]
  if (orgRow) {
    const oT = parseNum(orgRow["Giocato"]), oG = parseNum(orgRow["rake"]) || parseNum(orgRow["ggr"]), oA = parseNum(orgRow["conti attivi"])
    if (oT > 0) { chanPerf.push({ channel: 'DAZNBET Organic', turnover: oT, ggr: oG, gwm: oT > 0 ? parseFloat((oG / oT * 100).toFixed(1)) : 0, actives: oA }); totGgr += oG }
  }

  let ddT = 0, ddG = 0, ddA = 0
  daznbet.forEach(r => { const c = String(r["Cod liv 1"] || "").toUpperCase(); if (c.startsWith("DAZN_") || DAZN_DIRECT_COD_PUNTI.has(c)) { ddT += parseNum(r["Giocato"]); ddG += parseNum(r["ggr"]); ddA++ } })
  if (ddT > 0) { chanPerf.push({ channel: 'DAZN Direct', turnover: ddT, ggr: ddG, gwm: ddT > 0 ? parseFloat((ddG / ddT * 100).toFixed(1)) : 0, actives: ddA }); totGgr += ddG }

  let affT = 0, affG = 0, affA = 0
  daznbet.forEach(r => { const c = String(r["Cod liv 1"] || "").toUpperCase(); if (c && c !== "DAZNBET" && !c.startsWith("DAZN_") && !DAZN_DIRECT_COD_PUNTI.has(c) && c.toLowerCase() !== "nan") { affT += parseNum(r["Giocato"]); affG += parseNum(r["ggr"]); affA++ } })
  if (affT > 0) { chanPerf.push({ channel: 'AFFILIATES', turnover: affT, ggr: affG, gwm: affT > 0 ? parseFloat((affG / affT * 100).toFixed(1)) : 0, actives: affA }); totGgr += affG }

  chanPerf.forEach(c => { c.revShare = totGgr > 0 ? parseFloat((c.ggr / totGgr * 100).toFixed(1)) : 0 })

  const products = cat.map(r => ({
    product: r["Categoria"] || '', turnover: parseNum(r["Giocato"]), ggr: parseNum(r["rake"]) || parseNum(r["ggr"]),
    actives: parseNum(r["conti attivi"]), payout: parseNum(r["Giocato"]) > 0 ? parseFloat((parseNum(r["vinto"]) / parseNum(r["Giocato"]) * 100).toFixed(1)) : null
  })).filter(p => p.product && !String(p.product).includes('.'))

  const genderCount = { M: 0, F: 0 }
  ana.forEach(r => { const g = String(r["Sesso"] || "").toUpperCase(); if (g === "M" || g === "F") genderCount[g]++ })
  const totGender = genderCount.M + genderCount.F
  
  const ageGroups = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0 }
  ana.forEach(r => {
    if (r["Nato il"]) {
      const age = (new Date() - new Date(r["Nato il"])) / (365.25 * 24 * 60 * 60 * 1000)
      if (age < 25) ageGroups["18-24"]++; else if (age < 35) ageGroups["25-34"]++; else if (age < 45) ageGroups["35-44"]++
      else if (age < 55) ageGroups["45-54"]++; else if (age < 65) ageGroups["55-64"]++; else ageGroups["65+"]++
    }
  })
  const totAges = Object.values(ageGroups).reduce((a, b) => a + b, 0)

  const provCount = {}
  ana.forEach(r => { const p = r["Provincia di residenza"]; if (p) provCount[p] = (provCount[p] || 0) + 1 })
  const provinces = Object.entries(provCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))

  const srcCount = {}
  ana.forEach(r => { const s = r["Cod Punto"]; if (s) srcCount[s] = (srcCount[s] || 0) + 1 })
  const sources = Object.entries(srcCount).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([name, count]) => ({ name: String(name).substring(0, 20), count }))

  return {
    weekNumber: weekNum, dateRange, registrations: reg, ftds, conversionRate: reg > 0 ? parseFloat((ftds / reg * 100).toFixed(1)) : 0,
    avgFirstDeposit: ftds > 0 ? Math.round(avgFirstDepSum / ftds) : 0, totalDeposits: totalDep, totalWithdrawals: totalWit, netDeposit: totalDep - totalWit,
    turnover, ggr, gwm: turnover > 0 ? parseFloat((ggr / turnover * 100).toFixed(1)) : 0, activeUsers: actives, top3Products, totalLogins, totalBonus,
    demographics: { male: totGender > 0 ? Math.round(genderCount.M / totGender * 100) : 0, female: totGender > 0 ? Math.round(genderCount.F / totGender * 100) : 0, _maleCount: genderCount.M, _femaleCount: genderCount.F },
    ageGroups: Object.entries(ageGroups).map(([range, count]) => ({ range, count, percent: totAges > 0 ? Math.round(count / totAges * 100) : 0 })),
    provinces, topSources: sources, dailyStats: daily, qualityAcquisition: qualityAcq.map(({ _activatedCount, _ageSum, _ageCount, ...rest }) => rest), channelPerformance: chanPerf, productPerformance: products,
    financialHealth: {
      withdrawalRatio: totalDep > 0 ? parseFloat((totalWit / totalDep * 100).toFixed(1)) : 0,
      depositFrequency: totalUniqueDep > 0 ? parseFloat((totalDepCount / totalUniqueDep).toFixed(1)) : 0,
      bonusROI: totalBonus > 0 ? parseFloat((ggr / totalBonus).toFixed(1)) : 0,
      customerValue: actives > 0 ? Math.round(ggr / actives) : 0,
      loginPerUser: actives > 0 ? parseFloat((totalLogins / actives).toFixed(1)) : 0,
      _ggr: ggr, _bonus: totalBonus, _logins: totalLogins, _actives: actives
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASINO DATA PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════════
const processCasinoData = (files, weekNum, dateRange) => {
  const total = files.casinoTotal || []
  const totalEta = files.casinoTotalEta || []
  const piattaforme = files.casinoPiattaforme || []
  const categoria = files.casinoCategoria || []
  const skinTotal = files.casinoSkinTotal || []
  const academyTotal = files.casinoAcademyTotal || []
  const organicTotal = files.casinoOrganicTotal || []
  const daznbet = files.casinoDaznbet || []

  // KPIs from Casino_Total
  const totRow = total[0] || {}
  const turnover = parseNum(totRow["Giocato"]) || 0
  const ggr = parseNum(totRow["rake"]) || parseNum(totRow["ggr"]) || 0
  const actives = parseNum(totRow["conti attivi"]) || 0
  const betBonus = parseNum(totRow["bet bonus"]) || 0
  const numTicket = parseNum(totRow["num ticket"]) || 0
  const arpu = actives > 0 ? Math.round(ggr / actives) : 0

  // Età media from Casino_Total_età (colonna "Età" = età numerica diretta)
  const ages = totalEta.filter(r => r["Età"] != null && typeof r["Età"] === 'number' && r["Età"] > 0 && r["Età"] < 120).map(r => r["Età"])
  const avgAge = ages.length > 0 ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : 0

  // Age distribution from Casino_Total_età
  const ageGroups = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0 }
  ages.forEach(age => {
    if (age < 25) ageGroups["18-24"]++; else if (age < 35) ageGroups["25-34"]++; else if (age < 45) ageGroups["35-44"]++
    else if (age < 55) ageGroups["45-54"]++; else if (age < 65) ageGroups["55-64"]++; else ageGroups["65+"]++
  })
  const totAges = Object.values(ageGroups).reduce((a, b) => a + b, 0)
  const ageData = Object.entries(ageGroups).map(([range, count]) => ({ range, count, percent: totAges > 0 ? Math.round(count / totAges * 100) : 0 }))

  // Categorie (Casino vs Casino Live) from Casino_Categoria
  const categories = categoria.filter(r => r["Categoria"] && String(r["Categoria"]).trim() !== '').map(r => ({
    category: r["Categoria"],
    actives: parseNum(r["conti attivi"]),
    turnover: parseNum(r["Giocato"]),
    ggr: parseNum(r["ggr"]) || parseNum(r["rake"]),
    payout: parseNum(r["% payout"]),
    betBonus: parseNum(r["bet bonus"])
  }))

  // Provider aggregation from Casino_Piattaforme
  const provAgg = {}
  piattaforme.forEach(r => {
    const p = r["Piattaforma"]
    if (!p) return
    if (!provAgg[p]) provAgg[p] = { provider: p, turnover: 0, ggr: 0, actives: 0 }
    provAgg[p].turnover += parseNum(r["Giocato"]) || 0
    provAgg[p].ggr += parseNum(r["rake"]) || 0
    provAgg[p].actives += parseNum(r["conti attivi"]) || 0
  })
  const providers = Object.values(provAgg).sort((a, b) => b.turnover - a.turnover)

  // Games from Casino_Piattaforme
  const games = piattaforme.filter(r => r["Gioco"]).map(r => ({
    game: r["Gioco"], provider: r["Piattaforma"] || '',
    turnover: parseNum(r["Giocato"]) || 0, ggr: parseNum(r["rake"]) || 0, actives: parseNum(r["conti attivi"]) || 0
  })).sort((a, b) => b.turnover - a.turnover)

  // Channel Performance (same logic as main dashboard, casino-specific files)
  const chanPerf = []
  let totChGgr = 0

  let pvrT = 0, pvrG = 0, pvrA = 0
  skinTotal.forEach(r => {
    const s = String(r["Skin"] || "").toUpperCase()
    if (s && !s.includes("VIVABET") && !s.includes("DAZNBET") && !s.includes("NAN")) {
      pvrT += parseNum(r["Giocato"]); pvrG += parseNum(r["rake"]) || parseNum(r["ggr"]); pvrA += parseNum(r["conti attivi"])
    }
  })
  if (pvrT > 0 || pvrA > 0) { chanPerf.push({ channel: 'PVR', turnover: pvrT, ggr: pvrG, actives: pvrA }); totChGgr += pvrG }

  const vivRow = skinTotal.find(r => String(r["Skin"] || "").toUpperCase().includes("VIVABET"))
  const acadRow = academyTotal[0]
  if (vivRow) {
    const vT = parseNum(vivRow["Giocato"]), vG = parseNum(vivRow["rake"]) || parseNum(vivRow["ggr"]), vA = parseNum(vivRow["conti attivi"])
    const aT = acadRow ? parseNum(acadRow["Giocato"]) : 0, aG = acadRow ? (parseNum(acadRow["rake"]) || parseNum(acadRow["ggr"]) || 0) : 0, aA = acadRow ? parseNum(acadRow["conti attivi"]) : 0
    if ((vT - aT) > 0) { chanPerf.push({ channel: 'VIVABET/GLAD', turnover: vT - aT, ggr: vG - aG, actives: vA - aA }); totChGgr += vG - aG }
    if (aT > 0) { chanPerf.push({ channel: 'Tipster Academy', turnover: aT, ggr: aG, actives: aA }); totChGgr += aG }
  }

  const orgRow = organicTotal[0]
  if (orgRow) {
    const oT = parseNum(orgRow["Giocato"]), oG = parseNum(orgRow["rake"]) || parseNum(orgRow["ggr"]), oA = parseNum(orgRow["conti attivi"])
    if (oT > 0) { chanPerf.push({ channel: 'DAZNBET Organic', turnover: oT, ggr: oG, actives: oA }); totChGgr += oG }
  }

  let ddT = 0, ddG = 0, ddA = 0
  daznbet.forEach(r => { const c = String(r["Cod liv 1"] || "").toUpperCase(); if (c.startsWith("DAZN_") || DAZN_DIRECT_COD_PUNTI.has(c)) { ddT += parseNum(r["Giocato"]); ddG += parseNum(r["ggr"]) || parseNum(r["rake"]); ddA++ } })
  if (ddT > 0) { chanPerf.push({ channel: 'DAZN Direct', turnover: ddT, ggr: ddG, actives: ddA }); totChGgr += ddG }

  let affT = 0, affG = 0, affA = 0
  daznbet.forEach(r => { const c = String(r["Cod liv 1"] || "").toUpperCase(); if (c && c !== "DAZNBET" && !c.startsWith("DAZN_") && !DAZN_DIRECT_COD_PUNTI.has(c) && c.toLowerCase() !== "nan") { affT += parseNum(r["Giocato"]); affG += parseNum(r["ggr"]) || parseNum(r["rake"]); affA++ } })
  if (affT > 0) { chanPerf.push({ channel: 'AFFILIATES', turnover: affT, ggr: affG, actives: affA }); totChGgr += affG }

  chanPerf.forEach(c => {
    c.arpu = c.actives > 0 ? Math.round(c.ggr / c.actives) : 0
    c.gwm = c.turnover > 0 ? parseFloat((c.ggr / c.turnover * 100).toFixed(1)) : 0
    c.revShare = totChGgr > 0 ? parseFloat((c.ggr / totChGgr * 100).toFixed(1)) : 0
  })

  // Process Sessions if uploaded
  const sessionData = files.casinoSessioni ? processSessionData(files.casinoSessioni) : null

  return {
    weekNumber: weekNum, dateRange, turnover, ggr, activeUsers: actives, betBonus, numTicket, arpu, avgAge,
    gwm: turnover > 0 ? parseFloat((ggr / turnover * 100).toFixed(1)) : 0,
    ageGroups: ageData, categories, providers, games, channelPerformance: chanPerf, sessionData
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION DATA PROCESSOR (from SessioniCasino.xlsx)
// ═══════════════════════════════════════════════════════════════════════════════
const processSessionData = (rows) => {
  if (!rows || rows.length === 0) return null
  const ONLINE = ['DAZNBET-SKIN', 'VIVABET-SKIN']
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  const BLOCKS = ['00-04','04-08','08-12','12-16','16-20','20-24']

  const makeSeg = () => ({
    tk: 0, g: 0, ggr: 0, acc: new Set(),
    h: Array.from({length:24}, () => ({t:0,g:0,r:0})),
    d: Array.from({length:7}, () => ({t:0,g:0,r:0})),
    dur: [0,0,0,0,0,0,0,0], durArr: [], // durArr for median calculation
    hm: Array.from({length:7}, () => Array(6).fill(0)),
    pr: {}
  })
  const S = { gen: makeSeg(), onl: makeSeg(), pvr: makeSeg() }
  let minD = null, maxD = null

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const sd = r['Data vendita']
    if (!sd || !(sd instanceof Date) || isNaN(sd.getTime())) continue
    const ed = r['Data fine']
    const pr = String(r['Cod promoter'] || '').trim()
    const gi = parseFloat(r['Giocato']) || 0
    const gr = parseFloat(r['GGR']) || 0
    const ac = String(r['Id conto'] || '')
    if (!minD || sd < minD) minD = sd
    if (!maxD || sd > maxD) maxD = sd
    const hr = sd.getHours()
    const dw = sd.getDay()
    const di = dw === 0 ? 6 : dw - 1
    const bi = Math.min(Math.floor(hr / 4), 5)
    let dm = null
    if (ed instanceof Date && !isNaN(ed.getTime())) { 
      dm = (ed - sd) / 60000
      // Exclude negative and extreme outliers (> 4 hours = likely data errors)
      if (dm < 0 || dm > 240) dm = null 
    }
    const isO = ONLINE.includes(pr)
    const tgts = [S.gen, isO ? S.onl : S.pvr]
    for (let j = 0; j < 2; j++) {
      const s = tgts[j]; s.tk++; s.g += gi; s.ggr += gr
      if (ac) s.acc.add(ac)
      s.h[hr].t++; s.h[hr].g += gi; s.h[hr].r += gr
      s.d[di].t++; s.d[di].g += gi; s.d[di].r += gr
      s.hm[di][bi]++
      if (dm !== null) {
        s.durArr.push(dm)
        s.dur[dm<1?0:dm<5?1:dm<15?2:dm<30?3:dm<60?4:dm<120?5:dm<240?6:7]++
      }
      if (pr) s.pr[pr] = (s.pr[pr] || 0) + 1
    }
  }

  const fin = (s) => {
    const acc = s.acc.size
    // Calculate MEDIAN duration (much more representative than mean with outliers)
    let medianDur = 0
    if (s.durArr.length > 0) {
      s.durArr.sort((a, b) => a - b)
      const mid = Math.floor(s.durArr.length / 2)
      medianDur = s.durArr.length % 2 !== 0 ? s.durArr[mid] : (s.durArr[mid - 1] + s.durArr[mid]) / 2
      medianDur = Math.round(medianDur * 10) / 10
    }
    const gwm = s.g > 0 ? Math.round(s.ggr / s.g * 1000) / 10 : 0
    const tb = [{n:'Night',r:'00-06',t:0,g:0,rr:0},{n:'Morning',r:'06-12',t:0,g:0,rr:0},{n:'Afternoon',r:'12-18',t:0,g:0,rr:0},{n:'Evening',r:'18-24',t:0,g:0,rr:0}]
    s.h.forEach((h,i) => { const x = i<6?0:i<12?1:i<18?2:3; tb[x].t+=h.t; tb[x].g+=h.g; tb[x].rr+=h.r })
    const tbT = tb.reduce((a,b)=>a+b.t,0)
    const timeBlocks = tb.map(b => ({name:b.n,range:b.r,tickets:b.t,giocato:Math.round(b.g),ggr:Math.round(b.rr),percent:tbT>0?Math.round(b.t/tbT*1000)/10:0}))
    const hourly = s.h.map((h,i) => ({hour:String(i).padStart(2,'0')+':00',tickets:h.t,giocato:Math.round(h.g),ggr:Math.round(h.r),pct:s.tk>0?Math.round(h.t/s.tk*1000)/10:0}))
    const daily = s.d.map((d,i) => ({day:DAYS[i],tickets:d.t,giocato:Math.round(d.g),ggr:Math.round(d.r),pct:s.tk>0?Math.round(d.t/s.tk*1000)/10:0}))
    const DL = ['<1m','1-5m','5-15m','15-30m','30-60m','1-2h','2-4h','4h+']
    const durTotal = s.dur.reduce((a,b)=>a+b,0)
    const duration = DL.map((l,i) => ({range:l,count:s.dur[i],percent:durTotal>0?Math.round(s.dur[i]/durTotal*1000)/10:0}))
    const heatmap = DAYS.map((dy,di) => ({day:dy,blocks:BLOCKS.map((bl,bi) => ({block:bl,tickets:s.hm[di][bi],pct:s.tk>0?Math.round(s.hm[di][bi]/s.tk*1000)/10:0}))}))
    const promoters = Object.entries(s.pr).map(([n,c])=>({name:n,count:c,pct:s.tk>0?Math.round(c/s.tk*1000)/10:0})).sort((a,b)=>b.count-a.count)
    const pH = hourly.reduce((b,h)=>h.tickets>b.tickets?h:b,hourly[0])
    const gH = hourly.reduce((b,h)=>h.ggr>b.ggr?h:b,hourly[0])
    const tD = daily.reduce((b,d)=>d.tickets>b.tickets?d:b,daily[0])
    return { tickets:s.tk, giocato:Math.round(s.g), ggr:Math.round(s.ggr), accounts:acc, gwm, medianDuration:medianDur, hourly, daily, timeBlocks, duration, heatmap, promoters,
      insights:{peakHour:pH.hour,peakHourPct:pH.pct,bestGgrHour:gH.hour,bestGgrAmount:gH.ggr,topDay:tD.day,topDayPct:tD.pct}
    }
  }
  const df = d => d ? `${d.getDate().toString().padStart(2,'0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}` : ''
  return { period: `${df(minD)} - ${df(maxD)}`, totalRows: rows.length, segments: { generale: fin(S.gen), online: fin(S.onl), pvr: fin(S.pvr) } }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPORT DATA PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════
const processSportData = (files, weekNum, dateRange) => {
  // Sport_Total.xlsx - main totals with Online vs Retail and Live breakdown
  const totalRows = files.sportTotal || []
  
  // Online (15125) vs Retail (4528, 4218) from Sport_Total
  let onlineRaw = { turnover: 0, ggr: 0, tickets: 0, turnoverLive: 0, ticketsLive: 0, vinto: 0, vintoLive: 0, ggrLive: 0, betBonus: 0 }
  let retail4528 = { turnover: 0, ggr: 0, tickets: 0, turnoverLive: 0, ticketsLive: 0, vinto: 0, vintoLive: 0, ggrLive: 0 }
  let retail4218 = { turnover: 0, ggr: 0, tickets: 0, turnoverLive: 0, ticketsLive: 0, vinto: 0, vintoLive: 0, ggrLive: 0 }
  
  for (const row of totalRows) {
    const idCn = String(row['Id_cn'] || row['id_cn'] || '')
    if (idCn === 'Totali') continue // Skip totals row
    const data = {
      turnover: parseNum(row['Giocato totale']),
      ggr: parseNum(row['Netto']),
      tickets: parseNum(row['Totale biglietti']),
      turnoverLive: parseNum(row['Giocato live']),
      ticketsLive: parseNum(row['Biglietti live']),
      vinto: parseNum(row['Vinto']),
      vintoLive: parseNum(row['Vinto live']),
      ggrLive: parseNum(row['Netto live']),
      betBonus: parseNum(row['Bet bonus'])
    }
    if (idCn === '15125') {
      onlineRaw.turnover += data.turnover; onlineRaw.ggr += data.ggr; onlineRaw.tickets += data.tickets
      onlineRaw.turnoverLive += data.turnoverLive; onlineRaw.ticketsLive += data.ticketsLive
      onlineRaw.vinto += data.vinto; onlineRaw.vintoLive += data.vintoLive; onlineRaw.ggrLive += data.ggrLive
      onlineRaw.betBonus += data.betBonus
    } else if (idCn === '4528') {
      retail4528.turnover += data.turnover; retail4528.ggr += data.ggr; retail4528.tickets += data.tickets
      retail4528.turnoverLive += data.turnoverLive; retail4528.ticketsLive += data.ticketsLive
      retail4528.vinto += data.vinto; retail4528.vintoLive += data.vintoLive; retail4528.ggrLive += data.ggrLive
    } else if (idCn === '4218') {
      retail4218.turnover += data.turnover; retail4218.ggr += data.ggr; retail4218.tickets += data.tickets
      retail4218.turnoverLive += data.turnoverLive; retail4218.ticketsLive += data.ticketsLive
      retail4218.vinto += data.vinto; retail4218.vintoLive += data.vintoLive; retail4218.ggrLive += data.ggrLive
    }
  }
  
  const retailTot = {
    turnover: retail4528.turnover + retail4218.turnover,
    ggr: retail4528.ggr + retail4218.ggr,
    tickets: retail4528.tickets + retail4218.tickets,
    turnoverLive: retail4528.turnoverLive + retail4218.turnoverLive,
    ticketsLive: retail4528.ticketsLive + retail4218.ticketsLive,
    vintoLive: retail4528.vintoLive + retail4218.vintoLive,
    ggrLive: retail4528.ggrLive + retail4218.ggrLive
  }
  
  const totals = {
    turnover: onlineRaw.turnover + retailTot.turnover,
    ggr: onlineRaw.ggr + retailTot.ggr,
    tickets: onlineRaw.tickets + retailTot.tickets,
    turnoverLive: onlineRaw.turnoverLive + retailTot.turnoverLive,
    ticketsLive: onlineRaw.ticketsLive + retailTot.ticketsLive,
    vinto: onlineRaw.vinto + retail4528.vinto + retail4218.vinto,
    vintoLive: onlineRaw.vintoLive + retailTot.vintoLive,
    ggrLive: onlineRaw.ggrLive + retailTot.ggrLive,
    betBonus: onlineRaw.betBonus
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNEL PERFORMANCE (same logic as General/Casino)
  // ═══════════════════════════════════════════════════════════════════════════
  const chanPerf = []
  let totChGgr = 0
  
  // SKIN_Total_Sport.xlsx - already filtered for Sport, no Categoria needed
  const skinRows = (files.sportSkin || []).filter(r => r['Skin'] && String(r['Skin']).trim() !== '')
  const skinMap = {}
  for (const row of skinRows) {
    const skin = String(row['Skin'] || '').toLowerCase()
    if (!skin || skin === 'none') continue
    skinMap[skin] = {
      turnover: parseNum(row['Giocato']),
      ggr: parseNum(row['ggr']) || parseNum(row['rake']),
      actives: parseNum(row['conti attivi']),
      tickets: parseNum(row['num ticket']),
      payout: parseNum(row['% payout'])
    }
  }
  
  // PVR = Scommettendo + Altri B2B (excluding vivabet and daznbet)
  const pvrSkins = ['scommettendo s.r.l', 'sirplay-skin', 'gs24-skin', 'overbet-skin', 'italiagioco-skin', 'gfbwin888-skin', 'skiller-skin', 'loginbet-skin', 'il10bet-skin']
  let pvr = { turnover: 0, ggr: 0, actives: 0 }
  for (const sk of pvrSkins) {
    const s = skinMap[sk]
    if (s) { pvr.turnover += s.turnover; pvr.ggr += s.ggr; pvr.actives += s.actives }
  }
  if (pvr.turnover > 0) {
    chanPerf.push({ channel: 'PVR', turnover: pvr.turnover, ggr: pvr.ggr, gwm: pvr.turnover > 0 ? parseFloat((pvr.ggr / pvr.turnover * 100).toFixed(1)) : 0, actives: pvr.actives })
    totChGgr += pvr.ggr
  }
  
  // Retail (concessioni 4528 + 4218) - separate
  if (retailTot.turnover > 0 || retailTot.ggr !== 0) {
    chanPerf.push({ channel: 'Retail', turnover: retailTot.turnover, ggr: retailTot.ggr, gwm: retailTot.turnover > 0 ? parseFloat((retailTot.ggr / retailTot.turnover * 100).toFixed(1)) : 0, actives: 0 })
    totChGgr += retailTot.ggr
  }
  
  // VIVABET/GLADIATORE and Tipster Academy from vivabet-skin
  const vS = skinMap['vivabet-skin']
  const academyRow = (files.sportAcademyTotal || [])[0]
  if (vS) {
    const aT = academyRow ? parseNum(academyRow['Giocato']) : 0
    const aG = academyRow ? parseNum(academyRow['rake']) : 0
    const aA = academyRow ? parseNum(academyRow['conti attivi']) : 0
    // VIVABET/GLAD = vivabet-skin minus Academy
    if ((vS.turnover - aT) > 0) {
      chanPerf.push({ channel: 'VIVABET/GLAD', turnover: vS.turnover - aT, ggr: vS.ggr - aG, gwm: (vS.turnover - aT) > 0 ? parseFloat(((vS.ggr - aG) / (vS.turnover - aT) * 100).toFixed(1)) : 0, actives: vS.actives - aA })
      totChGgr += vS.ggr - aG
    }
    if (aT > 0) {
      chanPerf.push({ channel: 'Tipster Academy', turnover: aT, ggr: aG, gwm: aT > 0 ? parseFloat((aG / aT * 100).toFixed(1)) : 0, actives: aA })
      totChGgr += aG
    }
  }
  
  // DAZNBET Organic and DAZN Direct from daznbet-skin
  const dS = skinMap['daznbet-skin']
  const organicRow = (files.sportOrganicTotal || [])[0]
  if (dS) {
    const oT = organicRow ? parseNum(organicRow['Giocato']) : 0
    const oG = organicRow ? parseNum(organicRow['rake']) : 0
    const oA = organicRow ? parseNum(organicRow['conti attivi']) : 0
    if (oT > 0) {
      chanPerf.push({ channel: 'DAZNBET Organic', turnover: oT, ggr: oG, gwm: oT > 0 ? parseFloat((oG / oT * 100).toFixed(1)) : 0, actives: oA })
      totChGgr += oG
    }
    // DAZN Direct = daznbet-skin minus Organic
    const ddT = dS.turnover - oT, ddG = dS.ggr - oG, ddA = dS.actives - oA
    if (ddT > 0) {
      chanPerf.push({ channel: 'DAZN Direct', turnover: ddT, ggr: ddG, gwm: ddT > 0 ? parseFloat((ddG / ddT * 100).toFixed(1)) : 0, actives: ddA })
      totChGgr += ddG
    }
  }
  
  // Calculate revShare for each channel
  chanPerf.forEach(c => { c.revShare = totChGgr > 0 ? Math.round(c.ggr / totChGgr * 1000) / 10 : 0 })
  chanPerf.sort((a, b) => b.turnover - a.turnover)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ONLINE breakdown (all channels except Retail)
  // ═══════════════════════════════════════════════════════════════════════════
  const onlineChannels = chanPerf.filter(c => c.channel !== 'Retail')
  const online = {
    turnover: onlineChannels.reduce((s, c) => s + c.turnover, 0),
    ggr: onlineChannels.reduce((s, c) => s + c.ggr, 0),
    tickets: onlineRaw.tickets, // from Sport_Total 15125
    turnoverLive: onlineRaw.turnoverLive,
    ticketsLive: onlineRaw.ticketsLive,
    pct: 0
  }
  online.pct = totals.turnover > 0 ? Math.round(online.turnover / totals.turnover * 1000) / 10 : 0
  const retail = { ...retailTot, pct: totals.turnover > 0 ? Math.round(retailTot.turnover / totals.turnover * 1000) / 10 : 0 }
  
  // Pre-Match vs Live breakdown with GGR and Payout
  const turnoverPreMatch = totals.turnover - totals.turnoverLive
  const ticketsPreMatch = totals.tickets - totals.ticketsLive
  const ggrPreMatch = totals.ggr - totals.ggrLive
  const vintoPreMatch = totals.vinto - totals.vintoLive
  const payoutLive = totals.turnoverLive > 0 ? Math.round(totals.vintoLive / totals.turnoverLive * 1000) / 10 : 0
  const payoutPreMatch = turnoverPreMatch > 0 ? Math.round(vintoPreMatch / turnoverPreMatch * 1000) / 10 : 0
  const gwmLive = totals.turnoverLive > 0 ? Math.round(totals.ggrLive / totals.turnoverLive * 1000) / 10 : 0
  const gwmPreMatch = turnoverPreMatch > 0 ? Math.round(ggrPreMatch / turnoverPreMatch * 1000) / 10 : 0
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPORT_Total_età.xlsx - per-account with age
  // ═══════════════════════════════════════════════════════════════════════════
  const etaRows = files.sportTotalEta || []
  const ages = []
  let activeAccounts = 0
  const ageGroups = { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55-64': 0, '65+': 0 }
  
  for (const row of etaRows) {
    const eta = parseNum(row['Età'])
    if (eta > 0 && eta < 120) {
      ages.push(eta)
      activeAccounts++
      if (eta <= 24) ageGroups['18-24']++
      else if (eta <= 34) ageGroups['25-34']++
      else if (eta <= 44) ageGroups['35-44']++
      else if (eta <= 54) ageGroups['45-54']++
      else if (eta <= 64) ageGroups['55-64']++
      else ageGroups['65+']++
    }
  }
  const avgAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length * 10) / 10 : 0
  const ageData = Object.entries(ageGroups).map(([range, count]) => ({
    range, count, percent: activeAccounts > 0 ? Math.round(count / activeAccounts * 1000) / 10 : 0
  }))
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Sport_Manifestazione.xlsx - by sport and competition
  // ═══════════════════════════════════════════════════════════════════════════
  const manifRows = files.sportManifestazione || []
  const sportsMap = {}
  const manifestazioni = []
  
  for (const row of manifRows) {
    const sport = row['Sport'] || ''
    if (!sport || sport === 'UNKNOWN' || sport.toLowerCase() === 'totali') continue
    const manif = row['Manifestazione'] || ''
    if (manif.toLowerCase() === 'totali') continue
    const venduto = parseNum(row['Venduto'])
    const profit = parseNum(row['Profit'])
    const profitPct = parseNum(row['Profit %'])
    const tickets = parseNum(row['Tickets'])
    const livePct = parseNum(row['% Live totale'])
    
    if (!sportsMap[sport]) sportsMap[sport] = { turnover: 0, ggr: 0, tickets: 0 }
    sportsMap[sport].turnover += venduto
    sportsMap[sport].ggr += profit
    sportsMap[sport].tickets += tickets
    
    if (manif && venduto > 0) {
      manifestazioni.push({ sport, name: manif, turnover: venduto, ggr: profit, profitPct, tickets, livePct })
    }
  }
  
  const topSports = Object.entries(sportsMap)
    .filter(([name]) => name && name !== 'UNKNOWN')
    .map(([name, d]) => ({ name, turnover: d.turnover, ggr: d.ggr, tickets: d.tickets, gwm: d.turnover > 0 ? Math.round(d.ggr / d.turnover * 1000) / 10 : 0 }))
    .sort((a, b) => b.turnover - a.turnover).slice(0, 12)
  
  const topManifestazioni = [...manifestazioni].sort((a, b) => b.turnover - a.turnover).slice(0, 30)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Sport_NumEventi.xlsx - singles, doubles, etc. (up to 30)
  // ═══════════════════════════════════════════════════════════════════════════
  const eventiRows = files.sportNumEventi || []
  const numEventi = []
  const LABEL_MAP = { 1: 'Singole', 2: 'Doppie', 3: 'Triple', 4: 'Quadruple', 5: 'Quintuple' }
  
  for (const row of eventiRows) {
    const eventi = parseNum(row['Eventi'])
    if (eventi > 0 && eventi <= 30) {
      numEventi.push({
        eventi,
        label: LABEL_MAP[eventi] || `${eventi} Eventi`,
        tickets: parseNum(row['Tickets']),
        turnover: parseNum(row['Venduto']),
        ggr: parseNum(row['Profit']),
        profitPct: parseNum(row['Profit %']),
        livePct: parseNum(row['% Live totale'])
      })
    }
  }
  numEventi.sort((a, b) => a.eventi - b.eventi)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Sport_Scommesse.xlsx - bet types (exclude totals)
  // ═══════════════════════════════════════════════════════════════════════════
  const scommesseRows = files.sportScommesse || []
  const topScommesse = scommesseRows
    .filter(r => {
      const id = String(r['Id scommessa'] || r['Id'] || '')
      const name = String(r['Scommessa'] || '')
      return name && id !== 'Totali' && name.toLowerCase() !== 'totali' && parseNum(r['Venduto']) > 0
    })
    .map(r => ({
      id: r['Id scommessa'] || r['Id'],
      name: String(r['Scommessa'] || ''),
      tickets: parseNum(r['Tickets']),
      turnover: parseNum(r['Venduto']),
      ggr: parseNum(r['Profit']),
      profitPct: parseNum(r['Profit %']),
      livePct: parseNum(r['% Live totale'])
    }))
    .sort((a, b) => b.turnover - a.turnover).slice(0, 30)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Sport_PuntoVendita.xlsx - by point of sale (exclude totals)
  // ═══════════════════════════════════════════════════════════════════════════
  const pvRows = files.sportPuntoVendita || []
  const topPuntiVendita = pvRows
    .filter(r => {
      const cod = String(r['Cod punto'] || '')
      return cod && cod !== 'Totali' && cod.toLowerCase() !== 'totali' && parseNum(r['Venduto']) > 0
    })
    .map(r => ({
      codice: String(r['Cod punto'] || ''),
      skin: String(r['Skin'] || ''),
      tickets: parseNum(r['Tickets']),
      turnover: parseNum(r['Venduto']),
      ggr: parseNum(r['Profit']),
      profitPct: parseNum(r['Profit %']),
      livePct: parseNum(r['% Live totale'])
    }))
    .sort((a, b) => b.turnover - a.turnover).slice(0, 30)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL KPIs
  // ═══════════════════════════════════════════════════════════════════════════
  const arpu = activeAccounts > 0 ? Math.round(totals.ggr / activeAccounts * 100) / 100 : 0
  const gwm = totals.turnover > 0 ? Math.round(totals.ggr / totals.turnover * 1000) / 10 : 0
  const payout = totals.turnover > 0 ? Math.round(totals.vinto / totals.turnover * 1000) / 10 : 0
  const avgTicket = totals.tickets > 0 ? Math.round(totals.turnover / totals.tickets * 100) / 100 : 0
  const ticketsPerUser = activeAccounts > 0 ? Math.round(totals.tickets / activeAccounts * 10) / 10 : 0
  
  // Top Sport summary for quick KPIs
  const topSportCalcio = topSports.find(s => s.name === 'CALCIO')
  const topSportTennis = topSports.find(s => s.name === 'TENNIS')
  const calcioPct = totals.turnover > 0 && topSportCalcio ? Math.round(topSportCalcio.turnover / totals.turnover * 1000) / 10 : 0
  
  // Live betting insights
  const livePct = totals.turnover > 0 ? Math.round(totals.turnoverLive / totals.turnover * 1000) / 10 : 0
  const liveGgr = onlineRaw.turnoverLive > 0 ? chanPerf.reduce((s, c) => s + (c.ggr * livePct / 100), 0) : 0
  
  // Singles analysis - Multiple 3+ (3 or more events)
  const singole = numEventi.find(e => e.eventi === 1)
  const multiple3plus = numEventi.filter(e => e.eventi >= 3)
  const multiple3plusTurnover = multiple3plus.reduce((s, e) => s + e.turnover, 0)
  const multiple3plusPct = totals.turnover > 0 ? Math.round(multiple3plusTurnover / totals.turnover * 1000) / 10 : 0
  
  // Calcio % - calculate directly from sportsMap
  const calcioData = topSports.find(s => s.name === 'CALCIO')
  const calcioPctCalc = totals.turnover > 0 && calcioData ? Math.round(calcioData.turnover / totals.turnover * 1000) / 10 : 0
  
  return {
    weekNumber: weekNum,
    dateRange,
    // Main KPIs
    turnover: totals.turnover,
    ggr: totals.ggr,
    gwm,
    tickets: totals.tickets,
    activeUsers: activeAccounts,
    arpu,
    avgAge,
    betBonus: totals.betBonus,
    payout,
    avgTicket,
    ticketsPerUser,
    // Online vs Retail
    online,
    retail,
    // Pre-match vs Live (now with GGR and Payout)
    preMatch: { 
      turnover: turnoverPreMatch, 
      tickets: ticketsPreMatch, 
      ggr: ggrPreMatch,
      payout: payoutPreMatch,
      gwm: gwmPreMatch,
      pct: totals.turnover > 0 ? Math.round(turnoverPreMatch / totals.turnover * 1000) / 10 : 0 
    },
    live: { 
      turnover: totals.turnoverLive, 
      tickets: totals.ticketsLive, 
      ggr: totals.ggrLive,
      payout: payoutLive,
      gwm: gwmLive,
      pct: totals.turnover > 0 ? Math.round(totals.turnoverLive / totals.turnover * 1000) / 10 : 0 
    },
    // Breakdowns
    topSports,
    topManifestazioni,
    numEventi,
    topScommesse,
    topPuntiVendita,
    ageData,
    channelPerformance: chanPerf,
    // Additional insights
    calcioPct: calcioPctCalc,
    multiple3plusPct,
    singolePct: singole ? Math.round(singole.turnover / totals.turnover * 1000) / 10 : 0
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY MONTH DATA PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════════
const processDailyMonthData = (files, monthKey, monthLabel) => {
  const meseTotal = files.meseTotal || []
  const mesePadre = files.meseTotalPadre || []
  const mese2 = files.mese2 || []

  // cellDates:true converts Excel serial numbers to Date objects
  // So we check for both number AND Date, and use normalizeDate as validator
  const isDataRow = r => {
    const d = r["Data"]
    return d != null && (typeof d === 'number' || d instanceof Date || (typeof d === 'string' && normalizeDate(d) !== null))
  }

  // ── Parse Mese_Total: daily rows (turnover, ggr, tickets, conti attivi) ──
  const dailyRows = meseTotal.filter(isDataRow)

  const totalDailyMap = {}
  dailyRows.forEach(r => {
    const dateKey = normalizeDate(r["Data"])
    if (!dateKey) return
    totalDailyMap[dateKey] = {
      turnover: parseNum(r["Giocato"]) || 0,
      vinto: parseNum(r["vinto"]) || 0,
      ggr: parseNum(r["ggr"]) || 0,
      payout: parseNum(String(r["% payout"] || "0").replace(",", ".")) || 0,
      betBonus: parseNum(r["bet bonus"]) || 0,
      numTicket: parseNum(r["num ticket"]) || 0,
      contiAttivi: parseNum(r["conti attivi"]) || 0
    }
  })

  // ── Parse Mese_2: daily rows (REG, FTDs, Deposits, Withdrawals, Logins, Bonus) ──
  const mese2Rows = mese2.filter(isDataRow)
  const mese2DailyMap = {}
  mese2Rows.forEach(r => {
    const dateKey = normalizeDate(r["Data"])
    if (!dateKey) return
    mese2DailyMap[dateKey] = {
      registrations: parseNum(r["Registrati AAMS"]) || 0,
      ftds: parseNum(r["Primo deposito"]) || 0,
      deposits: parseNum(r["Importo depositi"]) || 0,
      withdrawals: parseNum(r["Importo prelievi processati"]) || 0,
      logins: parseNum(r["Login"]) || 0,
      bonus: parseNum(r["Importo bonus"]) || 0,
      depositanti: parseNum(r["Depositanti unici"]) || 0,
      importoPrimoDeposito: parseNum(r["Importo primo deposito"]) || 0
    }
  })

  // ── Merge daily data from both sources ──
  const allDateKeys = [...new Set([...Object.keys(totalDailyMap), ...Object.keys(mese2DailyMap)])].sort()
  const dailyStats = allDateKeys.map(dateKey => {
    const t = totalDailyMap[dateKey] || {}
    const m = mese2DailyMap[dateKey] || {}
    return {
      dateKey,
      date: formatDateLabel(dateKey),
      // From Mese_Total
      turnover: t.turnover || 0,
      vinto: t.vinto || 0,
      ggr: t.ggr || 0,
      payout: t.payout || 0,
      betBonus: t.betBonus || 0,
      numTicket: t.numTicket || 0,
      contiAttivi: t.contiAttivi || 0,
      // From Mese_2
      registrations: m.registrations || 0,
      ftds: m.ftds || 0,
      deposits: m.deposits || 0,
      withdrawals: m.withdrawals || 0,
      logins: m.logins || 0,
      bonus: m.bonus || 0
    }
  })

  // Monthly totals (sum daily for all additive KPIs)
  const turnover = dailyStats.reduce((s, d) => s + d.turnover, 0)
  const ggr = dailyStats.reduce((s, d) => s + d.ggr, 0)
  const betBonus = dailyStats.reduce((s, d) => s + d.betBonus, 0)
  const numTicket = dailyStats.reduce((s, d) => s + d.numTicket, 0)
  const reg = dailyStats.reduce((s, d) => s + d.registrations, 0)
  const ftds = dailyStats.reduce((s, d) => s + d.ftds, 0)
  const dep = dailyStats.reduce((s, d) => s + d.deposits, 0)
  const wit = dailyStats.reduce((s, d) => s + d.withdrawals, 0)
  const logins = dailyStats.reduce((s, d) => s + d.logins, 0)
  const bonusMese2 = dailyStats.reduce((s, d) => s + d.bonus, 0)
  const gwm = turnover > 0 ? parseFloat((ggr / turnover * 100).toFixed(1)) : 0
  // Avg Actives = somma conti attivi giornalieri / numero giorni
  const sumDailyActives = dailyStats.reduce((s, d) => s + d.contiAttivi, 0)
  const avgActives = dailyStats.length > 0 ? Math.round(sumDailyActives / dailyStats.length) : 0

  // ── Parse Mese_Total_Padre: channel breakdown ──
  const padreDaily = mesePadre.filter(isDataRow)

  // Aggregate by channel (full month)
  const channelAgg = {}
  padreDaily.forEach(r => {
    const ch = classifyChannelPadre(r)
    if (!channelAgg[ch]) channelAgg[ch] = { channel: ch, turnover: 0, ggr: 0, betBonus: 0, numTicket: 0, _activeDays: {} }
    channelAgg[ch].turnover += parseNum(r["Giocato"]) || 0
    channelAgg[ch].ggr += parseNum(r["ggr"]) || 0
    channelAgg[ch].betBonus += parseNum(r["bet bonus"]) || 0
    channelAgg[ch].numTicket += parseNum(r["num ticket"]) || 0
    const dk = normalizeDate(r["Data"])
    if (dk) {
      if (!channelAgg[ch]._activeDays[dk]) channelAgg[ch]._activeDays[dk] = 0
      channelAgg[ch]._activeDays[dk] += parseNum(r["conti attivi"]) || 0
    }
  })
  const channelPerformance = Object.values(channelAgg).map(ch => ({
    channel: ch.channel,
    turnover: ch.turnover,
    ggr: ch.ggr,
    gwm: ch.turnover > 0 ? parseFloat((ch.ggr / ch.turnover * 100).toFixed(1)) : 0,
    betBonus: ch.betBonus,
    numTicket: ch.numTicket,
    avgDailyActives: Math.round(Object.values(ch._activeDays).reduce((s, v) => s + v, 0) / Math.max(Object.keys(ch._activeDays).length, 1))
  })).sort((a, b) => b.ggr - a.ggr)
  const totalChGgr = channelPerformance.reduce((s, c) => s + c.ggr, 0)
  channelPerformance.forEach(ch => { ch.revShare = totalChGgr > 0 ? parseFloat((ch.ggr / totalChGgr * 100).toFixed(1)) : 0 })

  // Aggregate by channel per day (for daily channel trends)
  const channelDaily = {}
  padreDaily.forEach(r => {
    const dk = normalizeDate(r["Data"])
    if (!dk) return
    const ch = classifyChannelPadre(r)
    if (!channelDaily[dk]) channelDaily[dk] = {}
    if (!channelDaily[dk][ch]) channelDaily[dk][ch] = { turnover: 0, ggr: 0 }
    channelDaily[dk][ch].turnover += parseNum(r["Giocato"]) || 0
    channelDaily[dk][ch].ggr += parseNum(r["ggr"]) || 0
  })

  return {
    monthKey,
    monthLabel,
    days: dailyStats.length,
    turnover, ggr, gwm, betBonus, numTicket,
    reg, ftds, dep, wit, logins, bonus: bonusMese2,
    netDep: dep - wit,
    conv: reg > 0 ? parseFloat((ftds / reg * 100).toFixed(1)) : 0,
    activeUsers: avgActives,
    bonusRoi: betBonus > 0 ? parseFloat((ggr / betBonus).toFixed(1)) : 0,
    bonusPctGgr: ggr > 0 ? parseFloat((betBonus / ggr * 100).toFixed(1)) : 0,
    dailyStats,
    channelPerformance,
    channelDaily,
    _isRealDailyData: true
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG ICONS (monochrome, theme-aware)
// ═══════════════════════════════════════════════════════════════════════════════
const ICON_PATHS = {
  user: 'M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z',
  card: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V10h16v8zm0-10H4V6h16v2z',
  wallet: 'M21 7H3c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-1 8H4V9h16v6zm-3-3.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM21 4H3v2h18V4zM3 18h18v2H3v-2z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  trending: 'M16 6l2.3 2.3-5.6 5.6-4-4L2 16.6 3.4 18l5.3-5.3 4 4 7-7L22 12V6z',
  chart: 'M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z',
  users: 'M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5c0-2.3-4.7-3.5-7-3.5zm8 0c-.3 0-.6 0-1 .1 1.2.8 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z',
  lock: 'M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.7 1.4-3.1 3.1-3.1 1.7 0 3.1 1.4 3.1 3.1v2z',
  logout: 'M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z',
  sun: 'M12 7c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zM2 13h2c.6 0 1-.4 1-1s-.4-1-1-1H2c-.6 0-1 .4-1 1s.4 1 1 1zm18 0h2c.6 0 1-.4 1-1s-.4-1-1-1h-2c-.6 0-1 .4-1 1s.4 1 1 1zM11 2v2c0 .6.4 1 1 1s1-.4 1-1V2c0-.6-.4-1-1-1s-1 .4-1 1zm0 18v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1s-1 .4-1 1zM5.99 4.58a1 1 0 00-1.41 1.41l1.06 1.06a1 1 0 001.41-1.41L5.99 4.58zm12.37 12.37a1 1 0 00-1.41 1.41l1.06 1.06a1 1 0 001.41-1.41l-1.06-1.06zm1.06-12.37a1 1 0 00-1.41 0l-1.06 1.06a1 1 0 001.41 1.41l1.06-1.06a1 1 0 000-1.41zM7.05 18.36a1 1 0 00-1.41 0l-1.06 1.06a1 1 0 001.41 1.41l1.06-1.06a1 1 0 000-1.41z',
  moon: 'M12 3a9 9 0 109 9c0-.5 0-.9-.1-1.4A5.5 5.5 0 0113.4 3.1c-.5-.1-.9-.1-1.4-.1z',
  upload: 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z',
  calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z',
  box: 'M20.5 5.2l-8-3.2c-.3-.1-.7-.1-1 0l-8 3.2C3.2 5.3 3 5.6 3 6v12c0 .4.2.7.5.9l8 3.2c.2.1.3.1.5.1s.3 0 .5-.1l8-3.2c.3-.1.5-.5.5-.9V6c0-.4-.2-.7-.5-.8zM12 4l6.5 2.6L12 9.2 5.5 6.6 12 4zM5 7.8l6 2.4v9.5l-6-2.4V7.8zm8 11.9V10.2l6-2.4v9.5l-6 2.4z',
  percent: 'M7.5 11C9.4 11 11 9.4 11 7.5S9.4 4 7.5 4 4 5.6 4 7.5 5.6 11 7.5 11zm0-5C8.3 6 9 6.7 9 7.5S8.3 9 7.5 9 6 8.3 6 7.5 6.7 6 7.5 6zM16.5 13c-1.9 0-3.5 1.6-3.5 3.5s1.6 3.5 3.5 3.5 3.5-1.6 3.5-3.5-1.6-3.5-3.5-3.5zm0 5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM5.6 20L20 5.6 18.4 4 4 18.4 5.6 20z',
  casino: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 8C8.3 8 9 7.3 9 6.5S8.3 5 7.5 5 6 5.7 6 6.5 6.7 8 7.5 8zm0 11c-.8 0-1.5-.7-1.5-1.5S6.7 16 7.5 16s1.5.7 1.5 1.5S8.3 19 7.5 19zm4.5-5.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm4.5 5.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm0-11c-.8 0-1.5-.7-1.5-1.5S15.7 5 16.5 5s1.5.7 1.5 1.5S17.3 8 16.5 8z',
  sport: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 17.9V17h-2v2.9c-3.5-.4-6.4-3.2-6.9-6.7L7 13v-2l-2.9.2C4.5 7.6 7.4 4.7 11 4.1V7h2V4.1c3.6.5 6.5 3.4 7 7L17 11v2l2.9-.2c-.4 3.5-3.3 6.4-6.9 6.8v.3z',
  clock: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z',
  store: 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z',
  globe: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
}

const Icon = ({ name, size = 16, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
    <path d={ICON_PATHS[name] || ICON_PATHS.chart} />
  </svg>
)

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const KPI = ({ label, value, sub, change, delay = 0, cur = false, pct = false, icon, theme }) => {
  const C = theme
  const [vis, setVis] = useState(false)
  const [anim, setAnim] = useState(0)
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0

  useEffect(() => { setTimeout(() => setVis(true), delay) }, [delay])
  useEffect(() => {
    if (!vis) return
    const start = Date.now(), dur = 1000
    const tick = () => { const p = Math.min((Date.now() - start) / dur, 1); setAnim(numVal * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  }, [vis, numVal])

  const display = cur ? fmtCurrency(anim) : pct ? `${anim.toFixed(1)}%` : fmtNum(Math.round(anim))

  return (
    <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}`, opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(15px)', transition: 'all 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ color: C.textMuted, fontSize: 'clamp(10px, 1.1vw, 12px)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        {icon && <Icon name={icon} size={16} color={C.textMuted} />}
      </div>
      <p style={{ color: C.text, fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Oscine, system-ui' }}>{display}</p>
      {sub && <p style={{ color: C.textMuted, fontSize: 'clamp(10px, 1vw, 12px)', margin: 0 }}>{sub}</p>}
      {change && <p style={{ color: parseFloat(change) >= 0 ? C.success : C.danger, fontSize: 'clamp(11px, 1.1vw, 13px)', fontWeight: 700, margin: '6px 0 0 0' }}>{parseFloat(change) > 0 ? '▲' : '▼'} {Math.abs(parseFloat(change))}% vs prev</p>}
    </div>
  )
}

const Tip = ({ active, payload, label, theme }) => {
  const C = theme || THEMES.dark
  return active && payload?.length ? (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 14px' }}>
      <p style={{ color: C.text, margin: '0 0 6px 0', fontWeight: 700, fontSize: '13px' }}>{label}</p>
      {payload.map((e, i) => <p key={i} style={{ color: e.color, margin: '2px 0', fontSize: '12px' }}>{e.name}: <b>{typeof e.value === 'number' && e.value > 1000 ? fmtNum(e.value) : e.value}</b></p>)}
    </div>
  ) : null
}

const ChartCard = ({ title, children, height = 280, theme }) => {
  const C = theme
  return (
    <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}` }}>
      {title && <h4 style={{ color: C.textSec, margin: '0 0 16px 0', fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
    </div>
  )
}

const Table = ({ cols, data, compact = false, theme }) => {
  const C = theme
  return (
    <div style={{ overflowX: 'auto', borderRadius: '10px', border: `1px solid ${C.border}` }}>
      <table className="dazn-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: compact ? '12px' : 'clamp(12px, 1.2vw, 14px)' }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {cols.map((c, i) => <th key={i} style={{ padding: compact ? '10px 12px' : 'clamp(10px, 1.4vw, 14px) clamp(12px, 1.5vw, 18px)', textAlign: c.align || 'left', color: C.accent, fontWeight: 700, fontSize: compact ? '10px' : 'clamp(10px, 1vw, 12px)', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: `2px solid ${C.accent}` }}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((r, ri) => {
            const baseBg = r.isTotal ? C.accent + '12' : ri % 2 === 0 ? C.card : C.bg
            return (
              <tr key={ri} className={r.isTotal ? 'total-row' : ''} style={{ background: baseBg, transition: 'background 0.15s', cursor: 'default' }}>
                {cols.map((c, ci) => { const v = c.accessor ? r[c.accessor] : ''; return <td key={ci} style={{ padding: compact ? '8px 12px' : 'clamp(10px, 1.3vw, 12px) clamp(12px, 1.5vw, 18px)', textAlign: c.align || 'left', color: r.isTotal ? C.accent : C.text, fontWeight: r.isTotal ? 800 : 400, borderBottom: `1px solid ${C.border}` }}>{c.format ? c.format(v, ri, r) : v}</td> })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const Section = ({ title, children, theme, id }) => {
  const C = theme
  return (
    <section id={id} style={{ marginBottom: 'clamp(32px, 4vw, 56px)' }}>
      <div style={{ marginBottom: 'clamp(16px, 2vw, 24px)', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
        <h2 style={{ color: C.text, fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 800, margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN COMPONENT (protezione intera dashboard)
// ═══════════════════════════════════════════════════════════════════════════════
const LoginGate = ({ onLogin, theme }) => {
  const C = theme
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  const handleLogin = () => {
    if (pwd === DASHBOARD_PASSWORD) { onLogin(true); localStorage.setItem('dazn_dashboard_auth', 'true') }
    else { setError(true); setTimeout(() => setError(false), 2000) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: "Oscine, system-ui, sans-serif" }}>
      <style>{`@font-face { font-family: Oscine; src: url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Rg.woff) format("woff"), url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Rg.woff2) format("woff2"); font-weight: 400; } @font-face { font-family: Oscine; src: url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Bd.woff) format("woff"), url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Bd.woff2) format("woff2"); font-weight: 700; }`}</style>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px' }}>
        <img src="https://www.daznbet.it/external_css/DAZNBET/logo.png" alt="DAZN Bet" style={{ height: '60px', marginBottom: '40px' }} />
        <h2 style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>Weekly Trading Report</h2>
        <p style={{ color: '#888', fontSize: '14px', margin: '0 0 32px 0' }}>Enter password to access the dashboard</p>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="Password" style={{ width: '100%', background: '#111', border: `2px solid ${error ? '#FF4757' : '#333'}`, borderRadius: '10px', padding: '14px 18px', color: '#FFF', fontSize: '16px', marginBottom: '16px', textAlign: 'center', letterSpacing: '4px', outline: 'none' }} />
        {error && <p style={{ color: '#FF4757', fontSize: '13px', margin: '0 0 16px 0', fontWeight: 700 }}>Wrong password</p>}
        <button onClick={handleLogin} style={{ width: '100%', background: '#f7ff1a', color: '#000', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '16px', fontWeight: 800, cursor: 'pointer' }}>Login</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD PAGE - CON UPLOAD MASSIVO
// ═══════════════════════════════════════════════════════════════════════════════
const UploadPage = ({ weeksData, casinoWeeksData, sportWeeksData, dailyMonthsData, onUpload, onCasinoUpload, onSportUpload, onDailyUpload, onDelete, onCasinoDelete, onSportDelete, onDailyDelete, onLogout, onAdminAuth, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const [uploadAuth, setUploadAuth] = useState(false)
  const [uploadPwd, setUploadPwd] = useState('')
  const [uploadError, setUploadError] = useState(false)
  const [uploadSection, setUploadSection] = useState('main')
  const [week, setWeek] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [files, setFiles] = useState({})
  const [casinoFiles, setCasinoFiles] = useState({})
  const [sportFiles, setSportFiles] = useState({})
  const [dailyFiles, setDailyFiles] = useState({})
  const [dailyMonth, setDailyMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))
  const [dailyYear, setDailyYear] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const bulkInputRef = useRef(null)
  const casinoBulkRef = useRef(null)
  const sportBulkRef = useRef(null)
  const dailyBulkRef = useRef(null)
  const isMain = uploadSection === 'main'
  const isCasino = uploadSection === 'casino'
  const isSport = uploadSection === 'sport'
  const isDaily = uploadSection === 'daily'
  const curFILES = isMain ? FILES : isCasino ? CASINO_FILES : isSport ? SPORT_FILES : DAILY_FILES
  const curFiles = isMain ? files : isCasino ? casinoFiles : isSport ? sportFiles : dailyFiles
  const setCurFiles = isMain ? setFiles : isCasino ? setCasinoFiles : isSport ? setSportFiles : setDailyFiles
  const curWeeksData = isMain ? weeksData : isCasino ? (casinoWeeksData || {}) : isSport ? (sportWeeksData || {}) : (dailyMonthsData || {})
  const dailyMonthKey = `${dailyYear}-${dailyMonth}`
  const exists = isDaily ? (dailyMonthsData || {})[dailyMonthKey] : (week && curWeeksData[parseInt(week)])

  useEffect(() => { if (localStorage.getItem('dazn_upload_auth') === 'true') setUploadAuth(true) }, [])

  const handleUploadLogin = () => {
    if (uploadPwd === UPLOAD_PASSWORD) { setUploadAuth(true); localStorage.setItem('dazn_upload_auth', 'true'); onAdminAuth?.() }
    else { setUploadError(true); setTimeout(() => setUploadError(false), 2000) }
  }

  if (!uploadAuth) return (
    <div style={{ padding: 'clamp(40px, 5vw, 80px)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ background: C.card, borderRadius: '16px', padding: '40px', border: `1px solid ${C.border}`, maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', background: C.danger + '15', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><Icon name="lock" size={28} color={C.danger} /></div>
        <h2 style={{ color: C.text, fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>Admin Area</h2>
        <p style={{ color: C.textMuted, fontSize: '14px', margin: '0 0 32px 0' }}>Serve una password aggiuntiva per accedere all'upload</p>
        <input type="password" value={uploadPwd} onChange={e => setUploadPwd(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleUploadLogin()} placeholder="Password Upload" style={{ width: '100%', background: C.bg, border: `2px solid ${uploadError ? C.danger : C.border}`, borderRadius: '10px', padding: '14px 18px', color: C.text, fontSize: '16px', marginBottom: '16px', textAlign: 'center', letterSpacing: '4px', outline: 'none' }} />
        {uploadError && <p style={{ color: C.danger, fontSize: '13px', margin: '0 0 16px 0', fontWeight: 700 }}>Wrong password</p>}
        <button onClick={handleUploadLogin} style={{ width: '100%', background: C.primary, color: C.primaryText, border: 'none', borderRadius: '10px', padding: '14px', fontSize: '16px', fontWeight: 800, cursor: 'pointer' }}>Access Upload</button>
      </div>
    </div>
  )

  const formatDateRange = () => {
    if (!dateFrom || !dateTo) return ''
    const from = new Date(dateFrom), to = new Date(dateTo)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const fromDay = from.getDate().toString().padStart(2, '0'), toDay = to.getDate().toString().padStart(2, '0')
    if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) return `${fromDay} - ${toDay} ${months[to.getMonth()]} ${to.getFullYear()}`
    return `${fromDay} ${months[from.getMonth()]} - ${toDay} ${months[to.getMonth()]} ${to.getFullYear()}`
  }
  const dates = formatDateRange()

  const readFile = async f => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => { try { const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true }); res(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])) } catch (err) { rej(err) } }
    r.onerror = rej; r.readAsArrayBuffer(f)
  })

  const handleFile = async (e, key) => {
    const f = e.target.files[0]
    if (f) { try { const d = await readFile(f); setCurFiles(p => ({ ...p, [key]: { name: f.name, data: d, rows: d.length } })); setMsg(null) } catch { setMsg({ t: 'error', m: 'Error reading file' }) } }
  }

  // FILE MATCHING
  const matchMainFile = (fname) => {
    if (fname.includes('anagrafica2')) return 'anagrafica2'
    if (fname.includes('anagrafica_total')) return 'total'
    if (fname.includes('anagrafica_categoria')) return 'categoria'
    if (fname.includes('anagrafica_daznbet')) return 'daznbet'
    if (fname.includes('anagrafica_organic_total')) return 'organicTotal'
    if (fname.includes('anagrafica_organic')) return 'organic'
    if (fname.includes('anagrafica_skin_total')) return 'skinTotal'
    if (fname.includes('anagrafica_skin')) return 'skin'
    if (fname.includes('anagrafica_accademy') || fname.includes('anagrafica_academy')) return 'academyTotal'
    if (fname.includes('anagrafica') && !fname.includes('_')) return 'anagrafica'
    return null
  }
  const matchCasinoFile = (fname) => {
    if (fname.includes('casino_total_et') || fname.includes('casino_total_età')) return 'casinoTotalEta'
    if (fname.includes('casino_total')) return 'casinoTotal'
    if (fname.includes('casino_piattaforme')) return 'casinoPiattaforme'
    if (fname.includes('casino_categoria')) return 'casinoCategoria'
    if (fname.includes('skin_totalcasino')) return 'casinoSkinTotal'
    if (fname.includes('accademy_totalcasino') || fname.includes('academy_totalcasino')) return 'casinoAcademyTotal'
    if (fname.includes('organic_totalcasino')) return 'casinoOrganicTotal'
    if (fname.includes('daznbetcasino')) return 'casinoDaznbet'
    if (fname.includes('sessionicasino') || fname.includes('sessioni_casino')) return 'casinoSessioni'
    return null
  }
  const matchSportFile = (fname) => {
    if (fname.includes('sport_total_et') || fname.includes('sport_total_età')) return 'sportTotalEta'
    if (fname.includes('sport_total')) return 'sportTotal'
    if (fname.includes('sport_manifestazion')) return 'sportManifestazione'
    if (fname.includes('sport_numeventi') || fname.includes('sport_num_eventi')) return 'sportNumEventi'
    if (fname.includes('sport_scommesse')) return 'sportScommesse'
    if (fname.includes('sport_puntovendita') || fname.includes('sport_punto_vendita')) return 'sportPuntoVendita'
    // SKIN_Total_Sport.xlsx - Sport-specific skin data (multiple naming variants)
    if (fname.includes('skin_total_sport') || fname.includes('skin_totalsport') || fname.includes('skintotalsport') || (fname.includes('skin') && fname.includes('sport'))) return 'sportSkin'
    // Academy - both old and new names
    if (fname.includes('accademy_totalsport') || fname.includes('academy_totalsport') || fname.includes('anagrafica_accademy_total')) return 'sportAcademyTotal'
    // Organic - both old and new names
    if (fname.includes('organic_totalsport') || fname.includes('anagrafica_organic_total')) return 'sportOrganicTotal'
    // DAZNBET - both old and new names
    if (fname.includes('daznbetsport') || fname.includes('anagrafica_daznbet')) return 'sportDaznbet'
    return null
  }
  const matchDailyFile = (fname) => {
    if (fname.includes('mese_total_padre') || fname.includes('mesetotal_padre') || fname.includes('mese_totalpadre')) return 'meseTotalPadre'
    if (fname.includes('mese_2') || fname.includes('mese2')) return 'mese2'
    if (fname.includes('mese_total') || fname.includes('mesetotal')) return 'meseTotal'
    return null
  }

  // UPLOAD MASSIVO - Match file names automaticamente
  const handleBulkUpload = async (e) => {
    const fileList = Array.from(e.target.files)
    if (!fileList.length) return
    setLoading(true)
    setMsg({ t: 'info', m: `Processing ${fileList.length} files...` })
    console.log('[Sport Debug] Section:', uploadSection, 'isMain:', isMain, 'isCasino:', isCasino, 'isSport:', isSport)
    const newFiles = { ...curFiles }
    let matched = 0
    let sportMatches = 0, casinoMatches = 0, mainMatches = 0
    for (const f of fileList) {
      const fname = f.name.toLowerCase()
      // Match based on current section
      let key = isMain ? matchMainFile(fname) : isCasino ? matchCasinoFile(fname) : isSport ? matchSportFile(fname) : matchDailyFile(fname)
      
      // Track which section files belong to
      if (matchSportFile(fname)) sportMatches++
      if (matchCasinoFile(fname)) casinoMatches++
      if (matchMainFile(fname)) mainMatches++
      
      console.log('[Upload Debug] File:', f.name, '=> Key:', key, '| Section:', uploadSection)
      if (key) {
        try { const d = await readFile(f); newFiles[key] = { name: f.name, data: d, rows: d.length }; matched++ }
        catch (err) { console.error(`Error reading ${f.name}:`, err) }
      }
    }
    console.log('[Upload Debug] Matched files:', Object.keys(newFiles))
    setCurFiles(newFiles)
    setLoading(false)
    const sectionLabel = isMain ? 'General' : isCasino ? 'Casino' : isSport ? 'Sport' : 'Daily'
    if (matched === 0 && fileList.length > 0) {
      // Suggest the correct section
      let suggestion = ''
      if (sportMatches > casinoMatches && sportMatches > mainMatches) suggestion = ' These look like SPORT files!'
      else if (casinoMatches > sportMatches && casinoMatches > mainMatches) suggestion = ' These look like CASINO files!'
      else if (mainMatches > sportMatches && mainMatches > casinoMatches) suggestion = ' These look like GENERAL files!'
      setMsg({ t: 'error', m: `0 files matched for ${sectionLabel}.${suggestion}` })
    } else {
      setMsg({ t: 'success', m: `${matched}/${fileList.length} files matched for ${sectionLabel}!` })
    }
  }

  const handleUpload = async () => {
    if (isDaily) {
      // Daily month upload
      if (!dailyMonth || !dailyYear) { setMsg({ t: 'error', m: 'Select month and year' }); return }
      const missing = DAILY_FILES.filter(f => !dailyFiles[f.key])
      if (missing.length) { setMsg({ t: 'error', m: `${missing.length} files missing: ${missing.map(f => f.name).join(', ')}` }); return }
      setLoading(true)
      try {
        const fd = {}; Object.entries(dailyFiles).forEach(([k, v]) => fd[k] = v.data)
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        const mLabel = `${monthNames[parseInt(dailyMonth) - 1]} ${dailyYear}`
        const proc = processDailyMonthData(fd, dailyMonthKey, mLabel)
        await onDailyUpload(proc)
        setMsg({ t: 'success', m: `${mLabel} uploaded! (${proc.days} days)` })
        setDailyFiles({})
      } catch (err) { console.error(err); setMsg({ t: 'error', m: 'Error: ' + err.message }) }
      setLoading(false)
      return
    }
    if (!week || !dateFrom || !dateTo) { setMsg({ t: 'error', m: 'Enter week number and select dates' }); return }
    const missing = curFILES.filter(f => !curFiles[f.key])
    console.log('[Sport Debug] Upload - Section:', uploadSection)
    console.log('[Sport Debug] Required files:', curFILES.map(f => f.key))
    console.log('[Sport Debug] Loaded files:', Object.keys(curFiles))
    console.log('[Sport Debug] Missing:', missing.map(f => f.key))
    if (missing.length) { setMsg({ t: 'error', m: `${missing.length} files missing: ${missing.map(f => f.name).join(', ')}` }); return }
    setLoading(true)
    try {
      const fd = {}; Object.entries(curFiles).forEach(([k, v]) => fd[k] = v.data)
      console.log('[Sport Debug] Processing with keys:', Object.keys(fd))
      const proc = isMain ? processData(fd, parseInt(week), dates) : isCasino ? processCasinoData(fd, parseInt(week), dates) : processSportData(fd, parseInt(week), dates)
      console.log('[Sport Debug] Processed result:', proc)
      if (isMain) await onUpload(proc)
      else if (isCasino) await onCasinoUpload(proc)
      else await onSportUpload(proc)
      setMsg({ t: 'success', m: exists ? `Week ${week} updated!` : `Week ${week} uploaded!` })
      setWeek(''); setDateFrom(''); setDateTo(''); setCurFiles({})
    } catch (err) { console.error(err); setMsg({ t: 'error', m: 'Error: ' + err.message }) }
    setLoading(false)
  }

  const handleLogout = () => { localStorage.removeItem('dazn_upload_auth'); onLogout() }
  const uploadedCount = Object.keys(curFiles).length
  const totalRequired = curFILES.length

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <Section title="Upload Week Data" theme={C}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[{ id: 'main', label: 'Main Dashboard', icon: 'chart' }, { id: 'casino', label: 'Casino', icon: 'casino' }, { id: 'sport', label: 'Sport', icon: 'sport' }, { id: 'daily', label: 'Daily', icon: 'calendar' }].map(s => (
              <button key={s.id} onClick={() => { setUploadSection(s.id); setMsg(null) }} style={{ background: uploadSection === s.id ? C.primary : 'transparent', color: uploadSection === s.id ? C.primaryText : C.textSec, border: `1px solid ${uploadSection === s.id ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name={s.icon} size={14} color={uploadSection === s.id ? C.primaryText : C.textSec} />{!mob && s.label}</button>
            ))}
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="logout" size={14} color={C.danger} /> Logout</button>
        </div>
        
        {/* UPLOAD MASSIVO - Separate inputs for each section */}
        <div style={{ background: C.primary + '10', border: `2px dashed ${C.primary}`, borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <h3 style={{ color: C.accent, margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Icon name="upload" size={18} color={C.accent} /> Bulk Upload {isCasino ? '(Casino)' : isSport ? '(Sport)' : isDaily ? '(Daily / Monthly)' : ''}</h3>
          <p style={{ color: C.textMuted, fontSize: '13px', margin: '0 0 16px 0' }}>Select all {totalRequired} Excel files at once — they will be matched automatically</p>
          {isMain && <input ref={bulkInputRef} type="file" accept=".xlsx,.xls" multiple onChange={handleBulkUpload} style={{ display: 'none' }} />}
          {isCasino && <input ref={casinoBulkRef} type="file" accept=".xlsx,.xls" multiple onChange={handleBulkUpload} style={{ display: 'none' }} />}
          {isSport && <input ref={sportBulkRef} type="file" accept=".xlsx,.xls" multiple onChange={handleBulkUpload} style={{ display: 'none' }} />}
          {isDaily && <input ref={dailyBulkRef} type="file" accept=".xlsx,.xls" multiple onChange={handleBulkUpload} style={{ display: 'none' }} />}
          <button onClick={() => {
            if (isMain) bulkInputRef.current?.click();
            else if (isCasino) casinoBulkRef.current?.click();
            else if (isSport) sportBulkRef.current?.click();
            else if (isDaily) dailyBulkRef.current?.click();
          }} disabled={loading} style={{ background: C.primary, color: C.primaryText, border: 'none', borderRadius: '8px', padding: '12px 32px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Processing...' : 'Select All Files'}
          </button>
        </div>

        {isDaily ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Month</label>
              <select value={dailyMonth} onChange={e => setDailyMonth(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                  <option key={m} value={m}>{['January','February','March','April','May','June','July','August','September','October','November','December'][i]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Year</label>
              <select value={dailyYear} onChange={e => setDailyYear(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Preview</label>
              <div style={{ background: C.card, border: `1px solid ${exists ? C.orange : C.primary}`, borderRadius: '8px', padding: '12px', color: exists ? C.orange : C.accent, fontSize: '14px', fontWeight: 700 }}>
                📅 {dailyMonthKey}{exists ? ' ⚠ Will overwrite' : ''}
              </div>
            </div>
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Week</label>
            <input type="number" value={week} onChange={e => setWeek(e.target.value)} placeholder="e.g. 6" style={{ width: '100%', background: C.bg, border: `1px solid ${exists ? C.orange : C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '16px', fontWeight: 700 }} />
            {exists && <p style={{ color: C.orange, fontSize: '11px', marginTop: '6px' }}>⚠ Will overwrite</p>}
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer', colorScheme: C.bg === '#000000' ? 'dark' : 'light' }} />
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer', colorScheme: C.bg === '#000000' ? 'dark' : 'light' }} />
          </div>
          {dates && <div><label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Preview</label><div style={{ background: C.card, border: `1px solid ${C.primary}`, borderRadius: '8px', padding: '12px', color: C.accent, fontSize: '14px', fontWeight: 700 }}>{dates}</div></div>}
        </div>
        )}

        <details style={{ marginBottom: '24px' }}>
          <summary style={{ color: C.textSec, fontSize: '13px', cursor: 'pointer', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="box" size={14} color={C.textSec} /> Single File Upload (click to expand)</summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {curFILES.map((f, i) => {
              const up = curFiles[f.key]
              return (
                <div key={f.key} style={{ background: C.card, borderRadius: '10px', padding: '14px', border: `1px solid ${up ? C.success : C.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: up ? C.success : C.text, fontWeight: 700, fontSize: '13px' }}>{up ? '✓' : '○'} {f.name}</span>
                    {up && <span style={{ color: C.success, fontSize: '10px', background: C.successDim, padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>{up.rows}</span>}
                  </div>
                  <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 8px 0' }}>{f.path}</p>
                  <input type="file" accept=".xlsx,.xls" onChange={e => handleFile(e, f.key)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px', color: C.text, fontSize: '11px', cursor: 'pointer' }} />
                </div>
              )
            })}
          </div>
        </details>

        {msg && <div style={{ background: msg.t === 'success' ? C.successDim : msg.t === 'error' ? C.dangerDim : C.card, border: `1px solid ${msg.t === 'success' ? C.success : msg.t === 'error' ? C.danger : C.primary}`, borderRadius: '8px', padding: '12px', marginBottom: '16px' }}><p style={{ color: msg.t === 'success' ? C.success : msg.t === 'error' ? C.danger : C.primary, margin: 0, fontWeight: 700, fontSize: '13px' }}>{msg.m}</p></div>}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '40px' }}>
          <button onClick={handleUpload} disabled={loading || uploadedCount < totalRequired} style={{ background: uploadedCount >= totalRequired ? C.primary : C.border, color: C.primaryText, border: 'none', borderRadius: '8px', padding: '14px 32px', fontSize: '14px', fontWeight: 800, cursor: uploadedCount >= totalRequired ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Processing...' : isDaily ? (exists ? `Update ${dailyMonthKey}` : `Upload ${dailyMonthKey}`) : exists ? `Update Week ${week}` : `Upload Week ${week || '?'}`}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '120px', height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${(uploadedCount / totalRequired) * 100}%`, height: '100%', background: C.primary, transition: 'width 0.3s' }} /></div>
            <span style={{ color: uploadedCount >= totalRequired ? C.success : C.textMuted, fontSize: '13px', fontWeight: 700 }}>{uploadedCount}/{totalRequired}</span>
          </div>
        </div>

        {Object.keys(curWeeksData).length > 0 && (
          <>
            <h3 style={{ color: C.text, fontSize: '16px', margin: '0 0 16px 0', fontWeight: 700 }}>{isDaily ? 'Uploaded Months (Daily)' : `Uploaded Weeks ${isCasino ? '(Casino)' : isSport ? '(Sport)' : ''}`}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {isDaily ? (
                Object.values(curWeeksData).sort((a, b) => (b.monthKey || '').localeCompare(a.monthKey || '')).map(m => (
                  <div key={m.monthKey} style={{ background: C.card, borderRadius: '10px', padding: '16px', border: `1px solid ${C.border}`, position: 'relative' }}>
                    <button onClick={() => onDailyDelete(m.monthKey)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: C.danger, border: 'none', fontSize: '14px', cursor: 'pointer', opacity: 0.6 }}>✕</button>
                    <h4 style={{ color: C.accent, margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800 }}>📅 {m.monthLabel}</h4>
                    <p style={{ color: C.textMuted, margin: '0 0 12px 0', fontSize: '12px' }}>{m.days} days • Real daily data</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div><span style={{ color: C.textMuted }}>Turnover</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtCurrency(m.turnover)}</p></div>
                      <div><span style={{ color: C.textMuted }}>GGR</span><p style={{ color: C.success, margin: 0, fontWeight: 700 }}>{fmtCurrency(m.ggr)}</p></div>
                      <div><span style={{ color: C.textMuted }}>GWM</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{m.gwm}%</p></div>
                      <div><span style={{ color: C.textMuted }}>Actives</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtNum(m.activeUsers)}</p></div>
                    </div>
                  </div>
                ))
              ) : (
              Object.values(curWeeksData).sort((a, b) => b.weekNumber - a.weekNumber).map(w => (
                <div key={w.weekNumber} style={{ background: C.card, borderRadius: '10px', padding: '16px', border: `1px solid ${C.border}`, position: 'relative' }}>
                  <button onClick={() => isMain ? onDelete(w.weekNumber) : isCasino ? onCasinoDelete(w.weekNumber) : onSportDelete(w.weekNumber)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: C.danger, border: 'none', fontSize: '14px', cursor: 'pointer', opacity: 0.6 }}>✕</button>
                  <h4 style={{ color: C.accent, margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800 }}>W{w.weekNumber}</h4>
                  <p style={{ color: C.textMuted, margin: '0 0 12px 0', fontSize: '12px' }}>{w.dateRange}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    {isMain ? (<>
                      <div><span style={{ color: C.textMuted }}>REG</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtNum(w.registrations)}</p></div>
                      <div><span style={{ color: C.textMuted }}>FTDs</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtNum(w.ftds)}</p></div>
                    </>) : (<>
                      <div><span style={{ color: C.textMuted }}>Turnover</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtCurrency(w.turnover)}</p></div>
                      <div><span style={{ color: C.textMuted }}>ARPU</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtCurrency(w.arpu)}</p></div>
                    </>)}
                    <div><span style={{ color: C.textMuted }}>GGR</span><p style={{ color: C.success, margin: 0, fontWeight: 700 }}>{fmtCurrency(w.ggr)}</p></div>
                    <div><span style={{ color: C.textMuted }}>Actives</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtNum(w.activeUsers)}</p></div>
                  </div>
                </div>
              ))
              )}
            </div>
          </>
        )}
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERAL SUMMARY — ALL + MONTH (Calendar) + CUSTOM
// ═══════════════════════════════════════════════════════════════════════════════
const Monthly = ({ weeksData, dailyMonthsData = {}, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const allWeeks = Object.values(weeksData).sort((a, b) => a.weekNumber - b.weekNumber)
  
  const [filterMode, setFilterMode] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [qaChannel, setQaChannel] = useState('ALL')

  if (!allWeeks.length && !Object.keys(dailyMonthsData).length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>No data available</p></div>

  // ── Build calendar month options from dailyStats ──
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const calendarMonths = {}
  allWeeks.forEach(w => {
    (w.dailyStats || []).forEach(d => {
      if (!d.dateKey) return
      const ym = d.dateKey.substring(0, 7) // "YYYY-MM"
      if (!calendarMonths[ym]) {
        const [y, m] = ym.split('-')
        calendarMonths[ym] = { key: ym, label: `${monthNames[parseInt(m) - 1]} ${y}`, year: parseInt(y), month: parseInt(m) }
      }
    })
  })
  const calMonthOptions = Object.values(calendarMonths).sort((a, b) => a.key.localeCompare(b.key))
  // Also add months from dailyMonthsData that might not be in weekly data
  Object.values(dailyMonthsData).forEach(dm => {
    if (dm.monthKey && !calendarMonths[dm.monthKey]) {
      const [y, m] = dm.monthKey.split('-')
      calMonthOptions.push({ key: dm.monthKey, label: dm.monthLabel || `${monthNames[parseInt(m) - 1]} ${y}`, year: parseInt(y), month: parseInt(m) })
    }
  })
  calMonthOptions.sort((a, b) => a.key.localeCompare(b.key))

  // ── Aggregazione helper ──
  const aggregateWeeks = (weeks) => {
    if (!weeks || !weeks.length) return null
    
    const reg = weeks.reduce((s, w) => s + (w.registrations || 0), 0)
    const ftds = weeks.reduce((s, w) => s + (w.ftds || 0), 0)
    const dep = weeks.reduce((s, w) => s + (w.totalDeposits || 0), 0)
    const wit = weeks.reduce((s, w) => s + (w.totalWithdrawals || 0), 0)
    const turn = weeks.reduce((s, w) => s + (w.turnover || 0), 0)
    const ggr = weeks.reduce((s, w) => s + (w.ggr || 0), 0)
    const bonus = weeks.reduce((s, w) => s + (w.totalBonus || 0), 0)
    const logins = weeks.reduce((s, w) => s + (w.totalLogins || 0), 0)
    const avgAct = Math.round(weeks.reduce((s, w) => s + (w.activeUsers || 0), 0) / weeks.length)

    const qualityAgg = {}
    weeks.forEach(w => (w.qualityAcquisition || []).forEach(ch => {
      if (ch.isTotal) return
      if (!qualityAgg[ch.channel]) qualityAgg[ch.channel] = { channel: ch.channel, reg: 0, ftds: 0 }
      qualityAgg[ch.channel].reg += ch.reg || 0
      qualityAgg[ch.channel].ftds += ch.ftds || 0
    }))
    const qualityData = Object.values(qualityAgg).map(ch => ({
      ...ch, conv: ch.reg > 0 ? parseFloat((ch.ftds / ch.reg * 100).toFixed(1)) : 0
    })).sort((a, b) => b.reg - a.reg)
    const qTotals = { channel: 'TOTALI', isTotal: true, reg: qualityData.reduce((s, c) => s + c.reg, 0), ftds: qualityData.reduce((s, c) => s + c.ftds, 0) }
    qTotals.conv = qTotals.reg > 0 ? parseFloat((qTotals.ftds / qTotals.reg * 100).toFixed(1)) : 0
    qualityData.push(qTotals)

    const channelAgg = {}
    weeks.forEach(w => (w.channelPerformance || []).forEach(ch => {
      if (!channelAgg[ch.channel]) channelAgg[ch.channel] = { channel: ch.channel, turnover: 0, ggr: 0, actives: 0 }
      channelAgg[ch.channel].turnover += ch.turnover || 0
      channelAgg[ch.channel].ggr += ch.ggr || 0
      channelAgg[ch.channel].actives += ch.actives || 0
    }))
    const channelData = Object.values(channelAgg).map(ch => ({
      ...ch, gwm: ch.turnover > 0 ? parseFloat((ch.ggr / ch.turnover * 100).toFixed(1)) : 0,
      actives: Math.round(ch.actives / weeks.length)
    })).sort((a, b) => b.ggr - a.ggr)
    const totalChGgr = channelData.reduce((s, c) => s + c.ggr, 0)
    channelData.forEach(ch => { ch.revShare = totalChGgr > 0 ? parseFloat((ch.ggr / totalChGgr * 100).toFixed(1)) : 0 })

    const productAgg = {}
    weeks.forEach(w => (w.productPerformance || []).forEach(p => {
      if (!productAgg[p.product]) productAgg[p.product] = { product: p.product, turnover: 0, ggr: 0, actives: 0 }
      productAgg[p.product].turnover += p.turnover || 0
      productAgg[p.product].ggr += p.ggr || 0
      productAgg[p.product].actives += p.actives || 0
    }))
    const productData = Object.values(productAgg).map(p => ({
      ...p, actives: Math.round(p.actives / weeks.length)
    })).sort((a, b) => b.ggr - a.ggr)

    let totalMale = 0, totalFemale = 0
    weeks.forEach(w => {
      const d = w.demographics
      if (d) {
        if (d._maleCount != null) { totalMale += d._maleCount; totalFemale += d._femaleCount }
        else { totalMale += Math.round((d.male || 0) / 100 * (w.registrations || 0)); totalFemale += Math.round((d.female || 0) / 100 * (w.registrations || 0)) }
      }
    })
    const totalGender = totalMale + totalFemale

    const ageAcc = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0 }
    weeks.forEach(w => {
      (w.ageGroups || []).forEach(ag => {
        if (ag.count != null) ageAcc[ag.range] = (ageAcc[ag.range] || 0) + ag.count
        else ageAcc[ag.range] = (ageAcc[ag.range] || 0) + Math.round((ag.percent || 0) / 100 * (w.registrations || 0))
      })
    })
    const totalAgeCount = Object.values(ageAcc).reduce((s, v) => s + v, 0)
    const aggAge = Object.entries(ageAcc).map(([range, count]) => ({ range, count, percent: totalAgeCount > 0 ? Math.round(count / totalAgeCount * 100) : 0 }))

    return {
      weeks, weekCount: weeks.length, reg, ftds, dep, wit, turn, ggr, bonus, logins, avgAct,
      netDep: dep - wit,
      conv: reg > 0 ? parseFloat((ftds / reg * 100).toFixed(1)) : 0,
      gwm: turn > 0 ? parseFloat((ggr / turn * 100).toFixed(1)) : 0,
      bonusRoi: bonus > 0 ? parseFloat((ggr / bonus).toFixed(1)) : 0,
      bonusPctGgr: ggr > 0 ? parseFloat((bonus / ggr * 100).toFixed(1)) : 0,
      qualityData, channelData, productData,
      gender: { male: totalGender > 0 ? Math.round(totalMale / totalGender * 100) : 0, female: totalGender > 0 ? Math.round(totalFemale / totalGender * 100) : 0, _maleCount: totalMale, _femaleCount: totalFemale },
      ageGroups: aggAge
    }
  }

  // ── Calcola dati correnti ──
  let current, periodLabel
  
  if (filterMode === 'all') {
    current = aggregateWeeks(allWeeks)
    periodLabel = `All Weeks (${allWeeks.length})`
  } else if (filterMode === 'custom') {
    const from = parseInt(customFrom), to = parseInt(customTo)
    const filtered = allWeeks.filter(w => w.weekNumber >= from && w.weekNumber <= to)
    current = aggregateWeeks(filtered.length ? filtered : allWeeks)
    periodLabel = customFrom && customTo ? `Week ${customFrom} - ${customTo}` : `All Weeks`
  } else if (filterMode === 'month' && selectedMonth) {
    const ym = selectedMonth
    const realDaily = dailyMonthsData[ym]

    if (realDaily && realDaily._isRealDailyData) {
      // ═══ ALL DATA FROM DAILY FILES — NO WEEKLY FALLBACK ═══
      current = {
        weeks: [],
        weekCount: 0,
        // From Mese_Total (precise daily)
        turnover: realDaily.turnover,
        turn: realDaily.turnover,
        ggr: realDaily.ggr,
        gwm: realDaily.gwm,
        betBonus: realDaily.betBonus,
        numTicket: realDaily.numTicket,
        activeUsers: realDaily.activeUsers,
        avgAct: realDaily.activeUsers,
        // From Mese_2 (precise daily)
        reg: realDaily.reg || 0,
        ftds: realDaily.ftds || 0,
        dep: realDaily.dep || 0,
        wit: realDaily.wit || 0,
        netDep: realDaily.netDep || 0,
        bonus: realDaily.bonus || 0,
        logins: realDaily.logins || 0,
        conv: realDaily.conv || 0,
        bonusRoi: realDaily.bonusRoi || 0,
        bonusPctGgr: realDaily.bonusPctGgr || 0,
        // Channel performance from Padre file (precise)
        channelData: realDaily.channelPerformance || [],
        qualityData: [],
        productData: [],
        gender: { male: 0, female: 0, _maleCount: 0, _femaleCount: 0 },
        ageGroups: [],
        // Real daily chart data
        _isRealDailyData: true,
        _dailyStats: realDaily.dailyStats,
        _channelDaily: realDaily.channelDaily,
        _isCalendarMonth: true,
        _monthDays: realDaily.dailyStats
      }
      periodLabel = realDaily.monthLabel || ym
    } else {
      // No daily data uploaded for this month
      current = null
      const mo = calMonthOptions.find(m => m.key === ym)
      periodLabel = mo ? mo.label : ym
    }
  }

  if (filterMode === 'month' && !selectedMonth) {
    current = null
    periodLabel = 'Select a month'
  }

  if (!current) return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <div id="general-report" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {['all', 'month', 'custom'].map(mode => (
            <button key={mode} onClick={() => setFilterMode(mode)} style={{ background: filterMode === mode ? C.primary : 'transparent', color: filterMode === mode ? C.primaryText : C.textSec, border: `1px solid ${filterMode === mode ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>{mode}</button>
          ))}
          {filterMode === 'month' && (
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              <option value="">Select month...</option>
              {calMonthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          )}
        </div>
        <div style={{ padding: '60px 20px', textAlign: 'center', background: C.card, borderRadius: '12px', border: `1px dashed ${C.border}` }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <p style={{ color: C.text, fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0' }}>{filterMode === 'month' && selectedMonth ? `No daily data for ${periodLabel}` : 'Select a month'}</p>
          <p style={{ color: C.textMuted, fontSize: '13px', margin: 0 }}>{filterMode === 'month' && selectedMonth ? 'Upload the 3 monthly files from the Daily section in Admin' : 'Choose a month to view real daily data'}</p>
        </div>
      </div>
    </div>
  )

  // Chart data — use real daily data if available, otherwise weekly trend
  let trend, cashFlowTrend, bonusTrend, dailyTurnoverTrend
  if (current._isRealDailyData && current._dailyStats) {
    const ds = current._dailyStats
    trend = ds.map(d => ({ week: d.date, REG: d.registrations || 0, FTDs: d.ftds || 0 }))
    dailyTurnoverTrend = ds.map(d => ({
      week: d.date,
      Turnover: Math.round(d.turnover / 1000),
      GGR: Math.round(d.ggr / 1000),
      Attivi: d.contiAttivi,
      REG: d.registrations || 0,
      FTDs: d.ftds || 0
    }))
    cashFlowTrend = ds.map(d => ({
      week: d.date,
      Deposits: d.deposits || 0,
      Withdrawals: d.withdrawals || 0,
      NetDeposit: (d.deposits || 0) - (d.withdrawals || 0)
    }))
    bonusTrend = ds.map(d => ({ week: d.date, Bonus: d.betBonus || 0 }))
  } else {
    trend = (current.weeks || []).map(w => ({ week: `W${w.weekNumber}`, REG: w.registrations, FTDs: w.ftds, GGR: Math.round(w.ggr / 1000), Actives: w.activeUsers }))
    cashFlowTrend = (current.weeks || []).map(w => ({ week: `W${w.weekNumber}`, Deposits: w.totalDeposits || 0, Withdrawals: w.totalWithdrawals || 0, NetDeposit: (w.totalDeposits || 0) - (w.totalWithdrawals || 0) }))
    bonusTrend = (current.weeks || []).map(w => ({ week: `W${w.weekNumber}`, Bonus: w.totalBonus || 0 }))
    dailyTurnoverTrend = null
  }

  // QA per-week comparison
  const qaWeeks = (current.weeks || []).slice(-10)
  const qaChannelList = (current.qualityData || []).filter(c => !c.isTotal).map(c => c.channel)
  const qaCompareData = qaWeeks.map(w => {
    const qa = w.qualityAcquisition || []
    if (qaChannel === 'ALL') {
      const totRow = qa.find(c => c.isTotal)
      const regSum = totRow ? (totRow.reg || 0) : qa.filter(c => !c.isTotal).reduce((s, c) => s + (c.reg || 0), 0)
      const ftdSum = totRow ? (totRow.ftds || 0) : qa.filter(c => !c.isTotal).reduce((s, c) => s + (c.ftds || 0), 0)
      return { week: `W${w.weekNumber}`, REG: regSum, FTDs: ftdSum }
    }
    const ch = qa.find(c => c.channel === qaChannel)
    return { week: `W${w.weekNumber}`, REG: ch ? (ch.reg || 0) : 0, FTDs: ch ? (ch.ftds || 0) : 0 }
  })

  const weekNums = allWeeks.map(w => w.weekNumber)

  return (
    <div id="general-report" style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      {/* ═══ FILTER BAR ═══ */}
      <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}`, marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'month', 'custom'].map(mode => (
            <button key={mode} onClick={() => setFilterMode(mode)} style={{ background: filterMode === mode ? C.primary : 'transparent', color: filterMode === mode ? C.primaryText : C.textSec, border: `1px solid ${filterMode === mode ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>{mode}</button>
          ))}
        </div>

        {filterMode === 'month' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              <option value="">Select month...</option>
              {calMonthOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
        )}

        {filterMode === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: C.textMuted, fontSize: '12px' }}>Da Week</span>
            <select value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}><option value="">--</option>{weekNums.map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span style={{ color: C.textMuted, fontSize: '12px' }}>a Week</span>
            <select value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}><option value="">--</option>{weekNums.map(n => <option key={n} value={n}>{n}</option>)}</select>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: C.accent, fontSize: '14px', fontWeight: 800 }}>{periodLabel}</span>
          <span style={{ color: C.textMuted, fontSize: '11px', background: C.bg, padding: '4px 10px', borderRadius: '4px', fontWeight: 700 }}>{current._isRealDailyData ? `${current._dailyStats?.length || 0} days` : `${current.weekCount || 0}w`}</span>
          {current._isRealDailyData && <span style={{ color: C.success, fontSize: '10px', fontWeight: 700, background: C.successDim, padding: '3px 8px', borderRadius: '4px' }}>📊 Real Daily Data</span>}
        </div>
      </div>

      {/* ═══ TRADING SUMMARY ═══ */}
      <Section title="Trading Summary" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          <KPI label="Total REG" value={current.reg} icon="user" delay={0} theme={C} />
          <KPI label="Total FTDs" value={current.ftds} sub={`Conv: ${current.conv}%`} icon="card" delay={50} theme={C} />
          <KPI label="Net Deposit" value={current.netDep} cur icon="wallet" delay={100} theme={C} />
          <KPI label="Turnover" value={current.turn} cur icon="activity" delay={150} theme={C} />
          <KPI label="GGR" value={current.ggr} sub={`GWM: ${current.gwm}%`} cur icon="trending" delay={200} theme={C} />
          <KPI label="Avg Actives" value={current.avgAct} icon="users" delay={250} theme={C} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          {dailyTurnoverTrend ? (
            <>
              <ChartCard title="Daily Turnover & GGR (€K)" theme={C}>
                <ComposedChart data={dailyTurnoverTrend}><defs><linearGradient id="gTurn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} interval={2} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="Turnover" stroke={C.primary} fill="url(#gTurn)" strokeWidth={2} name="Turnover €K" /><Line type="monotone" dataKey="GGR" stroke={C.success} strokeWidth={2} dot={{ fill: C.success, r: 2 }} name="GGR €K" /></ComposedChart>
              </ChartCard>
              <ChartCard title="Daily REG & FTDs" theme={C}>
                <AreaChart data={dailyTurnoverTrend}><defs><linearGradient id="gRd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient><linearGradient id="gFd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.3} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} interval={2} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="REG" stroke={C.blue} fill="url(#gRd)" strokeWidth={2} /><Area type="monotone" dataKey="FTDs" stroke={C.success} fill="url(#gFd)" strokeWidth={2} /></AreaChart>
              </ChartCard>
            </>
          ) : (
            <>
              <ChartCard title="Registration & FTD Trend" theme={C}>
                <AreaChart data={trend}><defs><linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient><linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.3} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="REG" stroke={C.primary} fill="url(#gR)" strokeWidth={2} /><Area type="monotone" dataKey="FTDs" stroke={C.success} fill="url(#gF)" strokeWidth={2} /></AreaChart>
              </ChartCard>
              <ChartCard title="GGR Trend (€K)" theme={C}>
                <ComposedChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="GGR" fill={C.primary} radius={[4, 4, 0, 0]} /><Line type="monotone" dataKey="Actives" stroke={C.blue} strokeWidth={2} dot={{ fill: C.blue, r: 3 }} /></ComposedChart>
              </ChartCard>
            </>
          )}
        </div>

        {current._isRealDailyData && current._dailyStats ? null : (
          <Table cols={[
            { header: 'Week', accessor: 'weekNumber', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>W{v}</span> },
            { header: 'Date', accessor: 'dateRange' },
            { header: 'REG', accessor: 'registrations', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'FTDs', accessor: 'ftds', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Conv%', accessor: 'conversionRate', align: 'center', format: v => <b>{v}%</b> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'GWM', accessor: 'gwm', align: 'center', format: v => <b>{v}%</b> },
            { header: 'Actives', accessor: 'activeUsers', align: 'right', format: v => <b>{fmtNum(v)}</b> }
          ]} data={current.weeks || []} theme={C} />
        )}
      </Section>

      {/* ═══ CHANNEL PERFORMANCE ═══ */}
      <Section title="Channel Performance" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'GWM', accessor: 'gwm', align: 'center', format: v => <b>{v}%</b> },
            { header: 'Rev Share', accessor: 'revShare', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{v}%</span> }
          ]} data={current.channelData} theme={C} />
          <ChartCard title="Revenue Share" height={220} theme={C}>
            <PieChart><Pie data={current.channelData.filter(c => c.revShare > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="revShare" nameKey="channel">{current.channelData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} /><Legend /></PieChart>
          </ChartCard>
        </div>
      </Section>

      {/* ═══ CASH FLOW ═══ */}
      <Section title={current._isRealDailyData ? "Daily Cash Flow" : "Weekly Cash Flow"} theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
          <ChartCard title="Deposits vs Withdrawals" height={300} theme={C}>
            <BarChart data={cashFlowTrend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend /><Bar dataKey="Deposits" fill={C.success} radius={[4, 4, 0, 0]} /><Bar dataKey="Withdrawals" fill={C.danger} radius={[4, 4, 0, 0]} /></BarChart>
          </ChartCard>
          <ChartCard title="Net Deposit Trend" height={300} theme={C}>
            <AreaChart data={cashFlowTrend}><defs><linearGradient id="netG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.4} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Area type="monotone" dataKey="NetDeposit" name="Net Deposit" stroke={C.blue} fill="url(#netG)" strokeWidth={2} /></AreaChart>
          </ChartCard>
        </div>
      </Section>

      {/* ═══ BONUS ═══ */}
      <Section title="Bonus Analysis" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <ChartCard title="Bonus Trend" height={250} theme={C}>
            <AreaChart data={bonusTrend}><defs><linearGradient id="bonusG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.4} /><stop offset="95%" stopColor={C.orange} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Area type="monotone" dataKey="Bonus" stroke={C.orange} fill="url(#bonusG)" strokeWidth={2} /></AreaChart>
          </ChartCard>
          <div style={{ background: C.card, borderRadius: '12px', padding: '24px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ color: C.textMuted, margin: '0 0 16px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Bonus Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: '20px' }}>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Total Bonus</p><p style={{ color: C.orange, fontSize: '28px', fontWeight: 900, margin: 0 }}>{fmtCurrency(current.bonus)}</p></div>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>{current._isRealDailyData ? 'Avg Daily' : 'Avg Weekly'}</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: 0 }}>{fmtCurrency(current._isRealDailyData ? current.bonus / Math.max(current._dailyStats?.length || 1, 1) : current.bonus / Math.max(current.weekCount || 1, 1))}</p></div>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Bonus ROI</p><p style={{ color: C.success, fontSize: '28px', fontWeight: 900, margin: 0 }}>{current.bonusRoi}x</p></div>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>% of GGR</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: 0 }}>{current.bonusPctGgr}%</p></div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ DAILY DATA TABLE (bottom) ═══ */}
      {current._isRealDailyData && current._dailyStats && current._dailyStats.length > 0 && (
        <Section title="Daily Breakdown" theme={C}>
          <Table cols={[
            { header: 'Date', accessor: 'date', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{v}</span> },
            { header: 'REG', accessor: 'registrations', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'FTDs', accessor: 'ftds', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Payout%', accessor: 'payout', align: 'center', format: v => <b>{v}%</b> },
            { header: 'Attivi', accessor: 'contiAttivi', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Deposits', accessor: 'deposits', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'Withdrawals', accessor: 'withdrawals', align: 'right', format: v => <b style={{ color: C.danger }}>{fmtCurrency(v)}</b> }
          ]} data={current._dailyStats} theme={C} />
        </Section>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY REPORT
// ═══════════════════════════════════════════════════════════════════════════════
const Weekly = ({ data, prev, allWeeks = {}, theme, isAdmin = false, onSaveNote }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const [qaMetric, setQaMetric] = useState('conv')
  const [dailyMetric, setDailyMetric] = useState('regftd')
  const [timeRange, setTimeRange] = useState('daily')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [qaTimeRange, setQaTimeRange] = useState('daily')
  const [qaCustomFrom, setQaCustomFrom] = useState('')
  const [qaCustomTo, setQaCustomTo] = useState('')
  const [cpTimeRange, setCpTimeRange] = useState('daily')
  const [cpCustomFrom, setCpCustomFrom] = useState('')
  const [cpCustomTo, setCpCustomTo] = useState('')
  const [cpMetric, setCpMetric] = useState('ggr')
  const [editingNote, setEditingNote] = useState(false)
  const [noteText, setNoteText] = useState('')

  useEffect(() => { if (data?.weekNote !== undefined) setNoteText(data.weekNote || ''); else setNoteText('') }, [data?.weekNumber, data?.weekNote])

  if (!data) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>Select or upload a week</p></div>

  const regCh = prev ? calcChange(data.registrations, prev.registrations) : null
  const ftdCh = prev ? calcChange(data.ftds, prev.ftds) : null
  const turnCh = prev ? calcChange(data.turnover, prev.turnover) : null
  const ggrCh = prev ? calcChange(data.ggr, prev.ggr) : null
  const actCh = prev ? calcChange(data.activeUsers, prev.activeUsers) : null
  const netDepCh = prev ? calcChange(data.netDeposit, prev.netDeposit) : null
  const gwmCh = prev ? calcChange(data.gwm, prev.gwm) : null

  // GWM Sport & Casino from productPerformance
  const SPORT_CATS = ['SCOMMESSE', 'IPPICA', 'VIRTUALI']
  const CASINO_CATS = ['CASINO', 'CASINO LIVE', 'BINGO']
  const prods = data.productPerformance || []
  const sportProds = prods.filter(p => SPORT_CATS.includes(String(p.product).toUpperCase()))
  const casinoProds = prods.filter(p => CASINO_CATS.includes(String(p.product).toUpperCase()))
  const sportTurn = sportProds.reduce((s, p) => s + (p.turnover || 0), 0)
  const sportGgr = sportProds.reduce((s, p) => s + (p.ggr || 0), 0)
  const casinoTurn = casinoProds.reduce((s, p) => s + (p.turnover || 0), 0)
  const casinoGgr = casinoProds.reduce((s, p) => s + (p.ggr || 0), 0)
  const gwmSport = sportTurn > 0 ? parseFloat((sportGgr / sportTurn * 100).toFixed(1)) : 0
  const gwmCasino = casinoTurn > 0 ? parseFloat((casinoGgr / casinoTurn * 100).toFixed(1)) : 0

  // Previous week Sport/Casino GWM for comparison
  const prevProds = prev?.productPerformance || []
  const prevSportProds = prevProds.filter(p => SPORT_CATS.includes(String(p.product).toUpperCase()))
  const prevCasinoProds = prevProds.filter(p => CASINO_CATS.includes(String(p.product).toUpperCase()))
  const prevSportTurn = prevSportProds.reduce((s, p) => s + (p.turnover || 0), 0)
  const prevSportGgr = prevSportProds.reduce((s, p) => s + (p.ggr || 0), 0)
  const prevCasinoTurn = prevCasinoProds.reduce((s, p) => s + (p.turnover || 0), 0)
  const prevCasinoGgr = prevCasinoProds.reduce((s, p) => s + (p.ggr || 0), 0)
  const prevGwmSport = prevSportTurn > 0 ? parseFloat((prevSportGgr / prevSportTurn * 100).toFixed(1)) : 0
  const prevGwmCasino = prevCasinoTurn > 0 ? parseFloat((prevCasinoGgr / prevCasinoTurn * 100).toFixed(1)) : 0

  // Helper: get sorted & filtered weeks for trend charts
  const getFilteredWeeks = (tr, cFrom, cTo) => {
    const sorted = Object.values(allWeeks).sort((a, b) => a.weekNumber - b.weekNumber)
    if (tr === 'custom' && cFrom && cTo) return sorted.filter(w => w.weekNumber >= parseInt(cFrom) && w.weekNumber <= parseInt(cTo))
    return sorted
  }
  const availWeekNums = Object.keys(allWeeks).map(Number).sort((a, b) => a - b)

  // Reusable custom week range selector
  const WeekRangeSelector = ({ from, setFrom, to, setTo }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
      <span style={{ color: C.textMuted, fontSize: '11px', fontWeight: 600 }}>From W</span>
      <select value={from} onChange={e => setFrom(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
        <option value="">--</option>
        {availWeekNums.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
      <span style={{ color: C.textMuted, fontSize: '11px', fontWeight: 600 }}>to W</span>
      <select value={to} onChange={e => setTo(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
        <option value="">--</option>
        {availWeekNums.map(w => <option key={w} value={w}>{w}</option>)}
      </select>
    </div>
  )

  // Reusable time range toggle buttons
  const TimeToggle = ({ value, onChange }) => (
    <div style={{ display: 'flex', gap: '4px' }}>
      {['daily', 'weekly', 'custom'].map(tr => (
        <button key={tr} onClick={() => onChange(tr)} style={{ background: value === tr ? C.primary : 'transparent', color: value === tr ? C.primaryText : C.textSec, border: `1px solid ${value === tr ? C.primary : C.border}`, borderRadius: '5px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>{tr}</button>
      ))}
    </div>
  )

  return (
    <div id="weekly-report" style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <Section title="Trading Summary" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <KPI label="Registrations" value={data.registrations} change={regCh} icon="user" delay={0} theme={C} />
          <KPI label="FTDs" value={data.ftds} sub={`Conv: ${data.conversionRate}% • Avg: €${data.avgFirstDeposit}`} change={ftdCh} icon="card" delay={50} theme={C} />
          <KPI label="Net Deposit" value={data.netDeposit} sub={`Dep ${fmtCurrency(data.totalDeposits)} - Wit ${fmtCurrency(data.totalWithdrawals)}`} change={netDepCh} cur icon="wallet" delay={100} theme={C} />
          <KPI label="Turnover" value={data.turnover} change={turnCh} cur icon="activity" delay={150} theme={C} />
          <KPI label="GGR" value={data.ggr} change={ggrCh} cur icon="trending" delay={200} theme={C} />
        </div>

        {/* GWM Card — General / Sport / Casino */}
        <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}`, marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: C.textMuted, fontSize: 'clamp(10px, 1.1vw, 12px)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gross Win Margin</span>
            <Icon name="chart" size={16} color={C.textMuted} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(12px, 2vw, 24px)' }}>
            {[
              { label: 'General', value: data.gwm, prev: prev?.gwm, color: C.accent },
              { label: 'Sport', value: gwmSport, prev: prev ? prevGwmSport : null, color: C.success },
              { label: 'Casino', value: gwmCasino, prev: prev ? prevGwmCasino : null, color: C.purple }
            ].map((g, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 0', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                <p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>{g.label}</p>
                <p style={{ color: g.color, fontSize: mob ? '28px' : 'clamp(28px, 3.5vw, 40px)', fontWeight: 900, margin: '0 0 4px 0', fontFamily: 'Oscine, system-ui' }}>{g.value}%</p>
                {g.prev != null && <p style={{ color: (g.value - g.prev) >= 0 ? C.success : C.danger, fontSize: '12px', fontWeight: 700, margin: 0 }}>{(g.value - g.prev) >= 0 ? '▲' : '▼'} {Math.abs(g.value - g.prev).toFixed(1)}pp</p>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.bg} 100%)`, borderRadius: '12px', padding: 'clamp(20px, 3vw, 32px)', border: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1.2fr auto', gap: 'clamp(16px, 2vw, 24px)', alignItems: 'start' }}>
          {/* LEFT — Active Users + Product breakdown */}
          <div>
            <p style={{ color: C.textMuted, fontSize: 'clamp(11px, 1.2vw, 14px)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px 0' }}>Weekly Active Users</p>
            <p style={{ color: C.accent, fontSize: mob ? '32px' : 'clamp(36px, 5vw, 48px)', fontWeight: 900, margin: 0 }}>{fmtNum(data.activeUsers)}</p>
            {actCh && <p style={{ color: parseFloat(actCh) >= 0 ? C.success : C.danger, fontSize: '13px', fontWeight: 700, margin: '6px 0 0 0' }}>{parseFloat(actCh) > 0 ? '▲' : '▼'} {Math.abs(parseFloat(actCh))}% vs prev</p>}
            <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 20px)', marginTop: '16px', flexWrap: 'wrap' }}>
              {(data.top3Products || []).map((prod, i) => {
                const prevProd = prev?.top3Products?.[i]
                const ch = prevProd && prevProd.actives > 0 ? ((prod.actives - prevProd.actives) / prevProd.actives * 100).toFixed(1) : null
                return (
                  <div key={i} style={{ minWidth: '70px' }}>
                    <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 3px 0', textTransform: 'uppercase', fontWeight: 600 }}>{prod.name}</p>
                    <p style={{ color: C.chart[i], fontSize: '20px', fontWeight: 800, margin: 0 }}>{fmtNum(prod.actives)}</p>
                    {ch && <p style={{ color: parseFloat(ch) >= 0 ? C.success : C.danger, fontSize: '10px', fontWeight: 700, margin: '2px 0 0 0' }}>{parseFloat(ch) > 0 ? '▲' : '▼'} {Math.abs(parseFloat(ch))}%</p>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* CENTER — Weekly Note */}
          <div style={{ background: C.bg, borderRadius: '10px', padding: 'clamp(14px, 2vw, 20px)', border: `1px solid ${C.border}`, minHeight: '100px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>📋 Week Note</p>
              {isAdmin && !editingNote && (
                <button onClick={() => { setEditingNote(true); setNoteText(data.weekNote || '') }} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '4px', padding: '3px 8px', fontSize: '10px', color: C.textMuted, cursor: 'pointer', fontWeight: 600 }}>✏️ Edit</button>
              )}
            </div>
            {editingNote && isAdmin ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Es: Turno infrasettimanale Serie A, Champions League MD5, Torneo Casino..."
                  style={{ flex: 1, background: C.card, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '10px', fontSize: '12px', resize: 'vertical', minHeight: '50px', fontFamily: 'inherit', outline: 'none' }}
                  maxLength={300}
                />
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingNote(false)} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '5px', padding: '5px 12px', fontSize: '11px', color: C.textMuted, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                  <button onClick={() => { onSaveNote?.(data.weekNumber, noteText); setEditingNote(false) }} style={{ background: C.primary, color: C.primaryText, border: 'none', borderRadius: '5px', padding: '5px 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
                </div>
              </div>
            ) : (
              <p style={{ color: data.weekNote ? C.text : C.textMuted, fontSize: '13px', fontWeight: data.weekNote ? 600 : 400, margin: 0, lineHeight: 1.5, fontStyle: data.weekNote ? 'normal' : 'italic', flex: 1, display: 'flex', alignItems: 'center' }}>
                {data.weekNote || 'No notes for this week'}
              </p>
            )}
          </div>

          {/* RIGHT — Logins & Bonus */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: mob ? 'flex-start' : 'center' }}>
            <div style={{ textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Logins</p><p style={{ color: C.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>{fmtNum(data.totalLogins)}</p></div>
            <div style={{ textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Bonus</p><p style={{ color: C.orange, fontSize: '20px', fontWeight: 800, margin: 0 }}>{fmtCurrency(data.totalBonus)}</p></div>
          </div>
        </div>
      </Section>

      <Section title="Financial Health" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)' }}>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}><p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Withdrawal Ratio</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>{data.financialHealth?.withdrawalRatio || 0}%</p><p style={{ color: C.textMuted, fontSize: '10px', margin: 0 }}>{fmtCurrency(data.totalWithdrawals)} / {fmtCurrency(data.totalDeposits)}</p></div>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}><p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Bonus ROI</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>{data.financialHealth?.bonusROI || 0}x</p><p style={{ color: C.textMuted, fontSize: '10px', margin: 0 }}>{fmtCurrency(data.financialHealth?._ggr)} / {fmtCurrency(data.financialHealth?._bonus)}</p></div>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}><p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Customer Value</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>{fmtCurrency(data.financialHealth?.customerValue || 0)}</p><p style={{ color: C.textMuted, fontSize: '10px', margin: 0 }}>GGR / Actives</p></div>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}><p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Login / User</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>{data.financialHealth?.loginPerUser || 0}</p><p style={{ color: C.textMuted, fontSize: '10px', margin: 0 }}>{fmtNum(data.financialHealth?._logins)} / {fmtNum(data.financialHealth?._actives)}</p></div>
        </div>
      </Section>

      <Section title="Acquisition" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <TimeToggle value={timeRange} onChange={setTimeRange} />
              <select value={dailyMetric} onChange={e => setDailyMetric(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                {[{ k: 'regftd', l: 'REG & FTDs' }, { k: 'depwit', l: 'Deposits & Withdrawals' }, { k: 'logins', l: 'Logins' }, { k: 'bonus', l: 'Bonus' }].map(o => <option key={o.k} value={o.k}>{o.l}</option>)}
              </select>
            </div>
            {timeRange === 'custom' && <WeekRangeSelector from={customFrom} setFrom={setCustomFrom} to={customTo} setTo={setCustomTo} />}
            {(() => {
              // Build chart data based on timeRange
              if (timeRange === 'daily') {
                // === DAILY VIEW (existing behavior) ===
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    {dailyMetric === 'regftd' ? (
                      <AreaChart data={data.dailyStats || []}><defs><linearGradient id="dR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.4} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient><linearGradient id="dF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.4} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="registrations" name="REG" stroke={C.primary} fill="url(#dR)" strokeWidth={2} /><Area type="monotone" dataKey="ftds" name="FTDs" stroke={C.success} fill="url(#dF)" strokeWidth={2} /></AreaChart>
                    ) : dailyMetric === 'depwit' ? (
                      <BarChart data={data.dailyStats || []}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend /><Bar dataKey="deposits" name="Deposits" fill={C.success} radius={[3, 3, 0, 0]} /><Bar dataKey="withdrawals" name="Withdrawals" fill={C.danger} radius={[3, 3, 0, 0]} /></BarChart>
                    ) : dailyMetric === 'logins' ? (
                      <AreaChart data={data.dailyStats || []}><defs><linearGradient id="dL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.4} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="logins" name="Logins" stroke={C.blue} fill="url(#dL)" strokeWidth={2} /></AreaChart>
                    ) : (
                      <AreaChart data={data.dailyStats || []}><defs><linearGradient id="dB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.4} /><stop offset="95%" stopColor={C.orange} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend /><Area type="monotone" dataKey="bonus" name="Bonus" stroke={C.orange} fill="url(#dB)" strokeWidth={2} /></AreaChart>
                    )}
                  </ResponsiveContainer>
                )
              } else {
                // === WEEKLY / CUSTOM VIEW ===
                const sortedWeeks = Object.values(allWeeks).sort((a, b) => a.weekNumber - b.weekNumber)
                let filtered = sortedWeeks
                if (timeRange === 'custom' && customFrom && customTo) {
                  const f = parseInt(customFrom), t = parseInt(customTo)
                  filtered = sortedWeeks.filter(w => w.weekNumber >= f && w.weekNumber <= t)
                }
                const weeklyData = filtered.map(w => ({
                  week: `W${w.weekNumber}`,
                  registrations: w.registrations || 0,
                  ftds: w.ftds || 0,
                  deposits: w.totalDeposits || 0,
                  withdrawals: w.totalWithdrawals || 0,
                  logins: w.totalLogins || 0,
                  bonus: w.totalBonus || 0,
                  _isCurrent: w.weekNumber === data.weekNumber
                }))
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    {dailyMetric === 'regftd' ? (
                      <AreaChart data={weeklyData}><defs><linearGradient id="wR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.4} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient><linearGradient id="wF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.4} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="registrations" name="REG" stroke={C.primary} fill="url(#wR)" strokeWidth={2} dot={{ fill: C.primary, r: 3 }} /><Area type="monotone" dataKey="ftds" name="FTDs" stroke={C.success} fill="url(#wF)" strokeWidth={2} dot={{ fill: C.success, r: 3 }} /></AreaChart>
                    ) : dailyMetric === 'depwit' ? (
                      <AreaChart data={weeklyData}><defs><linearGradient id="wD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.4} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient><linearGradient id="wW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.danger} stopOpacity={0.4} /><stop offset="95%" stopColor={C.danger} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend /><Area type="monotone" dataKey="deposits" name="Deposits" stroke={C.success} fill="url(#wD)" strokeWidth={2} dot={{ fill: C.success, r: 3 }} /><Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke={C.danger} fill="url(#wW)" strokeWidth={2} dot={{ fill: C.danger, r: 3 }} /></AreaChart>
                    ) : dailyMetric === 'logins' ? (
                      <AreaChart data={weeklyData}><defs><linearGradient id="wL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.4} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="logins" name="Logins" stroke={C.blue} fill="url(#wL)" strokeWidth={2} dot={{ fill: C.blue, r: 3 }} /></AreaChart>
                    ) : (
                      <AreaChart data={weeklyData}><defs><linearGradient id="wBo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.4} /><stop offset="95%" stopColor={C.orange} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend /><Area type="monotone" dataKey="bonus" name="Bonus" stroke={C.orange} fill="url(#wBo)" strokeWidth={2} dot={{ fill: C.orange, r: 3 }} /></AreaChart>
                    )}
                  </ResponsiveContainer>
                )
              }
            })()}
          </div>
          <ChartCard title="Top 10 Sources (Cod Punto)" height={320} theme={C}>
            <BarChart data={(data.topSources || []).slice(0, 10)} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis dataKey="name" type="category" width={mob ? 70 : 100} tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="count" fill={C.success} radius={[0, 4, 4, 0]}>{(data.topSources || []).slice(0, 10).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <h4 style={{ color: C.textMuted, margin: '0 0 16px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Gender Split</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
              <div><p style={{ color: C.text, fontSize: '36px', fontWeight: 900, margin: 0 }}>{data.demographics?.male || 0}%</p><p style={{ color: C.textMuted, fontSize: '12px', fontWeight: 600 }}>Male</p></div>
              <div style={{ width: '1px', background: C.border }} />
              <div><p style={{ color: C.text, fontSize: '36px', fontWeight: 900, margin: 0 }}>{data.demographics?.female || 0}%</p><p style={{ color: C.textMuted, fontSize: '12px', fontWeight: 600 }}>Female</p></div>
            </div>
          </div>
          <ChartCard title="Age Distribution" height={140} theme={C}>
            <BarChart data={data.ageGroups || []}><XAxis dataKey="range" tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><YAxis hide /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="percent" fill={C.primary} radius={[4, 4, 0, 0]}>{(data.ageGroups || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
          <ChartCard title="Top Provinces" height={140} theme={C}>
            <BarChart data={(data.provinces || []).slice(0, 5)} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={45} tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="count" fill={C.cyan} radius={[0, 4, 4, 0]} /></BarChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Quality Acquisition" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: (v, r) => <span style={{ fontWeight: r.isTotal ? 900 : 700, color: r.isTotal ? C.accent : C.text }}>{v}</span> },
            { header: 'REG', accessor: 'reg', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'FTDs', accessor: 'ftds', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Conv%', accessor: 'conv', align: 'center', format: (v, r) => <span style={{ color: r.isTotal ? C.accent : v >= 55 ? C.success : v >= 45 ? C.orange : C.danger, fontWeight: 800 }}>{v}%</span> },
            { header: 'Activated', accessor: 'activated', align: 'center', format: v => <b>{v}%</b> },
            { header: 'Avg Age', accessor: 'avgAge', align: 'center', format: v => <b>{v}</b> }
          ]} data={data.qualityAcquisition || []} theme={C} />
          <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ color: C.textSec, margin: 0, fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Performance KPI</h4>
              <TimeToggle value={qaTimeRange} onChange={setQaTimeRange} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <select value={qaMetric} onChange={e => setQaMetric(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                {[{ k: 'reg', l: 'Registrations' }, { k: 'ftds', l: 'FTDs' }, { k: 'conv', l: 'Conversion %' }, { k: 'activated', l: 'Activated %' }, { k: 'avgAge', l: 'Avg Age' }].map(o => <option key={o.k} value={o.k}>{o.l}</option>)}
              </select>
            </div>
            {qaTimeRange === 'custom' && <WeekRangeSelector from={qaCustomFrom} setFrom={setQaCustomFrom} to={qaCustomTo} setTo={setQaCustomTo} />}
            {(() => {
              if (qaTimeRange === 'daily') {
                // === DAILY: existing horizontal bar chart ===
                const isPct = qaMetric === 'conv' || qaMetric === 'activated'
                const sorted = (data.qualityAcquisition || []).filter(c => !c.isTotal).sort((a, b) => (b[qaMetric] || 0) - (a[qaMetric] || 0)).slice(0, 10)
                const getColor = (val) => {
                  if (qaMetric === 'conv') return val >= 55 ? C.success : val >= 45 ? C.orange : C.danger
                  if (qaMetric === 'activated') return val >= 70 ? C.success : val >= 40 ? C.orange : C.danger
                  return C.chart[0]
                }
                return (
                  <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 32)}>
                    <BarChart data={sorted} layout="vertical" barSize={16}>
                      <XAxis type="number" domain={[0, isPct ? 100 : 'auto']} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => isPct ? `${v}%` : fmtNum(v)} />
                      <YAxis dataKey="channel" type="category" width={mob ? 75 : 110} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} />
                      <Tooltip content={<Tip theme={C} />} formatter={v => isPct ? `${v}%` : fmtNum(v)} />
                      <Bar dataKey={qaMetric} name={qaMetric === 'conv' ? 'Conv%' : qaMetric === 'activated' ? 'Activated%' : qaMetric === 'avgAge' ? 'Avg Age' : qaMetric === 'ftds' ? 'FTDs' : 'REG'} fill={C.primary} radius={[0, 4, 4, 0]}>
                        {sorted.map((e, i) => <Cell key={i} fill={isPct ? getColor(e[qaMetric]) : C.chart[i % C.chart.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              } else {
                // === WEEKLY / CUSTOM: AreaChart trend per channel ===
                const weeks = getFilteredWeeks(qaTimeRange, qaCustomFrom, qaCustomTo)
                const isPct = qaMetric === 'conv' || qaMetric === 'activated'
                // Get all unique channels
                const channelSet = new Set()
                weeks.forEach(w => (w.qualityAcquisition || []).filter(c => !c.isTotal).forEach(c => channelSet.add(c.channel)))
                const channels = [...channelSet]
                // Build trend data: [{week: 'W1', PVR: 10, AFFILIATES: 5, ...}, ...]
                const trendData = weeks.map(w => {
                  const row = { week: `W${w.weekNumber}` }
                  const qa = w.qualityAcquisition || []
                  channels.forEach(ch => {
                    const found = qa.find(c => c.channel === ch)
                    row[ch] = found ? (found[qaMetric] || 0) : 0
                  })
                  return row
                })
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>{channels.map((ch, i) => (
                        <linearGradient key={ch} id={`qaG${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.chart[i % C.chart.length]} stopOpacity={0.3} /><stop offset="95%" stopColor={C.chart[i % C.chart.length]} stopOpacity={0} /></linearGradient>
                      ))}</defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} />
                      <YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => isPct ? `${v}%` : fmtNum(v)} />
                      <Tooltip content={<Tip theme={C} />} formatter={v => isPct ? `${v}%` : fmtNum(v)} />
                      <Legend />
                      {channels.map((ch, i) => (
                        <Area key={ch} type="monotone" dataKey={ch} name={ch} stroke={C.chart[i % C.chart.length]} fill={`url(#qaG${i})`} strokeWidth={2} dot={{ fill: C.chart[i % C.chart.length], r: 3 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            })()}
          </div>
        </div>
      </Section>

      <Section title="Channel Performance" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'GWM', accessor: 'gwm', align: 'center', format: v => <b>{v}%</b> },
            { header: 'Actives', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Rev Share', accessor: 'revShare', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{v}%</span> }
          ]} data={data.channelPerformance || []} theme={C} />
          <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ color: C.textSec, margin: 0, fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Channel Trend</h4>
              <TimeToggle value={cpTimeRange} onChange={setCpTimeRange} />
            </div>
            {cpTimeRange !== 'daily' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <select value={cpMetric} onChange={e => setCpMetric(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                  {[{ k: 'ggr', l: 'GGR' }, { k: 'turnover', l: 'Turnover' }, { k: 'actives', l: 'Actives' }].map(o => <option key={o.k} value={o.k}>{o.l}</option>)}
                </select>
              </div>
            )}
            {cpTimeRange === 'custom' && <WeekRangeSelector from={cpCustomFrom} setFrom={setCpCustomFrom} to={cpCustomTo} setTo={setCpCustomTo} />}
            {(() => {
              if (cpTimeRange === 'daily') {
                // === DAILY: existing PieChart ===
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={(data.channelPerformance || []).filter(c => c.revShare > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="revShare" nameKey="channel">{(data.channelPerformance || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} /><Legend /></PieChart>
                  </ResponsiveContainer>
                )
              } else {
                // === WEEKLY / CUSTOM: AreaChart trend per channel ===
                const weeks = getFilteredWeeks(cpTimeRange, cpCustomFrom, cpCustomTo)
                const isCur = cpMetric === 'ggr' || cpMetric === 'turnover'
                const channelSet = new Set()
                weeks.forEach(w => (w.channelPerformance || []).forEach(c => channelSet.add(c.channel)))
                const channels = [...channelSet]
                const trendData = weeks.map(w => {
                  const row = { week: `W${w.weekNumber}` }
                  const cp = w.channelPerformance || []
                  channels.forEach(ch => {
                    const found = cp.find(c => c.channel === ch)
                    row[ch] = found ? (found[cpMetric] || 0) : 0
                  })
                  return row
                })
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>{channels.map((ch, i) => (
                        <linearGradient key={ch} id={`cpG${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.chart[i % C.chart.length]} stopOpacity={0.3} /><stop offset="95%" stopColor={C.chart[i % C.chart.length]} stopOpacity={0} /></linearGradient>
                      ))}</defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} />
                      <YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => isCur ? fmtCurrency(v) : fmtNum(v)} />
                      <Tooltip content={<Tip theme={C} />} formatter={v => isCur ? fmtCurrency(v) : fmtNum(v)} />
                      <Legend />
                      {channels.map((ch, i) => (
                        <Area key={ch} type="monotone" dataKey={ch} name={ch} stroke={C.chart[i % C.chart.length]} fill={`url(#cpG${i})`} strokeWidth={2} dot={{ fill: C.chart[i % C.chart.length], r: 3 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )
              }
            })()}
          </div>
        </div>
      </Section>

      <Section title="Product Performance" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Product', accessor: 'product', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Payout%', accessor: 'payout', align: 'center', format: v => v ? <b>{v}%</b> : '-' },
            { header: 'Actives', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
          ]} data={data.productPerformance || []} compact theme={C} />
          <ChartCard title="GGR by Product" height={220} theme={C}>
            <BarChart data={(data.productPerformance || []).slice(0, 6)} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><YAxis dataKey="product" type="category" width={mob ? 55 : 80} tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Bar dataKey="ggr" fill={C.primary} radius={[0, 4, 4, 0]}>{(data.productPerformance || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
        </div>
      </Section>

      <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.bg} 100%)`, borderRadius: '16px', padding: 'clamp(40px, 5vw, 80px)', textAlign: 'center', border: `1px solid ${C.border}`, marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}><img src="/logo.png" alt="DAZN Bet" style={{ height: '60px' }} /></div>
        <h2 style={{ color: C.accent, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, margin: '0 0 8px 0' }}>Thank You</h2>
        <p style={{ color: C.text, fontSize: 'clamp(14px, 1.8vw, 18px)', margin: '0 0 4px 0', fontWeight: 600 }}>Weekly Trading Report • Week {data.weekNumber} 2026</p>
        <p style={{ color: C.textMuted, fontSize: 'clamp(12px, 1.4vw, 16px)', margin: 0 }}>DAZN Bet Italy <span style={{ margin: '0 8px', opacity: 0.4 }}>•</span> <span style={{ fontStyle: 'italic', opacity: 0.7 }}>by Massimino Federico</span></p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CASINO SECTION
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// CASINO SESSIONS COMPONENT (dynamic from uploaded SessioniCasino.xlsx)
// ═══════════════════════════════════════════════════════════════════════════════
const CasinoSessions = ({ sessionData, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const [seg, setSeg] = useState('generale')

  if (!sessionData) return (
    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
      <Icon name="clock" size={40} color={C.textMuted} />
      <h3 style={{ color: C.text, margin: '16px 0 8px', fontWeight: 800 }}>No Session Data</h3>
      <p style={{ color: C.textMuted, fontSize: '13px', maxWidth: 400, margin: '0 auto' }}>Upload <b>SessioniCasino.xlsx</b> in the Admin area to enable session analysis.</p>
    </div>
  )

  const data = sessionData.segments[seg]
  if (!data) return null

  const segOpts = [
    { k: 'generale', label: 'All Channels', icon: 'casino', sub: `${fmtNum(sessionData.segments.generale.tickets)} tickets` },
    { k: 'online', label: 'Online', icon: 'globe', sub: 'DAZNBET + VIVABET' },
    { k: 'pvr', label: 'PVR / Retail', icon: 'store', sub: 'All other SKIN' }
  ]

  const ins = data.insights
  const insCards = [
    { label: 'Peak Hour', value: ins.peakHour, sub: `${ins.peakHourPct}% of tickets`, color: C.primary },
    { label: 'Best GGR Hour', value: ins.bestGgrHour, sub: `€${fmtNum(ins.bestGgrAmount)}`, color: C.success },
    { label: 'Top Day', value: ins.topDay, sub: `${ins.topDayPct}% of tickets`, color: C.accent },
    { label: 'Median Duration', value: `${data.medianDuration ?? data.avgDuration ?? 0} min`, sub: 'per session', color: C.blue }
  ]

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      {/* Period & Segment Selector */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: C.textMuted, fontSize: '11px', fontWeight: 700, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Period: {sessionData.period} — {fmtNum(sessionData.totalRows)} records</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {segOpts.map(o => (
            <button key={o.k} onClick={() => setSeg(o.k)} style={{
              display: 'flex', alignItems: 'center', gap: '8px', background: seg === o.k ? C.primary : C.card,
              color: seg === o.k ? C.primaryText : C.text, border: `1px solid ${seg === o.k ? C.primary : C.border}`,
              borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', transition: 'all .2s'
            }}>
              <Icon name={o.icon} size={16} color={seg === o.k ? C.primaryText : C.textMuted} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '13px' }}>{o.label}</div>
                <div style={{ fontSize: '10px', opacity: .7 }}>{o.sub}</div>
              </div>
            </button>
          ))}
        </div>
        {/* Promoter badges */}
        {data.promoters.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
            {data.promoters.slice(0, 8).map(p => (
              <span key={p.name} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, color: C.textSec }}>{p.name.replace('-SKIN', '')} <span style={{ color: C.primary }}>{p.pct}%</span></span>
            ))}
          </div>
        )}
      </div>

      {/* KPI Overview */}
      <Section title="Session Overview" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <KPI label="Tickets" value={data.tickets} icon="activity" theme={C} />
          <KPI label="Unique Accounts" value={data.accounts} icon="users" theme={C} />
          <KPI label="Turnover" value={data.giocato} cur icon="wallet" theme={C} />
          <KPI label="GGR" value={data.ggr} cur icon="trending" sub={`GWM: ${data.gwm}%`} theme={C} />
          <KPI label="Median Duration (min)" value={data.medianDuration ?? data.avgDuration ?? 0} icon="clock" theme={C} />
          <KPI label="Ticket/Account" value={data.accounts > 0 ? Math.round(data.tickets / data.accounts) : 0} icon="card" theme={C} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
          {insCards.map(c => (
            <div key={c.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 8, height: 40, borderRadius: 4, background: c.color }} />
              <div><p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>{c.label}</p><p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 900, color: C.text }}>{c.value}</p><p style={{ margin: 0, fontSize: '11px', color: C.textSec }}>{c.sub}</p></div>
            </div>
          ))}
        </div>
      </Section>

      {/* Hourly Distribution */}
      <Section title="Hourly Distribution" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '2fr 1fr', gap: '16px' }}>
          <ChartCard title="Tickets & GGR by Hour" height={260} theme={C}>
            <ComposedChart data={data.hourly}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="hour" tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} interval={mob ? 3 : 1} /><YAxis yAxisId="l" tick={{ fill: C.textMuted, fontSize: 9 }} /><YAxis yAxisId="r" orientation="right" tick={{ fill: C.textMuted, fontSize: 9 }} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} /><Legend /><Bar yAxisId="l" dataKey="tickets" name="Tickets" fill={C.primary} radius={[2,2,0,0]} opacity={.8} /><Line yAxisId="r" type="monotone" dataKey="ggr" name="GGR" stroke={C.success} strokeWidth={2} dot={false} /></ComposedChart>
          </ChartCard>
          <div>
            <ChartCard title="Time Blocks" height={180} theme={C}>
              <PieChart><Pie data={data.timeBlocks} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="tickets" nameKey="name">{data.timeBlocks.map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} /><Legend wrapperStyle={{fontSize:'10px'}} /></PieChart>
            </ChartCard>
            <div style={{ marginTop: '12px' }}>
              {data.timeBlocks.map(b => (
                <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderBottom: `1px solid ${C.border}`, fontSize: '11px' }}>
                  <span style={{ fontWeight: 700, color: C.text }}>{b.name} <span style={{ color: C.textMuted, fontWeight: 400 }}>{b.range}</span></span>
                  <span style={{ fontWeight: 800, color: C.primary }}>{b.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Daily Distribution */}
      <Section title="Daily Distribution" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: '16px' }}>
          <ChartCard title="Tickets per Day" height={220} theme={C}>
            <BarChart data={data.daily}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="day" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="tickets" fill={C.primary} radius={[4,4,0,0]}>{data.daily.map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
          <ChartCard title="GGR per Day" height={220} theme={C}>
            <BarChart data={data.daily}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="day" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Bar dataKey="ggr" fill={C.success} radius={[4,4,0,0]}>{data.daily.map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
        </div>
      </Section>

      {/* Duration */}
      <Section title="Session Duration" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: '16px' }}>
          <ChartCard title="Duration Distribution" height={220} theme={C}>
            <BarChart data={data.duration}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="range" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="count" fill={C.accent} radius={[4,4,0,0]}>{data.duration.map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
          <div style={{ background: C.card, borderRadius: '12px', padding: '16px', border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: C.textMuted, margin: '0 0 12px', textTransform: 'uppercase' }}>Breakdown</p>
            {data.duration.map(d => (
              <div key={d.range} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 700, color: C.text }}>{d.range}</span>
                  <span style={{ fontWeight: 800, color: C.primary }}>{d.percent}% <span style={{ color: C.textMuted, fontWeight: 400 }}>({fmtNum(d.count)})</span></span>
                </div>
                <div style={{ height: 4, background: C.bg, borderRadius: 2 }}><div style={{ height: 4, borderRadius: 2, background: C.primary, width: `${d.percent}%`, transition: 'width .5s' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Heatmap */}
      <Section title="Day × Hour Heatmap (% of Total Tickets)" theme={C}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead><tr>
              <th style={{ padding: '8px', textAlign: 'left', fontWeight: 800, color: C.textMuted, borderBottom: `2px solid ${C.border}` }}></th>
              {['00-04','04-08','08-12','12-16','16-20','20-24'].map(b => <th key={b} style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: C.textMuted, borderBottom: `2px solid ${C.border}` }}>{b}</th>)}
              <th style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: C.textMuted, borderBottom: `2px solid ${C.border}` }}>Total</th>
            </tr></thead>
            <tbody>{data.heatmap.map(row => {
              const maxPct = Math.max(...data.heatmap.flatMap(r => r.blocks.map(b => b.pct)))
              const rowTotal = row.blocks.reduce((s, b) => s + b.tickets, 0)
              return (
                <tr key={row.day}>
                  <td style={{ padding: '8px', fontWeight: 800, color: C.text }}>{row.day}</td>
                  {row.blocks.map(b => {
                    const intensity = maxPct > 0 ? b.pct / maxPct : 0
                    const isDark = C.bg.includes('0a0a')
                    const bgColor = isDark
                      ? `rgba(247, 255, 26, ${intensity * 0.7})`
                      : `rgba(0, 0, 0, ${intensity * 0.6})`
                    const txtColor = intensity > 0.5 ? (isDark ? '#000' : '#fff') : C.text
                    return <td key={b.block} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, background: bgColor, color: txtColor, borderRadius: '4px' }}>{b.pct}%</td>
                  })}
                  <td style={{ padding: '8px', textAlign: 'center', fontWeight: 800, color: C.primary }}>{fmtNum(rowTotal)}</td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      </Section>

      {/* Online vs PVR comparison (only in Generale view) */}
      {seg === 'generale' && sessionData.segments.online.tickets > 0 && sessionData.segments.pvr.tickets > 0 && (
        <Section title="Online vs PVR / Retail" theme={C}>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: '16px' }}>
            {[{k:'online',label:'Online',icon:'globe',d:sessionData.segments.online},{k:'pvr',label:'PVR / Retail',icon:'store',d:sessionData.segments.pvr}].map(s => (
              <div key={s.k} style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Icon name={s.icon} size={18} color={C.primary} />
                  <h4 style={{ margin: 0, color: C.text, fontWeight: 800, fontSize: '14px' }}>{s.label}</h4>
                  <span style={{ marginLeft: 'auto', background: C.primary+'22', color: C.primary, padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800 }}>{(s.d.tickets / data.tickets * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  {[{l:'Tickets',v:fmtNum(s.d.tickets)},{l:'Accounts',v:fmtNum(s.d.accounts)},{l:'GGR',v:fmtCurrency(s.d.ggr)},{l:'GWM',v:`${s.d.gwm}%`},{l:'Median Duration',v:`${s.d.medianDuration ?? s.d.avgDuration ?? 0} min`},{l:'Peak Hour',v:s.d.insights.peakHour}].map(m => (
                    <div key={m.l}><p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>{m.l}</p><p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 900, color: C.text }}>{m.v}</p></div>
                  ))}
                </div>
                {/* Mini sparkline hourly */}
                <div style={{ height: 50, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  {s.d.hourly.map((h, i) => {
                    const maxT = Math.max(...s.d.hourly.map(x => x.tickets))
                    return <div key={i} style={{ flex: 1, background: C.primary, opacity: .6, borderRadius: '2px 2px 0 0', height: maxT > 0 ? `${(h.tickets / maxT) * 100}%` : '2px', transition: 'height .3s' }} title={`${h.hour}: ${h.tickets} tickets`} />
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '9px', color: C.textMuted }}>00:00</span>
                  <span style={{ fontSize: '9px', color: C.textMuted }}>12:00</span>
                  <span style={{ fontSize: '9px', color: C.textMuted }}>23:00</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

const CasinoSection = ({ weeksData, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const [view, setView] = useState('weekly')
  const [selected, setSelected] = useState(null)
  const weekNums = Object.keys(weeksData).map(Number).sort((a, b) => b - a)
  useEffect(() => { if (weekNums.length && !selected) setSelected(weekNums[0]) }, [weekNums.length])
  const current = selected ? weeksData[selected] : null
  const prev = selected && weeksData[selected - 1] ? weeksData[selected - 1] : null
  const hasAnySessions = weekNums.some(w => weeksData[w]?.sessionData)

  if (!weekNums.length) return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <Icon name="casino" size={48} color={C.textMuted} />
      <h2 style={{ color: C.text, margin: '16px 0 8px 0', fontSize: '24px', fontWeight: 800 }}>Casino Dashboard</h2>
      <p style={{ color: C.textMuted, fontSize: '14px' }}>No Casino data uploaded. Go to the Admin area to upload data.</p>
    </div>
  )

  return (
    <div>
      <div style={{ padding: mob ? '12px 16px' : '16px clamp(20px, 3vw, 48px)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['weekly', 'monthly', ...(hasAnySessions ? ['sessions'] : [])].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? C.primary : 'transparent', color: view === v ? C.primaryText : C.textSec, border: `1px solid ${view === v ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{v === 'weekly' ? 'Weekly' : v === 'monthly' ? 'Monthly' : 'Sessions'}</button>
          ))}
        </div>
        {(view === 'weekly' || view === 'sessions') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select value={selected || ''} onChange={e => setSelected(Number(e.target.value))} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              {weekNums.map(w => <option key={w} value={w}>Week {w}{view === 'sessions' && weeksData[w]?.sessionData ? ' ✓' : view === 'sessions' ? ' —' : ''}</option>)}
            </select>
            {current && <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 600 }}>{current.dateRange}</span>}
          </div>
        )}
        <span style={{ marginLeft: 'auto', color: C.accent, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Casino</span>
      </div>
      {view === 'weekly' ? <CasinoWeekly data={current} prev={prev} theme={C} /> : view === 'monthly' ? <CasinoMonthly weeksData={weeksData} theme={C} /> : <CasinoSessions sessionData={current?.sessionData} theme={C} />}
    </div>
  )
}

const CasinoWeekly = ({ data, prev, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const [provSort, setProvSort] = useState('turnover')
  const [gameSort, setGameSort] = useState('turnover')
  if (!data) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted }}>Select a week</p></div>
  const topProv = [...(data.providers || [])].sort((a, b) => b[provSort] - a[provSort]).slice(0, 10)
  const topGames = [...(data.games || [])].sort((a, b) => b[gameSort] - a[gameSort]).slice(0, 25)
  const sortLbl = k => k === 'turnover' ? 'Turnover' : k === 'ggr' ? 'GGR' : 'Active Accounts'

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <Section title="Trading Summary" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          <KPI label="Turnover" value={data.turnover} change={calcChange(data.turnover, prev?.turnover)} cur icon="activity" theme={C} />
          <KPI label="GGR" value={data.ggr} change={calcChange(data.ggr, prev?.ggr)} cur icon="trending" sub={`GWM: ${data.gwm || 0}%`} theme={C} />
          <KPI label="Active Accounts" value={data.activeUsers} change={calcChange(data.activeUsers, prev?.activeUsers)} icon="users" theme={C} />
          <KPI label="ARPU Casino" value={data.arpu} cur icon="wallet" theme={C} />
          <KPI label="Bet Bonus" value={data.betBonus} cur icon="card" theme={C} />
          <KPI label="Avg Age" value={`${data.avgAge}`} sub="years" icon="user" theme={C} />
        </div>
      </Section>

      <Section title="Casino vs Casino Live" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Category', accessor: 'category', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Payout%', accessor: 'payout', align: 'center', format: v => <b>{v}%</b> }
          ]} data={data.categories || []} theme={C} />
          <ChartCard title="GGR Split" height={220} theme={C}>
            <PieChart><Pie data={(data.categories || []).filter(c => c.ggr > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="ggr" nameKey="category">{(data.categories || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend /></PieChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Player Age Distribution" theme={C}>
        <ChartCard title="Age Brackets" height={220} theme={C}>
          <BarChart data={data.ageGroups || []}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="range" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="count" fill={C.primary} radius={[4, 4, 0, 0]}>{(data.ageGroups || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
        </ChartCard>
      </Section>

      <Section title="Top 10 Provider" theme={C}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[{ k: 'turnover', l: 'By Turnover' }, { k: 'ggr', l: 'By GGR' }, { k: 'actives', l: 'By Active Accs' }].map(s => (
            <button key={s.k} onClick={() => setProvSort(s.k)} style={{ background: provSort === s.k ? C.primary : 'transparent', color: provSort === s.k ? C.primaryText : C.textSec, border: `1px solid ${provSort === s.k ? C.primary : C.border}`, borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{s.l}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: '#', accessor: '_idx' },
            { header: 'Provider', accessor: 'provider', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
          ]} data={topProv.map((p, i) => ({ ...p, _idx: i + 1 }))} compact theme={C} />
          <ChartCard title={`Top Provider - ${sortLbl(provSort)}`} height={300} theme={C}>
            <BarChart data={topProv} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={provSort === 'actives' ? undefined : v => fmtCurrency(v, true)} /><YAxis dataKey="provider" type="category" width={mob ? 55 : 85} tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} formatter={v => provSort === 'actives' ? fmtNum(v) : fmtCurrency(v)} /><Bar dataKey={provSort} fill={C.primary} radius={[0, 4, 4, 0]}>{topProv.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Top 25 Giochi" theme={C}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[{ k: 'turnover', l: 'By Turnover' }, { k: 'ggr', l: 'By GGR' }, { k: 'actives', l: 'By Active Accs' }].map(s => (
            <button key={s.k} onClick={() => setGameSort(s.k)} style={{ background: gameSort === s.k ? C.primary : 'transparent', color: gameSort === s.k ? C.primaryText : C.textSec, border: `1px solid ${gameSort === s.k ? C.primary : C.border}`, borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{s.l}</button>
          ))}
        </div>
        <Table cols={[
          { header: '#', accessor: '_idx' },
          { header: 'Game', accessor: 'game', format: v => <span style={{ fontWeight: 700 }}>{String(v).substring(0, 30)}</span> },
          { header: 'Provider', accessor: 'provider', format: v => <span style={{ color: C.textMuted }}>{v}</span> },
          { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
          { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
          { header: 'Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
        ]} data={topGames.map((g, i) => ({ ...g, _idx: i + 1 }))} compact theme={C} />
      </Section>

      {data.channelPerformance && data.channelPerformance.length > 0 && (
        <Section title="Channel Performance Casino" theme={C}>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
            <Table cols={[
              { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
              { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
              { header: 'Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> },
              { header: 'ARPU', accessor: 'arpu', align: 'right', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
              { header: 'Rev%', accessor: 'revShare', align: 'center', format: v => <b>{v}%</b> }
            ]} data={data.channelPerformance} theme={C} />
            <ChartCard title="Revenue Share Casino" height={220} theme={C}>
              <PieChart><Pie data={data.channelPerformance.filter(c => c.revShare > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="revShare" nameKey="channel">{data.channelPerformance.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} /><Legend /></PieChart>
            </ChartCard>
          </div>
        </Section>
      )}
    </div>
  )
}

const CasinoMonthly = ({ weeksData, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const allWeeks = Object.values(weeksData).sort((a, b) => a.weekNumber - b.weekNumber)
  const [filterMode, setFilterMode] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [provSort, setProvSort] = useState('turnover')
  const [gameSort, setGameSort] = useState('turnover')

  if (!allWeeks.length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted }}>No data available</p></div>

  const monthsMap = {}
  allWeeks.forEach(w => { const m = getMonthFromDateRange(w.dateRange); if (m.key && !monthsMap[m.key]) monthsMap[m.key] = { name: m.name, weeks: [] }; if (m.key) monthsMap[m.key].weeks.push(w.weekNumber) })
  const months = Object.entries(monthsMap).map(([key, val]) => ({ key, ...val }))

  let weeks = allWeeks
  let periodLabel = `All Weeks (${allWeeks.length})`
  if (filterMode === 'month' && selectedMonth && monthsMap[selectedMonth]) { weeks = allWeeks.filter(w => monthsMap[selectedMonth].weeks.includes(w.weekNumber)); periodLabel = monthsMap[selectedMonth].name }
  else if (filterMode === 'custom' && customFrom && customTo) { const from = parseInt(customFrom), to = parseInt(customTo); weeks = allWeeks.filter(w => w.weekNumber >= from && w.weekNumber <= to); periodLabel = `Week ${from} - ${to}` }
  if (!weeks.length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted }}>No weeks in selected period</p></div>

  const tot = { turnover: weeks.reduce((s, w) => s + (w.turnover || 0), 0), ggr: weeks.reduce((s, w) => s + (w.ggr || 0), 0), betBonus: weeks.reduce((s, w) => s + (w.betBonus || 0), 0) }
  const avgActives = Math.round(weeks.reduce((s, w) => s + (w.activeUsers || 0), 0) / weeks.length)
  const avgAge = Math.round(weeks.reduce((s, w) => s + (w.avgAge || 0), 0) / weeks.length)
  const arpu = avgActives > 0 ? Math.round(tot.ggr / avgActives) : 0
  const trend = weeks.map(w => ({ week: `W${w.weekNumber}`, Turnover: Math.round((w.turnover || 0) / 1000), GGR: Math.round((w.ggr || 0) / 1000), Actives: w.activeUsers || 0 }))

  const catAgg = {}
  weeks.forEach(w => (w.categories || []).forEach(c => { if (!catAgg[c.category]) catAgg[c.category] = { category: c.category, actives: 0, turnover: 0, ggr: 0 }; catAgg[c.category].turnover += c.turnover || 0; catAgg[c.category].ggr += c.ggr || 0; catAgg[c.category].actives += c.actives || 0 }))
  const catData = Object.values(catAgg)

  const provAgg = {}
  weeks.forEach(w => (w.providers || []).forEach(p => { if (!provAgg[p.provider]) provAgg[p.provider] = { provider: p.provider, turnover: 0, ggr: 0, actives: 0 }; provAgg[p.provider].turnover += p.turnover || 0; provAgg[p.provider].ggr += p.ggr || 0; provAgg[p.provider].actives += p.actives || 0 }))
  const provData = Object.values(provAgg).sort((a, b) => b[provSort] - a[provSort]).slice(0, 10)

  const gameAgg = {}
  weeks.forEach(w => (w.games || []).forEach(g => { const key = `${g.provider}|${g.game}`; if (!gameAgg[key]) gameAgg[key] = { game: g.game, provider: g.provider, turnover: 0, ggr: 0, actives: 0 }; gameAgg[key].turnover += g.turnover || 0; gameAgg[key].ggr += g.ggr || 0; gameAgg[key].actives += g.actives || 0 }))
  const gameData = Object.values(gameAgg).sort((a, b) => b[gameSort] - a[gameSort]).slice(0, 25)

  const chAgg = {}
  weeks.forEach(w => (w.channelPerformance || []).forEach(ch => { if (!chAgg[ch.channel]) chAgg[ch.channel] = { channel: ch.channel, turnover: 0, ggr: 0, actives: 0 }; chAgg[ch.channel].turnover += ch.turnover || 0; chAgg[ch.channel].ggr += ch.ggr || 0; chAgg[ch.channel].actives += ch.actives || 0 }))
  const chData = Object.values(chAgg); const totChGgr = chData.reduce((s, c) => s + c.ggr, 0); chData.forEach(c => { c.arpu = c.actives > 0 ? Math.round(c.ggr / c.actives) : 0; c.revShare = totChGgr > 0 ? parseFloat((c.ggr / totChGgr * 100).toFixed(1)) : 0 }); chData.sort((a, b) => b.ggr - a.ggr)

  const weekNums = allWeeks.map(w => w.weekNumber)
  const sortLbl = k => k === 'turnover' ? 'Turnover' : k === 'ggr' ? 'GGR' : 'Active Accounts'

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}`, marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'month', 'custom'].map(mode => (
            <button key={mode} onClick={() => setFilterMode(mode)} style={{ background: filterMode === mode ? C.primary : 'transparent', color: filterMode === mode ? C.primaryText : C.textSec, border: `1px solid ${filterMode === mode ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{mode === 'all' ? 'All' : mode === 'month' ? 'Month' : 'Custom'}</button>
          ))}
        </div>
        {filterMode === 'month' && <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}><option value="">Select month</option>{months.map(m => <option key={m.key} value={m.key}>{m.name} (W{m.weeks[0]}-W{m.weeks[m.weeks.length - 1]})</option>)}</select>}
        {filterMode === 'custom' && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ color: C.textMuted, fontSize: '12px' }}>From W</span><select value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}><option value="">--</option>{weekNums.map(n => <option key={n} value={n}>{n}</option>)}</select><span style={{ color: C.textMuted, fontSize: '12px' }}>to W</span><select value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}><option value="">--</option>{weekNums.map(n => <option key={n} value={n}>{n}</option>)}</select></div>}
        <div style={{ marginLeft: 'auto' }}><span style={{ color: C.accent, fontSize: '14px', fontWeight: 800 }}>{periodLabel}</span></div>
      </div>

      <Section title="Trading Summary" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          <KPI label="Total Turnover" value={tot.turnover} cur icon="activity" theme={C} />
          <KPI label="Total GGR" value={tot.ggr} sub={`GWM: ${tot.turnover > 0 ? (tot.ggr / tot.turnover * 100).toFixed(1) : 0}%`} cur icon="trending" theme={C} />
          <KPI label="Avg Actives" value={avgActives} icon="users" theme={C} />
          <KPI label="ARPU Casino" value={arpu} cur icon="wallet" theme={C} />
          <KPI label="Total Bet Bonus" value={tot.betBonus} cur icon="card" theme={C} />
          <KPI label="Avg Age" value={`${avgAge}`} sub="years" icon="user" theme={C} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          <ChartCard title="Turnover & GGR Trend (€K)" theme={C}>
            <ComposedChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Bar dataKey="Turnover" fill={C.primary} radius={[4, 4, 0, 0]} /><Line type="monotone" dataKey="GGR" stroke={C.success} strokeWidth={2} dot={{ fill: C.success, r: 3 }} /></ComposedChart>
          </ChartCard>
          <ChartCard title="Active Accounts Trend" theme={C}>
            <AreaChart data={trend}><defs><linearGradient id="caG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Area type="monotone" dataKey="Actives" stroke={C.blue} fill="url(#caG)" strokeWidth={2} /></AreaChart>
          </ChartCard>
        </div>
        <Table cols={[
          { header: 'Week', accessor: 'weekNumber', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>W{v}</span> },
          { header: 'Date', accessor: 'dateRange' },
          { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
          { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
          { header: 'GWM', accessor: 'gwm', align: 'center', format: v => <b>{v}%</b> },
          { header: 'Active', accessor: 'activeUsers', align: 'right', format: v => <b>{fmtNum(v)}</b> },
          { header: 'ARPU', accessor: 'arpu', align: 'right', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{fmtCurrency(v)}</span> }
        ]} data={weeks} theme={C} />
      </Section>

      <Section title="Casino vs Casino Live" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Category', accessor: 'category', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
          ]} data={catData} theme={C} />
          <ChartCard title="GGR Split" height={220} theme={C}>
            <PieChart><Pie data={catData.filter(c => c.ggr > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="ggr" nameKey="category">{catData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend /></PieChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Top 10 Provider" theme={C}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[{ k: 'turnover', l: 'By Turnover' }, { k: 'ggr', l: 'By GGR' }, { k: 'actives', l: 'By Active Accs' }].map(s => (
            <button key={s.k} onClick={() => setProvSort(s.k)} style={{ background: provSort === s.k ? C.primary : 'transparent', color: provSort === s.k ? C.primaryText : C.textSec, border: `1px solid ${provSort === s.k ? C.primary : C.border}`, borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{s.l}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: '#', accessor: '_idx' }, { header: 'Provider', accessor: 'provider', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
          ]} data={provData.map((p, i) => ({ ...p, _idx: i + 1 }))} compact theme={C} />
          <ChartCard title={`Top Provider - ${sortLbl(provSort)}`} height={300} theme={C}>
            <BarChart data={provData} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={provSort === 'actives' ? undefined : v => fmtCurrency(v, true)} /><YAxis dataKey="provider" type="category" width={mob ? 55 : 85} tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} formatter={v => provSort === 'actives' ? fmtNum(v) : fmtCurrency(v)} /><Bar dataKey={provSort} fill={C.primary} radius={[0, 4, 4, 0]}>{provData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Top 25 Giochi" theme={C}>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[{ k: 'turnover', l: 'By Turnover' }, { k: 'ggr', l: 'By GGR' }, { k: 'actives', l: 'By Active Accs' }].map(s => (
            <button key={s.k} onClick={() => setGameSort(s.k)} style={{ background: gameSort === s.k ? C.primary : 'transparent', color: gameSort === s.k ? C.primaryText : C.textSec, border: `1px solid ${gameSort === s.k ? C.primary : C.border}`, borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{s.l}</button>
          ))}
        </div>
        <Table cols={[
          { header: '#', accessor: '_idx' }, { header: 'Game', accessor: 'game', format: v => <span style={{ fontWeight: 700 }}>{String(v).substring(0, 30)}</span> },
          { header: 'Provider', accessor: 'provider', format: v => <span style={{ color: C.textMuted }}>{v}</span> },
          { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
          { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
          { header: 'Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
        ]} data={gameData.map((g, i) => ({ ...g, _idx: i + 1 }))} compact theme={C} />
      </Section>

      {chData.length > 0 && (
        <Section title="Channel Performance Casino" theme={C}>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
            <Table cols={[
              { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
              { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
              { header: 'Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> },
              { header: 'ARPU', accessor: 'arpu', align: 'right', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
              { header: 'Rev%', accessor: 'revShare', align: 'center', format: v => <b>{v}%</b> }
            ]} data={chData} theme={C} />
            <ChartCard title="Revenue Share Casino" height={220} theme={C}>
              <PieChart><Pie data={chData.filter(c => c.revShare > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="revShare" nameKey="channel">{chData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} /><Legend /></PieChart>
            </ChartCard>
          </div>
        </Section>
      )}

      {/* Session Analytics - Aggregated from weeks with sessionData */}
      {(() => {
        const weeksWithSessions = weeks.filter(w => w.sessionData?.segments?.generale)
        if (!weeksWithSessions.length) return null
        
        // Aggregate session data across all weeks in period
        const aggSes = { tickets: 0, accounts: 0, giocato: 0, ggr: 0, durSum: 0, durCount: 0, hourly: Array(24).fill(0), daily: Array(7).fill(0) }
        weeksWithSessions.forEach(w => {
          const s = w.sessionData.segments.generale
          aggSes.tickets += s.tickets || 0
          aggSes.accounts += s.accounts || 0
          aggSes.giocato += s.giocato || 0
          aggSes.ggr += s.ggr || 0
          const dur = s.medianDuration ?? s.avgDuration ?? 0
          if (dur > 0) { aggSes.durSum += dur * s.tickets; aggSes.durCount += s.tickets }
          s.hourly?.forEach((h, i) => { aggSes.hourly[i] += h.tickets || 0 })
          s.daily?.forEach((d, i) => { aggSes.daily[i] += d.tickets || 0 })
        })
        
        const medianDur = aggSes.durCount > 0 ? Math.round(aggSes.durSum / aggSes.durCount * 10) / 10 : 0
        const gwm = aggSes.giocato > 0 ? Math.round(aggSes.ggr / aggSes.giocato * 1000) / 10 : 0
        const peakHourIdx = aggSes.hourly.indexOf(Math.max(...aggSes.hourly))
        const peakHour = `${String(peakHourIdx).padStart(2,'0')}:00`
        const peakHourPct = aggSes.tickets > 0 ? Math.round(aggSes.hourly[peakHourIdx] / aggSes.tickets * 1000) / 10 : 0
        const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
        const topDayIdx = aggSes.daily.indexOf(Math.max(...aggSes.daily))
        const topDay = DAYS[topDayIdx]
        const topDayPct = aggSes.tickets > 0 ? Math.round(aggSes.daily[topDayIdx] / aggSes.tickets * 1000) / 10 : 0
        
        // Find best GGR hour (need to aggregate hourly GGR)
        const hourlyGgr = Array(24).fill(0)
        weeksWithSessions.forEach(w => { w.sessionData.segments.generale.hourly?.forEach((h, i) => { hourlyGgr[i] += h.ggr || 0 }) })
        const bestGgrHourIdx = hourlyGgr.indexOf(Math.max(...hourlyGgr))
        const bestGgrHour = `${String(bestGgrHourIdx).padStart(2,'0')}:00`
        const bestGgrAmount = hourlyGgr[bestGgrHourIdx]
        
        const sesKpis = [
          { label: 'Peak Hour', value: peakHour, sub: `${peakHourPct}% of tickets`, color: C.primary },
          { label: 'Best GGR Hour', value: bestGgrHour, sub: `€${fmtNum(Math.round(bestGgrAmount))}`, color: C.success },
          { label: 'Top Day', value: topDay, sub: `${topDayPct}% of tickets`, color: C.accent },
          { label: 'Median Duration', value: `${medianDur} min`, sub: 'per session', color: C.blue }
        ]
        
        return (
          <Section title={`Session Analytics (${weeksWithSessions.length} week${weeksWithSessions.length > 1 ? 's' : ''} with data)`} theme={C}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <KPI label="Total Tickets" value={aggSes.tickets} icon="activity" theme={C} />
              <KPI label="Total Accounts" value={aggSes.accounts} icon="users" theme={C} />
              <KPI label="Total Turnover" value={aggSes.giocato} cur icon="wallet" theme={C} />
              <KPI label="Total GGR" value={aggSes.ggr} cur icon="trending" sub={`GWM: ${gwm}%`} theme={C} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
              {sesKpis.map(c => (
                <div key={c.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 8, height: 40, borderRadius: 4, background: c.color }} />
                  <div><p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>{c.label}</p><p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 900, color: C.text }}>{c.value}</p><p style={{ margin: 0, fontSize: '11px', color: C.textSec }}>{c.sub}</p></div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '16px', fontSize: '11px', color: C.textMuted, fontStyle: 'italic' }}>Aggregated from weeks: {weeksWithSessions.map(w => `W${w.weekNumber}`).join(', ')}</p>
          </Section>
        )
      })()}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMING SOON
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// SPORT SECTION
// ═══════════════════════════════════════════════════════════════════════════════
const SportSection = ({ weeksData, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const [view, setView] = useState('weekly')
  const [selected, setSelected] = useState(null)
  const weekNums = Object.keys(weeksData).map(Number).sort((a, b) => b - a)
  useEffect(() => { if (weekNums.length && !selected) setSelected(weekNums[0]) }, [weekNums.length])
  const current = selected ? weeksData[selected] : null
  const prev = selected && weeksData[selected - 1] ? weeksData[selected - 1] : null

  if (!weekNums.length) return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <Icon name="sport" size={48} color={C.textMuted} />
      <h2 style={{ color: C.text, margin: '16px 0 8px 0', fontSize: '24px', fontWeight: 800 }}>Sport Dashboard</h2>
      <p style={{ color: C.textMuted, fontSize: '14px' }}>No Sport data loaded. Go to Admin area to upload data.</p>
    </div>
  )

  return (
    <div>
      <div style={{ padding: mob ? '12px 16px' : '16px clamp(20px, 3vw, 48px)', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['weekly', 'monthly'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? C.primary : 'transparent', color: view === v ? C.primaryText : C.textSec, border: `1px solid ${view === v ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{v === 'weekly' ? 'Weekly' : 'Monthly'}</button>
          ))}
        </div>
        {view === 'weekly' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select value={selected || ''} onChange={e => setSelected(Number(e.target.value))} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              {weekNums.map(w => <option key={w} value={w}>Week {w}</option>)}
            </select>
            {current && <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 600 }}>{current.dateRange}</span>}
          </div>
        )}
        <span style={{ marginLeft: 'auto', color: C.accent, fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Sport</span>
      </div>
      {view === 'weekly' ? <SportWeekly data={current} prev={prev} theme={C} /> : <SportMonthly weeksData={weeksData} theme={C} />}
    </div>
  )
}

const SportWeekly = ({ data, prev, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const [manifSort, setManifSort] = useState('turnover')
  const [pvSort, setPvSort] = useState('turnover')
  const [scommSort, setScommSort] = useState('turnover')
  const [showMoreEventi, setShowMoreEventi] = useState(false)
  const [showMoreManif, setShowMoreManif] = useState(false)
  const [showMoreScomm, setShowMoreScomm] = useState(false)
  const [showMorePV, setShowMorePV] = useState(false)
  
  if (!data) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted }}>Select a week</p></div>
  
  // Sort and slice data
  const topManif = [...(data.topManifestazioni || [])].sort((a, b) => b[manifSort] - a[manifSort])
  const topScomm = [...(data.topScommesse || [])].sort((a, b) => b[scommSort] - a[scommSort])
  const topPV = [...(data.topPuntiVendita || [])].sort((a, b) => b[pvSort] - a[pvSort])
  const eventiData = data.numEventi || []
  const channelData = data.channelPerformance || []
  
  // Accordion helper
  const Accordion = ({ label, expanded, onToggle, count }) => (
    <button onClick={onToggle} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', width: '100%', justifyContent: 'center' }}>
      <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700 }}>{expanded ? '▲ Hide' : `▼ Show ${count} more`}</span>
    </button>
  )

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      {/* ═══ 1. TRADING SUMMARY ═══ */}
      <Section title="Trading Summary Sport" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          <KPI label="Turnover" value={data.turnover} change={calcChange(data.turnover, prev?.turnover)} cur icon="activity" theme={C} />
          <KPI label="GGR" value={data.ggr} change={calcChange(data.ggr, prev?.ggr)} cur icon="trending" sub={`GWM: ${data.gwm || 0}%`} theme={C} />
          <KPI label="Tickets" value={data.tickets} change={calcChange(data.tickets, prev?.tickets)} icon="box" theme={C} />
          <KPI label="Active Accounts" value={data.activeUsers} change={calcChange(data.activeUsers, prev?.activeUsers)} icon="users" theme={C} />
          <KPI label="ARPU" value={data.arpu} cur icon="wallet" theme={C} />
          <KPI label="Avg Ticket" value={data.avgTicket} cur icon="card" sub={`${data.ticketsPerUser || 0} bets/user`} theme={C} />
          <KPI label="Payout" value={`${data.payout}%`} icon="percent" theme={C} />
          <KPI label="Bet Bonus" value={data.betBonus} cur icon="gift" theme={C} />
        </div>
        {/* Quick Insights Row */}
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: C.card, borderRadius: '10px', padding: '14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase' }}>Football %</p>
            <p style={{ color: C.accent, fontSize: '22px', fontWeight: 800, margin: 0 }}>{data.calcioPct || 0}%</p>
          </div>
          <div style={{ background: C.card, borderRadius: '10px', padding: '14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase' }}>Live %</p>
            <p style={{ color: C.danger, fontSize: '22px', fontWeight: 800, margin: 0 }}>{data.live?.pct || 0}%</p>
          </div>
          <div style={{ background: C.card, borderRadius: '10px', padding: '14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase' }}>Avg Age</p>
            <p style={{ color: C.blue, fontSize: '22px', fontWeight: 800, margin: 0 }}>{data.avgAge}</p>
          </div>
        </div>
      </Section>

      {/* ═══ 2. AGE DISTRIBUTION (subito dopo Trading Summary come Casino) ═══ */}
      <Section title="Player Age Distribution" theme={C}>
        <ChartCard title="Age Range" height={220} theme={C}>
          <BarChart data={data.ageData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="range" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
            <Tooltip content={<Tip theme={C} />} />
            <Bar dataKey="count" fill={C.primary} radius={[4, 4, 0, 0]}>
              {(data.ageData || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
            </Bar>
          </BarChart>
        </ChartCard>
      </Section>

      {/* ═══ 3. TURNOVER DISTRIBUTION ═══ */}
      <Section title="Turnover Distribution" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          {/* Online vs Retail + Pre-Match vs Live */}
          <div>
            <h4 style={{ color: C.textSec, fontSize: '12px', fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase' }}>Online vs Retail</h4>
            <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${data.online?.pct || 0}%`, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: C.primaryText, fontSize: '11px', fontWeight: 800 }}>{data.online?.pct || 0}%</span>
              </div>
              <div style={{ flex: 1, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFF', fontSize: '11px', fontWeight: 800 }}>{data.retail?.pct || 0}%</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: C.bg, borderRadius: '8px', padding: '12px', border: `2px solid ${C.primary}` }}>
                <p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 600, margin: '0 0 4px 0' }}>ONLINE</p>
                <p style={{ color: C.text, fontSize: '18px', fontWeight: 800, margin: 0 }}>{fmtCurrency(data.online?.turnover)}</p>
              </div>
              <div style={{ background: C.bg, borderRadius: '8px', padding: '12px', border: `2px solid ${C.blue}` }}>
                <p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 600, margin: '0 0 4px 0' }}>RETAIL</p>
                <p style={{ color: C.text, fontSize: '18px', fontWeight: 800, margin: 0 }}>{fmtCurrency(data.retail?.turnover)}</p>
              </div>
            </div>
            <h4 style={{ color: C.textSec, fontSize: '12px', fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase' }}>Pre-Match vs Live</h4>
            <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${data.preMatch?.pct || 0}%`, background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFF', fontSize: '11px', fontWeight: 800 }}>{data.preMatch?.pct || 0}%</span>
              </div>
              <div style={{ flex: 1, background: C.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFF', fontSize: '11px', fontWeight: 800 }}>{data.live?.pct || 0}%</span>
              </div>
            </div>
            <Table cols={[
              { header: 'Type', accessor: 'tipo', format: v => <span style={{ fontWeight: 700, color: v === 'Live' ? C.danger : C.success }}>{v}</span> },
              { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
              { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtCurrency(v)}</span> },
              { header: 'GWM%', accessor: 'gwm', align: 'center', format: v => <span style={{ fontWeight: 700 }}>{v}%</span> },
              { header: 'Payout%', accessor: 'payout', align: 'center', format: v => <span style={{ color: C.orange, fontWeight: 700 }}>{v}%</span> },
              { header: 'Tickets', accessor: 'tickets', align: 'right', format: v => fmtNum(v) },
              { header: '%', accessor: 'pct', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{v}%</span> }
            ]} data={[
              { tipo: 'Pre-Match', turnover: data.preMatch?.turnover, ggr: data.preMatch?.ggr, gwm: data.preMatch?.gwm, payout: data.preMatch?.payout, tickets: data.preMatch?.tickets, pct: data.preMatch?.pct },
              { tipo: 'Live', turnover: data.live?.turnover, ggr: data.live?.ggr, gwm: data.live?.gwm, payout: data.live?.payout, tickets: data.live?.tickets, pct: data.live?.pct }
            ]} theme={C} />
          </div>
          {/* Channel Pie Chart */}
          <ChartCard title="By Channel" height={320} theme={C}>
            <PieChart>
              <Pie data={channelData.filter(c => c.turnover > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="turnover" nameKey="channel">
                {channelData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
              </Pie>
              <Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend />
            </PieChart>
          </ChartCard>
        </div>
      </Section>

      {/* ═══ 4. CHANNEL PERFORMANCE ═══ */}
      <Section title="Channel Performance" theme={C}>
        <Table cols={[
          { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
          { header: 'Actives', accessor: 'actives', align: 'right', format: v => <span style={{ color: C.blue, fontWeight: 700 }}>{fmtNum(v)}</span> },
          { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
          { header: '% T/O', accessor: 'pctTotal', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 700 }}>{v}%</span> },
          { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtCurrency(v)}</span> },
          { header: 'GWM%', accessor: 'gwm', align: 'center', format: v => `${v}%` },
          { header: 'Rev Share', accessor: 'revShare', align: 'center', format: v => <span style={{ color: C.purple, fontWeight: 700 }}>{v}%</span> }
        ]} data={channelData.map(c => ({ ...c, pctTotal: data.turnover > 0 ? Math.round(c.turnover / data.turnover * 1000) / 10 : 0 }))} theme={C} />
      </Section>

      {/* ═══ 5. TOP SPORTS ═══ */}
      <Section title="Top Sports by Discipline" theme={C}>
        <ChartCard title="Turnover by Sport" height={280} theme={C}>
          <BarChart data={(data.topSports || []).filter(s => s.name && s.name !== 'UNKNOWN').slice(0, 10)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => fmtCurrency(v, false)} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fill: C.text, fontSize: 11, fontWeight: 600 }} />
            <Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} />
            <Bar dataKey="turnover" fill={C.primary} radius={[0, 4, 4, 0]}>
              {(data.topSports || []).slice(0, 10).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
            </Bar>
          </BarChart>
        </ChartCard>
      </Section>

      {/* ═══ 6. TOP COMPETITIONS ═══ */}
      <Section title="Top 10 Competitions" right={
        <select value={manifSort} onChange={e => setManifSort(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
          <option value="turnover">Turnover</option>
          <option value="ggr">GGR</option>
          <option value="tickets">Tickets</option>
        </select>
      } theme={C}>
        <Table cols={[
          { header: '#', accessor: '_idx', format: (v, i) => <span style={{ color: C.textMuted, fontWeight: 700 }}>{i + 1}</span> },
          { header: 'Competition', accessor: 'name', format: v => <span style={{ fontWeight: 700 }}>{String(v || '').substring(0, 30)}</span> },
          { header: 'Sport', accessor: 'sport', format: v => <span style={{ color: C.textMuted, fontSize: '11px' }}>{v}</span> },
          { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
          { header: '% T/O', accessor: 'pctTotal', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 700 }}>{v}%</span> },
          { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtCurrency(v)}</span> },
          { header: 'Margin%', accessor: 'profitPct', align: 'center', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{v}%</span> }
        ]} data={topManif.slice(0, showMoreManif ? 20 : 10).map(m => ({ ...m, pctTotal: data.turnover > 0 ? Math.round(m.turnover / data.turnover * 1000) / 10 : 0 }))} theme={C} />
        {topManif.length > 10 && <Accordion label="competitions" expanded={showMoreManif} onToggle={() => setShowMoreManif(!showMoreManif)} count={Math.min(topManif.length - 10, 10)} />}
      </Section>

      {/* ═══ 7. EVENTS DISTRIBUTION ═══ */}
      <Section title="Distribution by Number of Events" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <div>
            <Table cols={[
              { header: 'Events', accessor: 'label', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { header: 'Tickets', accessor: 'tickets', align: 'right', format: v => fmtNum(v) },
              { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
              { header: '% T/O', accessor: 'pctTotal', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 700 }}>{v}%</span> },
              { header: 'Margin%', accessor: 'profitPct', align: 'center', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{v}%</span> }
            ]} data={eventiData.slice(0, showMoreEventi ? 30 : 15).map(e => ({ ...e, pctTotal: data.turnover > 0 ? Math.round(e.turnover / data.turnover * 1000) / 10 : 0 }))} theme={C} />
            {eventiData.length > 15 && <Accordion label="events" expanded={showMoreEventi} onToggle={() => setShowMoreEventi(!showMoreEventi)} count={Math.min(eventiData.length - 15, 15)} />}
          </div>
          <ChartCard title="Turnover by Type" height={250} theme={C}>
            <PieChart>
              <Pie data={eventiData.slice(0, 6)} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="turnover" nameKey="label">
                {eventiData.slice(0, 6).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
              </Pie>
              <Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend />
            </PieChart>
          </ChartCard>
        </div>
      </Section>

      {/* ═══ 8. TOP BET TYPES ═══ */}
      {topScomm.length > 0 && (
        <Section title="Top 10 Bet Types" right={
          <select value={scommSort} onChange={e => setScommSort(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            <option value="turnover">Turnover</option>
            <option value="ggr">GGR</option>
            <option value="tickets">Tickets</option>
          </select>
        } theme={C}>
          <Table cols={[
            { header: '#', accessor: '_idx', format: (v, i) => <span style={{ color: C.textMuted, fontWeight: 700 }}>{i + 1}</span> },
            { header: 'Bet Type', accessor: 'name', format: v => <span style={{ fontWeight: 700 }}>{String(v || '').substring(0, 35)}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: '% T/O', accessor: 'pctTotal', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 700 }}>{v}%</span> },
            { header: 'Tickets', accessor: 'tickets', align: 'right', format: v => fmtNum(v) },
            { header: 'Margin%', accessor: 'profitPct', align: 'center', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{v}%</span> }
          ]} data={topScomm.slice(0, showMoreScomm ? 20 : 10).map(s => ({ ...s, pctTotal: data.turnover > 0 ? Math.round(s.turnover / data.turnover * 1000) / 10 : 0 }))} theme={C} />
          {topScomm.length > 10 && <Accordion label="bet types" expanded={showMoreScomm} onToggle={() => setShowMoreScomm(!showMoreScomm)} count={Math.min(topScomm.length - 10, 10)} />}
        </Section>
      )}

      {/* ═══ 9. TOP RETAIL POINTS ═══ */}
      {topPV.length > 0 && (
        <Section title="Top 10 Retail Points" right={
          <select value={pvSort} onChange={e => setPvSort(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            <option value="turnover">Turnover</option>
            <option value="ggr">GGR</option>
            <option value="tickets">Tickets</option>
          </select>
        } theme={C}>
          <Table cols={[
            { header: '#', accessor: '_idx', format: (v, i) => <span style={{ color: C.textMuted, fontWeight: 700 }}>{i + 1}</span> },
            { header: 'Point Code', accessor: 'codice', format: v => <span style={{ fontWeight: 700 }}>{String(v || '')}</span> },
            { header: 'Skin', accessor: 'skin', format: v => <span style={{ color: C.textMuted, fontSize: '11px' }}>{String(v || '')}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: '% T/O', accessor: 'pctTotal', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 700 }}>{v}%</span> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtCurrency(v)}</span> },
            { header: 'Margin%', accessor: 'profitPct', align: 'center', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{v}%</span> }
          ]} data={topPV.slice(0, showMorePV ? 20 : 10).map(p => ({ ...p, pctTotal: data.turnover > 0 ? Math.round(p.turnover / data.turnover * 1000) / 10 : 0 }))} theme={C} />
          {topPV.length > 10 && <Accordion label="retail points" expanded={showMorePV} onToggle={() => setShowMorePV(!showMorePV)} count={Math.min(topPV.length - 10, 10)} />}
        </Section>
      )}
    </div>
  )
}

const SportMonthly = ({ weeksData, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  
  // Filter states
  const [filterMode, setFilterMode] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  
  // Safety check for weeksData
  if (!weeksData || typeof weeksData !== 'object') {
    return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted }}>No data available</p></div>
  }
  
  // Build allWeeks array with weekNumber property
  const allWeeks = Object.entries(weeksData)
    .filter(([k, v]) => !isNaN(Number(k)) && v)
    .map(([k, v]) => ({ ...v, weekNumber: Number(k) }))
    .sort((a, b) => a.weekNumber - b.weekNumber)
  
  if (!allWeeks.length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted }}>No data available</p></div>
  
  // Build months map from dateRange
  const monthsMap = {}
  allWeeks.forEach(w => {
    const m = getMonthFromDateRange(w.dateRange)
    if (m.key && !monthsMap[m.key]) monthsMap[m.key] = { name: m.name, weeks: [] }
    if (m.key) monthsMap[m.key].weeks.push(w.weekNumber)
  })
  const months = Object.entries(monthsMap).map(([key, val]) => ({ key, ...val }))
  
  // Filter weeks based on filterMode
  let weeks = allWeeks
  let periodLabel = `All Weeks (${allWeeks.length})`
  if (filterMode === 'month' && selectedMonth && monthsMap[selectedMonth]) {
    weeks = allWeeks.filter(w => monthsMap[selectedMonth].weeks.includes(w.weekNumber))
    periodLabel = monthsMap[selectedMonth].name
  } else if (filterMode === 'custom' && customFrom && customTo) {
    const from = parseInt(customFrom), to = parseInt(customTo)
    weeks = allWeeks.filter(w => w.weekNumber >= from && w.weekNumber <= to)
    periodLabel = `Week ${from} - ${to}`
  }
  
  if (!weeks.length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted }}>No weeks in selected period</p></div>
  
  const n = weeks.length
  const weekNums = allWeeks.map(w => w.weekNumber)
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AGGREGATE FILTERED WEEKS
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Main totals
  const totals = {
    turnover: weeks.reduce((s, w) => s + (w.turnover || 0), 0),
    ggr: weeks.reduce((s, w) => s + (w.ggr || 0), 0),
    tickets: weeks.reduce((s, w) => s + (w.tickets || 0), 0),
    betBonus: weeks.reduce((s, w) => s + (w.betBonus || 0), 0),
    onlineTurnover: weeks.reduce((s, w) => s + (w.online?.turnover || 0), 0),
    retailTurnover: weeks.reduce((s, w) => s + (w.retail?.turnover || 0), 0),
    liveTurnover: weeks.reduce((s, w) => s + (w.live?.turnover || 0), 0),
    liveGgr: weeks.reduce((s, w) => s + (w.live?.ggr || 0), 0),
    liveTickets: weeks.reduce((s, w) => s + (w.live?.tickets || 0), 0),
    preMatchTurnover: weeks.reduce((s, w) => s + (w.preMatch?.turnover || 0), 0),
    preMatchGgr: weeks.reduce((s, w) => s + (w.preMatch?.ggr || 0), 0),
    preMatchTickets: weeks.reduce((s, w) => s + (w.preMatch?.tickets || 0), 0)
  }
  
  // Averages
  const totalActives = weeks.reduce((s, w) => s + (w.activeUsers || 0), 0)
  const avgActives = Math.round(totalActives / n)
  const arpu = avgActives > 0 ? Math.round(totals.ggr / avgActives) : 0  // GGR / Avg Actives for period
  const avgs = {
    actives: avgActives,
    age: Math.round(weeks.reduce((s, w) => s + (w.avgAge || 0), 0) / n * 10) / 10,
    arpu: arpu,
    avgTicket: Math.round(weeks.reduce((s, w) => s + (w.avgTicket || 0), 0) / n * 100) / 100,
    payout: Math.round(weeks.reduce((s, w) => s + (w.payout || 0), 0) / n * 10) / 10,
    gwm: totals.turnover > 0 ? Math.round(totals.ggr / totals.turnover * 1000) / 10 : 0,
    calcioPct: Math.round(weeks.reduce((s, w) => s + (w.calcioPct || 0), 0) / n * 10) / 10,
    livePct: Math.round(weeks.reduce((s, w) => s + (w.live?.pct || 0), 0) / n * 10) / 10,
    ticketsPerUser: avgActives > 0 ? Math.round(totals.tickets / avgActives * 10) / 10 : 0
  }
  
  // Calculated metrics
  const onlinePct = totals.turnover > 0 ? Math.round(totals.onlineTurnover / totals.turnover * 1000) / 10 : 0
  const retailPct = totals.turnover > 0 ? Math.round(totals.retailTurnover / totals.turnover * 1000) / 10 : 0
  const totalLivePct = totals.turnover > 0 ? Math.round(totals.liveTurnover / totals.turnover * 1000) / 10 : 0
  const preMatchPct = totals.turnover > 0 ? Math.round(totals.preMatchTurnover / totals.turnover * 1000) / 10 : 0
  
  // GWM and Payout for Pre-Match vs Live
  const liveGwm = totals.liveTurnover > 0 ? Math.round(totals.liveGgr / totals.liveTurnover * 1000) / 10 : 0
  const preMatchGwm = totals.preMatchTurnover > 0 ? Math.round(totals.preMatchGgr / totals.preMatchTurnover * 1000) / 10 : 0
  const livePayout = totals.liveTurnover > 0 ? Math.round((totals.liveTurnover - totals.liveGgr) / totals.liveTurnover * 1000) / 10 : 0
  const preMatchPayout = totals.preMatchTurnover > 0 ? Math.round((totals.preMatchTurnover - totals.preMatchGgr) / totals.preMatchTurnover * 1000) / 10 : 0
  
  // Trend data (filtered weeks)
  const trendData = weeks.map(w => ({ 
    week: `W${w.weekNumber}`, 
    turnover: w.turnover || 0, 
    ggr: w.ggr || 0, 
    tickets: w.tickets || 0, 
    actives: w.activeUsers || 0,
    gwm: w.gwm || 0,
    payout: w.payout || 0,
    avgTicket: w.avgTicket || 0,
    arpu: w.arpu || 0,
    livePct: w.live?.pct || 0,
    calcioPct: w.calcioPct || 0
  }))
  
  // Online vs Retail trend
  const channelTrend = weeks.map(w => ({
    week: `W${w.weekNumber}`,
    Online: w.online?.turnover || 0,
    Retail: w.retail?.turnover || 0
  }))
  
  // Pre-Match vs Live trend
  const typeTrend = weeks.map(w => ({
    week: `W${w.weekNumber}`,
    'Pre-Match': w.preMatch?.turnover || 0,
    Live: w.live?.turnover || 0
  }))
  
  // Channel Performance aggregated
  const channelAgg = {}
  weeks.forEach(w => (w.channelPerformance || []).forEach(ch => {
    if (!channelAgg[ch.channel]) channelAgg[ch.channel] = { channel: ch.channel, turnover: 0, ggr: 0, activesSum: 0, weeksCount: 0 }
    channelAgg[ch.channel].turnover += ch.turnover || 0
    channelAgg[ch.channel].ggr += ch.ggr || 0
    channelAgg[ch.channel].activesSum += ch.actives || 0
    channelAgg[ch.channel].weeksCount++
  }))
  const channelData = Object.values(channelAgg).map(ch => ({
    channel: ch.channel,
    turnover: ch.turnover,
    ggr: ch.ggr,
    actives: ch.weeksCount > 0 ? Math.round(ch.activesSum / ch.weeksCount) : 0,
    gwm: ch.turnover > 0 ? Math.round(ch.ggr / ch.turnover * 1000) / 10 : 0,
    pctTotal: totals.turnover > 0 ? Math.round(ch.turnover / totals.turnover * 1000) / 10 : 0
  })).sort((a, b) => b.turnover - a.turnover)
  const totalChGgr = channelData.reduce((s, c) => s + c.ggr, 0)
  channelData.forEach(c => { c.revShare = totalChGgr > 0 ? Math.round(c.ggr / totalChGgr * 1000) / 10 : 0 })
  
  // Top Sports aggregated
  const sportsAgg = {}
  weeks.forEach(w => (w.topSports || []).forEach(sp => {
    if (!sportsAgg[sp.name]) sportsAgg[sp.name] = { name: sp.name, turnover: 0, ggr: 0 }
    sportsAgg[sp.name].turnover += sp.turnover || 0
    sportsAgg[sp.name].ggr += sp.ggr || 0
  }))
  const topSportsData = Object.values(sportsAgg)
    .map(sp => ({ ...sp, pctTotal: totals.turnover > 0 ? Math.round(sp.turnover / totals.turnover * 1000) / 10 : 0 }))
    .sort((a, b) => b.turnover - a.turnover).slice(0, 8)
  
  // Age Distribution aggregated
  const ageAgg = { '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55-64': 0, '65+': 0 }
  weeks.forEach(w => (w.ageData || []).forEach(ag => { ageAgg[ag.range] = (ageAgg[ag.range] || 0) + ag.count }))
  const totalAgeCount = Object.values(ageAgg).reduce((s, v) => s + v, 0)
  const ageData = Object.entries(ageAgg).map(([range, count]) => ({ range, count, percent: totalAgeCount > 0 ? Math.round(count / totalAgeCount * 1000) / 10 : 0 }))

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      {/* ═══ FILTER BAR ═══ */}
      <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}`, marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'month', 'custom'].map(mode => (
            <button key={mode} onClick={() => setFilterMode(mode)} style={{ background: filterMode === mode ? C.primary : 'transparent', color: filterMode === mode ? C.primaryText : C.textSec, border: `1px solid ${filterMode === mode ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              {mode === 'all' ? 'All' : mode === 'month' ? 'Month' : 'Custom'}
            </button>
          ))}
        </div>
        {filterMode === 'month' && (
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            <option value="">Select month</option>
            {months.map(m => <option key={m.key} value={m.key}>{m.name} (W{m.weeks[0]}-W{m.weeks[m.weeks.length - 1]})</option>)}
          </select>
        )}
        {filterMode === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: C.textMuted, fontSize: '12px' }}>From W</span>
            <select value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}>
              <option value="">--</option>
              {weekNums.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span style={{ color: C.textMuted, fontSize: '12px' }}>to W</span>
            <select value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}>
              <option value="">--</option>
              {weekNums.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ color: C.accent, fontSize: '14px', fontWeight: 800 }}>{periodLabel}</span>
        </div>
      </div>

      {/* ═══ TRADING SUMMARY ═══ */}
      <Section title="Trading Summary Sport" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: '24px' }}>
          <KPI label="Total Turnover" value={totals.turnover} cur icon="activity" theme={C} />
          <KPI label="Total GGR" value={totals.ggr} sub={`GWM: ${avgs.gwm}%`} cur icon="trending" theme={C} />
          <KPI label="Total Tickets" value={totals.tickets} icon="box" theme={C} />
          <KPI label="Avg Actives/Week" value={avgs.actives} icon="users" theme={C} />
          <KPI label="ARPU Sport" value={avgs.arpu} cur icon="wallet" theme={C} />
          <KPI label="Avg Ticket" value={avgs.avgTicket} cur icon="card" theme={C} />
          <KPI label="Avg Payout" value={`${avgs.payout}%`} icon="percent" theme={C} />
          <KPI label="Total Bet Bonus" value={totals.betBonus} cur icon="gift" theme={C} />
        </div>
        
        {/* Quick Insights Row */}
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: C.card, borderRadius: '10px', padding: '14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase' }}>Football % Avg</p>
            <p style={{ color: C.accent, fontSize: '22px', fontWeight: 800, margin: 0 }}>{avgs.calcioPct}%</p>
          </div>
          <div style={{ background: C.card, borderRadius: '10px', padding: '14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase' }}>Live % Avg</p>
            <p style={{ color: C.danger, fontSize: '22px', fontWeight: 800, margin: 0 }}>{avgs.livePct}%</p>
          </div>
          <div style={{ background: C.card, borderRadius: '10px', padding: '14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase' }}>Avg Age</p>
            <p style={{ color: C.blue, fontSize: '22px', fontWeight: 800, margin: 0 }}>{avgs.age}</p>
          </div>
          <div style={{ background: C.card, borderRadius: '10px', padding: '14px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', fontWeight: 700, textTransform: 'uppercase' }}>Weeks</p>
            <p style={{ color: C.success, fontSize: '22px', fontWeight: 800, margin: 0 }}>{n}</p>
          </div>
        </div>
        
        {/* Trend Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
          <ChartCard title="Turnover + GGR + Payout" theme={C}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
              <YAxis yAxisId="left" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" domain={[85, 100]} tick={{ fill: C.orange, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<Tip theme={C} />} formatter={(v, name) => name === 'Payout' ? `${v}%` : fmtCurrency(v)} />
              <Legend />
              <Bar yAxisId="left" dataKey="turnover" name="Turnover" fill={C.primary} radius={[4, 4, 0, 0]} />
              <Line yAxisId="left" type="monotone" dataKey="ggr" name="GGR" stroke={C.success} strokeWidth={2} dot={{ fill: C.success, r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="payout" name="Payout" stroke={C.orange} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: C.orange, r: 4, strokeWidth: 2, stroke: '#FFF' }} />
            </ComposedChart>
          </ChartCard>
          <ChartCard title="Tickets & Actives Trend" theme={C}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
              <YAxis yAxisId="left" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
              <Tooltip content={<Tip theme={C} />} />
              <Legend />
              <Bar yAxisId="left" dataKey="tickets" name="Tickets" fill={C.blue} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="actives" name="Actives" stroke={C.purple} strokeWidth={2} dot={{ fill: C.purple, r: 3 }} />
            </ComposedChart>
          </ChartCard>
        </div>
      </Section>
      
      {/* ═══ AGE DISTRIBUTION ═══ */}
      <Section title="Player Age Distribution" theme={C}>
        <ChartCard title="Age Range" height={220} theme={C}>
          <BarChart data={ageData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="range" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
            <YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
            <Tooltip content={<Tip theme={C} />} />
            <Bar dataKey="count" fill={C.primary} radius={[4, 4, 0, 0]}>
              {ageData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
            </Bar>
          </BarChart>
        </ChartCard>
      </Section>
      
      {/* ═══ TURNOVER DISTRIBUTION ═══ */}
      <Section title="Turnover Distribution" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <div>
            <h4 style={{ color: C.textSec, fontSize: '12px', fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase' }}>Online vs Retail</h4>
            <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ width: `${onlinePct}%`, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: C.primaryText, fontSize: '11px', fontWeight: 800 }}>{onlinePct}%</span>
              </div>
              <div style={{ flex: 1, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFF', fontSize: '11px', fontWeight: 800 }}>{retailPct}%</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: C.bg, borderRadius: '8px', padding: '12px', border: `2px solid ${C.primary}` }}>
                <p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 600, margin: '0 0 4px 0' }}>ONLINE</p>
                <p style={{ color: C.text, fontSize: '18px', fontWeight: 800, margin: 0 }}>{fmtCurrency(totals.onlineTurnover)}</p>
              </div>
              <div style={{ background: C.bg, borderRadius: '8px', padding: '12px', border: `2px solid ${C.blue}` }}>
                <p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 600, margin: '0 0 4px 0' }}>RETAIL</p>
                <p style={{ color: C.text, fontSize: '18px', fontWeight: 800, margin: 0 }}>{fmtCurrency(totals.retailTurnover)}</p>
              </div>
            </div>
            <h4 style={{ color: C.textSec, fontSize: '12px', fontWeight: 700, margin: '0 0 12px 0', textTransform: 'uppercase' }}>Pre-Match vs Live</h4>
            <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ width: `${preMatchPct}%`, background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFF', fontSize: '11px', fontWeight: 800 }}>{preMatchPct}%</span>
              </div>
              <div style={{ flex: 1, background: C.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#FFF', fontSize: '11px', fontWeight: 800 }}>{totalLivePct}%</span>
              </div>
            </div>
            <Table cols={[
              { header: 'Type', accessor: 'tipo', format: v => <span style={{ fontWeight: 700, color: v === 'Live' ? C.danger : C.success }}>{v}</span> },
              { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
              { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtCurrency(v)}</span> },
              { header: 'GWM%', accessor: 'gwm', align: 'center', format: v => <span style={{ fontWeight: 700 }}>{v}%</span> },
              { header: 'Payout%', accessor: 'payout', align: 'center', format: v => <span style={{ color: C.orange, fontWeight: 700 }}>{v}%</span> },
              { header: 'Tickets', accessor: 'tickets', align: 'right', format: v => fmtNum(v) },
              { header: '%', accessor: 'pct', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{v}%</span> }
            ]} data={[
              { tipo: 'Pre-Match', turnover: totals.preMatchTurnover, ggr: totals.preMatchGgr, gwm: preMatchGwm, payout: preMatchPayout, tickets: totals.preMatchTickets, pct: preMatchPct },
              { tipo: 'Live', turnover: totals.liveTurnover, ggr: totals.liveGgr, gwm: liveGwm, payout: livePayout, tickets: totals.liveTickets, pct: totalLivePct }
            ]} theme={C} />
          </div>
          <ChartCard title="By Channel" height={320} theme={C}>
            <PieChart>
              <Pie data={channelData.filter(c => c.turnover > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="turnover" nameKey="channel">
                {channelData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
              </Pie>
              <Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend />
            </PieChart>
          </ChartCard>
        </div>
      </Section>
      
      {/* ═══ CHANNEL TREND ═══ */}
      <Section title="Channel Trend" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <ChartCard title="Online vs Retail" height={250} theme={C}>
            <AreaChart data={channelTrend}>
              <defs>
                <linearGradient id="spOL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient>
                <linearGradient id="spRT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.3} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} />
              <Legend />
              <Area type="monotone" dataKey="Online" stroke={C.primary} fill="url(#spOL)" strokeWidth={2} />
              <Area type="monotone" dataKey="Retail" stroke={C.blue} fill="url(#spRT)" strokeWidth={2} />
            </AreaChart>
          </ChartCard>
          <ChartCard title="Pre-Match vs Live" height={250} theme={C}>
            <AreaChart data={typeTrend}>
              <defs>
                <linearGradient id="spPM" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.3} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient>
                <linearGradient id="spLV" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.danger} stopOpacity={0.3} /><stop offset="95%" stopColor={C.danger} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} />
              <Legend />
              <Area type="monotone" dataKey="Pre-Match" stroke={C.success} fill="url(#spPM)" strokeWidth={2} />
              <Area type="monotone" dataKey="Live" stroke={C.danger} fill="url(#spLV)" strokeWidth={2} />
            </AreaChart>
          </ChartCard>
        </div>
      </Section>
      
      {/* ═══ CHANNEL PERFORMANCE ═══ */}
      {channelData.length > 0 && (
        <Section title="Channel Performance" theme={C}>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
            <Table cols={[
              { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { header: 'Avg Actives', accessor: 'actives', align: 'right', format: v => <span style={{ color: C.blue, fontWeight: 700 }}>{fmtNum(v)}</span> },
              { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
              { header: '% T/O', accessor: 'pctTotal', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 700 }}>{v}%</span> },
              { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtCurrency(v)}</span> },
              { header: 'GWM%', accessor: 'gwm', align: 'center', format: v => `${v}%` },
              { header: 'Rev Share', accessor: 'revShare', align: 'center', format: v => <span style={{ color: C.purple, fontWeight: 700 }}>{v}%</span> }
            ]} data={channelData} theme={C} />
            <ChartCard title="Revenue Share" height={220} theme={C}>
              <PieChart>
                <Pie data={channelData.filter(c => c.revShare > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="revShare" nameKey="channel">
                  {channelData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
                </Pie>
                <Tooltip content={<Tip theme={C} />} /><Legend />
              </PieChart>
            </ChartCard>
          </div>
        </Section>
      )}
      
      {/* ═══ TOP SPORTS ═══ */}
      {topSportsData.length > 0 && (
        <Section title="Top Sports" theme={C}>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
            <Table cols={[
              { header: '#', accessor: '_idx' },
              { header: 'Sport', accessor: 'name', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
              { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
              { header: '% T/O', accessor: 'pctTotal', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 700 }}>{v}%</span> },
              { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtCurrency(v)}</span> }
            ]} data={topSportsData.map((s, i) => ({ ...s, _idx: i + 1 }))} theme={C} />
            <ChartCard title="Turnover by Sport" height={280} theme={C}>
              <BarChart data={topSportsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => `€${(v/1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fill: C.text, fontSize: 11, fontWeight: 600 }} />
                <Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} />
                <Bar dataKey="turnover" fill={C.primary} radius={[0, 4, 4, 0]}>
                  {topSportsData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
                </Bar>
              </BarChart>
            </ChartCard>
          </div>
        </Section>
      )}
      
      {/* ═══ WEEKLY DETAIL ═══ */}
      <Section title="Weekly Detail" theme={C}>
        <Table cols={[
          { header: 'Week', accessor: 'week', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{v}</span> },
          { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
          { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: v >= 0 ? C.success : C.danger, fontWeight: 700 }}>{fmtCurrency(v)}</span> },
          { header: 'GWM%', accessor: 'gwm', align: 'center', format: v => `${v}%` },
          { header: 'Tickets', accessor: 'tickets', align: 'right', format: v => fmtNum(v) },
          { header: 'Actives', accessor: 'actives', align: 'right', format: v => fmtNum(v) },
          { header: 'Avg Ticket', accessor: 'avgTicket', align: 'right', format: v => fmtCurrency(v) },
          { header: 'ARPU', accessor: 'arpu', align: 'right', format: v => fmtCurrency(v) },
          { header: 'Football%', accessor: 'calcioPct', align: 'center', format: v => `${v}%` },
          { header: 'Live%', accessor: 'livePct', align: 'center', format: v => `${v}%` }
        ]} data={[...trendData].reverse()} theme={C} />
      </Section>
    </div>
  )
}

const ComingSoon = ({ section, icon, theme }) => {
  const C = theme
  return (
    <div style={{ padding: 'clamp(40px, 6vw, 80px)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: C.card, border: `2px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <Icon name={icon} size={36} color={C.text} />
        </div>
        <h2 style={{ color: C.text, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, margin: '0 0 12px 0' }}>{section}</h2>
        <div style={{ display: 'inline-block', background: C.primary, color: C.primaryText, padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>Coming Soon</div>
        <p style={{ color: C.textMuted, fontSize: 'clamp(14px, 1.6vw, 17px)', lineHeight: 1.7, margin: 0 }}>
          {section === 'Casino' 
            ? 'Dashboard dedicated to the Casino vertical with detailed analysis on Slots, Live Casino, Table Games, provider performance and product-specific metrics.'
            : 'Dashboard dedicated to the Sport vertical with analysis on Pre-Match Bets, Live Betting, performance by sport discipline and market trends.'}
        </p>
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {(section === 'Casino' 
            ? ['Slot', 'Live Casino', 'Table Games', 'Provider Analysis']
            : ['Pre-Match', 'Live Betting', 'Per Sport', 'Market Trends']
          ).map(tag => (
            <span key={tag} style={{ color: C.textMuted, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 14px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.card }}>{tag}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [tab, setTab] = useState('weekly')
  const [weeks, setWeeks] = useState({})
  const [casinoWeeks, setCasinoWeeks] = useState({})
  const [sportWeeks, setSportWeeks] = useState({})
  const [dailyMonths, setDailyMonths] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [db, setDb] = useState({ connected: false })
  const [isDark, setIsDark] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const ww = useWindowWidth()
  const mob = ww < 768

  const C = isDark ? THEMES.dark : THEMES.light

  useEffect(() => {
    if (localStorage.getItem('dazn_dashboard_auth') === 'true') setIsAuth(true)
    if (localStorage.getItem('dazn_upload_auth') === 'true') setIsAdmin(true)
  }, [])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isAuth) { setLoading(false); return }
    setLoading(true);
    (async () => {
      try {
        const c = await checkConnection(); setDb(c)
        const r = await loadAllWeeksData()
        if (r.data && Object.keys(r.data).length) {
          const mainW = {}, casinoW = {}, sportW = {}, dailyM = {}
          const dailyNumToKey = n => { const yr = 2025 + Math.floor((n - 1) / 12); const mo = ((n - 1) % 12) + 1; return `${yr}-${String(mo).padStart(2, '0')}` }
          Object.entries(r.data).forEach(([k, v]) => {
            const n = Number(k)
            if (n >= 3000) { const mk = dailyNumToKey(n - 3000); dailyM[mk] = { ...v, monthKey: mk } }
            else if (n >= 2000) sportW[n - 2000] = { ...v, weekNumber: n - 2000 }
            else if (n >= 1000) casinoW[n - 1000] = { ...v, weekNumber: n - 1000 }
            else mainW[n] = v
          })
          setWeeks(mainW); setCasinoWeeks(casinoW); setSportWeeks(sportW); setDailyMonths(dailyM)
          const mainKeys = Object.keys(mainW).map(Number); if (mainKeys.length) setSelected(Math.max(...mainKeys))
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    })()
  }, [isAuth])

  const handleLogout = () => { localStorage.removeItem('dazn_dashboard_auth'); localStorage.removeItem('dazn_upload_auth'); setIsAuth(false); setIsAdmin(false) }
  const handleSaveNote = async (weekNum, note) => {
    const updated = { ...weeks[weekNum], weekNote: note }
    const u = { ...weeks, [weekNum]: updated }
    setWeeks(u)
    await saveWeekData(updated)
  }
  const handleUpload = async d => { const u = { ...weeks, [d.weekNumber]: d }; setWeeks(u); setSelected(d.weekNumber); await saveWeekData(d); setTab('weekly') }
  const handleDelete = async n => { if (!confirm(`Delete Week ${n}?`)) return; const { [n]: _, ...rest } = weeks; setWeeks(rest); await deleteWeekData(n); setSelected(Object.keys(rest).length ? Math.max(...Object.keys(rest).map(Number)) : null) }
  const handleCasinoUpload = async d => { const u = { ...casinoWeeks, [d.weekNumber]: d }; setCasinoWeeks(u); await saveWeekData({ ...d, weekNumber: d.weekNumber + 1000 }); setTab('casino') }
  const handleCasinoDelete = async n => { if (!confirm(`Delete Casino Week ${n}?`)) return; const { [n]: _, ...rest } = casinoWeeks; setCasinoWeeks(rest); await deleteWeekData(n + 1000) }
  const handleSportUpload = async d => { const u = { ...sportWeeks, [d.weekNumber]: d }; setSportWeeks(u); await saveWeekData({ ...d, weekNumber: d.weekNumber + 2000 }); setTab('sport') }
  const handleSportDelete = async n => { if (!confirm(`Delete Sport Week ${n}?`)) return; const { [n]: _, ...rest } = sportWeeks; setSportWeeks(rest); await deleteWeekData(n + 2000) }
  const dailyKeyToNum = mk => { const [y, m] = mk.split('-').map(Number); return 3000 + (y - 2025) * 12 + m }
  const handleDailyUpload = async d => { const u = { ...dailyMonths, [d.monthKey]: d }; setDailyMonths(u); await saveWeekData({ ...d, weekNumber: dailyKeyToNum(d.monthKey) }); setTab('general') }
  const handleDailyDelete = async mk => { if (!confirm(`Delete ${mk}?`)) return; const { [mk]: _, ...rest } = dailyMonths; setDailyMonths(rest); await deleteWeekData(dailyKeyToNum(mk)) }

  const weekNums = Object.keys(weeks).map(Number).sort((a, b) => b - a)
  const current = selected ? weeks[selected] : null
  const prev = selected && weeks[selected - 1] ? weeks[selected - 1] : null

  // LOGIN SCREEN
  if (!isAuth) return <LoginGate onLogin={setIsAuth} theme={C} />

  // LOADING con logo DAZN Bet
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "Oscine, system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <img src="https://www.daznbet.it/external_css/DAZNBET/logo.png" alt="DAZN Bet" style={{ height: '50px', marginBottom: '24px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <p style={{ color: '#888', fontSize: '14px', fontWeight: 600 }}>Loading data...</p>
      </div>
      <style>{`@font-face { font-family: Oscine; src: url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Rg.woff) format("woff"), url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Rg.woff2) format("woff2"); font-weight: 400; } @font-face { font-family: Oscine; src: url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Bd.woff) format("woff"), url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Bd.woff2) format("woff2"); font-weight: 700; } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "Oscine, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text, transition: 'background 0.3s, color 0.3s', overflowX: 'hidden', '--hover-bg': C.hover, '--hover-text': C.text }}>
      <style>{`
        @font-face { font-family: Oscine; src: url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Rg.woff) format("woff"), url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Rg.woff2) format("woff2"); font-weight: 400; }
        @font-face { font-family: Oscine; src: url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Bd.woff) format("woff"), url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Bd.woff2) format("woff2"); font-weight: 700; }
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        .recharts-wrapper { max-width: 100% !important; }
        .recharts-surface { max-width: 100% !important; }
        .dazn-table tbody tr:not(.total-row):hover { background: var(--hover-bg) !important; }
        .dazn-table tbody tr:not(.total-row):hover td { color: var(--hover-text) !important; }
        @media (max-width: 480px) {
          table { font-size: 11px !important; }
          th, td { padding: 6px 8px !important; }
        }
      `}</style>
      <header style={{ background: C.bg, padding: mob ? '12px 16px' : 'clamp(12px, 1.5vw, 16px) clamp(20px, 3vw, 48px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="DAZN Bet" style={{ height: mob ? '30px' : '40px' }} />
            {!mob && <div>
              <h1 style={{ color: C.text, fontSize: 'clamp(14px, 1.6vw, 18px)', fontWeight: 800, margin: 0 }}>Weekly Trading Report</h1>
              <p style={{ color: C.textMuted, fontSize: 'clamp(10px, 1vw, 12px)', margin: 0 }}>Italy 2026 <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: db.connected ? C.successDim : C.border, color: db.connected ? C.success : C.textMuted, fontWeight: 700 }}>{db.connected ? '● Cloud' : '● Local'}</span></p>
            </div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: mob ? '6px' : '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[{ id: 'weekly', icon: 'chart', label: 'Weekly' }, { id: 'general', icon: 'calendar', label: 'General' }, { id: 'casino', icon: 'casino', label: 'Casino' }, { id: 'sport', icon: 'sport', label: 'Sport' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? C.primary : 'transparent', color: tab === t.id ? C.primaryText : C.textSec, border: `1px solid ${tab === t.id ? C.primary : C.border}`, borderRadius: '6px', padding: mob ? '8px 12px' : 'clamp(8px, 1vw, 10px) clamp(14px, 2vw, 20px)', fontSize: mob ? '12px' : 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name={t.icon} size={14} color={tab === t.id ? C.primaryText : C.textSec} />{!mob && t.label}</button>
              ))}
            </div>
            <div style={{ width: '1px', height: '24px', background: C.border }} />
            <button onClick={() => setTab('upload')} style={{ background: tab === 'upload' ? C.danger : 'transparent', color: tab === 'upload' ? '#FFF' : C.textMuted, border: `1px solid ${tab === 'upload' ? C.danger : C.border}`, borderRadius: '6px', padding: mob ? '8px 10px' : 'clamp(8px, 1vw, 10px) clamp(14px, 2vw, 20px)', fontSize: mob ? '12px' : 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="lock" size={14} color={tab === 'upload' ? '#FFF' : C.textMuted} />{!mob && 'Admin'}</button>
            <button onClick={() => setIsDark(!isDark)} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={isDark ? 'sun' : 'moon'} size={16} color={C.text} /></button>
            <button onClick={handleLogout} style={{ background: 'transparent', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: '6px', padding: '8px', cursor: 'pointer', opacity: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Logout"><Icon name="logout" size={16} color={C.danger} /></button>
          </div>
          {tab === 'weekly' && weekNums.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select value={selected || ''} onChange={e => setSelected(Number(e.target.value))} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', minWidth: '100px' }}>
                {weekNums.map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
              {current && <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 600 }}>{current.dateRange}</span>}
            </div>
          )}
        </div>
      </header>
      <main>
        {tab === 'weekly' && <Weekly data={current} prev={prev} allWeeks={weeks} theme={C} isAdmin={isAdmin} onSaveNote={handleSaveNote} />}
        {tab === 'general' && <Monthly weeksData={weeks} dailyMonthsData={dailyMonths} theme={C} />}
        {tab === 'casino' && <CasinoSection weeksData={casinoWeeks} theme={C} />}
        {tab === 'sport' && <SportSection weeksData={sportWeeks} theme={C} />}
        {tab === 'upload' && <UploadPage weeksData={weeks} casinoWeeksData={casinoWeeks} sportWeeksData={sportWeeks} dailyMonthsData={dailyMonths} onUpload={handleUpload} onCasinoUpload={handleCasinoUpload} onSportUpload={handleSportUpload} onDailyUpload={handleDailyUpload} onDelete={handleDelete} onCasinoDelete={handleCasinoDelete} onSportDelete={handleSportDelete} onDailyDelete={handleDailyDelete} onLogout={handleLogout} onAdminAuth={() => setIsAdmin(true)} theme={C} />}
      </main>
      {showTop && <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '24px', right: '24px', width: '44px', height: '44px', borderRadius: '50%', background: C.primary, color: C.primaryText, border: 'none', fontSize: '20px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, transition: 'opacity 0.3s', opacity: 0.85 }} title="Back to top">↑</button>}
    </div>
  )
}
