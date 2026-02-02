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
    chart: ['#f7ff1a', '#00D26A', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#F97316']
  },
  light: {
    primary: '#f7ff1a',       // Sfondo bottoni (giallo)
    primaryText: '#000000',   // Testo SU sfondo giallo
    accent: '#6d7000',        // Testo accento (verde oliva scuro = leggibile su bianco)
    bg: '#FFFFFF',
    card: '#F8F8F8',
    border: '#E0E0E0',
    text: '#000000',
    textSec: '#444444',
    textMuted: '#888888',
    success: '#00A854',
    successDim: 'rgba(0,168,84,0.1)',
    danger: '#D93025',
    dangerDim: 'rgba(217,48,37,0.1)',
    blue: '#1A73E8',
    purple: '#7C3AED',
    orange: '#EA8600',
    cyan: '#0891B2',
    chart: ['#6d7000', '#00A854', '#1A73E8', '#7C3AED', '#EA8600', '#0891B2', '#DB2777', '#EA580C']
  }
}

const UPLOAD_PASSWORD = 'dazn2025'

// ═══════════════════════════════════════════════════════════════════════════════
// FILE REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const FILES = [
  { key: 'anagrafica', name: 'Anagrafica.xlsx', path: 'Modifica Conto Telematico → Ricerca anagrafica' },
  { key: 'anagrafica2', name: 'Anagrafica2.xlsx', path: 'Statistica Conti' },
  { key: 'total', name: 'Anagrafica_TOTAL.xlsx', path: 'Stats Multilivello → GRID senza selezioni' },
  { key: 'categoria', name: 'Anagrafica_CATEGORIA.xlsx', path: 'Stats Multilivello → GRID Categoria' },
  { key: 'daznbet', name: 'Anagrafica_DAZNBET.xlsx', path: 'Stats Multilivello → DAZNBET SKIN per conto' },
  { key: 'organic', name: 'Anagrafica_ORGANIC.xlsx', path: 'DAZNBET SKIN, PV: www.daznbet.it → GRID Categoria' },
  { key: 'organicTotal', name: 'Anagrafica_ORGANIC_TOTAL.xlsx', path: 'DAZNBET SKIN, PV: www.daznbet.it' },
  { key: 'skin', name: 'Anagrafica_SKIN.xlsx', path: 'Stats Multilivello → GRID SKIN e Categoria' },
  { key: 'skinTotal', name: 'Anagrafica_SKIN_TOTAL.xlsx', path: 'Stats Multilivello → GRID SKIN' },
  { key: 'academyTotal', name: 'Anagrafica_ACCADEMY_TOTAL.xlsx', path: 'VIVABET SKIN, Promoter: sbozza' }
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
    demographics: { male: totGender > 0 ? Math.round(genderCount.M / totGender * 100) : 0, female: totGender > 0 ? Math.round(genderCount.F / totGender * 100) : 0 },
    ageGroups: Object.entries(ageGroups).map(([range, count]) => ({ range, percent: totAges > 0 ? Math.round(count / totAges * 100) : 0 })),
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
        {icon && <span style={{ fontSize: '16px', opacity: 0.5 }}>{icon}</span>}
      </div>
      <p style={{ color: C.text, fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'system-ui' }}>{display}</p>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: compact ? '12px' : 'clamp(12px, 1.2vw, 14px)' }}>
        <thead>
          <tr style={{ background: C.bg }}>
            {cols.map((c, i) => <th key={i} style={{ padding: compact ? '10px 12px' : 'clamp(10px, 1.4vw, 14px) clamp(12px, 1.5vw, 18px)', textAlign: c.align || 'left', color: C.accent, fontWeight: 700, fontSize: compact ? '10px' : 'clamp(10px, 1vw, 12px)', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: `2px solid ${C.accent}` }}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((r, ri) => (
            <tr key={ri} style={{ background: r.isTotal ? C.primary + '15' : ri % 2 === 0 ? C.card : C.bg }}>
              {cols.map((c, ci) => { const v = c.accessor ? r[c.accessor] : ''; return <td key={ci} style={{ padding: compact ? '8px 12px' : 'clamp(10px, 1.3vw, 12px) clamp(12px, 1.5vw, 18px)', textAlign: c.align || 'left', color: r.isTotal ? C.accent : C.text, fontWeight: r.isTotal ? 800 : 400, borderBottom: `1px solid ${C.border}` }}>{c.format ? c.format(v, r) : v}</td> })}
            </tr>
          ))}
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
// LOGIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const LoginGate = ({ onLogin, theme }) => {
  const C = theme
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  const handleLogin = () => {
    if (pwd === UPLOAD_PASSWORD) { onLogin(true); localStorage.setItem('dazn_upload_auth', 'true') }
    else { setError(true); setTimeout(() => setError(false), 2000) }
  }

  return (
    <div style={{ padding: 'clamp(40px, 5vw, 80px)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ background: C.card, borderRadius: '16px', padding: '40px', border: `1px solid ${C.border}`, maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', background: C.primary + '20', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}><span style={{ fontSize: '28px' }}>🔐</span></div>
        <h2 style={{ color: C.text, fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>Admin Access</h2>
        <p style={{ color: C.textMuted, fontSize: '14px', margin: '0 0 32px 0' }}>Inserisci la password per accedere all'upload</p>
        <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="Password" style={{ width: '100%', background: C.bg, border: `2px solid ${error ? C.danger : C.border}`, borderRadius: '10px', padding: '14px 18px', color: C.text, fontSize: '16px', marginBottom: '16px', textAlign: 'center', letterSpacing: '4px' }} />
        {error && <p style={{ color: C.danger, fontSize: '13px', margin: '0 0 16px 0', fontWeight: 700 }}>Password errata</p>}
        <button onClick={handleLogin} style={{ width: '100%', background: C.primary, color: C.primaryText, border: 'none', borderRadius: '10px', padding: '14px', fontSize: '16px', fontWeight: 800, cursor: 'pointer' }}>Accedi</button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD PAGE - CON UPLOAD MASSIVO
// ═══════════════════════════════════════════════════════════════════════════════
const UploadPage = ({ weeksData, onUpload, onDelete, theme }) => {
  const C = theme
  const [isAuth, setIsAuth] = useState(false)
  const [week, setWeek] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const bulkInputRef = useRef(null)
  const exists = week && weeksData[parseInt(week)]

  useEffect(() => { if (localStorage.getItem('dazn_upload_auth') === 'true') setIsAuth(true) }, [])

  if (!isAuth) return <LoginGate onLogin={setIsAuth} theme={C} />

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
    if (f) { try { const d = await readFile(f); setFiles(p => ({ ...p, [key]: { name: f.name, data: d, rows: d.length } })); setMsg(null) } catch { setMsg({ t: 'error', m: 'Errore lettura file' }) } }
  }

  // UPLOAD MASSIVO - Match file names automaticamente
  const handleBulkUpload = async (e) => {
    const fileList = Array.from(e.target.files)
    if (!fileList.length) return
    
    setLoading(true)
    setMsg({ t: 'info', m: `Elaborazione ${fileList.length} file...` })
    
    const newFiles = { ...files }
    let matched = 0
    
    for (const f of fileList) {
      const fname = f.name.toLowerCase()
      let key = null
      
      if (fname.includes('anagrafica2')) key = 'anagrafica2'
      else if (fname.includes('anagrafica_total')) key = 'total'
      else if (fname.includes('anagrafica_categoria')) key = 'categoria'
      else if (fname.includes('anagrafica_daznbet')) key = 'daznbet'
      else if (fname.includes('anagrafica_organic_total')) key = 'organicTotal'
      else if (fname.includes('anagrafica_organic')) key = 'organic'
      else if (fname.includes('anagrafica_skin_total')) key = 'skinTotal'
      else if (fname.includes('anagrafica_skin')) key = 'skin'
      else if (fname.includes('anagrafica_accademy') || fname.includes('anagrafica_academy')) key = 'academyTotal'
      else if (fname.includes('anagrafica') && !fname.includes('_')) key = 'anagrafica'
      
      if (key) {
        try {
          const d = await readFile(f)
          newFiles[key] = { name: f.name, data: d, rows: d.length }
          matched++
        } catch (err) { console.error(`Errore lettura ${f.name}:`, err) }
      }
    }
    
    setFiles(newFiles)
    setLoading(false)
    setMsg({ t: 'success', m: `${matched}/${fileList.length} file riconosciuti e caricati!` })
  }

  const handleUpload = async () => {
    if (!week || !dateFrom || !dateTo) { setMsg({ t: 'error', m: 'Inserisci settimana e seleziona date' }); return }
    const missing = FILES.filter(f => !files[f.key])
    if (missing.length) { setMsg({ t: 'error', m: `Mancano ${missing.length} file` }); return }
    setLoading(true)
    try {
      const fd = {}; Object.entries(files).forEach(([k, v]) => fd[k] = v.data)
      const proc = processData(fd, parseInt(week), dates)
      await onUpload(proc)
      setMsg({ t: 'success', m: exists ? `Week ${week} aggiornata!` : `Week ${week} caricata!` })
      setWeek(''); setDateFrom(''); setDateTo(''); setFiles({})
    } catch (err) { console.error(err); setMsg({ t: 'error', m: 'Errore elaborazione' }) }
    setLoading(false)
  }

  const handleLogout = () => { localStorage.removeItem('dazn_upload_auth'); setIsAuth(false) }
  const uploadedCount = Object.keys(files).length

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <Section title="Upload Week Data" theme={C}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={handleLogout} style={{ background: 'transparent', color: C.danger, border: `1px solid ${C.danger}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>🚪 Logout</button>
        </div>
        
        {/* UPLOAD MASSIVO */}
        <div style={{ background: C.primary + '10', border: `2px dashed ${C.primary}`, borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
          <h3 style={{ color: C.accent, margin: '0 0 8px 0', fontSize: '16px', fontWeight: 800 }}>📦 Upload Massivo</h3>
          <p style={{ color: C.textMuted, fontSize: '13px', margin: '0 0 16px 0' }}>Seleziona tutti i 10 file Excel insieme - verranno riconosciuti automaticamente</p>
          <input ref={bulkInputRef} type="file" accept=".xlsx,.xls" multiple onChange={handleBulkUpload} style={{ display: 'none' }} />
          <button onClick={() => bulkInputRef.current?.click()} disabled={loading} style={{ background: C.primary, color: C.primaryText, border: 'none', borderRadius: '8px', padding: '12px 32px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Elaborazione...' : 'Seleziona Tutti i File'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Settimana</label>
            <input type="number" value={week} onChange={e => setWeek(e.target.value)} placeholder="es. 6" style={{ width: '100%', background: C.bg, border: `1px solid ${exists ? C.orange : C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '16px', fontWeight: 700 }} />
            {exists && <p style={{ color: C.orange, fontSize: '11px', marginTop: '6px' }}>⚠ Sovrascriverà</p>}
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Da</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }} />
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>A</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }} />
          </div>
          {dates && <div><label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>Preview</label><div style={{ background: C.card, border: `1px solid ${C.primary}`, borderRadius: '8px', padding: '12px', color: C.accent, fontSize: '14px', fontWeight: 700 }}>{dates}</div></div>}
        </div>

        <details style={{ marginBottom: '24px' }}>
          <summary style={{ color: C.textSec, fontSize: '13px', cursor: 'pointer', fontWeight: 700, marginBottom: '12px' }}>📁 Upload Singolo (clicca per espandere)</summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {FILES.map((f, i) => {
              const up = files[f.key]
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
          <button onClick={handleUpload} disabled={loading || uploadedCount < 10} style={{ background: uploadedCount >= 10 ? C.primary : C.border, color: C.primaryText, border: 'none', borderRadius: '8px', padding: '14px 32px', fontSize: '14px', fontWeight: 800, cursor: uploadedCount >= 10 ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Elaborazione...' : exists ? `Aggiorna Week ${week}` : `Carica Week ${week || '?'}`}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '120px', height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${(uploadedCount / 10) * 100}%`, height: '100%', background: C.primary, transition: 'width 0.3s' }} /></div>
            <span style={{ color: uploadedCount >= 10 ? C.success : C.textMuted, fontSize: '13px', fontWeight: 700 }}>{uploadedCount}/10</span>
          </div>
        </div>

        {Object.keys(weeksData).length > 0 && (
          <>
            <h3 style={{ color: C.text, fontSize: '16px', margin: '0 0 16px 0', fontWeight: 700 }}>Settimane Caricate</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {Object.values(weeksData).sort((a, b) => b.weekNumber - a.weekNumber).map(w => (
                <div key={w.weekNumber} style={{ background: C.card, borderRadius: '10px', padding: '16px', border: `1px solid ${C.border}`, position: 'relative' }}>
                  <button onClick={() => onDelete(w.weekNumber)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: C.danger, border: 'none', fontSize: '14px', cursor: 'pointer', opacity: 0.6 }}>✕</button>
                  <h4 style={{ color: C.accent, margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800 }}>W{w.weekNumber}</h4>
                  <p style={{ color: C.textMuted, margin: '0 0 12px 0', fontSize: '12px' }}>{w.dateRange}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div><span style={{ color: C.textMuted }}>REG</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtNum(w.registrations)}</p></div>
                    <div><span style={{ color: C.textMuted }}>FTDs</span><p style={{ color: C.text, margin: 0, fontWeight: 700 }}>{fmtNum(w.ftds)}</p></div>
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
// MONTHLY SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const Monthly = ({ weeksData, theme }) => {
  const C = theme
  const allWeeks = Object.values(weeksData).sort((a, b) => a.weekNumber - b.weekNumber)
  
  const [filterMode, setFilterMode] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  if (!allWeeks.length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>Nessun dato disponibile</p></div>

  // Raggruppa settimane per mese (basato sulla data di FINE settimana)
  const monthsMap = {}
  allWeeks.forEach(w => {
    const m = getMonthFromDateRange(w.dateRange)
    if (m.key && !monthsMap[m.key]) monthsMap[m.key] = { name: m.name, weeks: [] }
    if (m.key) monthsMap[m.key].weeks.push(w.weekNumber)
  })
  const months = Object.entries(monthsMap).map(([key, val]) => ({ key, ...val }))

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

  if (!weeks.length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>Nessuna settimana nel periodo selezionato</p></div>

  const tot = { reg: weeks.reduce((s, w) => s + (w.registrations || 0), 0), ftds: weeks.reduce((s, w) => s + (w.ftds || 0), 0), dep: weeks.reduce((s, w) => s + (w.totalDeposits || 0), 0), wit: weeks.reduce((s, w) => s + (w.totalWithdrawals || 0), 0), turn: weeks.reduce((s, w) => s + (w.turnover || 0), 0), ggr: weeks.reduce((s, w) => s + (w.ggr || 0), 0), bonus: weeks.reduce((s, w) => s + (w.totalBonus || 0), 0) }
  const avgAct = Math.round(weeks.reduce((s, w) => s + (w.activeUsers || 0), 0) / weeks.length)

  const trend = weeks.map(w => ({ week: `W${w.weekNumber}`, REG: w.registrations, FTDs: w.ftds, GGR: Math.round(w.ggr / 1000), Actives: w.activeUsers }))
  const cashFlowTrend = weeks.map(w => ({ week: `W${w.weekNumber}`, Deposits: w.totalDeposits || 0, Withdrawals: w.totalWithdrawals || 0, NetDeposit: (w.totalDeposits || 0) - (w.totalWithdrawals || 0) }))
  const bonusTrend = weeks.map(w => ({ week: `W${w.weekNumber}`, Bonus: w.totalBonus || 0 }))

  const qualityAgg = {}
  weeks.forEach(w => (w.qualityAcquisition || []).forEach(ch => { if (ch.isTotal) return; if (!qualityAgg[ch.channel]) qualityAgg[ch.channel] = { channel: ch.channel, reg: 0, ftds: 0 }; qualityAgg[ch.channel].reg += ch.reg || 0; qualityAgg[ch.channel].ftds += ch.ftds || 0 }))
  const qualityData = Object.values(qualityAgg).map(ch => ({ ...ch, conv: ch.reg > 0 ? parseFloat((ch.ftds / ch.reg * 100).toFixed(1)) : 0 })).sort((a, b) => b.reg - a.reg)
  const qualityTotals = { channel: 'TOTALI', isTotal: true, reg: qualityData.reduce((s, c) => s + c.reg, 0), ftds: qualityData.reduce((s, c) => s + c.ftds, 0), conv: 0 }
  qualityTotals.conv = qualityTotals.reg > 0 ? parseFloat((qualityTotals.ftds / qualityTotals.reg * 100).toFixed(1)) : 0
  qualityData.push(qualityTotals)

  const channelAgg = {}
  weeks.forEach(w => (w.channelPerformance || []).forEach(ch => { if (!channelAgg[ch.channel]) channelAgg[ch.channel] = { channel: ch.channel, turnover: 0, ggr: 0, actives: 0 }; channelAgg[ch.channel].turnover += ch.turnover || 0; channelAgg[ch.channel].ggr += ch.ggr || 0; channelAgg[ch.channel].actives += ch.actives || 0 }))
  const channelData = Object.values(channelAgg).map(ch => ({ ...ch, gwm: ch.turnover > 0 ? parseFloat((ch.ggr / ch.turnover * 100).toFixed(1)) : 0, actives: Math.round(ch.actives / weeks.length) })).sort((a, b) => b.ggr - a.ggr)
  const totalChGgr = channelData.reduce((s, c) => s + c.ggr, 0)
  channelData.forEach(ch => { ch.revShare = totalChGgr > 0 ? parseFloat((ch.ggr / totalChGgr * 100).toFixed(1)) : 0 })

  const productAgg = {}
  weeks.forEach(w => (w.productPerformance || []).forEach(p => { if (!productAgg[p.product]) productAgg[p.product] = { product: p.product, turnover: 0, ggr: 0, actives: 0 }; productAgg[p.product].turnover += p.turnover || 0; productAgg[p.product].ggr += p.ggr || 0; productAgg[p.product].actives += p.actives || 0 }))
  const productData = Object.values(productAgg).map(p => ({ ...p, actives: Math.round(p.actives / weeks.length) })).sort((a, b) => b.ggr - a.ggr)

  const weekNums = allWeeks.map(w => w.weekNumber)

  return (
    <div id="monthly-report" style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      {/* FILTER BAR */}
      <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}`, marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'month', 'custom'].map(mode => (
            <button key={mode} onClick={() => setFilterMode(mode)} style={{ background: filterMode === mode ? C.primary : 'transparent', color: filterMode === mode ? C.primaryText : C.textSec, border: `1px solid ${filterMode === mode ? C.primary : C.border}`, borderRadius: '6px', padding: '8px 16px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{mode === 'all' ? 'Tutto' : mode === 'month' ? 'Mese' : 'Custom'}</button>
          ))}
        </div>
        
        {filterMode === 'month' && (
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.primary}`, borderRadius: '6px', padding: '8px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
            <option value="">Seleziona mese</option>
            {months.map(m => <option key={m.key} value={m.key}>{m.name} (W{m.weeks[0]}-W{m.weeks[m.weeks.length - 1]})</option>)}
          </select>
        )}

        {filterMode === 'custom' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: C.textMuted, fontSize: '12px' }}>Da Week</span>
            <select value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}><option value="">--</option>{weekNums.map(n => <option key={n} value={n}>{n}</option>)}</select>
            <span style={{ color: C.textMuted, fontSize: '12px' }}>a Week</span>
            <select value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '13px', fontWeight: 700 }}><option value="">--</option>{weekNums.map(n => <option key={n} value={n}>{n}</option>)}</select>
          </div>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <span style={{ color: C.accent, fontSize: '14px', fontWeight: 800 }}>{periodLabel}</span>
        </div>
      </div>

      <Section title="Trading Summary" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          <KPI label="Total REG" value={tot.reg} icon="👤" delay={0} theme={C} />
          <KPI label="Total FTDs" value={tot.ftds} sub={`Conv: ${(tot.ftds / tot.reg * 100).toFixed(1)}%`} icon="💳" delay={50} theme={C} />
          <KPI label="Net Deposit" value={tot.dep - tot.wit} cur icon="💰" delay={100} theme={C} />
          <KPI label="Turnover" value={tot.turn} cur icon="🎰" delay={150} theme={C} />
          <KPI label="GGR" value={tot.ggr} sub={`GWM: ${(tot.ggr / tot.turn * 100).toFixed(1)}%`} cur icon="📈" delay={200} theme={C} />
          <KPI label="Avg Actives" value={avgAct} icon="👥" delay={250} theme={C} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
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
        ]} data={weeks} theme={C} />
      </Section>

      <Section title="Weekly Cash Flow" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
          <ChartCard title="Deposits vs Withdrawals" height={300} theme={C}>
            <BarChart data={cashFlowTrend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Legend /><Bar dataKey="Deposits" fill={C.success} radius={[4, 4, 0, 0]} /><Bar dataKey="Withdrawals" fill={C.danger} radius={[4, 4, 0, 0]} /></BarChart>
          </ChartCard>
          <ChartCard title="Net Deposit Trend" height={300} theme={C}>
            <AreaChart data={cashFlowTrend}><defs><linearGradient id="netG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.blue} stopOpacity={0.4} /><stop offset="95%" stopColor={C.blue} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Area type="monotone" dataKey="NetDeposit" name="Net Deposit" stroke={C.blue} fill="url(#netG)" strokeWidth={2} /></AreaChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Weekly Bonus" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <ChartCard title="Bonus Trend" height={250} theme={C}>
            <AreaChart data={bonusTrend}><defs><linearGradient id="bonusG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.4} /><stop offset="95%" stopColor={C.orange} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 11, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Area type="monotone" dataKey="Bonus" stroke={C.orange} fill="url(#bonusG)" strokeWidth={2} /></AreaChart>
          </ChartCard>
          <div style={{ background: C.card, borderRadius: '12px', padding: '24px', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ color: C.textMuted, margin: '0 0 16px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Bonus Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Total Bonus</p><p style={{ color: C.orange, fontSize: '28px', fontWeight: 900, margin: 0 }}>{fmtCurrency(tot.bonus)}</p></div>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Avg Weekly</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: 0 }}>{fmtCurrency(tot.bonus / weeks.length)}</p></div>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Bonus ROI</p><p style={{ color: C.success, fontSize: '28px', fontWeight: 900, margin: 0 }}>{tot.bonus > 0 ? (tot.ggr / tot.bonus).toFixed(1) : 0}x</p></div>
              <div><p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 4px 0', textTransform: 'uppercase' }}>% of GGR</p><p style={{ color: C.text, fontSize: '28px', fontWeight: 900, margin: 0 }}>{tot.ggr > 0 ? (tot.bonus / tot.ggr * 100).toFixed(1) : 0}%</p></div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Quality Acquisition" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: (v, r) => <span style={{ fontWeight: r.isTotal ? 900 : 700, color: r.isTotal ? C.accent : C.text }}>{v}</span> },
            { header: 'REG', accessor: 'reg', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'FTDs', accessor: 'ftds', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Conv%', accessor: 'conv', align: 'center', format: (v, r) => <span style={{ color: r.isTotal ? C.accent : v >= 55 ? C.success : v >= 45 ? C.orange : C.danger, fontWeight: 800 }}>{v}%</span> }
          ]} data={qualityData} theme={C} />
          <ChartCard title="REG by Channel" height={220} theme={C}>
            <BarChart data={qualityData.filter(c => !c.isTotal)} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis dataKey="channel" type="category" width={100} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="reg" name="REG" fill={C.primary} radius={[0, 4, 4, 0]}>{qualityData.filter(c => !c.isTotal).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Channel Performance" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'GWM', accessor: 'gwm', align: 'center', format: v => <b>{v}%</b> },
            { header: 'Rev Share', accessor: 'revShare', align: 'center', format: v => <span style={{ color: C.accent, fontWeight: 800 }}>{v}%</span> }
          ]} data={channelData} theme={C} />
          <ChartCard title="Revenue Share" height={220} theme={C}>
            <PieChart><Pie data={channelData.filter(c => c.revShare > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="revShare" nameKey="channel">{channelData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Pie><Tooltip content={<Tip theme={C} />} /><Legend /></PieChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Product Performance" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Product', accessor: 'product', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Avg Actives', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
          ]} data={productData} compact theme={C} />
          <ChartCard title="GGR by Product" height={220} theme={C}>
            <BarChart data={productData.slice(0, 6)} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><YAxis dataKey="product" type="category" width={80} tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Bar dataKey="ggr" fill={C.primary} radius={[0, 4, 4, 0]}>{productData.map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
          </ChartCard>
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
  if (!data) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>Seleziona o carica una settimana</p></div>

  const regCh = prev ? calcChange(data.registrations, prev.registrations) : null
  const ftdCh = prev ? calcChange(data.ftds, prev.ftds) : null
  const turnCh = prev ? calcChange(data.turnover, prev.turnover) : null
  const ggrCh = prev ? calcChange(data.ggr, prev.ggr) : null
  const actCh = prev ? calcChange(data.activeUsers, prev.activeUsers) : null

  return (
    <div id="weekly-report" style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <Section title="Trading Summary" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <KPI label="Registrations" value={data.registrations} change={regCh} icon="👤" delay={0} theme={C} />
          <KPI label="FTDs" value={data.ftds} sub={`Conv: ${data.conversionRate}% • Avg: €${data.avgFirstDeposit}`} change={ftdCh} icon="💳" delay={50} theme={C} />
          <KPI label="Net Deposit" value={data.netDeposit} sub={`Dep ${fmtCurrency(data.totalDeposits)} - Wit ${fmtCurrency(data.totalWithdrawals)}`} cur icon="💰" delay={100} theme={C} />
          <KPI label="Turnover" value={data.turnover} change={turnCh} cur icon="🎰" delay={150} theme={C} />
          <KPI label="GGR" value={data.ggr} change={ggrCh} cur icon="📈" delay={200} theme={C} />
          <KPI label="GWM" value={data.gwm} sub={prev ? `${(data.gwm - prev.gwm) >= 0 ? '+' : ''}${(data.gwm - prev.gwm).toFixed(1)}pp` : null} pct icon="📊" delay={250} theme={C} />
        </div>

        <div style={{ background: `linear-gradient(135deg, ${C.card} 0%, ${C.bg} 100%)`, borderRadius: '12px', padding: 'clamp(20px, 3vw, 32px)', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: 'clamp(11px, 1.2vw, 14px)', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 6px 0' }}>Weekly Active Users</p>
            <p style={{ color: C.accent, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, margin: 0 }}>{fmtNum(data.activeUsers)}</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <ChartCard title="Daily REG & FTDs" theme={C}>
            <AreaChart data={data.dailyStats || []}><defs><linearGradient id="dR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.4} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient><linearGradient id="dF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.4} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Legend /><Area type="monotone" dataKey="registrations" name="REG" stroke={C.primary} fill="url(#dR)" strokeWidth={2} /><Area type="monotone" dataKey="ftds" name="FTDs" stroke={C.success} fill="url(#dF)" strokeWidth={2} /></AreaChart>
          </ChartCard>
          <ChartCard title="Top Sources (Cod Punto)" theme={C}>
            <BarChart data={data.topSources || []} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis dataKey="name" type="category" width={100} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="count" fill={C.success} radius={[0, 4, 4, 0]} /></BarChart>
          </ChartCard>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <h4 style={{ color: C.textMuted, margin: '0 0 16px 0', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Gender Split</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
              <div><p style={{ color: C.blue, fontSize: '36px', fontWeight: 900, margin: 0 }}>{data.demographics?.male || 0}%</p><p style={{ color: C.textMuted, fontSize: '12px', fontWeight: 600 }}>Male</p></div>
              <div><p style={{ color: C.purple, fontSize: '36px', fontWeight: 900, margin: 0 }}>{data.demographics?.female || 0}%</p><p style={{ color: C.textMuted, fontSize: '12px', fontWeight: 600 }}>Female</p></div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: (v, r) => <span style={{ fontWeight: r.isTotal ? 900 : 700, color: r.isTotal ? C.accent : C.text }}>{v}</span> },
            { header: 'REG', accessor: 'reg', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'FTDs', accessor: 'ftds', align: 'right', format: v => <b>{fmtNum(v)}</b> },
            { header: 'Conv%', accessor: 'conv', align: 'center', format: (v, r) => <span style={{ color: r.isTotal ? C.accent : v >= 55 ? C.success : v >= 45 ? C.orange : C.danger, fontWeight: 800 }}>{v}%</span> },
            { header: 'Activated', accessor: 'activated', align: 'center', format: v => <b>{v}%</b> },
            { header: 'Avg Age', accessor: 'avgAge', align: 'center', format: v => <b>{v}</b> }
          ]} data={data.qualityAcquisition || []} theme={C} />
          <ChartCard title="Conversion by Channel" height={220} theme={C}>
            <BarChart data={(data.qualityAcquisition || []).filter(c => !c.isTotal)} layout="vertical"><XAxis type="number" domain={[0, 80]} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><YAxis dataKey="channel" type="category" width={100} tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} /><Bar dataKey="conv" name="Conv%" fill={C.primary} radius={[0, 4, 4, 0]}>{(data.qualityAcquisition || []).filter(c => !c.isTotal).map((e, i) => <Cell key={i} fill={e.conv >= 55 ? C.success : e.conv >= 45 ? C.orange : C.danger} />)}</Bar></BarChart>
          </ChartCard>
        </div>
      </Section>

      <Section title="Channel Performance" theme={C}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Product', accessor: 'product', format: v => <span style={{ fontWeight: 700 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: v => <b>{fmtCurrency(v)}</b> },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 800 }}>{fmtCurrency(v)}</span> },
            { header: 'Payout%', accessor: 'payout', align: 'center', format: v => v ? <b>{v}%</b> : '-' },
            { header: 'Actives', accessor: 'actives', align: 'right', format: v => <b>{fmtNum(v)}</b> }
          ]} data={data.productPerformance || []} compact theme={C} />
          <ChartCard title="GGR by Product" height={220} theme={C}>
            <BarChart data={(data.productPerformance || []).slice(0, 6)} layout="vertical"><XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10, fontWeight: 700 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} /><YAxis dataKey="product" type="category" width={80} tick={{ fill: C.textMuted, fontSize: 9, fontWeight: 700 }} /><Tooltip content={<Tip theme={C} />} formatter={v => fmtCurrency(v)} /><Bar dataKey="ggr" fill={C.primary} radius={[0, 4, 4, 0]}>{(data.productPerformance || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}</Bar></BarChart>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
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
        <p style={{ color: C.textMuted, fontSize: 'clamp(12px, 1.4vw, 16px)', margin: 0 }}>DAZN Bet Italy</p>
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
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [db, setDb] = useState({ connected: false })
  const [isDark, setIsDark] = useState(true)

  const C = isDark ? THEMES.dark : THEMES.light

  useEffect(() => {
    (async () => {
      try { const c = await checkConnection(); setDb(c); const r = await loadAllWeeksData(); if (r.data && Object.keys(r.data).length) { setWeeks(r.data); setSelected(Math.max(...Object.keys(r.data).map(Number))) } } catch (e) { console.error(e) }
      setLoading(false)
    })()
  }, [])

  const handleUpload = async d => { const u = { ...weeks, [d.weekNumber]: d }; setWeeks(u); setSelected(d.weekNumber); await saveWeekData(d); setTab('weekly') }
  const handleDelete = async n => { if (!confirm(`Eliminare Week ${n}?`)) return; const { [n]: _, ...rest } = weeks; setWeeks(rest); await deleteWeekData(n); setSelected(Object.keys(rest).length ? Math.max(...Object.keys(rest).map(Number)) : null) }

  const weekNums = Object.keys(weeks).map(Number).sort((a, b) => b - a)
  const current = selected ? weeks[selected] : null
  const prev = selected && weeks[selected - 1] ? weeks[selected - 1] : null

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}><div style={{ width: '40px', height: '40px', border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} /><p style={{ color: C.accent, fontSize: '14px', fontWeight: 700 }}>Loading...</p></div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text, transition: 'background 0.3s, color 0.3s' }}>
      <header style={{ background: C.bg, padding: 'clamp(12px, 1.5vw, 16px) clamp(20px, 3vw, 48px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 20px)' }}>
            <img src="/logo.png" alt="DAZN Bet" style={{ height: '40px' }} />
            <div>
              <h1 style={{ color: C.text, fontSize: 'clamp(14px, 1.6vw, 18px)', fontWeight: 800, margin: 0 }}>Weekly Trading Report</h1>
              <p style={{ color: C.textMuted, fontSize: 'clamp(10px, 1vw, 12px)', margin: 0 }}>Italy 2026 <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: db.connected ? C.successDim : C.border, color: db.connected ? C.success : C.textMuted, fontWeight: 700 }}>{db.connected ? '● Cloud' : '● Local'}</span></p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setIsDark(!isDark)} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>{isDark ? '☀️' : '🌙'} {isDark ? 'Light' : 'Dark'}</button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[{ id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }, { id: 'upload', label: 'Upload' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? C.primary : 'transparent', color: tab === t.id ? C.primaryText : C.textSec, border: `1px solid ${tab === t.id ? C.primary : C.border}`, borderRadius: '6px', padding: 'clamp(8px, 1vw, 10px) clamp(14px, 2vw, 20px)', fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>{t.label}</button>
              ))}
            </div>
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
        {tab === 'upload' && <UploadPage weeksData={weeks} onUpload={handleUpload} onDelete={handleDelete} theme={C} />}
      </main>
    </div>
  )
}
