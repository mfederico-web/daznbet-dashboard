'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line, ComposedChart } from 'recharts'
import { saveWeekData, loadAllWeeksData, deleteWeekData, checkConnection } from '../lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════════
// DAZN BET - MINIMAL B&W THEME
// ═══════════════════════════════════════════════════════════════════════════════
const C = {
  primary: '#CCFF00',
  primaryDark: '#a8d600',
  bg: '#000000',
  card: '#0a0a0a',
  cardHover: '#111111',
  border: '#1a1a1a',
  borderLight: '#333333',
  text: '#FFFFFF',
  textSec: '#999999',
  textMuted: '#666666',
  success: '#00D26A',
  successDim: 'rgba(0,210,106,0.1)',
  danger: '#FF4757',
  dangerDim: 'rgba(255,71,87,0.1)',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  cyan: '#06B6D4',
  chart: ['#CCFF00', '#00D26A', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#F97316']
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const FILES = [
  { key: 'anagrafica', name: 'Anagrafica.xlsx', path: 'Modifica Conto Telematico → Ricerca anagrafica' },
  { key: 'anagrafica2', name: 'Anagrafica2.xlsx', path: 'Statistica Conti' },
  { key: 'total', name: 'Anagrafica_TOTAL.xlsx', path: 'Stats Multilivello → GRID senza selezioni' },
  { key: 'categoria', name: 'Anagrafica_CATEGORIA.xlsx', path: 'Stats Multilivello → GRID Categoria' },
  { key: 'daznbet', name: 'Anagrafica_DAZNBET.xlsx', path: 'Stats Multilivello → DAZNBET SKIN' },
  { key: 'organic', name: 'Anagrafica_ORGANIC.xlsx', path: 'DAZNBET SKIN, PV: www.daznbet.it → GRID Categoria' },
  { key: 'organicTotal', name: 'Anagrafica_ORGANIC_TOTAL.xlsx', path: 'DAZNBET SKIN, PV: www.daznbet.it' },
  { key: 'skin', name: 'Anagrafica_SKIN.xlsx', path: 'Stats Multilivello → GRID SKIN e Categoria' },
  { key: 'skinTotal', name: 'Anagrafica_SKIN_TOTAL.xlsx', path: 'Stats Multilivello → GRID SKIN' },
  { key: 'academyTotal', name: 'Anagrafica_ACCADEMY_TOTAL.xlsx', path: 'VIVABET SKIN, Promoter: Academy' }
]

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
const parseNum = v => { if (typeof v === 'number') return v; if (typeof v === 'string') return parseFloat(v.replace(/[.]/g,'').replace(',','.').replace(/[^\d.-]/g,'')) || 0; return 0 }
const fmtCurrency = (v, c=true) => { if (!v || isNaN(v)) return '€0'; if (c) { if (Math.abs(v)>=1e6) return `€${(v/1e6).toFixed(2)}M`; if (Math.abs(v)>=1e3) return `€${(v/1e3).toFixed(0)}K` } return `€${v.toLocaleString('it-IT')}` }
const fmtNum = v => (!v || isNaN(v)) ? '0' : v.toLocaleString('it-IT')
const calcChange = (cur, prev) => (!prev || prev===0) ? null : ((cur-prev)/prev*100).toFixed(1)

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL CLASSIFICATION - UPDATED LOGIC
// ═══════════════════════════════════════════════════════════════════════════════
const classifyChannel = row => {
  const skin = String(row["Skin"] || "").toUpperCase().trim()
  const promoter = String(row["Promoter"] || "").toLowerCase().trim()
  const puntoVendita = String(row["Punto vendita"] || "").toLowerCase().trim()
  const codPunto = String(row["Cod Punto"] || "").toUpperCase().trim()
  
  // VIVABET/GLADIATORE: SKIN=VIVABET + Promoter='nsg social web srl'
  if (skin.includes("VIVABET")) {
    if (promoter.includes("nsg social web")) return "VIVABET/GLAD"
    return "Tipster Academy"
  }
  
  // DAZNBET channels
  if (skin.includes("DAZNBET") || skin.includes("SCOMMETTENDO")) {
    // DAZNBET Organic: PV = www.daznbet.it o www.scommettendo.it
    if (puntoVendita.includes("www.daznbet.it") || puntoVendita.includes("www.scommettendo.it")) {
      return "DAZNBET Organic"
    }
    // DAZN Direct: Promoter=DAZN/Funpoints o Cod Punto=DAZN_Superpronostico
    if (promoter.includes("dazn") || promoter.includes("funpoints") || codPunto.includes("DAZN_SUPERPRONOSTICO")) {
      return "DAZN Direct"
    }
    // AFFILIATES: resto DAZNBET
    return "AFFILIATES"
  }
  
  // PVR: Non DAZNBET/VIVABET e non www.scommettendo.it
  if (!puntoVendita.includes("www.scommettendo.it")) {
    return "PVR"
  }
  
  return "OTHER"
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PROCESSOR - UPDATED
// ═══════════════════════════════════════════════════════════════════════════════
const processData = (files, weekNum, dateRange) => {
  const ana = files.anagrafica || []
  const ana2 = files.anagrafica2 || []
  const total = files.total || []
  const cat = files.categoria || []
  const skinTotal = files.skinTotal || []
  const academyTotal = files.academyTotal || []
  const organicTotal = files.organicTotal || []
  
  // REGISTRATIONS: count rows from Anagrafica (Data Creazione)
  const reg = ana.length
  
  // Channel classification
  const channelGroups = {}
  ana.forEach(r => {
    const ch = classifyChannel(r)
    if (!channelGroups[ch]) channelGroups[ch] = { rows: [], ages: [], ftds: 0 }
    channelGroups[ch].rows.push(r)
    if (r["Nato il"]) channelGroups[ch].ages.push(r["Nato il"])
    // FTD: check "Primo deposito" column
    if (r["Primo deposito"]) channelGroups[ch].ftds++
  })
  
  // Quality Acquisition per channel
  const qualityAcq = Object.entries(channelGroups).map(([ch, d]) => {
    const r = d.rows.length
    const f = d.ftds
    const act = d.rows.filter(x => String(x["Stato conto"] || "").toUpperCase().includes("ATTIVATO")).length
    const avgAge = d.ages.length ? Math.round(d.ages.map(x => {
      const bd = new Date(x)
      return (new Date() - bd) / (365.25 * 24 * 60 * 60 * 1000)
    }).reduce((a, b) => a + b, 0) / d.ages.length) : 0
    return { 
      channel: ch, 
      reg: r, 
      ftds: f, 
      conv: r > 0 ? parseFloat((f / r * 100).toFixed(1)) : 0, 
      activated: r > 0 ? Math.round(act / r * 100) : 0, 
      avgAge 
    }
  }).filter(c => c.channel !== "OTHER").sort((a, b) => b.reg - a.reg)

  // Daily stats from Anagrafica2
  const daily = ana2.map(r => {
    const d = r["Data"]
    return {
      date: d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '',
      registrations: parseNum(r["Registrati AAMS"]) || 0,
      ftds: parseNum(r["Primo deposito"]) || 0,
      deposits: parseNum(r["Importo depositi"]) || 0,
      withdrawals: parseNum(r["Importo prelievi processati"]) || 0,
      bonus: parseNum(r["Importo bonus"]) || 0,
      logins: parseNum(r["Login"]) || 0,
      depositCount: parseNum(r["Depositi"]) || 0,
      uniqueDepositors: parseNum(r["Depositanti unici"]) || 0
    }
  })
  
  // Aggregated stats
  const ftds = daily.reduce((s, d) => s + d.ftds, 0)
  const totalDep = daily.reduce((s, d) => s + d.deposits, 0)
  const totalWit = daily.reduce((s, d) => s + d.withdrawals, 0)
  const totalBonus = daily.reduce((s, d) => s + d.bonus, 0)
  const totalLogins = daily.reduce((s, d) => s + d.logins, 0)
  const totalDepCount = daily.reduce((s, d) => s + d.depositCount, 0)
  const totalUniqueDep = daily.reduce((s, d) => s + d.uniqueDepositors, 0)
  const avgFirstDep = ana2.reduce((s, r) => s + parseNum(r["Importo primo deposito"]), 0)
  
  // TOTALS from Anagrafica_TOTAL (prima riga)
  const totRow = total[0] || {}
  const turnover = parseNum(totRow["Giocato"]) || 0
  const ggr = parseNum(totRow["rake"]) || parseNum(totRow["ggr"]) || 0
  const actives = parseNum(totRow["conti attivi"]) || 0

  // Products from Anagrafica_CATEGORIA (colonna rake per GGR)
  const products = cat.map(r => ({
    product: r["Categoria"] || '',
    turnover: parseNum(r["Giocato"]),
    ggr: parseNum(r["rake"]) || parseNum(r["ggr"]),
    actives: parseNum(r["conti attivi"]),
    payout: parseNum(r["Giocato"]) > 0 ? parseFloat((parseNum(r["vinto"]) / parseNum(r["Giocato"]) * 100).toFixed(1)) : null
  })).filter(p => p.product)

  // Channel Performance from SKIN files
  const chanPerf = []
  let totGgr = 0
  
  // PVR: SKIN not VIVABET/DAZNBET
  let pvrT = 0, pvrG = 0, pvrA = 0
  skinTotal.forEach(r => {
    const s = String(r["Skin"] || "").toUpperCase()
    if (s && !s.includes("VIVABET") && !s.includes("DAZNBET") && !s.includes("SCOMMETTENDO")) {
      pvrT += parseNum(r["Giocato"])
      pvrG += parseNum(r["rake"]) || parseNum(r["ggr"])
      pvrA += parseNum(r["conti attivi"])
    }
  })
  if (pvrT > 0 || pvrA > 0) {
    chanPerf.push({ channel: 'PVR', turnover: pvrT, ggr: pvrG, gwm: pvrT > 0 ? parseFloat((pvrG / pvrT * 100).toFixed(1)) : 0, actives: pvrA })
    totGgr += pvrG
  }
  
  // VIVABET
  const vivRow = skinTotal.find(r => String(r["Skin"] || "").toUpperCase().includes("VIVABET"))
  const acadRow = academyTotal[0]
  if (vivRow) {
    const vT = parseNum(vivRow["Giocato"])
    const vG = parseNum(vivRow["rake"]) || parseNum(vivRow["ggr"])
    const vA = parseNum(vivRow["conti attivi"])
    const aT = acadRow ? parseNum(acadRow["Giocato"]) : 0
    const aG = acadRow ? (parseNum(acadRow["rake"]) || parseNum(acadRow["ggr"])) : 0
    const aA = acadRow ? parseNum(acadRow["conti attivi"]) : 0
    
    // VIVABET/GLAD = VIVABET totale - Academy
    const gladT = vT - aT, gladG = vG - aG, gladA = vA - aA
    if (gladT > 0 || gladA > 0) {
      chanPerf.push({ channel: 'VIVABET/GLAD', turnover: gladT, ggr: gladG, gwm: gladT > 0 ? parseFloat((gladG / gladT * 100).toFixed(1)) : 0, actives: gladA })
      totGgr += gladG
    }
    if (aT > 0 || aA > 0) {
      chanPerf.push({ channel: 'Tipster Academy', turnover: aT, ggr: aG, gwm: aT > 0 ? parseFloat((aG / aT * 100).toFixed(1)) : 0, actives: aA })
      totGgr += aG
    }
  }
  
  // DAZNBET Organic
  const orgRow = organicTotal[0]
  if (orgRow) {
    const oT = parseNum(orgRow["Giocato"])
    const oG = parseNum(orgRow["rake"]) || parseNum(orgRow["ggr"])
    const oA = parseNum(orgRow["conti attivi"])
    chanPerf.push({ channel: 'DAZNBET Organic', turnover: oT, ggr: oG, gwm: oT > 0 ? parseFloat((oG / oT * 100).toFixed(1)) : 0, actives: oA })
    totGgr += oG
  }
  
  // Revenue Share
  chanPerf.forEach(c => { c.revShare = totGgr > 0 ? parseFloat((c.ggr / totGgr * 100).toFixed(1)) : 0 })

  // Demographics
  const genderCount = { M: 0, F: 0 }
  ana.forEach(r => { const g = String(r["Sesso"] || "").toUpperCase(); if (g === "M" || g === "F") genderCount[g]++ })
  const totGender = genderCount.M + genderCount.F
  
  const ageGroups = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0 }
  ana.forEach(r => {
    if (r["Nato il"]) {
      const age = (new Date() - new Date(r["Nato il"])) / (365.25 * 24 * 60 * 60 * 1000)
      if (age < 25) ageGroups["18-24"]++
      else if (age < 35) ageGroups["25-34"]++
      else if (age < 45) ageGroups["35-44"]++
      else if (age < 55) ageGroups["45-54"]++
      else if (age < 65) ageGroups["55-64"]++
      else ageGroups["65+"]++
    }
  })
  const totAges = Object.values(ageGroups).reduce((a, b) => a + b, 0)
  
  // Provinces (Top 8)
  const provCount = {}
  ana.forEach(r => { const p = r["Provincia di residenza"]; if (p) provCount[p] = (provCount[p] || 0) + 1 })
  const provinces = Object.entries(provCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }))
  
  // Top Sources from Cod Punto (Top 5)
  const srcCount = {}
  ana.forEach(r => { const s = r["Cod Punto"]; if (s) srcCount[s] = (srcCount[s] || 0) + 1 })
  const sources = Object.entries(srcCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name: name.substring(0, 20), count }))

  // Daily REG from Anagrafica (group by Data Creazione date)
  const dailyRegMap = {}
  ana.forEach(r => {
    if (r["Data Creazione"]) {
      const d = new Date(r["Data Creazione"]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      dailyRegMap[d] = (dailyRegMap[d] || 0) + 1
    }
  })
  // Merge with daily stats
  daily.forEach(d => {
    if (dailyRegMap[d.date]) d.registrations = dailyRegMap[d.date]
  })

  return {
    weekNumber: weekNum,
    dateRange,
    registrations: reg,
    ftds,
    conversionRate: reg > 0 ? parseFloat((ftds / reg * 100).toFixed(1)) : 0,
    avgFirstDeposit: ftds > 0 ? Math.round(avgFirstDep / ftds) : 0,
    totalDeposits: totalDep,
    totalWithdrawals: totalWit,
    netDeposit: totalDep - totalWit,
    turnover,
    ggr,
    gwm: turnover > 0 ? parseFloat((ggr / turnover * 100).toFixed(1)) : 0,
    activeUsers: actives,
    totalLogins,
    totalBonus,
    demographics: {
      male: totGender > 0 ? Math.round(genderCount.M / totGender * 100) : 0,
      female: totGender > 0 ? Math.round(genderCount.F / totGender * 100) : 0
    },
    ageGroups: Object.entries(ageGroups).map(([range, count]) => ({ range, percent: totAges > 0 ? Math.round(count / totAges * 100) : 0 })),
    provinces,
    topSources: sources,
    dailyStats: daily,
    qualityAcquisition: qualityAcq,
    channelPerformance: chanPerf,
    productPerformance: products,
    financialHealth: {
      withdrawalRatio: totalDep > 0 ? parseFloat((totalWit / totalDep * 100).toFixed(1)) : 0,
      depositFrequency: totalUniqueDep > 0 ? parseFloat((totalDepCount / totalUniqueDep).toFixed(1)) : 0,
      bonusROI: totalBonus > 0 ? Math.round(ggr / totalBonus) : 0,
      customerValue: actives > 0 ? Math.round(ggr / actives) : 0,
      loginPerUser: actives > 0 ? parseFloat((totalLogins / actives).toFixed(1)) : 0,
      newPlayersRatio: actives > 0 ? parseFloat((ftds / actives * 100).toFixed(1)) : 0
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGO COMPONENT (Official)
// ═══════════════════════════════════════════════════════════════════════════════
const Logo = ({ size = 'md' }) => {
  const sizes = { sm: { dazn: 12, bet: 16 }, md: { dazn: 14, bet: 20 }, lg: { dazn: 20, bet: 28 } }
  const s = sizes[size] || sizes.md
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ background: '#000', border: '2.5px solid #fff', borderRadius: '6px', padding: '5px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0.85 }}>
        <span style={{ color: '#fff', fontSize: s.dazn, fontWeight: 900, fontFamily: 'system-ui' }}>DA</span>
        <span style={{ color: '#fff', fontSize: s.dazn, fontWeight: 900, fontFamily: 'system-ui' }}>ZN</span>
      </div>
      <div style={{ background: C.primary, borderRadius: '6px', padding: '5px 10px', marginLeft: '-2px' }}>
        <span style={{ color: '#000', fontSize: s.bet, fontWeight: 900, fontStyle: 'italic', fontFamily: 'system-ui' }}>BET</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATED KPI CARD
// ═══════════════════════════════════════════════════════════════════════════════
const KPI = ({ label, value, sub, change, delay = 0, cur = false, pct = false, icon }) => {
  const [vis, setVis] = useState(false)
  const [anim, setAnim] = useState(0)
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0
  
  useEffect(() => { setTimeout(() => setVis(true), delay) }, [delay])
  useEffect(() => {
    if (!vis) return
    const start = Date.now(), dur = 1000
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      setAnim(numVal * (1 - Math.pow(1 - p, 3)))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [vis, numVal])

  const display = cur ? fmtCurrency(anim) : pct ? `${anim.toFixed(1)}%` : fmtNum(Math.round(anim))
  
  return (
    <div style={{
      background: C.card,
      borderRadius: '12px',
      padding: 'clamp(16px, 2vw, 24px)',
      border: `1px solid ${C.border}`,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(15px)',
      transition: 'all 0.4s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ color: C.textMuted, fontSize: 'clamp(10px, 1.1vw, 12px)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        {icon && <span style={{ fontSize: '16px', opacity: 0.5 }}>{icon}</span>}
      </div>
      <p style={{ color: C.text, fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, margin: '0 0 4px 0', fontFamily: 'system-ui' }}>{display}</p>
      {sub && <p style={{ color: C.textMuted, fontSize: 'clamp(10px, 1vw, 12px)', margin: 0 }}>{sub}</p>}
      {change && (
        <p style={{ color: parseFloat(change) >= 0 ? C.success : C.danger, fontSize: 'clamp(11px, 1.1vw, 13px)', fontWeight: 600, margin: '6px 0 0 0' }}>
          {parseFloat(change) > 0 ? '▲' : '▼'} {Math.abs(parseFloat(change))}% vs prev
        </p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const Tip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background: '#111', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 14px' }}>
    <p style={{ color: C.text, margin: '0 0 6px 0', fontWeight: 600, fontSize: '13px' }}>{label}</p>
    {payload.map((e, i) => <p key={i} style={{ color: e.color, margin: '2px 0', fontSize: '12px' }}>{e.name}: <b>{typeof e.value === 'number' && e.value > 1000 ? fmtNum(e.value) : e.value}</b></p>)}
  </div>
) : null

const ChartCard = ({ title, children, height = 280 }) => (
  <div style={{ background: C.card, borderRadius: '12px', padding: 'clamp(16px, 2vw, 24px)', border: `1px solid ${C.border}` }}>
    {title && <h4 style={{ color: C.textSec, margin: '0 0 16px 0', fontSize: 'clamp(11px, 1.2vw, 13px)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>}
    <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// TABLE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Table = ({ cols, data, compact = false }) => (
  <div style={{ overflowX: 'auto', borderRadius: '10px', border: `1px solid ${C.border}` }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: compact ? '12px' : 'clamp(12px, 1.2vw, 14px)' }}>
      <thead>
        <tr style={{ background: '#0a0a0a' }}>
          {cols.map((c, i) => (
            <th key={i} style={{ padding: compact ? '10px 12px' : 'clamp(10px, 1.4vw, 14px) clamp(12px, 1.5vw, 18px)', textAlign: c.align || 'left', color: C.primary, fontWeight: 600, fontSize: compact ? '10px' : 'clamp(10px, 1vw, 12px)', textTransform: 'uppercase', letterSpacing: '0.3px', borderBottom: `1px solid ${C.primary}` }}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((r, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? C.card : '#050505' }}>
            {cols.map((c, ci) => {
              const v = c.accessor ? r[c.accessor] : ''
              return <td key={ci} style={{ padding: compact ? '8px 12px' : 'clamp(10px, 1.3vw, 12px) clamp(12px, 1.5vw, 18px)', textAlign: c.align || 'left', color: C.text, borderBottom: `1px solid ${C.border}` }}>{c.format ? c.format(v, r) : v}</td>
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════════════════════
const Section = ({ title, sub, children }) => (
  <section style={{ marginBottom: 'clamp(32px, 4vw, 56px)' }}>
    <div style={{ marginBottom: 'clamp(16px, 2vw, 24px)', borderBottom: `1px solid ${C.border}`, paddingBottom: '12px' }}>
      <h2 style={{ color: C.text, fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 700, margin: 0 }}>{title}</h2>
      {sub && <p style={{ color: C.textMuted, fontSize: 'clamp(11px, 1.2vw, 14px)', margin: '4px 0 0 0' }}>{sub}</p>}
    </div>
    {children}
  </section>
)

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const UploadPage = ({ weeksData, onUpload, onDelete }) => {
  const [week, setWeek] = useState('')
  const [dates, setDates] = useState('')
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const exists = week && weeksData[parseInt(week)]

  const readFile = async f => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => { try { const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true }); res(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])) } catch (err) { rej(err) } }
    r.onerror = rej
    r.readAsArrayBuffer(f)
  })

  const handleFile = async (e, key) => {
    const f = e.target.files[0]
    if (f) {
      try { const d = await readFile(f); setFiles(p => ({ ...p, [key]: { name: f.name, data: d, rows: d.length } })); setMsg(null) }
      catch { setMsg({ t: 'error', m: 'Errore lettura file' }) }
    }
  }

  const handleUpload = async () => {
    if (!week || !dates) { setMsg({ t: 'error', m: 'Inserisci settimana e date range' }); return }
    const missing = FILES.filter(f => !files[f.key])
    if (missing.length) { setMsg({ t: 'error', m: `Mancano ${missing.length} file` }); return }
    setLoading(true)
    try {
      const fd = {}; Object.entries(files).forEach(([k, v]) => fd[k] = v.data)
      const proc = processData(fd, parseInt(week), dates)
      await onUpload(proc)
      setMsg({ t: 'success', m: exists ? `Week ${week} aggiornata!` : `Week ${week} caricata!` })
      setWeek(''); setDates(''); setFiles({})
    } catch { setMsg({ t: 'error', m: 'Errore elaborazione' }) }
    setLoading(false)
  }

  const uploadedCount = Object.keys(files).length

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <Section title="Upload Week Data" sub="Carica i 10 file Excel per processare una nuova settimana">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Settimana</label>
            <input type="number" value={week} onChange={e => setWeek(e.target.value)} placeholder="es. 6" style={{ width: '100%', background: '#000', border: `1px solid ${exists ? C.orange : C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '16px', fontWeight: 600 }} />
            {exists && <p style={{ color: C.orange, fontSize: '11px', marginTop: '6px' }}>⚠ Sovrascriverà i dati esistenti</p>}
          </div>
          <div>
            <label style={{ color: C.textMuted, fontSize: '11px', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Date Range</label>
            <input type="text" value={dates} onChange={e => setDates(e.target.value)} placeholder="03 - 09 Feb 2025" style={{ width: '100%', background: '#000', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', color: C.text, fontSize: '16px' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {FILES.map((f, i) => {
            const up = files[f.key]
            return (
              <div key={f.key} style={{ background: '#050505', borderRadius: '10px', padding: '14px', border: `1px solid ${up ? C.success : C.border}`, opacity: 0, animation: `fadeIn 0.3s ease ${i * 0.03}s forwards` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: up ? C.success : C.text, fontWeight: 600, fontSize: '13px' }}>{up ? '✓' : '○'} {f.name}</span>
                  {up && <span style={{ color: C.success, fontSize: '10px', background: C.successDim, padding: '2px 6px', borderRadius: '4px' }}>{up.rows}</span>}
                </div>
                <p style={{ color: C.textMuted, fontSize: '10px', margin: '0 0 8px 0' }}>{f.path}</p>
                <input type="file" accept=".xlsx,.xls" onChange={e => handleFile(e, f.key)} style={{ width: '100%', background: '#000', border: `1px solid ${C.border}`, borderRadius: '6px', padding: '8px', color: C.text, fontSize: '11px', cursor: 'pointer' }} />
              </div>
            )
          })}
        </div>

        {msg && <div style={{ background: msg.t === 'success' ? C.successDim : C.dangerDim, border: `1px solid ${msg.t === 'success' ? C.success : C.danger}`, borderRadius: '8px', padding: '12px', marginBottom: '16px' }}><p style={{ color: msg.t === 'success' ? C.success : C.danger, margin: 0, fontWeight: 600, fontSize: '13px' }}>{msg.m}</p></div>}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '40px' }}>
          <button onClick={handleUpload} disabled={loading || uploadedCount < 10} style={{ background: uploadedCount >= 10 ? C.primary : C.border, color: '#000', border: 'none', borderRadius: '8px', padding: '14px 32px', fontSize: '14px', fontWeight: 700, cursor: uploadedCount >= 10 ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Elaborazione...' : exists ? `Aggiorna Week ${week}` : `Carica Week ${week || '?'}`}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '120px', height: '6px', background: C.border, borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(uploadedCount / 10) * 100}%`, height: '100%', background: C.primary, transition: 'width 0.3s' }} />
            </div>
            <span style={{ color: uploadedCount >= 10 ? C.success : C.textMuted, fontSize: '13px', fontWeight: 600 }}>{uploadedCount}/10</span>
          </div>
        </div>

        {Object.keys(weeksData).length > 0 && (
          <>
            <h3 style={{ color: C.text, fontSize: '16px', margin: '0 0 16px 0', fontWeight: 600 }}>Settimane Caricate</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              {Object.values(weeksData).sort((a, b) => b.weekNumber - a.weekNumber).map(w => (
                <div key={w.weekNumber} style={{ background: '#050505', borderRadius: '10px', padding: '16px', border: `1px solid ${C.border}`, position: 'relative' }}>
                  <button onClick={() => onDelete(w.weekNumber)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', color: C.danger, border: 'none', fontSize: '14px', cursor: 'pointer', opacity: 0.6 }}>✕</button>
                  <h4 style={{ color: C.primary, margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>W{w.weekNumber}</h4>
                  <p style={{ color: C.textMuted, margin: '0 0 12px 0', fontSize: '12px' }}>{w.dateRange}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div><span style={{ color: C.textMuted }}>REG</span><p style={{ color: C.text, margin: 0, fontWeight: 600 }}>{fmtNum(w.registrations)}</p></div>
                    <div><span style={{ color: C.textMuted }}>FTDs</span><p style={{ color: C.text, margin: 0, fontWeight: 600 }}>{fmtNum(w.ftds)}</p></div>
                    <div><span style={{ color: C.textMuted }}>GGR</span><p style={{ color: C.success, margin: 0, fontWeight: 600 }}>{fmtCurrency(w.ggr)}</p></div>
                    <div><span style={{ color: C.textMuted }}>Actives</span><p style={{ color: C.text, margin: 0, fontWeight: 600 }}>{fmtNum(w.activeUsers)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const Monthly = ({ weeksData }) => {
  const weeks = Object.values(weeksData).sort((a, b) => a.weekNumber - b.weekNumber)
  if (!weeks.length) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>Nessun dato disponibile</p></div>

  const tot = {
    reg: weeks.reduce((s, w) => s + (w.registrations || 0), 0),
    ftds: weeks.reduce((s, w) => s + (w.ftds || 0), 0),
    dep: weeks.reduce((s, w) => s + (w.totalDeposits || 0), 0),
    wit: weeks.reduce((s, w) => s + (w.totalWithdrawals || 0), 0),
    turn: weeks.reduce((s, w) => s + (w.turnover || 0), 0),
    ggr: weeks.reduce((s, w) => s + (w.ggr || 0), 0)
  }
  const avgAct = Math.round(weeks.reduce((s, w) => s + (w.activeUsers || 0), 0) / weeks.length)
  const trend = weeks.map(w => ({ week: `W${w.weekNumber}`, REG: w.registrations, FTDs: w.ftds, GGR: Math.round(w.ggr / 1000), Actives: w.activeUsers }))

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      <Section title="Monthly Summary" sub={`Week ${weeks[0].weekNumber} - ${weeks[weeks.length - 1].weekNumber} • ${weeks.length} settimane`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          <KPI label="Total REG" value={tot.reg} icon="👤" delay={0} />
          <KPI label="Total FTDs" value={tot.ftds} sub={`Conv: ${(tot.ftds / tot.reg * 100).toFixed(1)}%`} icon="💳" delay={50} />
          <KPI label="Net Deposit" value={tot.dep - tot.wit} cur icon="💰" delay={100} />
          <KPI label="Turnover" value={tot.turn} cur icon="🎰" delay={150} />
          <KPI label="GGR" value={tot.ggr} sub={`GWM: ${(tot.ggr / tot.turn * 100).toFixed(1)}%`} cur icon="📈" delay={200} />
          <KPI label="Avg Actives" value={avgAct} icon="👥" delay={250} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 'clamp(24px, 3vw, 40px)' }}>
          <ChartCard title="Registration & FTD Trend">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient>
                <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.3} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11 }} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Area type="monotone" dataKey="REG" stroke={C.primary} fill="url(#gR)" strokeWidth={2} animationDuration={1200} />
              <Area type="monotone" dataKey="FTDs" stroke={C.success} fill="url(#gF)" strokeWidth={2} animationDuration={1200} animationBegin={200} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="GGR Trend (€K)">
            <ComposedChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="week" tick={{ fill: C.textMuted, fontSize: 11 }} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="GGR" fill={C.primary} radius={[4, 4, 0, 0]} animationDuration={1000} />
              <Line type="monotone" dataKey="Actives" stroke={C.blue} strokeWidth={2} dot={{ fill: C.blue, r: 3 }} animationDuration={1000} animationBegin={300} />
            </ComposedChart>
          </ChartCard>
        </div>

        <Table cols={[
          { header: 'Week', accessor: 'weekNumber', format: v => <span style={{ color: C.primary, fontWeight: 700 }}>W{v}</span> },
          { header: 'Date', accessor: 'dateRange' },
          { header: 'REG', accessor: 'registrations', align: 'right', format: fmtNum },
          { header: 'FTDs', accessor: 'ftds', align: 'right', format: fmtNum },
          { header: 'Conv%', accessor: 'conversionRate', align: 'center', format: v => `${v}%` },
          { header: 'Turnover', accessor: 'turnover', align: 'right', format: fmtCurrency },
          { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 600 }}>{fmtCurrency(v)}</span> },
          { header: 'GWM', accessor: 'gwm', align: 'center', format: v => `${v}%` },
          { header: 'Actives', accessor: 'activeUsers', align: 'right', format: fmtNum }
        ]} data={weeks} />
      </Section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY REPORT - MAIN VIEW
// ═══════════════════════════════════════════════════════════════════════════════
const Weekly = ({ data, prev, allData }) => {
  if (!data) return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: C.textMuted, fontSize: '16px' }}>Seleziona o carica una settimana</p></div>

  const regCh = prev ? calcChange(data.registrations, prev.registrations) : null
  const ftdCh = prev ? calcChange(data.ftds, prev.ftds) : null
  const turnCh = prev ? calcChange(data.turnover, prev.turnover) : null
  const ggrCh = prev ? calcChange(data.ggr, prev.ggr) : null
  const actCh = prev ? calcChange(data.activeUsers, prev.activeUsers) : null

  return (
    <div style={{ padding: 'clamp(20px, 3vw, 48px)' }}>
      {/* TRADING SUMMARY */}
      <Section title="Trading Summary" sub={`Week ${data.weekNumber} • ${data.dateRange}`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <KPI label="Registrations" value={data.registrations} change={regCh} icon="👤" delay={0} />
          <KPI label="FTDs" value={data.ftds} sub={`Conv: ${data.conversionRate}% • Avg: €${data.avgFirstDeposit}`} change={ftdCh} icon="💳" delay={50} />
          <KPI label="Net Deposit" value={data.netDeposit} sub={`Dep ${fmtCurrency(data.totalDeposits)} - Wit ${fmtCurrency(data.totalWithdrawals)}`} cur icon="💰" delay={100} />
          <KPI label="Turnover" value={data.turnover} change={turnCh} cur icon="🎰" delay={150} />
          <KPI label="GGR" value={data.ggr} change={ggrCh} cur icon="📈" delay={200} />
          <KPI label="GWM" value={data.gwm} sub={prev ? `${(data.gwm - prev.gwm) >= 0 ? '+' : ''}${(data.gwm - prev.gwm).toFixed(1)}pp` : null} pct icon="📊" delay={250} />
        </div>

        {/* Weekly Actives Highlight */}
        <div style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #000 100%)', borderRadius: '12px', padding: 'clamp(20px, 3vw, 32px)', border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <p style={{ color: C.textMuted, fontSize: 'clamp(11px, 1.2vw, 14px)', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 6px 0' }}>Weekly Active Users</p>
            <p style={{ color: C.primary, fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, margin: 0, fontFamily: 'system-ui' }}>{fmtNum(data.activeUsers)}</p>
            {actCh && <p style={{ color: parseFloat(actCh) >= 0 ? C.success : C.danger, fontSize: '14px', margin: '8px 0 0 0' }}>{parseFloat(actCh) > 0 ? '▲' : '▼'} {Math.abs(parseFloat(actCh))}% vs prev week</p>}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: C.textMuted, fontSize: '11px', margin: '0 0 4px 0' }}>Logins</p>
              <p style={{ color: C.text, fontSize: '20px', fontWeight: 700, margin: 0 }}>{fmtNum(data.totalLogins)}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: C.textMuted, fontSize: '11px', margin: '0 0 4px 0' }}>Bonus</p>
              <p style={{ color: C.orange, fontSize: '20px', fontWeight: 700, margin: 0 }}>{fmtCurrency(data.totalBonus)}</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ACQUISITION */}
      <Section title="Acquisition" sub="Daily trend e demographics">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'clamp(16px, 2vw, 24px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <ChartCard title="Daily Registrations & FTDs">
            <AreaChart data={data.dailyStats || []}>
              <defs>
                <linearGradient id="dR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.4} /><stop offset="95%" stopColor={C.primary} stopOpacity={0} /></linearGradient>
                <linearGradient id="dF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.4} /><stop offset="95%" stopColor={C.success} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10 }} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Area type="monotone" dataKey="registrations" name="REG" stroke={C.primary} fill="url(#dR)" strokeWidth={2} animationDuration={1200} />
              <Area type="monotone" dataKey="ftds" name="FTDs" stroke={C.success} fill="url(#dF)" strokeWidth={2} animationDuration={1200} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Top Sources (Cod Punto)">
            <BarChart data={data.topSources || []} layout="vertical">
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fill: C.textMuted, fontSize: 10 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" fill={C.success} radius={[0, 4, 4, 0]} animationDuration={1000} />
            </BarChart>
          </ChartCard>
        </div>

        {/* Demographics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
          {/* Gender */}
          <div style={{ background: C.card, borderRadius: '12px', padding: '20px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
            <h4 style={{ color: C.textMuted, margin: '0 0 16px 0', fontSize: '11px', textTransform: 'uppercase' }}>Gender Split</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
              <div>
                <p style={{ color: C.blue, fontSize: '36px', fontWeight: 700, margin: 0 }}>{data.demographics?.male || 0}%</p>
                <p style={{ color: C.textMuted, fontSize: '12px' }}>Male</p>
              </div>
              <div>
                <p style={{ color: C.purple, fontSize: '36px', fontWeight: 700, margin: 0 }}>{data.demographics?.female || 0}%</p>
                <p style={{ color: C.textMuted, fontSize: '12px' }}>Female</p>
              </div>
            </div>
          </div>

          {/* Age */}
          <ChartCard title="Age Distribution" height={140}>
            <BarChart data={data.ageGroups || []}>
              <XAxis dataKey="range" tick={{ fill: C.textMuted, fontSize: 9 }} />
              <YAxis hide />
              <Tooltip content={<Tip />} />
              <Bar dataKey="percent" fill={C.primary} radius={[4, 4, 0, 0]} animationDuration={800}>
                {(data.ageGroups || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
              </Bar>
            </BarChart>
          </ChartCard>

          {/* Provinces */}
          <ChartCard title="Top Provinces" height={140}>
            <BarChart data={(data.provinces || []).slice(0, 5)} layout="vertical">
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={45} tick={{ fill: C.textMuted, fontSize: 9 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="count" fill={C.cyan} radius={[0, 4, 4, 0]} animationDuration={800} />
            </BarChart>
          </ChartCard>
        </div>
      </Section>

      {/* QUALITY ACQUISITION */}
      <Section title="Quality Acquisition" sub="Performance per canale di acquisizione">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 600 }}>{v}</span> },
            { header: 'REG', accessor: 'reg', align: 'right', format: fmtNum },
            { header: 'FTDs', accessor: 'ftds', align: 'right', format: fmtNum },
            { header: 'Conv%', accessor: 'conv', align: 'center', format: v => <span style={{ color: v >= 55 ? C.success : v >= 45 ? C.orange : C.danger, fontWeight: 600 }}>{v}%</span> },
            { header: 'Activated', accessor: 'activated', align: 'center', format: v => `${v}%` },
            { header: 'Avg Age', accessor: 'avgAge', align: 'center', format: v => `${v}` }
          ]} data={data.qualityAcquisition || []} />

          <ChartCard title="Conversion Rate by Channel" height={220}>
            <BarChart data={data.qualityAcquisition || []} layout="vertical">
              <XAxis type="number" domain={[0, 80]} tick={{ fill: C.textMuted, fontSize: 10 }} />
              <YAxis dataKey="channel" type="category" width={100} tick={{ fill: C.textMuted, fontSize: 10 }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="conv" name="Conv%" fill={C.primary} radius={[0, 4, 4, 0]} animationDuration={1000}>
                {(data.qualityAcquisition || []).map((e, i) => <Cell key={i} fill={e.conv >= 55 ? C.success : e.conv >= 45 ? C.orange : C.danger} />)}
              </Bar>
            </BarChart>
          </ChartCard>
        </div>
      </Section>

      {/* CHANNEL PERFORMANCE */}
      <Section title="Channel Performance" sub="Turnover, GGR e Revenue Share per canale">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Channel', accessor: 'channel', format: v => <span style={{ fontWeight: 600 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: fmtCurrency },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 600 }}>{fmtCurrency(v)}</span> },
            { header: 'GWM', accessor: 'gwm', align: 'center', format: v => `${v}%` },
            { header: 'Actives', accessor: 'actives', align: 'right', format: fmtNum },
            { header: 'Rev Share', accessor: 'revShare', align: 'center', format: v => <span style={{ color: C.primary, fontWeight: 600 }}>{v}%</span> }
          ]} data={data.channelPerformance || []} />

          <ChartCard title="Revenue Share" height={220}>
            <PieChart>
              <Pie data={(data.channelPerformance || []).filter(c => c.revShare > 0)} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="revShare" nameKey="channel" animationDuration={1000}>
                {(data.channelPerformance || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
              </Pie>
              <Tooltip content={<Tip />} />
              <Legend />
            </PieChart>
          </ChartCard>
        </div>
      </Section>

      {/* PRODUCT PERFORMANCE */}
      <Section title="Product Performance" sub="Performance per categoria di gioco">
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'clamp(16px, 2vw, 24px)' }}>
          <Table cols={[
            { header: 'Product', accessor: 'product', format: v => <span style={{ fontWeight: 600 }}>{v}</span> },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: fmtCurrency },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: v => <span style={{ color: C.success, fontWeight: 600 }}>{fmtCurrency(v)}</span> },
            { header: 'Payout%', accessor: 'payout', align: 'center', format: v => v ? `${v}%` : '-' },
            { header: 'Actives', accessor: 'actives', align: 'right', format: fmtNum }
          ]} data={data.productPerformance || []} compact />

          <ChartCard title="GGR by Product" height={220}>
            <BarChart data={(data.productPerformance || []).slice(0, 6)} layout="vertical">
              <XAxis type="number" tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} />
              <YAxis dataKey="product" type="category" width={80} tick={{ fill: C.textMuted, fontSize: 9 }} />
              <Tooltip content={<Tip />} formatter={v => fmtCurrency(v)} />
              <Bar dataKey="ggr" fill={C.primary} radius={[0, 4, 4, 0]} animationDuration={1000}>
                {(data.productPerformance || []).map((_, i) => <Cell key={i} fill={C.chart[i % C.chart.length]} />)}
              </Bar>
            </BarChart>
          </ChartCard>
        </div>
      </Section>

      {/* FINANCIAL HEALTH */}
      <Section title="Financial Health" sub="Indicatori finanziari e cash flow">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(12px, 1.5vw, 16px)', marginBottom: 'clamp(20px, 2.5vw, 28px)' }}>
          <KPI label="Withdrawal Ratio" value={data.financialHealth?.withdrawalRatio || 0} pct delay={0} />
          <KPI label="Deposit Freq" value={data.financialHealth?.depositFrequency || 0} sub="dep/user" delay={50} />
          <KPI label="Bonus ROI" value={data.financialHealth?.bonusROI || 0} sub="x return" delay={100} />
          <KPI label="Customer Value" value={data.financialHealth?.customerValue || 0} cur delay={150} />
          <KPI label="Login/User" value={data.financialHealth?.loginPerUser || 0} delay={200} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'clamp(16px, 2vw, 24px)' }}>
          <ChartCard title="Daily Cash Flow">
            <BarChart data={data.dailyStats || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10 }} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Bar dataKey="deposits" name="Deposits" fill={C.success} radius={[3, 3, 0, 0]} animationDuration={800} />
              <Bar dataKey="withdrawals" name="Withdrawals" fill={C.danger} radius={[3, 3, 0, 0]} animationDuration={800} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Daily Bonus Distribution">
            <AreaChart data={data.dailyStats || []}>
              <defs>
                <linearGradient id="bG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.4} /><stop offset="95%" stopColor={C.orange} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="date" tick={{ fill: C.textMuted, fontSize: 10 }} />
              <YAxis tick={{ fill: C.textMuted, fontSize: 10 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="bonus" name="Bonus" stroke={C.orange} fill="url(#bG)" strokeWidth={2} animationDuration={1000} />
            </AreaChart>
          </ChartCard>
        </div>
      </Section>

      {/* FOOTER */}
      <div style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #000 100%)', borderRadius: '16px', padding: 'clamp(40px, 5vw, 80px)', textAlign: 'center', border: `1px solid ${C.border}`, marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <Logo size="lg" />
        </div>
        <h2 style={{ color: C.primary, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, margin: '0 0 8px 0' }}>Thank You</h2>
        <p style={{ color: C.text, fontSize: 'clamp(14px, 1.8vw, 18px)', margin: '0 0 4px 0' }}>Weekly Trading Report • Week {data.weekNumber} 2025</p>
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

  useEffect(() => {
    (async () => {
      try {
        const c = await checkConnection(); setDb(c)
        const r = await loadAllWeeksData()
        if (r.data && Object.keys(r.data).length) {
          setWeeks(r.data)
          setSelected(Math.max(...Object.keys(r.data).map(Number)))
        }
      } catch (e) { console.error(e) }
      setLoading(false)
    })()
  }, [])

  const handleUpload = async d => {
    const u = { ...weeks, [d.weekNumber]: d }
    setWeeks(u); setSelected(d.weekNumber)
    await saveWeekData(d); setTab('weekly')
  }

  const handleDelete = async n => {
    if (!confirm(`Eliminare Week ${n}?`)) return
    const { [n]: _, ...rest } = weeks; setWeeks(rest)
    await deleteWeekData(n)
    setSelected(Object.keys(rest).length ? Math.max(...Object.keys(rest).map(Number)) : null)
  }

  const weekNums = Object.keys(weeks).map(Number).sort((a, b) => b - a)
  const current = selected ? weeks[selected] : null
  const prev = selected && weeks[selected - 1] ? weeks[selected - 1] : null

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #222', borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: C.primary, fontSize: '14px' }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: C.text }}>
      {/* HEADER */}
      <header style={{ background: '#000', padding: 'clamp(12px, 1.5vw, 16px) clamp(20px, 3vw, 48px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 20px)' }}>
            <Logo size="sm" />
            <div>
              <h1 style={{ color: C.text, fontSize: 'clamp(14px, 1.6vw, 18px)', fontWeight: 700, margin: 0 }}>Weekly Trading Report</h1>
              <p style={{ color: C.textMuted, fontSize: 'clamp(10px, 1vw, 12px)', margin: 0 }}>
                Italy
                <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: db.connected ? C.successDim : '#1a1a00', color: db.connected ? C.success : C.primary }}>
                  {db.connected ? '● Cloud' : '● Local'}
                </span>
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {[{ id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }, { id: 'upload', label: 'Upload' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? C.primary : 'transparent',
                color: tab === t.id ? '#000' : C.textSec,
                border: `1px solid ${tab === t.id ? C.primary : C.border}`,
                borderRadius: '6px',
                padding: 'clamp(8px, 1vw, 10px) clamp(14px, 2vw, 20px)',
                fontSize: 'clamp(11px, 1.2vw, 13px)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Week Selector */}
          {tab === 'weekly' && weekNums.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select value={selected || ''} onChange={e => setSelected(Number(e.target.value))} style={{
                background: '#000',
                color: C.text,
                border: `1px solid ${C.primary}`,
                borderRadius: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: '100px'
              }}>
                {weekNums.map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
              {current && <span style={{ color: C.textMuted, fontSize: '12px' }}>{current.dateRange}</span>}
            </div>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <main>
        {tab === 'weekly' && <Weekly data={current} prev={prev} allData={weeks} />}
        {tab === 'monthly' && <Monthly weeksData={weeks} />}
        {tab === 'upload' && <UploadPage weeksData={weeks} onUpload={handleUpload} onDelete={handleDelete} />}
      </main>
    </div>
  )
}
