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
    hover: '#EFEFEF',         // Hover righe tabella (grigio chiaro)
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

  if (skin.includes("VIVABET")) {
    if (promoter.includes("nsg social web")) return "VIVABET/GLAD"
    return "Tipster Academy"
  }
  if (skin.includes("DAZNBET") || skin.includes("SCOMMETTENDO")) {
    if (puntoVendita.includes("www.daznbet.it") || puntoVendita.includes("www.scommettendo.it")) return "DAZNBET Organic"
    if (promoter.includes("dazn") || promoter.includes("funpoints") || codPunto.includes("DAZN_SUPERPRONOSTICO")) return "DAZN Direct"
    return "AFFILIATES"
  }
  if (!puntoVendita.includes("www.scommettendo.it")) return "PVR"
  return "OTHER"
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
  daznbet.forEach(r => { const c = String(r["Cod liv 1"] || ""); if (c.startsWith("DAZN_")) { ddT += parseNum(r["Giocato"]); ddG += parseNum(r["ggr"]); ddA++ } })
  if (ddT > 0) { chanPerf.push({ channel: 'DAZN Direct', turnover: ddT, ggr: ddG, gwm: ddT > 0 ? parseFloat((ddG / ddT * 100).toFixed(1)) : 0, actives: ddA }); totGgr += ddG }

  let affT = 0, affG = 0, affA = 0
  daznbet.forEach(r => { const c = String(r["Cod liv 1"] || ""); if (c && c !== "DAZNBET" && !c.startsWith("DAZN_") && c.toLowerCase() !== "nan") { affT += parseNum(r["Giocato"]); affG += parseNum(r["ggr"]); affA++ } })
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
  const sources = Object.entries(srcCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name: String(name).substring(0, 20), count }))

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
  daznbet.forEach(r => { const c = String(r["Cod liv 1"] || ""); if (c.startsWith("DAZN_")) { ddT += parseNum(r["Giocato"]); ddG += parseNum(r["ggr"]) || parseNum(r["rake"]); ddA++ } })
  if (ddT > 0) { chanPerf.push({ channel: 'DAZN Direct', turnover: ddT, ggr: ddG, actives: ddA }); totChGgr += ddG }

  let affT = 0, affG = 0, affA = 0
  daznbet.forEach(r => { const c = String(r["Cod liv 1"] || ""); if (c && c !== "DAZNBET" && !c.startsWith("DAZN_") && c.toLowerCase() !== "nan") { affT += parseNum(r["Giocato"]); affG += parseNum(r["ggr"]) || parseNum(r["rake"]); affA++ } })
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
  const DAYS = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
  const BLOCKS = ['00-04','04-08','08-12','12-16','16-20','20-24']

  const makeSeg = () => ({
    tk: 0, g: 0, ggr: 0, acc: new Set(),
    h: Array.from({length:24}, () => ({t:0,g:0,r:0})),
    d: Array.from({length:7}, () => ({t:0,g:0,r:0})),
    dur: [0,0,0,0,0,0,0,0], durS: 0, durN: 0,
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
    if (ed instanceof Date && !isNaN(ed.getTime())) { dm = (ed - sd) / 60000; if (dm < 0) dm = null }
    const isO = ONLINE.includes(pr)
    const tgts = [S.gen, isO ? S.onl : S.pvr]
    for (let j = 0; j < 2; j++) {
      const s = tgts[j]; s.tk++; s.g += gi; s.ggr += gr
      if (ac) s.acc.add(ac)
      s.h[hr].t++; s.h[hr].g += gi; s.h[hr].r += gr
      s.d[di].t++; s.d[di].g += gi; s.d[di].r += gr
      s.hm[di][bi]++
      if (dm !== null && dm >= 0) {
        s.durS += dm; s.durN++
        s.dur[dm<1?0:dm<5?1:dm<15?2:dm<30?3:dm<60?4:dm<120?5:dm<240?6:7]++
      }
      if (pr) s.pr[pr] = (s.pr[pr] || 0) + 1
    }
  }

  const fin = (s) => {
    const acc = s.acc.size
    const avg = s.durN > 0 ? Math.round(s.durS / s.durN * 10) / 10 : 0
    const gwm = s.g > 0 ? Math.round(s.ggr / s.g * 1000) / 10 : 0
    const tb = [{n:'Notte',r:'00-06',t:0,g:0,rr:0},{n:'Mattina',r:'06-12',t:0,g:0,rr:0},{n:'Pomeriggio',r:'12-18',t:0,g:0,rr:0},{n:'Sera',r:'18-24',t:0,g:0,rr:0}]
    s.h.forEach((h,i) => { const x = i<6?0:i<12?1:i<18?2:3; tb[x].t+=h.t; tb[x].g+=h.g; tb[x].rr+=h.r })
    const tbT = tb.reduce((a,b)=>a+b.t,0)
    const timeBlocks = tb.map(b => ({name:b.n,range:b.r,tickets:b.t,giocato:Math.round(b.g),ggr:Math.round(b.rr),percent:tbT>0?Math.round(b.t/tbT*1000)/10:0}))
    const hourly = s.h.map((h,i) => ({hour:String(i).padStart(2,'0')+':00',tickets:h.t,giocato:Math.round(h.g),ggr:Math.round(h.r),pct:s.tk>0?Math.round(h.t/s.tk*1000)/10:0}))
    const daily = s.d.map((d,i) => ({day:DAYS[i],tickets:d.t,giocato:Math.round(d.g),ggr:Math.round(d.r),pct:s.tk>0?Math.round(d.t/s.tk*1000)/10:0}))
    const DL = ['<1m','1-5m','5-15m','15-30m','30-60m','1-2h','2-4h','4h+']
    const duration = DL.map((l,i) => ({range:l,count:s.dur[i],percent:s.durN>0?Math.round(s.dur[i]/s.durN*1000)/10:0}))
    const heatmap = DAYS.map((dy,di) => ({day:dy,blocks:BLOCKS.map((bl,bi) => ({block:bl,tickets:s.hm[di][bi],pct:s.tk>0?Math.round(s.hm[di][bi]/s.tk*1000)/10:0}))}))
    const promoters = Object.entries(s.pr).map(([n,c])=>({name:n,count:c,pct:s.tk>0?Math.round(c/s.tk*1000)/10:0})).sort((a,b)=>b.count-a.count)
    const pH = hourly.reduce((b,h)=>h.tickets>b.tickets?h:b,hourly[0])
    const gH = hourly.reduce((b,h)=>h.ggr>b.ggr?h:b,hourly[0])
    const tD = daily.reduce((b,d)=>d.tickets>b.tickets?d:b,daily[0])
    return { tickets:s.tk, giocato:Math.round(s.g), ggr:Math.round(s.ggr), accounts:acc, gwm, avgDuration:avg, hourly, daily, timeBlocks, duration, heatmap, promoters,
      insights:{peakHour:pH.hour,peakHourPct:pH.pct,bestGgrHour:gH.hour,bestGgrAmount:gH.ggr,topDay:tD.day,topDayPct:tD.pct}
    }
  }
  const df = d => d ? `${d.getDate().toString().padStart(2,'0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]} ${d.getFullYear()}` : ''
  return { period: `${df(minD)} - ${df(maxD)}`, totalRows: rows.length, segments: { generale: fin(S.gen), online: fin(S.onl), pvr: fin(S.pvr) } }
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
  const [hovered, setHovered] = useState(null)
  return (
    <div style={{ overflowX: 'auto', borderRadius: '10px', border: `1px solid ${C.border}` }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: compact ? '12px' : 'clamp(12px, 1.2vw, 14px)' }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {cols.map((c, i) => <th key={i} style={{ padding: compact ? '10px 12px' : 'clamp(10px, 1.4vw, 14px) clamp(12px, 1.5vw, 18px)', textAlign: c.align || 'left', color: C.accent, fontWeight: 700, fontSize: compact ? '10px' : 'clamp(10px, 1vw, 12px)', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: `2px solid ${C.accent}` }}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((r, ri) => {
            const isHov = hovered === ri && !r.isTotal
            const baseBg = r.isTotal ? C.accent + '12' : ri % 2 === 0 ? C.card : C.bg
            return (
              <tr key={ri} onMouseEnter={() => setHovered(ri)} onMouseLeave={() => setHovered(null)} style={{ background: isHov ? C.hover : baseBg, transition: 'background 0.15s', cursor: 'default' }}>
                {cols.map((c, ci) => { const v = c.accessor ? r[c.accessor] : ''; return <td key={ci} style={{ padding: compact ? '8px 12px' : 'clamp(10px, 1.3vw, 12px) clamp(12px, 1.5vw, 18px)', textAlign: c.align || 'left', color: r.isTotal ? C.accent : C.text, fontWeight: r.isTotal ? 800 : 400, borderBottom: `1px solid ${C.border}` }}>{c.format ? c.format(v, r) : v}</td> })}
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
const UploadPage = ({ weeksData, casinoWeeksData, onUpload, onCasinoUpload, onDelete, onCasinoDelete, onLogout, theme }) => {
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
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const bulkInputRef = useRef(null)
  const casinoBulkRef = useRef(null)
  const isMain = uploadSection === 'main'
  const curFILES = isMain ? FILES : CASINO_FILES
  const curFiles = isMain ? files : casinoFiles
  const setCurFiles = isMain ? setFiles : setCasinoFiles
  const curWeeksData = isMain ? weeksData : (casinoWeeksData || {})
  const exists = week && curWeeksData[parseInt(week)]

  useEffect(() => { if (localStorage.getItem('dazn_upload_auth') === 'true') setUploadAuth(true) }, [])

  const handleUploadLogin = () => {
    if (uploadPwd === UPLOAD_PASSWORD) { setUploadAuth(true); localStorage.setItem('dazn_upload_auth', 'true') }
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

  // UPLOAD MASSIVO - Match file names automaticamente
  const handleBulkUpload = async (e) => {
    const fileList = Array.from(e.target.files)
    if (!fileList.length) return
    setLoading(true)
    setMsg({ t: 'info', m: `Processing ${fileList.length} files...` })
    const newFiles = { ...curFiles }
    let matched = 0
    for (const f of fileList) {
      const fname = f.name.toLowerCase()
      const key = isMain ? matchMainFile(fname) : matchCasinoFile(fname)
      if (key) {
        try { const d = await readFile(f); newFiles[key] = { name: f.name, data: d, rows: d.length }; matched++ }
        catch (err) { console.error(`Error reading ${f.name}:`, err) }
      }
    }
    setCurFiles(newFiles)
    setLoading(false)
    setMsg({ t: 'success', m: `${matched}/${fileList.length} files matched and loaded!` })
  }

  const handleUpload = async () => {
    if (!week || !dateFrom || !dateTo) { setMsg({ t: 'error', m: 'Enter week number and select dates' }); return }
    const missing = curFILES.filter(f => !curFiles[f.key])
    if (missing.length) { setMsg({ t: 'error', m: `${missing.length} files missing` }); return }
    setLoading(true)
    try {
      const fd = {}; Object.entries(curFiles).forEach(([k, v]) => fd[k] = v.data)
      const proc = isMain ? processData(fd, parseInt(week), dates) : processCasinoData(fd, parseInt(week), dates)
      if (isMain) await onUpload(proc); else await onCasinoUpload(proc)
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
            {[{ id: 'main', label: 'Main Dashboard', icon: 'chart' }, { id: 'casino', label: 'Casino', icon: 'casino' }].map(s => (
              <button key={s.id} onClick={() => { setUploadSection(s.id); setMsg(null) }} style={{ background: uploadSection === s.id ? C.primary : 'transparent', color: uploadSection === s.id ? C.primaryText : C.textSec, border: `1px solid ${uploadSection === s.id ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name={s.icon} size={14} color={uploadSection === s.id ? C.primaryText : C.textSec} />{!mob && s.label}</button>
            ))}
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="logout" size={14} color={C.danger} /> Logout</button>
        </div>
        
        {/* UPLOAD MASSIVO */}
        <div style={{ background: C.primary + '10', border: `2px dashed ${C.primary}`, borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <h3 style={{ color: C.accent, margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Icon name="upload" size={18} color={C.accent} /> Bulk Upload {!isMain && '(Casino)'}</h3>
          <p style={{ color: C.textMuted, fontSize: '13px', margin: '0 0 16px 0' }}>Select all {totalRequired} Excel files at once — they will be matched automatically</p>
          <input ref={isMain ? bulkInputRef : casinoBulkRef} type="file" accept=".xlsx,.xls" multiple onChange={handleBulkUpload} style={{ display: 'none' }} />
          <button onClick={() => (isMain ? bulkInputRef : casinoBulkRef).current?.click()} disabled={loading} style={{ background: C.primary, color: C.primaryText, border: 'none', borderRadius: '8px', padding: '12px 32px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Processing...' : 'Select All Files'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Week</label>
            <input type="number" value={week} onChange={e => setWeek(e.target.value)} placeholder="e.g. 6" style={{ width: '100%', background: C.bg, border: `1px solid ${exists ? C.orange : C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '16px', fontWeight: 700 }} />
            {exists && <p style={{ color: C.orange, fontSize: '11px', marginTop: '6px' }}>⚠ Will overwrite</p>}
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }} />
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }} />
          </div>
          {dates && <div><label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Preview</label><div style={{ background: C.card, border: `1px solid ${C.primary}`, borderRadius: '8px', padding: '12px', color: C.accent, fontSize: '14px', fontWeight: 700 }}>{dates}</div></div>}
        </div>

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
            {loading ? 'Processing...' : exists ? `Update Week ${week}` : `Upload Week ${week || '?'}`}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '120px', height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${(uploadedCount / totalRequired) * 100}%`, height: '100%', background: C.primary, transition: 'width 0.3s' }} /></div>
            <span style={{ color: uploadedCount >= totalRequired ? C.success : C.textMuted, fontSize: '13px', fontWeight: 700 }}>{uploadedCount}/{totalRequired}</span>
          </div>
        </div>

        {Object.keys(curWeeksData).length > 0 && (
          <>
            <h3 style={{ color: C.text, fontSize: '16px', margin: '0 0 16px 0', fontWeight: 700 }}>Uploaded Weeks {!isMain && '(Casino)'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {Object.values(curWeeksData).sort((a, b) => b.weekNumber - a.weekNumber).map(w => (
                <div key={w.weekNumber} style={{ background: C.card, borderRadius: '10px', padding: '16px', border: `1px solid ${C.border}`, position: 'relative' }}>
                  <button onClick={() => isMain ? onDelete(w.weekNumber) : onCasinoDelete(w.weekNumber)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: C.danger, border: 'none', fontSize: '14px', cursor: 'pointer', opacity: 0.6 }}>✕</button>
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
              ))}
            </div>
          </>
        )}
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY SUMMARY — ALL + CUSTOM
// ═══════════════════════════════════════════════════════════════════════════════
const Monthly = ({ weeksData, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const allWeeks = Object.values(weeksData).sort((a, b) => a.weekNumber - b.weekNumber)
  
  const [filterMode, setFilterMode] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [qaChannel, setQaChannel] = useState('ALL')

  if (!allWeeks.length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>No data available</p></div>

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
  }

  if (!current) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted }}>No data for selection</p></div>

  // Chart data
  const trend = current.weeks.map(w => ({ week: `W${w.weekNumber}`, REG: w.registrations, FTDs: w.ftds, GGR: Math.round(w.ggr / 1000), Actives: w.activeUsers }))
  const cashFlowTrend = current.weeks.map(w => ({ week: `W${w.weekNumber}`, Deposits: w.totalDeposits || 0, Withdrawals: w.totalWithdrawals || 0, NetDeposit: (w.totalDeposits || 0) - (w.totalWithdrawals || 0) }))
  const bonusTrend = current.weeks.map(w => ({ week: `W${w.weekNumber}`, Bonus: w.totalBonus || 0 }))

  // QA per-week comparison
  const qaWeeks = current.weeks.slice(-10)
  const qaChannelList = current.qualityData.filter(c => !c.isTotal).map(c => c.channel)
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
    <div id="monthly-report" style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      {/* ═══ FILTER BAR ═══ */}
      <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}`, marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'custom'].map(mode => (
            <button key={mode} onClick={() => setFilterMode(mode)} style={{ background: filterMode === mode ? C.primary : 'transparent', color: filterMode === mode ? C.primaryText : C.textSec, border: `1px solid ${filterMode === mode ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{mode === 'all' ? 'All' : 'Custom'}</button>
          ))}
        </div>

        {filterMode === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: C.textMuted, fontSize: '12px' }}>Da Week</span>
            <select value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}><option value="">--</option>{weekNums.map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span style={{ color: C.textMuted, fontSize: '12px' }}>a Week</span>
            <select value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}><option value="">--</option>{weekNums.map(n => <option key={n} value={n}>{n}</option>)}</select>
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: C.accent, fontSize: '14px', fontWeight: 800 }}>{periodLabel}</span>
          <span style={{ color: C.textMuted, fontSize: '11px', background: C.bg, padding: '4px 10px', borderRadius: '4px', fontWeight: 700 }}>{current.weekCount}w</span>
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
          <ChartCard title="Registration & FTD Trend" theme={C}>
            <AreaChart data={trend}><defs><linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient><linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.3} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="REG" stroke={C.primary} fill="url(#gR)" strokeWidth={2} /><Area type="monotone" dataKey="FTDs" stroke={C.success} fill="url(#gF)" strokeWidth={2} /></AreaChart>
          </ChartCard>
          <ChartCard title="GGR Trend (€K)" theme={C}>
            <ComposedChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="GGR" fill={C.primary} radius={[4, 4, 0, 0]} /><Line type="monotone" dataKey="Actives" stroke={C.blue} strokeWidth={2} dot={{ fill: C.blue, r: 3 }} /></ComposedChart>
          </ChartCard>
        </div>

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
        ]} data={current.weeks} theme={C} />
      </Section>

      {/* ═══ CASH FLOW ═══ */}
      <Section title="Weekly Cash Flow" theme={C}>
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
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Avg Weekly</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: 0 }}>{fmtCurrency(current.bonus / current.weekCount)}</p></div>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Bonus ROI</p><p style={{ color: C.success, fontSize: '28px', fontWeight: 900, margin: 0 }}>{current.bonusRoi}x</p></div>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>% of GGR</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: 0 }}>{current.bonusPctGgr}%</p></div>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ QUALITY ACQUISITION ═══ */}
      <Section title="Quality Acquisition" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: (v, r) => <span style={{ fontWeight: r.isTotal ? 900 : 700, color: r.isTotal ? C.accent : C.text }}>{v}</span> },
            { header: 'REG', accessor: 'reg', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'FTDs', accessor: 'ftds', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Conv%', accessor: 'conv', align: 'center', format: (v, r) => <span style={{ color: r.isTotal ? C.accent : v >= 55 ? C.success : v >= 45 ? C.orange : C.danger, fontWeight: 800 }}>{v}%</span> }
          ]} data={current.qualityData} theme={C} />
          <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ color: C.textSec, margin: 0, fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>REG & FTDs per Week</h4>
              <select value={qaChannel} onChange={e => setQaChannel(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                <option value="ALL">Tutti i Canali</option>
                {qaChannelList.map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={qaCompareData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} />
                <YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} />
                <Tooltip content={<Tip theme={C} />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                <Bar dataKey="REG" fill={C.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="FTDs" fill={C.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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

      {/* ═══ PRODUCT PERFORMANCE ═══ */}
      <Section title="Product Performance" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Product', accessor: 'product', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Avg Active', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
          ]} data={current.productData} compact theme={C} />
          <ChartCard title="GGR by Product" height={220} theme={C}>
            <BarChart data={current.productData.slice(0, 6)} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><YAxis dataKey="product" type="category" width={mob ? 55 : 80} tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Bar dataKey="ggr" fill={C.primary} radius={[0, 4, 4, 0]}>{current.productData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
        </div>
      </Section>

      {/* ═══ DEMOGRAPHICS ═══ */}
      <Section title="Demographics" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1.5fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(20px, 3vw, 32px)', border: `1px solid ${C.border}` }}>
            <h4 style={{ color: C.textMuted, margin: '0 0 24px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>Gender Split</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: C.text, fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, margin: 0 }}>{current.gender.male}%</p>
                <p style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, margin: '4px 0 0 0', textTransform: 'uppercase' }}>Male</p>
                <p style={{ color: C.textMuted, fontSize: '11px', margin: '2px 0 0 0' }}>{fmtNum(current.gender._maleCount)}</p>
              </div>
              <div style={{ width: '1px', background: C.border }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: C.text, fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 900, margin: 0 }}>{current.gender.female}%</p>
                <p style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, margin: '4px 0 0 0', textTransform: 'uppercase' }}>Female</p>
                <p style={{ color: C.textMuted, fontSize: '11px', margin: '2px 0 0 0' }}>{fmtNum(current.gender._femaleCount)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${current.gender.male}%`, background: C.text, transition: 'width 0.5s' }} />
              <div style={{ width: `${current.gender.female}%`, background: C.textMuted, transition: 'width 0.5s' }} />
            </div>
          </div>

          <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(20px, 3vw, 32px)', border: `1px solid ${C.border}` }}>
            <h4 style={{ color: C.textMuted, margin: '0 0 24px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>Age Distribution</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {current.ageGroups.map((ag, i) => (
                <div key={ag.range} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: C.textMuted, fontSize: '12px', fontWeight: 700, minWidth: '50px' }}>{ag.range}</span>
                  <div style={{ flex: 1, height: '24px', background: C.bg, borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${Math.max(ag.percent, 2)}%`, height: '100%', background: C.chart[i % C.chart.length], borderRadius: '4px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ color: C.text, fontSize: '13px', fontWeight: 800, minWidth: '40px', textAlign: 'right' }}>{ag.percent}%</span>
                  <span style={{ color: C.textMuted, fontSize: '11px', minWidth: '45px', textAlign: 'right' }}>{fmtNum(ag.count)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY REPORT
// ═══════════════════════════════════════════════════════════════════════════════
const Weekly = ({ data, prev, theme }) => {
  const C = theme
  const ww = useWindowWidth()
  const mob = ww < 768
  const [qaMetric, setQaMetric] = useState('conv')
  const [dailyMetric, setDailyMetric] = useState('regftd')
  if (!data) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>Select or upload a week</p></div>

  const regCh = prev ? calcChange(data.registrations, prev.registrations) : null
  const ftdCh = prev ? calcChange(data.ftds, prev.ftds) : null
  const turnCh = prev ? calcChange(data.turnover, prev.turnover) : null
  const ggrCh = prev ? calcChange(data.ggr, prev.ggr) : null
  const actCh = prev ? calcChange(data.activeUsers, prev.activeUsers) : null

  return (
    <div id="weekly-report" style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <Section title="Trading Summary" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <KPI label="Registrations" value={data.registrations} change={regCh} icon="user" delay={0} theme={C} />
          <KPI label="FTDs" value={data.ftds} sub={`Conv: ${data.conversionRate}% • Avg: €${data.avgFirstDeposit}`} change={ftdCh} icon="card" delay={50} theme={C} />
          <KPI label="Net Deposit" value={data.netDeposit} sub={`Dep ${fmtCurrency(data.totalDeposits)} - Wit ${fmtCurrency(data.totalWithdrawals)}`} cur icon="wallet" delay={100} theme={C} />
          <KPI label="Turnover" value={data.turnover} change={turnCh} cur icon="activity" delay={150} theme={C} />
          <KPI label="GGR" value={data.ggr} change={ggrCh} cur icon="trending" delay={200} theme={C} />
          <KPI label="GWM" value={data.gwm} sub={prev ? `${(data.gwm - prev.gwm) >= 0 ? '+' : ''}${(data.gwm - prev.gwm).toFixed(1)}pp` : null} pct icon="chart" delay={250} theme={C} />
        </div>

        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.bg} 100%)`, borderRadius: '12px', padding: 'clamp(20px, 3vw, 32px)', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: 'clamp(11px, 1.2vw, 14px)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px 0' }}>Weekly Active Users</p>
            <p style={{ color: C.accent, fontSize: mob ? '32px' : 'clamp(36px, 5vw, 56px)', fontWeight: 900, margin: 0 }}>{fmtNum(data.activeUsers)}</p>
            {actCh && <p style={{ color: parseFloat(actCh) >= 0 ? C.success : C.danger, fontSize: '14px', fontWeight: 700, margin: '8px 0 0 0' }}>{parseFloat(actCh) > 0 ? '▲' : '▼'} {Math.abs(parseFloat(actCh))}% vs prev</p>}
          </div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {(data.top3Products || []).map((prod, i) => <div key={i} style={{ textAlign: 'center', minWidth: '80px' }}><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase', fontWeight: 600 }}>{prod.name}</p><p style={{ color: C.chart[i], fontSize: '24px', fontWeight: 800, margin: 0 }}>{fmtNum(prod.actives)}</p></div>)}
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Logins</p><p style={{ color: C.text, fontSize: '20px', fontWeight: 800, margin: 0 }}>{fmtNum(data.totalLogins)}</p></div>
            <div style={{ textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Bonus</p><p style={{ color: C.orange, fontSize: '20px', fontWeight: 800, margin: 0 }}>{fmtCurrency(data.totalBonus)}</p></div>
          </div>
        </div>
      </Section>

      <Section title="Acquisition" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ color: C.textSec, margin: 0, fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Breakdown</h4>
              <select value={dailyMetric} onChange={e => setDailyMetric(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                {[{ k: 'regftd', l: 'REG & FTDs' }, { k: 'depwit', l: 'Deposits & Withdrawals' }, { k: 'logins', l: 'Logins' }, { k: 'bonus', l: 'Bonus' }].map(o => <option key={o.k} value={o.k}>{o.l}</option>)}
              </select>
            </div>
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
          </div>
          <ChartCard title="Top Sources (Cod Punto)" theme={C}>
            <BarChart data={data.topSources || []} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis dataKey="name" type="category" width={mob ? 70 : 100} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="count" fill={C.success} radius={[0, 4, 4, 0]} /></BarChart>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ color: C.textSec, margin: 0, fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Performance KPI</h4>
              <select value={qaMetric} onChange={e => setQaMetric(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                {[{ k: 'reg', l: 'Registrations' }, { k: 'ftds', l: 'FTDs' }, { k: 'conv', l: 'Conversion %' }, { k: 'activated', l: 'Activated %' }, { k: 'avgAge', l: 'Avg Age' }].map(o => <option key={o.k} value={o.k}>{o.l}</option>)}
              </select>
            </div>
            {(() => {
              const isPct = qaMetric === 'conv' || qaMetric === 'activated'
              const sorted = (data.qualityAcquisition || []).filter(c => !c.isTotal).sort((a, b) => (b[qaMetric] || 0) - (a[qaMetric] || 0)).slice(0, 10)
              const maxVal = sorted.length ? Math.max(...sorted.map(c => c[qaMetric] || 0)) : 100
              const getColor = (val) => {
                if (qaMetric === 'conv') return val >= 55 ? C.success : val >= 45 ? C.orange : C.danger
                if (qaMetric === 'activated') return val >= 70 ? C.success : val >= 40 ? C.orange : C.danger
                return C.chart[0]
              }
              return (
                <ResponsiveContainer width="100%" height={Math.max(220, sorted.length * 32)}>
                  <BarChart data={sorted} layout="vertical" barSize={16}>
                    <XAxis type="number" domain={[0, isPct ? Math.min(Math.ceil(maxVal / 10) * 10 + 10, 100) : 'auto']} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => isPct ? `${v}%` : fmtNum(v)} />
                    <YAxis dataKey="channel" type="category" width={mob ? 75 : 110} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} />
                    <Tooltip content={<Tip theme={C} />} formatter={v => isPct ? `${v}%` : fmtNum(v)} />
                    <Bar dataKey={qaMetric} name={qaMetric === 'conv' ? 'Conv%' : qaMetric === 'activated' ? 'Activated%' : qaMetric === 'avgAge' ? 'Avg Age' : qaMetric === 'ftds' ? 'FTDs' : 'REG'} fill={C.primary} radius={[0, 4, 4, 0]}>
                      {sorted.map((e, i) => <Cell key={i} fill={isPct ? getColor(e[qaMetric]) : C.chart[i % C.chart.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
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
          <ChartCard title="Revenue Share" height={220} theme={C}>
            <PieChart><Pie data={(data.channelPerformance || []).filter(c => c.revShare > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="revShare" nameKey="channel">{(data.channelPerformance || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} /><Legend /></PieChart>
          </ChartCard>
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

      <Section title="Financial Health" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}><p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Withdrawal Ratio</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>{data.financialHealth?.withdrawalRatio || 0}%</p><p style={{ color: C.textMuted, fontSize: '10px', margin: 0 }}>{fmtCurrency(data.totalWithdrawals)} / {fmtCurrency(data.totalDeposits)}</p></div>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}><p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Bonus ROI</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>{data.financialHealth?.bonusROI || 0}x</p><p style={{ color: C.textMuted, fontSize: '10px', margin: 0 }}>{fmtCurrency(data.financialHealth?._ggr)} / {fmtCurrency(data.financialHealth?._bonus)}</p></div>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}><p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Customer Value</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>{fmtCurrency(data.financialHealth?.customerValue || 0)}</p><p style={{ color: C.textMuted, fontSize: '10px', margin: 0 }}>GGR / Actives</p></div>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}` }}><p style={{ color: C.textMuted, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>Login / User</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: '0 0 8px 0' }}>{data.financialHealth?.loginPerUser || 0}</p><p style={{ color: C.textMuted, fontSize: '10px', margin: 0 }}>{fmtNum(data.financialHealth?._logins)} / {fmtNum(data.financialHealth?._actives)}</p></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(auto-fit, minmax(380px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
          <ChartCard title="Daily Cash Flow" theme={C}>
            <BarChart data={data.dailyStats || []}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} /><Legend /><Bar dataKey="deposits" name="Deposits" fill={C.success} radius={[3, 3, 0, 0]} /><Bar dataKey="withdrawals" name="Withdrawals" fill={C.danger} radius={[3, 3, 0, 0]} /></BarChart>
          </ChartCard>
          <ChartCard title="Daily Bonus" theme={C}>
            <AreaChart data={data.dailyStats || []}><defs><linearGradient id="bG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.4} /><stop offset="95%" stopColor={C.orange} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} /><Area type="monotone" dataKey="bonus" name="Bonus" stroke={C.orange} fill="url(#bG)" strokeWidth={2} /></AreaChart>
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
    { k: 'generale', label: 'Generale', icon: 'casino', sub: `${fmtNum(sessionData.segments.generale.tickets)} tickets` },
    { k: 'online', label: 'Online', icon: 'globe', sub: 'DAZNBET + VIVABET' },
    { k: 'pvr', label: 'PVR / Retail', icon: 'store', sub: 'All other SKIN' }
  ]

  const ins = data.insights
  const insCards = [
    { label: 'Peak Hour', value: ins.peakHour, sub: `${ins.peakHourPct}% of tickets`, color: C.primary },
    { label: 'Best GGR Hour', value: ins.bestGgrHour, sub: `€${fmtNum(ins.bestGgrAmount)}`, color: C.success },
    { label: 'Top Day', value: ins.topDay, sub: `${ins.topDayPct}% of tickets`, color: C.accent }
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
          <KPI label="Giocato" value={data.giocato} cur icon="wallet" theme={C} />
          <KPI label="GGR" value={data.ggr} cur icon="trending" sub={`GWM: ${data.gwm}%`} theme={C} />
          <KPI label="Avg Duration" value={`${data.avgDuration}m`} icon="clock" theme={C} />
          <KPI label="Ticket/Account" value={data.accounts > 0 ? Math.round(data.tickets / data.accounts) : 0} icon="card" theme={C} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(3, 1fr)', gap: '12px' }}>
          {insCards.map(c => (
            <div key={c.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 8, height: 40, borderRadius: 4, background: c.color }} />
              <div><p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>{c.label}</p><p style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 900, color: C.text }}>{c.value}</p><p style={{ margin: 0, fontSize: '11px', color: C.textSec }}>{c.sub}</p></div>
            </div>
          ))}
        </div>
      </Section>

      {/* Hourly Distribution */}
      <Section title="Distribuzione Oraria" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '2fr 1fr', gap: '16px' }}>
          <ChartCard title="Ticket & GGR per Ora" height={260} theme={C}>
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
      <Section title="Distribuzione Giornaliera" theme={C}>
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
      <Section title="Durata Sessioni" theme={C}>
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
      <Section title="Heatmap Giorno × Fascia Oraria" theme={C}>
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
                  {[{l:'Tickets',v:fmtNum(s.d.tickets)},{l:'Accounts',v:fmtNum(s.d.accounts)},{l:'GGR',v:fmtCurrency(s.d.ggr)},{l:'GWM',v:`${s.d.gwm}%`},{l:'Avg Duration',v:`${s.d.avgDuration}m`},{l:'Peak',v:s.d.insights.peakHour}].map(m => (
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
          <KPI label="Età Media" value={`${data.avgAge}`} sub="years" icon="user" theme={C} />
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
          <KPI label="Avg Età" value={`${avgAge}`} sub="years" icon="user" theme={C} />
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
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMING SOON
// ═══════════════════════════════════════════════════════════════════════════════
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
            ? 'Dashboard dedicata al vertical Casino con analisi dettagliate su Slot, Live Casino, Table Games, performance per provider e metriche specifiche di prodotto.'
            : 'Dashboard dedicata al vertical Sport con analisi su Scommesse Pre-Match, Live Betting, performance per disciplina sportiva e trend di mercato.'}
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
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [db, setDb] = useState({ connected: false })
  const [isDark, setIsDark] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const ww = useWindowWidth()
  const mob = ww < 768

  const C = isDark ? THEMES.dark : THEMES.light

  useEffect(() => {
    if (localStorage.getItem('dazn_dashboard_auth') === 'true') setIsAuth(true)
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
          const mainW = {}, casinoW = {}
          Object.entries(r.data).forEach(([k, v]) => { const n = Number(k); if (n >= 1000) casinoW[n - 1000] = { ...v, weekNumber: n - 1000 }; else mainW[n] = v })
          setWeeks(mainW); setCasinoWeeks(casinoW)
          const mainKeys = Object.keys(mainW).map(Number); if (mainKeys.length) setSelected(Math.max(...mainKeys))
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    })()
  }, [isAuth])

  const handleLogout = () => { localStorage.removeItem('dazn_dashboard_auth'); localStorage.removeItem('dazn_upload_auth'); setIsAuth(false) }
  const handleUpload = async d => { const u = { ...weeks, [d.weekNumber]: d }; setWeeks(u); setSelected(d.weekNumber); await saveWeekData(d); setTab('weekly') }
  const handleDelete = async n => { if (!confirm(`Delete Week ${n}?`)) return; const { [n]: _, ...rest } = weeks; setWeeks(rest); await deleteWeekData(n); setSelected(Object.keys(rest).length ? Math.max(...Object.keys(rest).map(Number)) : null) }
  const handleCasinoUpload = async d => { const u = { ...casinoWeeks, [d.weekNumber]: d }; setCasinoWeeks(u); await saveWeekData({ ...d, weekNumber: d.weekNumber + 1000 }); setTab('casino') }
  const handleCasinoDelete = async n => { if (!confirm(`Delete Casino Week ${n}?`)) return; const { [n]: _, ...rest } = casinoWeeks; setCasinoWeeks(rest); await deleteWeekData(n + 1000) }

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
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "Oscine, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text, transition: 'background 0.3s, color 0.3s', overflowX: 'hidden' }}>
      <style>{`
        @font-face { font-family: Oscine; src: url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Rg.woff) format("woff"), url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Rg.woff2) format("woff2"); font-weight: 400; }
        @font-face { font-family: Oscine; src: url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Bd.woff) format("woff"), url(https://www.daznbet.it/external_css/DAZNBET/font/DAZN_Oscine_W_Bd.woff2) format("woff2"); font-weight: 700; }
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        .recharts-wrapper { max-width: 100% !important; }
        .recharts-surface { max-width: 100% !important; }
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
              {[{ id: 'weekly', icon: 'chart', label: 'Weekly' }, { id: 'monthly', icon: 'calendar', label: 'Monthly' }, { id: 'casino', icon: 'casino', label: 'Casino' }, { id: 'sport', icon: 'sport', label: 'Sport' }].map(t => (
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
        {tab === 'weekly' && <Weekly data={current} prev={prev} theme={C} />}
        {tab === 'monthly' && <Monthly weeksData={weeks} theme={C} />}
        {tab === 'casino' && <CasinoSection weeksData={casinoWeeks} theme={C} />}
        {tab === 'sport' && <ComingSoon section="Sport" icon="sport" theme={C} />}
        {tab === 'upload' && <UploadPage weeksData={weeks} casinoWeeksData={casinoWeeks} onUpload={handleUpload} onCasinoUpload={handleCasinoUpload} onDelete={handleDelete} onCasinoDelete={handleCasinoDelete} onLogout={handleLogout} theme={C} />}
      </main>
      {showTop && <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '24px', right: '24px', width: '44px', height: '44px', borderRadius: '50%', background: C.primary, color: C.primaryText, border: 'none', fontSize: '20px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, transition: 'opacity 0.3s', opacity: 0.85 }} title="Back to top">↑</button>}
    </div>
  )
}
