'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { saveWeekData, loadAllWeeksData, deleteWeekData, checkConnection } from '../lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const THEMES = {
  dark: {
    name: 'dark',
    bg: '#0A0A0A',
    bgSecondary: '#111111',
    card: '#161616',
    cardHover: '#1c1c1c',
    border: '#262626',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    textMuted: '#666666',
    accent: '#CCFF00',
    accentDim: 'rgba(204, 255, 0, 0.08)',
    success: '#10B981',
    successDim: 'rgba(16, 185, 129, 0.1)',
    danger: '#EF4444',
    dangerDim: 'rgba(239, 68, 68, 0.1)',
    chart: ['#CCFF00', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'],
  },
  light: {
    name: 'light',
    bg: '#FAFAFA',
    bgSecondary: '#FFFFFF',
    card: '#FFFFFF',
    cardHover: '#F5F5F5',
    border: '#E5E5E5',
    text: '#0A0A0A',
    textSecondary: '#666666',
    textMuted: '#999999',
    accent: '#0A0A0A',
    accentDim: 'rgba(10, 10, 10, 0.04)',
    success: '#059669',
    successDim: 'rgba(5, 150, 105, 0.08)',
    danger: '#DC2626',
    dangerDim: 'rgba(220, 38, 38, 0.08)',
    chart: ['#0A0A0A', '#059669', '#2563EB', '#7C3AED', '#D97706'],
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE REQUIREMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const FILE_REQUIREMENTS = [
  { key: 'anagrafica', name: 'Anagrafica.xlsx', boPath: 'Modifica Conto Telematico → Ricerca Avanzata → Ricerca anagrafica' },
  { key: 'anagrafica2', name: 'Anagrafica2.xlsx', boPath: 'Statistica Conti' },
  { key: 'total', name: 'Anagrafica_TOTAL.xlsx', boPath: 'Stats Multilivello → tutti i prodotti → GRID senza selezioni' },
  { key: 'categoria', name: 'Anagrafica_CATEGORIA.xlsx', boPath: 'Stats Multilivello → tutti i prodotti → GRID Categoria' },
  { key: 'daznbet', name: 'Anagrafica_DAZNBET.xlsx', boPath: 'Stats Multilivello → DAZNBET SKIN → GRID senza selezioni' },
  { key: 'organic', name: 'Anagrafica_ORGANIC.xlsx', boPath: 'Stats Multilivello → DAZNBET SKIN, PV: www.daznbet.it → GRID Categoria' },
  { key: 'organicTotal', name: 'Anagrafica_ORGANIC_TOTAL.xlsx', boPath: 'Stats Multilivello → DAZNBET SKIN, PV: www.daznbet.it → GRID senza selezioni' },
  { key: 'skin', name: 'Anagrafica_SKIN.xlsx', boPath: 'Stats Multilivello → tutti i prodotti → GRID SKIN e Categoria' },
  { key: 'skinTotal', name: 'Anagrafica_SKIN_TOTAL.xlsx', boPath: 'Stats Multilivello → tutti i prodotti → GRID SKIN' },
  { key: 'academyTotal', name: 'Anagrafica_ACCADEMY_TOTAL.xlsx', boPath: 'Stats Multilivello → VIVABET SKIN, Promoter: Academy → GRID senza selezioni' }
]

// ═══════════════════════════════════════════════════════════════════════════════
// KPI & UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
const KPI = {
  conversionRate: (ftds, reg) => reg > 0 ? (ftds / reg * 100).toFixed(1) : "0.0",
  gwm: (ggr, turnover) => turnover > 0 ? (ggr / turnover * 100).toFixed(1) : "0.0",
  avgFirstDeposit: (importo, ftds) => ftds > 0 ? Math.round(importo / ftds) : 0,
  withdrawalRatio: (wit, dep) => dep > 0 ? (wit / dep * 100).toFixed(1) : "0.0",
  depositFrequency: (nDep, depositanti) => depositanti > 0 ? (nDep / depositanti).toFixed(1) : "0.0",
  bonusROI: (ggr, bonus) => bonus > 0 ? Math.round(ggr / bonus) : 0,
  customerValue: (ggr, actives) => actives > 0 ? Math.round(ggr / actives) : 0,
  loginFrequency: (logins, actives) => actives > 0 ? (logins / actives).toFixed(1) : "0.0",
  payout: (vinto, giocato) => giocato > 0 ? (vinto / giocato * 100).toFixed(1) : "0.0",
  arpu: (ggr, actives) => actives > 0 ? (ggr / actives).toFixed(2) : "0.00",
  revenueShare: (ggrProd, ggrTot) => ggrTot > 0 ? (ggrProd / ggrTot * 100).toFixed(1) : "0.0",
  activationRate: (attivati, reg) => reg > 0 ? Math.round(attivati / reg * 100).toString() : "0",
  avgAge: (birthdates) => {
    const now = new Date()
    const valid = birthdates.filter(d => d)
    if (valid.length === 0) return 0
    const ages = valid.map(d => (now - new Date(d)) / (365.25 * 24 * 60 * 60 * 1000))
    return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
  }
}

const CHANNELS = { PVR: "PVR", VIVABET_GLAD: "VIVABET/GLAD", TIPSTER_ACADEMY: "Tipster Academy", DAZNBET_ORGANIC: "DAZNBET Organic", DAZN_DIRECT: "DAZN Direct", AFFILIATES: "AFFILIATES" }

const classifyChannel = (row) => {
  const skin = String(row["Skin"] || "").toUpperCase().trim()
  const promoter = String(row["Promoter"] || "").toLowerCase().trim()
  const puntoVendita = String(row["Punto vendita"] || "").toUpperCase().trim()
  if (!skin.includes("DAZNBET") && !skin.includes("VIVABET")) { if (!["dazn", "funpoints", "igaming.com ltd", "one click marketing ltd"].some(p => promoter.includes(p))) return CHANNELS.PVR }
  if (skin.includes("VIVABET")) return ["nsg social web srl"].some(p => promoter.includes(p)) ? CHANNELS.VIVABET_GLAD : CHANNELS.TIPSTER_ACADEMY
  if (skin.includes("DAZNBET")) {
    if (["WWW.DAZNBET.IT", "DAZNBET"].some(pv => puntoVendita.includes(pv))) return CHANNELS.DAZNBET_ORGANIC
    if (["dazn", "funpoints"].some(p => promoter.includes(p)) || puntoVendita.includes("SUPERPRONOSTICO")) return CHANNELS.DAZN_DIRECT
    return CHANNELS.AFFILIATES
  }
  return "OTHER"
}

const parseNum = (val) => { if (typeof val === 'number') return val; if (typeof val === 'string') return parseFloat(val.replace(/[.]/g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0; return 0 }
const formatCurrency = (val, compact = true) => { if (!val || isNaN(val)) return '€0'; if (compact) { if (Math.abs(val) >= 1000000) return `€${(val / 1000000).toFixed(2)}M`; if (Math.abs(val) >= 1000) return `€${(val / 1000).toFixed(0)}k` } return `€${val.toLocaleString('it-IT')}` }
const formatNumber = (val) => (!val || isNaN(val)) ? '0' : val.toLocaleString('it-IT')
const calcChange = (current, previous) => (!previous || previous === 0) ? null : ((current - previous) / previous * 100).toFixed(1)

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════════
const processWeekData = (files, weekNumber, dateRange) => {
  const ana = files.anagrafica || [], ana2 = files.anagrafica2 || [], cat = files.categoria || [], skinTotal = files.skinTotal || [], academyTotal = files.academyTotal || [], organicTotal = files.organicTotal || []
  const registrations = ana.length
  const channelGroups = {}
  ana.forEach(row => { const channel = classifyChannel(row); if (!channelGroups[channel]) channelGroups[channel] = { rows: [], birthdates: [] }; channelGroups[channel].rows.push(row); if (row["Nato il"]) channelGroups[channel].birthdates.push(row["Nato il"]) })

  const qualityAcquisition = Object.entries(channelGroups).map(([channel, data]) => {
    const reg = data.rows.length, ftds = data.rows.filter(r => r["Primo deposito"] || parseNum(r["Depositi"]) > 0).length, activated = data.rows.filter(r => String(r["Stato conto"] || "").includes("ATTIVATO")).length
    return { channel, reg, ftds, conv: parseFloat(KPI.conversionRate(ftds, reg)), activated: parseInt(KPI.activationRate(activated, reg)), avgAge: KPI.avgAge(data.birthdates) }
  }).filter(c => c.channel !== "OTHER").sort((a, b) => b.reg - a.reg)

  const dailyStats = ana2.map(r => { const dateVal = r["Data"]; let dateStr = ''; if (dateVal) { const d = new Date(dateVal); dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) }; return { date: dateStr, registrations: parseNum(r["Registrati AAMS"]) || 0, ftds: parseNum(r["Primo deposito"]) || 0, deposits: parseNum(r["Importo depositi"]) || 0, withdrawals: parseNum(r["Importo prelievi processati"]) || 0, logins: parseNum(r["Login"]) || 0, bonus: parseNum(r["Importo bonus"]) || 0, depositCount: parseNum(r["Depositi"]) || 0, uniqueDepositors: parseNum(r["Depositanti unici"]) || 0 } })

  const ftds = dailyStats.reduce((sum, d) => sum + d.ftds, 0), totalDeposits = dailyStats.reduce((sum, d) => sum + d.deposits, 0), totalWithdrawals = dailyStats.reduce((sum, d) => sum + d.withdrawals, 0), totalLogins = dailyStats.reduce((sum, d) => sum + d.logins, 0), totalBonus = dailyStats.reduce((sum, d) => sum + d.bonus, 0), totalDepositCount = dailyStats.reduce((sum, d) => sum + d.depositCount, 0), totalUniqueDepositors = dailyStats.reduce((sum, d) => sum + d.uniqueDepositors, 0), importoPrimoDeposito = ana2.reduce((sum, r) => sum + parseNum(r["Importo primo deposito"]), 0)
  const turnover = cat.reduce((sum, r) => sum + parseNum(r["Giocato"]), 0), ggr = cat.reduce((sum, r) => sum + parseNum(r["ggr"]), 0), activeUsers = cat.reduce((max, r) => Math.max(max, parseNum(r["conti attivi"])), 0)
  const productPerformance = cat.map(r => { const prodTurnover = parseNum(r["Giocato"]), prodGgr = parseNum(r["ggr"]), prodActives = parseNum(r["conti attivi"]), prodVinto = parseNum(r["vinto"]); return { product: r["Categoria"] || '', turnover: prodTurnover, ggr: prodGgr, payout: prodTurnover > 0 ? parseFloat(KPI.payout(prodVinto, prodTurnover)) : null, actives: prodActives, arpu: parseFloat(KPI.arpu(prodGgr, prodActives)) } }).filter(p => p.product)

  const channelPerformance = []; let totalGgrForShare = 0
  let pvrTurnover = 0, pvrGgr = 0, pvrActives = 0
  skinTotal.forEach(r => { const skinName = String(r["Skin"] || "").toUpperCase(); if (skinName && !skinName.includes("VIVABET") && !skinName.includes("DAZNBET")) { pvrTurnover += parseNum(r["Giocato"]); pvrGgr += parseNum(r["ggr"]) || parseNum(r["rake"]); pvrActives += parseNum(r["conti attivi"]) } })
  if (pvrTurnover > 0 || pvrActives > 0) { channelPerformance.push({ channel: 'PVR', turnover: pvrTurnover, ggr: pvrGgr, gwm: parseFloat(KPI.gwm(pvrGgr, pvrTurnover)), actives: pvrActives, revShare: 0 }); totalGgrForShare += pvrGgr }

  const vivabetRow = skinTotal.find(r => String(r["Skin"] || "").toUpperCase().includes("VIVABET")), academyRow = academyTotal[0]
  if (vivabetRow) { const vivTurnover = parseNum(vivabetRow["Giocato"]), vivGgr = parseNum(vivabetRow["ggr"]) || parseNum(vivabetRow["rake"]), vivActives = parseNum(vivabetRow["conti attivi"]), acadTurnover = academyRow ? parseNum(academyRow["Giocato"]) : 0, acadGgr = academyRow ? (parseNum(academyRow["ggr"]) || parseNum(academyRow["rake"])) : 0, acadActives = academyRow ? parseNum(academyRow["conti attivi"]) : 0; channelPerformance.push({ channel: 'VIVABET/GLAD', turnover: vivTurnover - acadTurnover, ggr: vivGgr - acadGgr, gwm: parseFloat(KPI.gwm(vivGgr - acadGgr, vivTurnover - acadTurnover)), actives: vivActives - acadActives, revShare: 0 }); totalGgrForShare += vivGgr - acadGgr; if (acadTurnover > 0 || acadActives > 0) { channelPerformance.push({ channel: 'Tipster Academy', turnover: acadTurnover, ggr: acadGgr, gwm: parseFloat(KPI.gwm(acadGgr, acadTurnover)), actives: acadActives, revShare: 0 }); totalGgrForShare += acadGgr } }

  const organicRow = organicTotal[0]
  if (organicRow) { const orgTurnover = parseNum(organicRow["Giocato"]), orgGgr = parseNum(organicRow["ggr"]) || parseNum(organicRow["rake"]), orgActives = parseNum(organicRow["conti attivi"]); channelPerformance.push({ channel: 'DAZNBET Organic', turnover: orgTurnover, ggr: orgGgr, gwm: parseFloat(KPI.gwm(orgGgr, orgTurnover)), actives: orgActives, revShare: 0 }); totalGgrForShare += orgGgr }
  channelPerformance.forEach(c => { c.revShare = parseFloat(KPI.revenueShare(c.ggr, totalGgrForShare)) })

  const genderCount = { M: 0, F: 0 }; ana.forEach(r => { const gender = String(r["Sesso"] || "").toUpperCase(); if (gender === "M" || gender === "F") genderCount[gender]++ }); const totalGender = genderCount.M + genderCount.F
  const ageGroups = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55-64": 0, "65+": 0 }; ana.forEach(r => { if (r["Nato il"]) { const age = (new Date() - new Date(r["Nato il"])) / (365.25 * 24 * 60 * 60 * 1000); if (age < 25) ageGroups["18-24"]++; else if (age < 35) ageGroups["25-34"]++; else if (age < 45) ageGroups["35-44"]++; else if (age < 55) ageGroups["45-54"]++; else if (age < 65) ageGroups["55-64"]++; else ageGroups["65+"]++ } }); const totalAges = Object.values(ageGroups).reduce((a, b) => a + b, 0)
  const provinceCount = {}; ana.forEach(r => { const prov = r["Provincia di residenza"]; if (prov) provinceCount[prov] = (provinceCount[prov] || 0) + 1 }); const provinces = Object.entries(provinceCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))
  const sourceCount = {}; ana.forEach(r => { let source = r["Cod Punto"] || r["Punto vendita"] || "Unknown"; if (source.toLowerCase().includes("daznbet")) source = "DAZNBET (Organic)"; sourceCount[source] = (sourceCount[source] || 0) + 1 }); const topSources = Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name: name.substring(0, 20), count }))

  const deepDiveEntry = { week: weekNumber, pvr: { reg: qualityAcquisition.find(q => q.channel === 'PVR')?.reg || 0, ftds: qualityAcquisition.find(q => q.channel === 'PVR')?.ftds || 0, ggr: Math.round((channelPerformance.find(c => c.channel === 'PVR')?.ggr || 0) / 1000) }, vivabet: { reg: (qualityAcquisition.find(q => q.channel === 'VIVABET/GLAD')?.reg || 0) + (qualityAcquisition.find(q => q.channel === 'Tipster Academy')?.reg || 0), ftds: (qualityAcquisition.find(q => q.channel === 'VIVABET/GLAD')?.ftds || 0) + (qualityAcquisition.find(q => q.channel === 'Tipster Academy')?.ftds || 0), ggr: Math.round(((channelPerformance.find(c => c.channel === 'VIVABET/GLAD')?.ggr || 0) + (channelPerformance.find(c => c.channel === 'Tipster Academy')?.ggr || 0)) / 1000) }, organic: { reg: qualityAcquisition.find(q => q.channel === 'DAZNBET Organic')?.reg || 0, ftds: qualityAcquisition.find(q => q.channel === 'DAZNBET Organic')?.ftds || 0, ggr: Math.round((channelPerformance.find(c => c.channel === 'DAZNBET Organic')?.ggr || 0) / 1000) }, direct: { reg: qualityAcquisition.find(q => q.channel === 'DAZN Direct')?.reg || 0, ftds: qualityAcquisition.find(q => q.channel === 'DAZN Direct')?.ftds || 0, ggr: 0 }, affiliates: { reg: qualityAcquisition.find(q => q.channel === 'AFFILIATES')?.reg || 0, ftds: qualityAcquisition.find(q => q.channel === 'AFFILIATES')?.ftds || 0, ggr: 0 }, total: { reg: registrations, ftds, ggr: Math.round(ggr / 1000) } }

  return { weekNumber, dateRange, registrations, ftds, conversionRate: parseFloat(KPI.conversionRate(ftds, registrations)), avgFirstDeposit: KPI.avgFirstDeposit(importoPrimoDeposito, ftds), totalDeposits, totalWithdrawals, netDeposit: totalDeposits - totalWithdrawals, turnover, ggr, gwm: parseFloat(KPI.gwm(ggr, turnover)), activeUsers, totalLogins, totalBonus, demographics: { male: totalGender > 0 ? Math.round(genderCount.M / totalGender * 100) : 0, female: totalGender > 0 ? Math.round(genderCount.F / totalGender * 100) : 0 }, ageGroups: Object.entries(ageGroups).map(([range, count]) => ({ range, percent: totalAges > 0 ? Math.round(count / totalAges * 100) : 0 })), provinces, topSources, dailyStats, qualityAcquisition, channelPerformance, productPerformance, financialHealth: { withdrawalRatio: parseFloat(KPI.withdrawalRatio(totalWithdrawals, totalDeposits)), depositFrequency: parseFloat(KPI.depositFrequency(totalDepositCount, totalUniqueDepositors)), bonusROI: KPI.bonusROI(ggr, totalBonus), customerValue: KPI.customerValue(ggr, activeUsers), loginPerUser: parseFloat(KPI.loginFrequency(totalLogins, activeUsers)), newPlayersRatio: activeUsers > 0 ? parseFloat((ftds / activeUsers * 100).toFixed(1)) : 0, returningRatio: activeUsers > 0 ? parseFloat((100 - (ftds / activeUsers * 100)).toFixed(1)) : 0 }, deepDive: [deepDiveEntry] }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS - MINIMAL STYLE
// ═══════════════════════════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (<div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}><p style={{ color: t.text, margin: '0 0 4px 0', fontWeight: '500', fontSize: '12px' }}>{label}</p>{payload.map((entry, i) => (<p key={i} style={{ color: entry.color, margin: '2px 0', fontSize: '11px' }}>{entry.name}: <strong>{typeof entry.value === 'number' && entry.value > 1000 ? formatNumber(entry.value) : entry.value}</strong></p>))}</div>)
  }
  return null
}

const Metric = ({ label, value, change, t }) => (
  <div style={{ padding: '16px 20px', background: t.card, borderRadius: '6px', border: `1px solid ${t.border}` }}>
    <p style={{ color: t.textSecondary, fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>{label}</p>
    <p style={{ color: t.text, fontSize: '24px', fontWeight: '600', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>{value}</p>
    {change && <p style={{ color: parseFloat(change) >= 0 ? t.success : t.danger, fontSize: '11px', margin: '6px 0 0 0' }}>{parseFloat(change) > 0 ? '+' : ''}{change}%</p>}
  </div>
)

const SectionTitle = ({ children, t }) => (<h3 style={{ color: t.text, fontSize: '14px', fontWeight: '600', margin: '0 0 16px 0', letterSpacing: '-0.01em' }}>{children}</h3>)

const Table = ({ columns, data, t }) => (
  <div style={{ overflowX: 'auto', borderRadius: '6px', border: `1px solid ${t.border}` }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
      <thead>
        <tr style={{ background: t.bgSecondary }}>
          {columns.map((col, i) => (<th key={i} style={{ padding: '10px 12px', textAlign: col.align || 'left', color: t.textSecondary, fontWeight: '500', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${t.border}` }}>{col.header}</th>))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? t.card : t.bgSecondary }}>
            {columns.map((col, ci) => { const val = col.accessor ? row[col.accessor] : ''; return (<td key={ci} style={{ padding: '10px 12px', textAlign: col.align || 'left', color: t.text, borderBottom: `1px solid ${t.border}` }}>{col.format ? col.format(val, row) : val}</td>) })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// PAGES
// ═══════════════════════════════════════════════════════════════════════════════

// UPLOAD PAGE
const UploadPage = ({ weeksData, onUploadComplete, onDeleteWeek, t }) => {
  const [weekNumber, setWeekNumber] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState(null)

  const processExcel = async (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (e) => { try { const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true }); resolve(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])) } catch (err) { reject(err) } }; reader.onerror = reject; reader.readAsArrayBuffer(file) })
  const handleFile = async (e, key) => { const file = e.target.files[0]; if (file) { try { const data = await processExcel(file); setUploadedFiles(prev => ({ ...prev, [key]: { name: file.name, data, rows: data.length } })) } catch { setStatus({ type: 'error', msg: `Error: ${file.name}` }) } } }
  const handleUpload = async () => {
    if (!weekNumber || !dateRange) { setStatus({ type: 'error', msg: 'Enter week number and date range' }); return }
    const missing = FILE_REQUIREMENTS.filter(f => !uploadedFiles[f.key])
    if (missing.length > 0) { setStatus({ type: 'error', msg: `Missing: ${missing.map(f => f.name).join(', ')}` }); return }
    setIsProcessing(true)
    try { const filesData = {}; Object.entries(uploadedFiles).forEach(([k, f]) => { filesData[k] = f.data }); const processed = processWeekData(filesData, parseInt(weekNumber), dateRange); await onUploadComplete(processed); setStatus({ type: 'success', msg: `Week ${weekNumber} uploaded` }); setWeekNumber(''); setDateRange(''); setUploadedFiles({}) } catch { setStatus({ type: 'error', msg: 'Processing error' }) }
    setIsProcessing(false)
  }
  const uploadedCount = Object.keys(uploadedFiles).length

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <SectionTitle t={t}>Upload Week Data</SectionTitle>
      <p style={{ color: t.textSecondary, fontSize: '13px', margin: '0 0 24px 0' }}>Upload 10 required Excel files</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '12px', marginBottom: '24px' }}>
        <input type="number" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} placeholder="Week #" style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '10px 12px', color: t.text, fontSize: '13px' }} />
        <input type="text" value={dateRange} onChange={(e) => setDateRange(e.target.value)} placeholder="Date range (e.g. 03 Feb - 09 Feb 2025)" style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '10px 12px', color: t.text, fontSize: '13px' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {FILE_REQUIREMENTS.map(file => {
          const uploaded = uploadedFiles[file.key]
          return (
            <div key={file.key} style={{ background: t.card, borderRadius: '6px', padding: '12px 14px', border: `1px solid ${uploaded ? t.success : t.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: uploaded ? t.success : t.text, fontWeight: '500', fontSize: '12px' }}>{file.name}</span>
                {uploaded && <span style={{ color: t.success, fontSize: '10px' }}>{uploaded.rows} rows</span>}
              </div>
              <p style={{ color: t.textMuted, fontSize: '10px', margin: '0 0 8px 0' }}>{file.boPath}</p>
              <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFile(e, file.key)} style={{ fontSize: '11px', color: t.textSecondary }} />
            </div>
          )
        })}
      </div>

      {status && (<div style={{ background: status.type === 'success' ? t.successDim : t.dangerDim, border: `1px solid ${status.type === 'success' ? t.success : t.danger}`, borderRadius: '4px', padding: '10px 14px', marginBottom: '16px' }}><p style={{ color: status.type === 'success' ? t.success : t.danger, margin: 0, fontSize: '12px' }}>{status.msg}</p></div>)}

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '48px' }}>
        <button onClick={handleUpload} disabled={isProcessing || uploadedCount < 10} style={{ background: uploadedCount >= 10 ? t.text : t.border, color: uploadedCount >= 10 ? t.bg : t.textMuted, border: 'none', borderRadius: '4px', padding: '10px 20px', fontSize: '13px', fontWeight: '500', cursor: uploadedCount >= 10 ? 'pointer' : 'not-allowed' }}>{isProcessing ? 'Processing...' : 'Upload Week'}</button>
        <span style={{ color: t.textSecondary, fontSize: '12px' }}>{uploadedCount}/10 files</span>
      </div>

      {Object.keys(weeksData).length > 0 && (
        <>
          <SectionTitle t={t}>Uploaded Weeks</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {Object.values(weeksData).sort((a, b) => b.weekNumber - a.weekNumber).map(week => (
              <div key={week.weekNumber} style={{ background: t.card, borderRadius: '6px', padding: '14px', border: `1px solid ${t.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: t.text, fontWeight: '600', fontSize: '14px' }}>Week {week.weekNumber}</span>
                  <button onClick={() => onDeleteWeek(week.weekNumber)} style={{ background: 'transparent', color: t.danger, border: 'none', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                </div>
                <p style={{ color: t.textSecondary, margin: '0 0 6px 0', fontSize: '11px' }}>{week.dateRange}</p>
                <p style={{ color: t.textMuted, margin: 0, fontSize: '11px' }}>REG: {formatNumber(week.registrations)} | GGR: {formatCurrency(week.ggr)}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// MONTHLY SUMMARY
const MonthlySummary = ({ weeksData, t }) => {
  const weeks = Object.values(weeksData).sort((a, b) => a.weekNumber - b.weekNumber)
  if (weeks.length === 0) return <div style={{ padding: '32px', textAlign: 'center' }}><p style={{ color: t.textSecondary }}>Upload at least one week</p></div>

  const totals = { registrations: weeks.reduce((s, w) => s + (w.registrations || 0), 0), ftds: weeks.reduce((s, w) => s + (w.ftds || 0), 0), deposits: weeks.reduce((s, w) => s + (w.totalDeposits || 0), 0), withdrawals: weeks.reduce((s, w) => s + (w.totalWithdrawals || 0), 0), turnover: weeks.reduce((s, w) => s + (w.turnover || 0), 0), ggr: weeks.reduce((s, w) => s + (w.ggr || 0), 0) }
  const avgActives = Math.round(weeks.reduce((s, w) => s + (w.activeUsers || 0), 0) / weeks.length)
  const trendData = weeks.map(w => ({ week: `W${w.weekNumber}`, registrations: w.registrations, ftds: w.ftds, ggr: Math.round(w.ggr / 1000) }))

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      <SectionTitle t={t}>Monthly Summary</SectionTitle>
      <p style={{ color: t.textSecondary, fontSize: '12px', margin: '-12px 0 24px 0' }}>Week {weeks[0].weekNumber} - {weeks[weeks.length-1].weekNumber} | {weeks.length} weeks</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '32px' }}>
        <Metric label="Total Registrations" value={formatNumber(totals.registrations)} t={t} />
        <Metric label="Total FTDs" value={formatNumber(totals.ftds)} t={t} />
        <Metric label="Net Deposit" value={formatCurrency(totals.deposits - totals.withdrawals)} t={t} />
        <Metric label="Total Turnover" value={formatCurrency(totals.turnover)} t={t} />
        <Metric label="Total GGR" value={formatCurrency(totals.ggr)} t={t} />
        <Metric label="Avg Actives" value={formatNumber(avgActives)} t={t} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: t.card, borderRadius: '6px', padding: '16px', border: `1px solid ${t.border}` }}>
          <p style={{ color: t.textSecondary, fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', margin: '0 0 12px 0' }}>REG & FTD Trend</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData}>
              <defs><linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={t.chart[0]} stopOpacity={0.15}/><stop offset="95%" stopColor={t.chart[0]} stopOpacity={0}/></linearGradient><linearGradient id="gFtd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={t.chart[1]} stopOpacity={0.15}/><stop offset="95%" stopColor={t.chart[1]} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} /><XAxis dataKey="week" tick={{ fill: t.textMuted, fontSize: 10 }} /><YAxis tick={{ fill: t.textMuted, fontSize: 10 }} /><Tooltip content={<CustomTooltip t={t} />} />
              <Area type="monotone" dataKey="registrations" name="REG" stroke={t.chart[0]} fill="url(#gReg)" strokeWidth={1.5} /><Area type="monotone" dataKey="ftds" name="FTDs" stroke={t.chart[1]} fill="url(#gFtd)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: t.card, borderRadius: '6px', padding: '16px', border: `1px solid ${t.border}` }}>
          <p style={{ color: t.textSecondary, fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', margin: '0 0 12px 0' }}>GGR Trend (€k)</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke={t.border} /><XAxis dataKey="week" tick={{ fill: t.textMuted, fontSize: 10 }} /><YAxis tick={{ fill: t.textMuted, fontSize: 10 }} /><Tooltip content={<CustomTooltip t={t} />} /><Bar dataKey="ggr" name="GGR" fill={t.chart[0]} radius={[3, 3, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Table columns={[{ header: 'Week', accessor: 'weekNumber', format: v => `Week ${v}` }, { header: 'Date Range', accessor: 'dateRange' }, { header: 'REG', accessor: 'registrations', align: 'right', format: formatNumber }, { header: 'FTDs', accessor: 'ftds', align: 'right', format: formatNumber }, { header: 'Conv %', accessor: 'conversionRate', align: 'center', format: v => `${v}%` }, { header: 'Turnover', accessor: 'turnover', align: 'right', format: formatCurrency }, { header: 'GGR', accessor: 'ggr', align: 'right', format: formatCurrency }, { header: 'GWM', accessor: 'gwm', align: 'center', format: v => `${v}%` }]} data={weeks} t={t} />
    </div>
  )
}

// WEEKLY REPORT
const WeeklyReport = ({ data, prevData, allWeeksData, t }) => {
  if (!data) return <div style={{ padding: '32px', textAlign: 'center' }}><p style={{ color: t.textSecondary }}>Select a week or upload data</p></div>

  const allWeeks = Object.keys(allWeeksData).map(Number).sort((a, b) => b - a), latestWeek = Math.max(...allWeeks), deepDiveWeeks = allWeeks.filter(w => w > latestWeek - 5).sort((a, b) => b - a)
  const allDeepDive = []; Object.values(allWeeksData).forEach(w => { if (w.deepDive && deepDiveWeeks.includes(w.weekNumber)) allDeepDive.push(...w.deepDive) }); const filteredDeepDive = allDeepDive.sort((a, b) => b.week - a.week)
  const regChange = prevData ? calcChange(data.registrations, prevData.registrations) : null, ftdChange = prevData ? calcChange(data.ftds, prevData.ftds) : null, turnoverChange = prevData ? calcChange(data.turnover, prevData.turnover) : null, ggrChange = prevData ? calcChange(data.ggr, prevData.ggr) : null

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Summary */}
      <section style={{ marginBottom: '40px' }}>
        <SectionTitle t={t}>Trading Summary</SectionTitle>
        <p style={{ color: t.textSecondary, fontSize: '12px', margin: '-12px 0 16px 0' }}>Week {data.weekNumber} | {data.dateRange}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <Metric label="Registrations" value={formatNumber(data.registrations)} change={regChange} t={t} />
          <Metric label="FTDs" value={formatNumber(data.ftds)} change={ftdChange} t={t} />
          <Metric label="Net Deposit" value={formatCurrency(data.netDeposit)} t={t} />
          <Metric label="Turnover" value={formatCurrency(data.turnover)} change={turnoverChange} t={t} />
          <Metric label="GGR" value={formatCurrency(data.ggr)} change={ggrChange} t={t} />
          <Metric label="GWM" value={`${data.gwm}%`} t={t} />
        </div>
        <div style={{ background: t.card, borderRadius: '6px', padding: '16px 20px', border: `1px solid ${t.border}` }}>
          <p style={{ color: t.textSecondary, fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Weekly Actives</p>
          <p style={{ color: t.text, fontSize: '32px', fontWeight: '600', margin: 0 }}>{formatNumber(data.activeUsers)}</p>
        </div>
      </section>

      {/* Acquisition */}
      <section style={{ marginBottom: '40px' }}>
        <SectionTitle t={t}>Acquisition</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div style={{ background: t.card, borderRadius: '6px', padding: '16px', border: `1px solid ${t.border}` }}>
            <p style={{ color: t.textSecondary, fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', margin: '0 0 12px 0' }}>Daily Trend</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={data.dailyStats || []}>
                <defs><linearGradient id="dReg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={t.chart[0]} stopOpacity={0.15}/><stop offset="95%" stopColor={t.chart[0]} stopOpacity={0}/></linearGradient><linearGradient id="dFtd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={t.chart[1]} stopOpacity={0.15}/><stop offset="95%" stopColor={t.chart[1]} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} /><XAxis dataKey="date" tick={{ fill: t.textMuted, fontSize: 10 }} /><YAxis tick={{ fill: t.textMuted, fontSize: 10 }} /><Tooltip content={<CustomTooltip t={t} />} />
                <Area type="monotone" dataKey="registrations" name="REG" stroke={t.chart[0]} fill="url(#dReg)" strokeWidth={1.5} /><Area type="monotone" dataKey="ftds" name="FTDs" stroke={t.chart[1]} fill="url(#dFtd)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: t.card, borderRadius: '6px', padding: '16px', border: `1px solid ${t.border}` }}>
            <p style={{ color: t.textSecondary, fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', margin: '0 0 12px 0' }}>Top Sources</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.topSources || []} layout="vertical"><XAxis type="number" tick={{ fill: t.textMuted, fontSize: 9 }} /><YAxis dataKey="name" type="category" width={90} tick={{ fill: t.textMuted, fontSize: 9 }} /><Tooltip content={<CustomTooltip t={t} />} /><Bar dataKey="count" fill={t.chart[1]} radius={[0, 3, 3, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ background: t.card, borderRadius: '6px', padding: '16px', border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <p style={{ color: t.textSecondary, fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Gender</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
              <div><p style={{ color: t.text, fontSize: '22px', fontWeight: '600', margin: 0 }}>{data.demographics?.male || 0}%</p><p style={{ color: t.textMuted, fontSize: '10px', margin: 0 }}>Male</p></div>
              <div><p style={{ color: t.text, fontSize: '22px', fontWeight: '600', margin: 0 }}>{data.demographics?.female || 0}%</p><p style={{ color: t.textMuted, fontSize: '10px', margin: 0 }}>Female</p></div>
            </div>
          </div>
          <div style={{ background: t.card, borderRadius: '6px', padding: '16px', border: `1px solid ${t.border}` }}>
            <p style={{ color: t.textSecondary, fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Age</p>
            <ResponsiveContainer width="100%" height={60}><BarChart data={data.ageGroups || []}><XAxis dataKey="range" tick={{ fill: t.textMuted, fontSize: 8 }} /><YAxis hide /><Bar dataKey="percent" fill={t.chart[0]} radius={[2, 2, 0, 0]} /></BarChart></ResponsiveContainer>
          </div>
          <div style={{ background: t.card, borderRadius: '6px', padding: '16px', border: `1px solid ${t.border}` }}>
            <p style={{ color: t.textSecondary, fontSize: '10px', fontWeight: '500', textTransform: 'uppercase', margin: '0 0 10px 0' }}>Top Provinces</p>
            <ResponsiveContainer width="100%" height={60}><BarChart data={data.provinces || []} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={28} tick={{ fill: t.textMuted, fontSize: 9 }} /><Bar dataKey="count" fill={t.chart[1]} radius={[0, 2, 2, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Quality Acquisition */}
      <section style={{ marginBottom: '40px' }}>
        <SectionTitle t={t}>Quality Acquisition</SectionTitle>
        <Table columns={[{ header: 'Channel', accessor: 'channel' }, { header: 'REG', accessor: 'reg', align: 'right', format: formatNumber }, { header: 'FTDs', accessor: 'ftds', align: 'right', format: formatNumber }, { header: 'Conv %', accessor: 'conv', align: 'center', format: v => `${v}%` }, { header: 'Activated', accessor: 'activated', align: 'center', format: v => `${v}%` }, { header: 'Avg Age', accessor: 'avgAge', align: 'center', format: v => `${v} yrs` }]} data={data.qualityAcquisition || []} t={t} />
      </section>

      {/* Channel Performance */}
      <section style={{ marginBottom: '40px' }}>
        <SectionTitle t={t}>Channel Performance</SectionTitle>
        <Table columns={[{ header: 'Channel', accessor: 'channel' }, { header: 'Turnover', accessor: 'turnover', align: 'right', format: formatCurrency }, { header: 'GGR', accessor: 'ggr', align: 'right', format: formatCurrency }, { header: 'GWM', accessor: 'gwm', align: 'center', format: v => `${v}%` }, { header: 'Actives', accessor: 'actives', align: 'right', format: formatNumber }, { header: 'Rev Share', accessor: 'revShare', align: 'center', format: v => `${v}%` }]} data={data.channelPerformance || []} t={t} />
      </section>

      {/* Product Performance */}
      <section style={{ marginBottom: '40px' }}>
        <SectionTitle t={t}>Product Performance</SectionTitle>
        <Table columns={[{ header: 'Product', accessor: 'product' }, { header: 'Turnover', accessor: 'turnover', align: 'right', format: formatCurrency }, { header: 'GGR', accessor: 'ggr', align: 'right', format: formatCurrency }, { header: 'Payout', accessor: 'payout', align: 'center', format: v => v ? `${v}%` : '-' }, { header: 'Actives', accessor: 'actives', align: 'right', format: formatNumber }, { header: 'ARPU', accessor: 'arpu', align: 'right', format: v => `€${v}` }]} data={data.productPerformance || []} t={t} />
      </section>

      {/* Financial Health */}
      <section style={{ marginBottom: '40px' }}>
        <SectionTitle t={t}>Financial Health</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <Metric label="Withdrawal Ratio" value={`${data.financialHealth?.withdrawalRatio || 0}%`} t={t} />
          <Metric label="Deposit Frequency" value={`${data.financialHealth?.depositFrequency || 0}x`} t={t} />
          <Metric label="Bonus ROI" value={`${data.financialHealth?.bonusROI || 0}x`} t={t} />
          <Metric label="Customer Value" value={`€${data.financialHealth?.customerValue || 0}`} t={t} />
          <Metric label="Login / User" value={data.financialHealth?.loginPerUser || 0} t={t} />
        </div>
      </section>

      {/* Deep Dive */}
      {filteredDeepDive.length > 0 && (
        <section>
          <SectionTitle t={t}>Deep Dive - Last {deepDiveWeeks.length} Weeks</SectionTitle>
          <div style={{ background: t.card, borderRadius: '6px', border: `1px solid ${t.border}`, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead><tr><th style={{ padding: '10px', textAlign: 'left', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}></th><th style={{ padding: '10px', textAlign: 'right', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>PVR</th><th style={{ padding: '10px', textAlign: 'right', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>Vivabet+Acad</th><th style={{ padding: '10px', textAlign: 'right', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>Organic</th><th style={{ padding: '10px', textAlign: 'right', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>Direct</th><th style={{ padding: '10px', textAlign: 'right', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>Affiliates</th><th style={{ padding: '10px', textAlign: 'right', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>TOTAL</th></tr></thead>
              <tbody>
                {filteredDeepDive.map((week) => (
                  <React.Fragment key={week.week}>
                    <tr><td colSpan={7} style={{ padding: '8px 10px', color: t.text, fontWeight: '500', background: t.accentDim, borderBottom: `1px solid ${t.border}` }}>Week {week.week} {week.week === latestWeek && <span style={{ color: t.success, fontSize: '9px', marginLeft: '6px' }}>LATEST</span>}</td></tr>
                    {['Reg', 'FTDs', 'GGR (k)'].map((metric) => { const key = metric === 'Reg' ? 'reg' : metric === 'FTDs' ? 'ftds' : 'ggr'; return (<tr key={`${week.week}-${metric}`}><td style={{ padding: '6px 10px', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>{metric}</td><td style={{ padding: '6px 10px', textAlign: 'right', color: t.text, borderBottom: `1px solid ${t.border}` }}>{week.pvr?.[key] || 0}</td><td style={{ padding: '6px 10px', textAlign: 'right', color: t.text, borderBottom: `1px solid ${t.border}` }}>{week.vivabet?.[key] || 0}</td><td style={{ padding: '6px 10px', textAlign: 'right', color: t.text, borderBottom: `1px solid ${t.border}` }}>{week.organic?.[key] || 0}</td><td style={{ padding: '6px 10px', textAlign: 'right', color: t.text, borderBottom: `1px solid ${t.border}` }}>{week.direct?.[key] || 0}</td><td style={{ padding: '6px 10px', textAlign: 'right', color: t.text, borderBottom: `1px solid ${t.border}` }}>{week.affiliates?.[key] || 0}</td><td style={{ padding: '6px 10px', textAlign: 'right', color: t.text, fontWeight: '500', borderBottom: `1px solid ${t.border}` }}>{week.total?.[key] || 0}</td></tr>) })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [theme, setTheme] = useState('dark')
  const [activeTab, setActiveTab] = useState('weekly')
  const [weeksData, setWeeksData] = useState({})
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState({ connected: false })

  const t = THEMES[theme]

  useEffect(() => {
    const load = async () => {
      try { const conn = await checkConnection(); setDbStatus(conn); const result = await loadAllWeeksData(); if (result.data && Object.keys(result.data).length > 0) { setWeeksData(result.data); const weeks = Object.keys(result.data).map(Number); if (weeks.length > 0) setSelectedWeek(Math.max(...weeks)) } } catch (e) { console.error(e) }
      setIsLoading(false)
    }
    load()
  }, [])

  const handleUpload = async (data) => { const updated = { ...weeksData, [data.weekNumber]: data }; setWeeksData(updated); setSelectedWeek(data.weekNumber); await saveWeekData(data); setActiveTab('weekly') }
  const handleDelete = async (num) => { if (confirm(`Delete Week ${num}?`)) { const { [num]: _, ...rest } = weeksData; setWeeksData(rest); await deleteWeekData(num); const weeks = Object.keys(rest).map(Number); setSelectedWeek(weeks.length > 0 ? Math.max(...weeks) : null) } }

  const allWeeks = Object.keys(weeksData).map(Number).sort((a, b) => b - a)
  const currentData = selectedWeek ? weeksData[selectedWeek] : null
  const prevData = selectedWeek && weeksData[selectedWeek - 1] ? weeksData[selectedWeek - 1] : null

  if (isLoading) return <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: t.textSecondary, fontSize: '13px' }}>Loading...</p></div>

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: t.text }}>
      {/* Header */}
      <header style={{ background: t.bgSecondary, padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/favicon.png" alt="DAZN Bet" style={{ height: '28px' }} />
            <div style={{ borderLeft: `1px solid ${t.border}`, paddingLeft: '12px' }}>
              <p style={{ color: t.text, fontSize: '13px', fontWeight: '500', margin: 0, lineHeight: 1.2 }}>Weekly Trading Report</p>
              <p style={{ color: t.textMuted, fontSize: '10px', margin: 0 }}>Italy</p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: '2px' }}>
            {[{ id: 'weekly', label: 'Weekly' }, { id: 'monthly', label: 'Monthly' }, { id: 'upload', label: 'Upload' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? t.accentDim : 'transparent', color: activeTab === tab.id ? t.text : t.textSecondary, border: 'none', borderRadius: '4px', padding: '6px 14px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s' }}>{tab.label}</button>
            ))}
          </nav>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeTab === 'weekly' && allWeeks.length > 0 && (
              <>
                <select value={selectedWeek || ''} onChange={(e) => setSelectedWeek(Number(e.target.value))} style={{ background: t.card, color: t.text, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>
                  {allWeeks.map(w => <option key={w} value={w}>Week {w}</option>)}
                </select>
                {currentData && <span style={{ color: t.textMuted, fontSize: '11px' }}>{currentData.dateRange}</span>}
              </>
            )}
            
            {/* Theme Toggle */}
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ background: t.card, color: t.textSecondary, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '14px' }}>{theme === 'dark' ? '○' : '●'}</span>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>

            {/* Status */}
            <span style={{ color: dbStatus.connected ? t.success : t.textMuted, fontSize: '10px' }}>{dbStatus.connected ? 'DB' : 'Local'}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main>
        {activeTab === 'weekly' && <WeeklyReport data={currentData} prevData={prevData} allWeeksData={weeksData} t={t} />}
        {activeTab === 'monthly' && <MonthlySummary weeksData={weeksData} t={t} />}
        {activeTab === 'upload' && <UploadPage weeksData={weeksData} onUploadComplete={handleUpload} onDeleteWeek={handleDelete} t={t} />}
      </main>
    </div>
  )
}
