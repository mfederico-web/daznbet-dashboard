'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { saveWeekData, loadAllWeeksData, deleteWeekData, checkConnection } from '../lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════════
// DAZN BRAND COLORS
// ═══════════════════════════════════════════════════════════════════════════════
const COLORS = {
  yellow: '#E3FF00',
  black: '#000000',
  darkBg: '#0D0D0D',
  cardBg: '#1A1A1A',
  cardBorder: '#2A2A2A',
  white: '#FFFFFF',
  green: '#00C853',
  red: '#FF1744',
  lightGray: '#9E9E9E',
  mediumGray: '#424242',
  blue: '#2196F3',
  orange: '#FF9800'
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE REQUIREMENTS (10 files from LEGENDA.txt)
// ═══════════════════════════════════════════════════════════════════════════════
const FILE_REQUIREMENTS = [
  { key: 'anagrafica', name: 'Anagrafica.xlsx', required: true, desc: 'Dettaglio utenti registrati', boPath: 'Modifica Conto Telematico → Ricerca Avanzata → Ricerca anagrafica' },
  { key: 'anagrafica2', name: 'Anagrafica2.xlsx', required: true, desc: 'KPI giornalieri (depositi, login, bonus)', boPath: 'Statistica Conti' },
  { key: 'total', name: 'Anagrafica_TOTAL.xlsx', required: true, desc: 'Totali generali', boPath: 'Stats Multilivello → Seleziona tutti i prodotti → Ricerca GRID senza selezioni' },
  { key: 'categoria', name: 'Anagrafica_CATEGORIA.xlsx', required: true, desc: 'Performance per categoria prodotto', boPath: 'Stats Multilivello → Seleziona tutti i prodotti → Ricerca GRID Categoria' },
  { key: 'daznbet', name: 'Anagrafica_DAZNBET.xlsx', required: true, desc: 'Dati DAZNBET Skin', boPath: 'Stats Multilivello → Seleziona DAZNBET SKIN, tutti i prodotti → Ricerca GRID senza selezioni' },
  { key: 'organic', name: 'Anagrafica_ORGANIC.xlsx', required: true, desc: 'DAZNBET Organic per categoria', boPath: 'Stats Multilivello → DAZNBET SKIN, Punto vendita: www.daznbet.it, tutti i prodotti → Ricerca GRID Categoria' },
  { key: 'organicTotal', name: 'Anagrafica_ORGANIC_TOTAL.xlsx', required: true, desc: 'DAZNBET Organic totali', boPath: 'Stats Multilivello → DAZNBET SKIN, Punto vendita: www.daznbet.it, tutti i prodotti → Ricerca GRID senza selezioni' },
  { key: 'skin', name: 'Anagrafica_SKIN.xlsx', required: true, desc: 'Performance per Skin e categoria', boPath: 'Stats Multilivello → Seleziona tutti i prodotti → Ricerca GRID SKIN e Categoria' },
  { key: 'skinTotal', name: 'Anagrafica_SKIN_TOTAL.xlsx', required: true, desc: 'Totali per Skin', boPath: 'Stats Multilivello → Seleziona tutti i prodotti → Ricerca GRID SKIN' },
  { key: 'academyTotal', name: 'Anagrafica_ACCADEMY_TOTAL.xlsx', required: true, desc: 'Dati Tipster Academy', boPath: 'Stats Multilivello → Seleziona VIVABET SKIN, Promoter: Tipster Academy → Ricerca GRID senza selezioni' }
]

// ═══════════════════════════════════════════════════════════════════════════════
// KPI FORMULAS
// ═══════════════════════════════════════════════════════════════════════════════
const KPI = {
  trading: {
    conversionRate: (ftds, reg) => reg > 0 ? (ftds / reg * 100).toFixed(1) : "0.0",
    netDeposit: (dep, wit) => dep - wit,
    gwm: (ggr, turnover) => turnover > 0 ? (ggr / turnover * 100).toFixed(1) : "0.0",
    avgFirstDeposit: (importo, ftds) => ftds > 0 ? Math.round(importo / ftds) : 0
  },
  financial: {
    withdrawalRatio: (wit, dep) => dep > 0 ? (wit / dep * 100).toFixed(1) : "0.0",
    depositFrequency: (nDep, depositanti) => depositanti > 0 ? (nDep / depositanti).toFixed(1) : "0.0",
    bonusROI: (ggr, bonus) => bonus > 0 ? Math.round(ggr / bonus) : 0,
    customerValue: (ggr, actives) => actives > 0 ? Math.round(ggr / actives) : 0,
    loginFrequency: (logins, actives) => actives > 0 ? (logins / actives).toFixed(1) : "0.0",
    avgSessionValue: (turnover, logins) => logins > 0 ? (turnover / logins).toFixed(2) : "0.00"
  },
  product: {
    payout: (vinto, giocato) => giocato > 0 ? (vinto / giocato * 100).toFixed(1) : "0.0",
    arpu: (ggr, actives) => actives > 0 ? (ggr / actives).toFixed(2) : "0.00",
    revenueShare: (ggrProd, ggrTot) => ggrTot > 0 ? (ggrProd / ggrTot * 100).toFixed(1) : "0.0"
  },
  quality: {
    activationRate: (attivati, reg) => reg > 0 ? Math.round(attivati / reg * 100).toString() : "0",
    avgAge: (birthdates) => {
      const now = new Date()
      const valid = birthdates.filter(d => d)
      if (valid.length === 0) return 0
      const ages = valid.map(d => (now - new Date(d)) / (365.25 * 24 * 60 * 60 * 1000))
      return Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════════
const CHANNELS = {
  PVR: "PVR",
  VIVABET_GLAD: "VIVABET/GLAD",
  TIPSTER_ACADEMY: "Tipster Academy",
  DAZNBET_ORGANIC: "DAZNBET Organic",
  DAZN_DIRECT: "DAZN Direct",
  AFFILIATES: "AFFILIATES"
}

const classifyChannel = (row) => {
  const skin = String(row["Skin"] || "").toUpperCase().trim()
  const promoter = String(row["Promoter"] || "").toLowerCase().trim()
  const puntoVendita = String(row["Punto vendita"] || "").toUpperCase().trim()
  
  if (!skin.includes("DAZNBET") && !skin.includes("VIVABET")) {
    const isDAZNPromoter = ["dazn", "funpoints", "igaming.com ltd", "one click marketing ltd"].some(p => promoter.includes(p))
    if (!isDAZNPromoter) return CHANNELS.PVR
  }
  
  if (skin.includes("VIVABET")) {
    const isNSG = ["nsg social web srl"].some(p => promoter.includes(p))
    return isNSG ? CHANNELS.VIVABET_GLAD : CHANNELS.TIPSTER_ACADEMY
  }
  
  if (skin.includes("DAZNBET")) {
    const isOrganic = ["WWW.DAZNBET.IT", "DAZNBET"].some(pv => puntoVendita.includes(pv))
    if (isOrganic) return CHANNELS.DAZNBET_ORGANIC
    
    const isDAZNDirect = ["dazn", "funpoints"].some(p => promoter.includes(p))
    const isSuperpronostico = puntoVendita.includes("SUPERPRONOSTICO")
    if (isDAZNDirect || isSuperpronostico) return CHANNELS.DAZN_DIRECT
    
    return CHANNELS.AFFILIATES
  }
  
  return "OTHER"
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
const parseNum = (val) => {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    return parseFloat(val.replace(/[.]/g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0
  }
  return 0
}

const formatCurrency = (val, compact = true) => {
  if (!val || isNaN(val)) return '€0'
  if (compact) {
    if (Math.abs(val) >= 1000000) return `€${(val / 1000000).toFixed(2)}M`
    if (Math.abs(val) >= 1000) return `€${(val / 1000).toFixed(0)}k`
  }
  return `€${val.toLocaleString('it-IT')}`
}

const formatNumber = (val) => (!val || isNaN(val)) ? '0' : val.toLocaleString('it-IT')

const calcChange = (current, previous) => {
  if (!previous || previous === 0) return null
  return ((current - previous) / previous * 100).toFixed(1)
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: '8px', padding: '12px 16px' }}>
        <p style={{ color: COLORS.white, margin: '0 0 8px 0', fontWeight: '600', fontSize: '14px' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: '4px 0', fontSize: '13px' }}>
            {entry.name}: <strong>{typeof entry.value === 'number' && entry.value > 1000 ? formatNumber(entry.value) : entry.value}</strong>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════════
const processWeekData = (files, weekNumber, dateRange) => {
  const ana = files.anagrafica || []
  const ana2 = files.anagrafica2 || []
  const total = files.total || []
  const cat = files.categoria || []
  const daznbet = files.daznbet || []
  const organic = files.organic || []
  const organicTotal = files.organicTotal || []
  const skin = files.skin || []
  const skinTotal = files.skinTotal || []
  const academyTotal = files.academyTotal || []

  // Basic metrics from Anagrafica
  const registrations = ana.length

  // Channel classification
  const channelGroups = {}
  ana.forEach(row => {
    const channel = classifyChannel(row)
    if (!channelGroups[channel]) {
      channelGroups[channel] = { rows: [], birthdates: [] }
    }
    channelGroups[channel].rows.push(row)
    if (row["Nato il"]) channelGroups[channel].birthdates.push(row["Nato il"])
  })

  // Quality Acquisition per channel
  const qualityAcquisition = Object.entries(channelGroups).map(([channel, data]) => {
    const reg = data.rows.length
    const ftds = data.rows.filter(r => r["Primo deposito"] || parseNum(r["Depositi"]) > 0).length
    const activated = data.rows.filter(r => String(r["Stato conto"] || "").includes("ATTIVATO")).length
    return {
      channel,
      reg,
      ftds,
      conv: parseFloat(KPI.trading.conversionRate(ftds, reg)),
      activated: parseInt(KPI.quality.activationRate(activated, reg)),
      avgAge: KPI.quality.avgAge(data.birthdates)
    }
  }).filter(c => c.channel !== "OTHER").sort((a, b) => b.reg - a.reg)

  // Daily stats from Anagrafica2
  const dailyStats = ana2.map(r => {
    const dateVal = r["Data"]
    let dateStr = ''
    if (dateVal) {
      const d = new Date(dateVal)
      dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    }
    return {
      date: dateStr,
      registrations: parseNum(r["Registrati AAMS"]) || 0,
      ftds: parseNum(r["Primo deposito"]) || 0,
      deposits: parseNum(r["Importo depositi"]) || 0,
      withdrawals: parseNum(r["Importo prelievi processati"]) || 0,
      logins: parseNum(r["Login"]) || 0,
      bonus: parseNum(r["Importo bonus"]) || 0,
      depositCount: parseNum(r["Depositi"]) || 0,
      uniqueDepositors: parseNum(r["Depositanti unici"]) || 0
    }
  })

  // Aggregated metrics
  const ftds = dailyStats.reduce((sum, d) => sum + d.ftds, 0)
  const totalDeposits = dailyStats.reduce((sum, d) => sum + d.deposits, 0)
  const totalWithdrawals = dailyStats.reduce((sum, d) => sum + d.withdrawals, 0)
  const totalLogins = dailyStats.reduce((sum, d) => sum + d.logins, 0)
  const totalBonus = dailyStats.reduce((sum, d) => sum + d.bonus, 0)
  const totalDepositCount = dailyStats.reduce((sum, d) => sum + d.depositCount, 0)
  const totalUniqueDepositors = dailyStats.reduce((sum, d) => sum + d.uniqueDepositors, 0)
  const importoPrimoDeposito = ana2.reduce((sum, r) => sum + parseNum(r["Importo primo deposito"]), 0)

  // Product performance from Categoria
  const turnover = cat.reduce((sum, r) => sum + parseNum(r["Giocato"]), 0)
  const ggr = cat.reduce((sum, r) => sum + parseNum(r["ggr"]), 0)
  const activeUsers = cat.reduce((max, r) => Math.max(max, parseNum(r["conti attivi"])), 0)

  const productPerformance = cat.map(r => {
    const prodTurnover = parseNum(r["Giocato"])
    const prodGgr = parseNum(r["ggr"])
    const prodActives = parseNum(r["conti attivi"])
    const prodVinto = parseNum(r["vinto"])
    return {
      product: r["Categoria"] || '',
      turnover: prodTurnover,
      ggr: prodGgr,
      payout: prodTurnover > 0 ? parseFloat(KPI.product.payout(prodVinto, prodTurnover)) : null,
      actives: prodActives,
      arpu: parseFloat(KPI.product.arpu(prodGgr, prodActives))
    }
  }).filter(p => p.product)

  // Channel performance from Skin files
  const channelPerformance = []
  let totalGgrForShare = 0

  // PVR
  let pvrTurnover = 0, pvrGgr = 0, pvrActives = 0
  skinTotal.forEach(r => {
    const skinName = String(r["Skin"] || "").toUpperCase()
    if (skinName && !skinName.includes("VIVABET") && !skinName.includes("DAZNBET")) {
      pvrTurnover += parseNum(r["Giocato"])
      pvrGgr += parseNum(r["ggr"]) || parseNum(r["rake"])
      pvrActives += parseNum(r["conti attivi"])
    }
  })
  if (pvrTurnover > 0 || pvrActives > 0) {
    channelPerformance.push({ channel: 'PVR', turnover: pvrTurnover, ggr: pvrGgr, gwm: parseFloat(KPI.trading.gwm(pvrGgr, pvrTurnover)), actives: pvrActives, revShare: 0 })
    totalGgrForShare += pvrGgr
  }

  // VIVABET/GLAD and Academy
  const vivabetRow = skinTotal.find(r => String(r["Skin"] || "").toUpperCase().includes("VIVABET"))
  const academyRow = academyTotal[0]
  
  if (vivabetRow) {
    const vivTurnover = parseNum(vivabetRow["Giocato"])
    const vivGgr = parseNum(vivabetRow["ggr"]) || parseNum(vivabetRow["rake"])
    const vivActives = parseNum(vivabetRow["conti attivi"])
    
    const acadTurnover = academyRow ? parseNum(academyRow["Giocato"]) : 0
    const acadGgr = academyRow ? (parseNum(academyRow["ggr"]) || parseNum(academyRow["rake"])) : 0
    const acadActives = academyRow ? parseNum(academyRow["conti attivi"]) : 0

    const gladTurnover = vivTurnover - acadTurnover
    const gladGgr = vivGgr - acadGgr
    const gladActives = vivActives - acadActives
    
    channelPerformance.push({ channel: 'VIVABET/GLAD', turnover: gladTurnover, ggr: gladGgr, gwm: parseFloat(KPI.trading.gwm(gladGgr, gladTurnover)), actives: gladActives, revShare: 0 })
    totalGgrForShare += gladGgr

    if (acadTurnover > 0 || acadActives > 0) {
      channelPerformance.push({ channel: 'Tipster Academy', turnover: acadTurnover, ggr: acadGgr, gwm: parseFloat(KPI.trading.gwm(acadGgr, acadTurnover)), actives: acadActives, revShare: 0 })
      totalGgrForShare += acadGgr
    }
  }

  // DAZNBET Organic
  const organicRow = organicTotal[0]
  if (organicRow) {
    const orgTurnover = parseNum(organicRow["Giocato"])
    const orgGgr = parseNum(organicRow["ggr"]) || parseNum(organicRow["rake"])
    const orgActives = parseNum(organicRow["conti attivi"])
    channelPerformance.push({ channel: 'DAZNBET Organic', turnover: orgTurnover, ggr: orgGgr, gwm: parseFloat(KPI.trading.gwm(orgGgr, orgTurnover)), actives: orgActives, revShare: 0 })
    totalGgrForShare += orgGgr
  }

  // Calculate revenue share
  channelPerformance.forEach(c => { c.revShare = parseFloat(KPI.product.revenueShare(c.ggr, totalGgrForShare)) })

  // Demographics
  const genderCount = { M: 0, F: 0 }
  ana.forEach(r => {
    const gender = String(r["Sesso"] || "").toUpperCase()
    if (gender === "M" || gender === "F") genderCount[gender]++
  })
  const totalGender = genderCount.M + genderCount.F

  // Age groups
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
  const totalAges = Object.values(ageGroups).reduce((a, b) => a + b, 0)

  // Top provinces
  const provinceCount = {}
  ana.forEach(r => {
    const prov = r["Provincia di residenza"]
    if (prov) provinceCount[prov] = (provinceCount[prov] || 0) + 1
  })
  const provinces = Object.entries(provinceCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }))

  // Top sources
  const sourceCount = {}
  ana.forEach(r => {
    let source = r["Cod Punto"] || r["Punto vendita"] || "Unknown"
    if (source.toLowerCase().includes("daznbet")) source = "DAZNBET (Organic)"
    sourceCount[source] = (sourceCount[source] || 0) + 1
  })
  const topSources = Object.entries(sourceCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name: name.substring(0, 20), count }))

  // Deep dive data
  const deepDiveEntry = {
    week: weekNumber,
    pvr: { reg: qualityAcquisition.find(q => q.channel === 'PVR')?.reg || 0, ftds: qualityAcquisition.find(q => q.channel === 'PVR')?.ftds || 0, ggr: Math.round((channelPerformance.find(c => c.channel === 'PVR')?.ggr || 0) / 1000) },
    vivabet: { reg: (qualityAcquisition.find(q => q.channel === 'VIVABET/GLAD')?.reg || 0) + (qualityAcquisition.find(q => q.channel === 'Tipster Academy')?.reg || 0), ftds: (qualityAcquisition.find(q => q.channel === 'VIVABET/GLAD')?.ftds || 0) + (qualityAcquisition.find(q => q.channel === 'Tipster Academy')?.ftds || 0), ggr: Math.round(((channelPerformance.find(c => c.channel === 'VIVABET/GLAD')?.ggr || 0) + (channelPerformance.find(c => c.channel === 'Tipster Academy')?.ggr || 0)) / 1000) },
    organic: { reg: qualityAcquisition.find(q => q.channel === 'DAZNBET Organic')?.reg || 0, ftds: qualityAcquisition.find(q => q.channel === 'DAZNBET Organic')?.ftds || 0, ggr: Math.round((channelPerformance.find(c => c.channel === 'DAZNBET Organic')?.ggr || 0) / 1000) },
    direct: { reg: qualityAcquisition.find(q => q.channel === 'DAZN Direct')?.reg || 0, ftds: qualityAcquisition.find(q => q.channel === 'DAZN Direct')?.ftds || 0, ggr: 0 },
    affiliates: { reg: qualityAcquisition.find(q => q.channel === 'AFFILIATES')?.reg || 0, ftds: qualityAcquisition.find(q => q.channel === 'AFFILIATES')?.ftds || 0, ggr: 0 },
    total: { reg: registrations, ftds, ggr: Math.round(ggr / 1000) }
  }

  return {
    weekNumber,
    dateRange,
    registrations,
    ftds,
    conversionRate: parseFloat(KPI.trading.conversionRate(ftds, registrations)),
    avgFirstDeposit: KPI.trading.avgFirstDeposit(importoPrimoDeposito, ftds),
    totalDeposits,
    totalWithdrawals,
    netDeposit: totalDeposits - totalWithdrawals,
    turnover,
    ggr,
    gwm: parseFloat(KPI.trading.gwm(ggr, turnover)),
    activeUsers,
    totalLogins,
    totalBonus,
    demographics: {
      male: totalGender > 0 ? Math.round(genderCount.M / totalGender * 100) : 0,
      female: totalGender > 0 ? Math.round(genderCount.F / totalGender * 100) : 0
    },
    ageGroups: Object.entries(ageGroups).map(([range, count]) => ({ range, percent: totalAges > 0 ? Math.round(count / totalAges * 100) : 0 })),
    provinces,
    topSources,
    dailyStats,
    qualityAcquisition,
    channelPerformance,
    productPerformance,
    financialHealth: {
      withdrawalRatio: parseFloat(KPI.financial.withdrawalRatio(totalWithdrawals, totalDeposits)),
      depositFrequency: parseFloat(KPI.financial.depositFrequency(totalDepositCount, totalUniqueDepositors)),
      bonusROI: KPI.financial.bonusROI(ggr, totalBonus),
      customerValue: KPI.financial.customerValue(ggr, activeUsers),
      loginPerUser: parseFloat(KPI.financial.loginFrequency(totalLogins, activeUsers)),
      avgSessionValue: parseFloat(KPI.financial.avgSessionValue(turnover, totalLogins)),
      newPlayersRatio: activeUsers > 0 ? parseFloat((ftds / activeUsers * 100).toFixed(1)) : 0,
      returningRatio: activeUsers > 0 ? parseFloat((100 - (ftds / activeUsers * 100)).toFixed(1)) : 0
    },
    deepDive: [deepDiveEntry]
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const KPICard = ({ label, value, subtext, trend, trendValue, small = false }) => {
  const trendColor = trend === 'positive' ? COLORS.green : trend === 'negative' ? COLORS.red : COLORS.lightGray
  return (
    <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: small ? '16px' : '20px', borderLeft: `4px solid ${COLORS.yellow}`, minHeight: small ? '80px' : '120px' }}>
      <p style={{ color: COLORS.lightGray, fontSize: small ? '11px' : '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0' }}>{label}</p>
      <p style={{ color: COLORS.white, fontSize: small ? '24px' : '32px', fontWeight: '900', margin: '0 0 8px 0' }}>{value}</p>
      {subtext && <p style={{ color: trendColor, fontSize: small ? '12px' : '14px', margin: 0, fontWeight: '500' }}>{trendValue && <span style={{ marginRight: '4px' }}>{trendValue}</span>}{subtext}</p>}
    </div>
  )
}

const SectionHeader = ({ title, subtitle }) => (
  <div style={{ background: COLORS.black, padding: '20px 24px', borderRadius: '12px', marginBottom: '20px', borderLeft: `4px solid ${COLORS.yellow}` }}>
    <h2 style={{ color: COLORS.yellow, fontSize: '28px', fontWeight: '900', margin: 0 }}>{title}</h2>
    {subtitle && <p style={{ color: COLORS.lightGray, fontSize: '15px', margin: '6px 0 0 0' }}>{subtitle}</p>}
  </div>
)

const DataTable = ({ columns, data }) => (
  <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${COLORS.cardBorder}` }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ background: COLORS.black }}>
          {columns.map((col, i) => (
            <th key={i} style={{ padding: '14px 12px', textAlign: col.align || 'left', color: COLORS.yellow, fontWeight: '700', fontSize: '13px', borderBottom: `2px solid ${COLORS.yellow}` }}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIdx) => (
          <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? COLORS.cardBg : '#151515' }}>
            {columns.map((col, colIdx) => {
              const val = col.accessor ? row[col.accessor] : col.render ? col.render(row) : ''
              return <td key={colIdx} style={{ padding: '12px', textAlign: col.align || 'left', color: COLORS.white, fontWeight: '400', borderBottom: `1px solid ${COLORS.cardBorder}` }}>{col.format ? col.format(val, row) : val}</td>
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const ComingSoonSection = ({ title }) => (
  <div style={{ background: `linear-gradient(135deg, ${COLORS.cardBg} 0%, #252525 100%)`, borderRadius: '12px', padding: '40px', textAlign: 'center', border: `1px dashed ${COLORS.cardBorder}`, marginBottom: '24px' }}>
    <h3 style={{ color: COLORS.yellow, fontSize: '24px', fontWeight: '700', margin: '0 0 12px 0' }}>{title}</h3>
    <p style={{ color: COLORS.lightGray, fontSize: '16px', margin: 0 }}>🚧 Coming Soon</p>
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN UPLOAD PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const AdminUploadPage = ({ weeksData, onUploadComplete, onDeleteWeek }) => {
  const [weekNumber, setWeekNumber] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null)

  const processExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array', cellDates: true })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (err) { reject(err) }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileChange = async (e, fileKey) => {
    const file = e.target.files[0]
    if (file) {
      try {
        const data = await processExcelFile(file)
        setUploadedFiles(prev => ({ ...prev, [fileKey]: { name: file.name, data, rows: data.length } }))
      } catch (err) {
        console.error('Error processing file:', err)
        setUploadStatus({ type: 'error', message: `Errore nel file ${file.name}` })
      }
    }
  }

  const handleUpload = async () => {
    if (!weekNumber || !dateRange) {
      setUploadStatus({ type: 'error', message: 'Inserisci numero settimana e date range' })
      return
    }

    const missingFiles = FILE_REQUIREMENTS.filter(f => !uploadedFiles[f.key])
    if (missingFiles.length > 0) {
      setUploadStatus({ type: 'error', message: `File mancanti (${missingFiles.length}): ${missingFiles.map(f => f.name).join(', ')}` })
      return
    }

    setIsProcessing(true)
    try {
      const filesData = {}
      Object.entries(uploadedFiles).forEach(([key, file]) => { filesData[key] = file.data })

      const processedData = processWeekData(filesData, parseInt(weekNumber), dateRange)
      await onUploadComplete(processedData)
      
      setUploadStatus({ type: 'success', message: `Week ${weekNumber} caricata con successo!` })
      setWeekNumber('')
      setDateRange('')
      setUploadedFiles({})
    } catch (err) {
      console.error('Processing error:', err)
      setUploadStatus({ type: 'error', message: 'Errore durante l\'elaborazione dei dati' })
    }
    setIsProcessing(false)
  }

  const uploadedCount = Object.keys(uploadedFiles).length
  const totalFilesRequired = FILE_REQUIREMENTS.length

  return (
    <div style={{ padding: '24px' }}>
      <SectionHeader title="📤 Upload Week Data" subtitle="Carica i 10 file Excel per una nuova settimana" />
      
      {/* Week Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ color: COLORS.lightGray, fontSize: '13px', display: 'block', marginBottom: '8px' }}>Numero Settimana *</label>
          <input type="number" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} placeholder="es. 6" style={{ width: '100%', background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: '8px', padding: '12px 16px', color: COLORS.white, fontSize: '16px' }} />
        </div>
        <div>
          <label style={{ color: COLORS.lightGray, fontSize: '13px', display: 'block', marginBottom: '8px' }}>Date Range *</label>
          <input type="text" value={dateRange} onChange={(e) => setDateRange(e.target.value)} placeholder="es. 03 Feb - 09 Feb 2025" style={{ width: '100%', background: COLORS.cardBg, border: `1px solid ${COLORS.cardBorder}`, borderRadius: '8px', padding: '12px 16px', color: COLORS.white, fontSize: '16px' }} />
        </div>
      </div>

      {/* File Upload Grid */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: COLORS.yellow, fontSize: '18px', margin: '0 0 16px 0' }}>📁 File Richiesti (10 file)</h3>
        <p style={{ color: COLORS.lightGray, fontSize: '13px', margin: '0 0 16px 0' }}>Tutti i file sono obbligatori. Segui i percorsi indicati per esportare i dati dal Back Office.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
          {FILE_REQUIREMENTS.map(file => {
            const uploaded = uploadedFiles[file.key]
            return (
              <div key={file.key} style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '16px', border: `1px solid ${uploaded ? COLORS.green : COLORS.cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: uploaded ? COLORS.green : COLORS.white, fontWeight: '700', fontSize: '14px' }}>{uploaded ? '✅' : '📄'} {file.name}</span>
                  {uploaded && <span style={{ color: COLORS.green, fontSize: '12px', fontWeight: '600' }}>✓ {uploaded.rows} righe</span>}
                </div>
                <p style={{ color: COLORS.lightGray, fontSize: '12px', margin: '0 0 8px 0' }}>{file.desc}</p>
                <div style={{ background: COLORS.black, borderRadius: '6px', padding: '10px 12px', marginBottom: '12px', borderLeft: `3px solid ${COLORS.yellow}` }}>
                  <p style={{ color: COLORS.yellow, fontSize: '10px', fontWeight: '600', margin: '0 0 4px 0', textTransform: 'uppercase' }}>📍 Percorso BO:</p>
                  <p style={{ color: COLORS.white, fontSize: '12px', margin: 0, lineHeight: '1.4' }}>{file.boPath}</p>
                </div>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => handleFileChange(e, file.key)} style={{ width: '100%', background: uploaded ? `${COLORS.green}15` : COLORS.black, border: `1px solid ${uploaded ? COLORS.green : COLORS.cardBorder}`, borderRadius: '6px', padding: '8px', color: COLORS.white, fontSize: '12px', cursor: 'pointer' }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div style={{ background: uploadStatus.type === 'success' ? `${COLORS.green}20` : `${COLORS.red}20`, border: `1px solid ${uploadStatus.type === 'success' ? COLORS.green : COLORS.red}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
          <p style={{ color: uploadStatus.type === 'success' ? COLORS.green : COLORS.red, margin: 0 }}>{uploadStatus.message}</p>
        </div>
      )}

      {/* Upload Button */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button onClick={handleUpload} disabled={isProcessing || uploadedCount < totalFilesRequired} style={{ background: uploadedCount >= totalFilesRequired ? COLORS.yellow : COLORS.mediumGray, color: COLORS.black, border: 'none', borderRadius: '8px', padding: '14px 32px', fontSize: '16px', fontWeight: '700', cursor: uploadedCount >= totalFilesRequired ? 'pointer' : 'not-allowed', opacity: isProcessing ? 0.7 : 1 }}>
          {isProcessing ? '⏳ Elaborazione...' : `📥 Carica Week ${weekNumber || 'X'}`}
        </button>
        <span style={{ color: uploadedCount >= totalFilesRequired ? COLORS.green : COLORS.lightGray, fontSize: '14px', fontWeight: '600' }}>
          {uploadedCount}/{totalFilesRequired} file caricati {uploadedCount < totalFilesRequired && `(mancano ${totalFilesRequired - uploadedCount})`}
        </span>
      </div>

      {/* Existing Weeks */}
      {Object.keys(weeksData).length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <SectionHeader title="📅 Settimane Caricate" subtitle="Gestisci i dati esistenti" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {Object.values(weeksData).sort((a, b) => b.weekNumber - a.weekNumber).map(week => (
              <div key={week.weekNumber} style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ color: COLORS.yellow, margin: 0, fontSize: '20px', fontWeight: '700' }}>Week {week.weekNumber}</h3>
                  <button onClick={() => onDeleteWeek(week.weekNumber)} style={{ background: `${COLORS.red}20`, color: COLORS.red, border: `1px solid ${COLORS.red}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>🗑️ Elimina</button>
                </div>
                <p style={{ color: COLORS.lightGray, margin: '0 0 8px 0', fontSize: '14px' }}>{week.dateRange}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: COLORS.lightGray }}>REG:</span> <span style={{ color: COLORS.white }}>{formatNumber(week.registrations)}</span></div>
                  <div><span style={{ color: COLORS.lightGray }}>FTDs:</span> <span style={{ color: COLORS.white }}>{formatNumber(week.ftds)}</span></div>
                  <div><span style={{ color: COLORS.lightGray }}>GGR:</span> <span style={{ color: COLORS.white }}>{formatCurrency(week.ggr)}</span></div>
                  <div><span style={{ color: COLORS.lightGray }}>Actives:</span> <span style={{ color: COLORS.white }}>{formatNumber(week.activeUsers)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MONTHLY SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
const MonthlySummary = ({ weeksData }) => {
  const weeks = Object.values(weeksData).sort((a, b) => a.weekNumber - b.weekNumber)
  
  if (weeks.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center' }}><p style={{ color: COLORS.lightGray, fontSize: '18px' }}>Carica almeno una settimana per vedere il riepilogo mensile</p></div>
  }

  const totals = {
    registrations: weeks.reduce((sum, w) => sum + (w.registrations || 0), 0),
    ftds: weeks.reduce((sum, w) => sum + (w.ftds || 0), 0),
    deposits: weeks.reduce((sum, w) => sum + (w.totalDeposits || 0), 0),
    withdrawals: weeks.reduce((sum, w) => sum + (w.totalWithdrawals || 0), 0),
    turnover: weeks.reduce((sum, w) => sum + (w.turnover || 0), 0),
    ggr: weeks.reduce((sum, w) => sum + (w.ggr || 0), 0),
    bonus: weeks.reduce((sum, w) => sum + (w.totalBonus || 0), 0)
  }

  const avgActives = Math.round(weeks.reduce((sum, w) => sum + (w.activeUsers || 0), 0) / weeks.length)
  const overallConvRate = totals.registrations > 0 ? (totals.ftds / totals.registrations * 100).toFixed(1) : 0
  const overallGwm = totals.turnover > 0 ? (totals.ggr / totals.turnover * 100).toFixed(1) : 0

  const trendData = weeks.map(w => ({ week: `W${w.weekNumber}`, registrations: w.registrations, ftds: w.ftds, ggr: Math.round(w.ggr / 1000) }))

  return (
    <div style={{ padding: '24px' }}>
      <SectionHeader title="📊 Monthly Summary" subtitle={`Week ${weeks[0].weekNumber} - Week ${weeks[weeks.length - 1].weekNumber} | ${weeks.length} settimane`} />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <KPICard label="TOTAL REGISTRATIONS" value={formatNumber(totals.registrations)} subtext={`${weeks.length} weeks combined`} />
        <KPICard label="TOTAL FTDs" value={formatNumber(totals.ftds)} subtext={`Conv: ${overallConvRate}%`} />
        <KPICard label="NET DEPOSIT" value={formatCurrency(totals.deposits - totals.withdrawals)} />
        <KPICard label="TOTAL TURNOVER" value={formatCurrency(totals.turnover)} />
        <KPICard label="TOTAL GGR" value={formatCurrency(totals.ggr)} subtext={`GWM: ${overallGwm}%`} />
        <KPICard label="AVG WEEKLY ACTIVES" value={formatNumber(avgActives)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
          <h4 style={{ color: COLORS.white, margin: '0 0 16px 0', fontSize: '16px' }}>Registrations & FTDs Trend</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.yellow} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.yellow} stopOpacity={0}/></linearGradient>
                <linearGradient id="ftdGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cardBorder} />
              <XAxis dataKey="week" tick={{ fill: COLORS.lightGray, fontSize: 12 }} />
              <YAxis tick={{ fill: COLORS.lightGray, fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="registrations" name="REG" stroke={COLORS.yellow} fill="url(#regGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="ftds" name="FTDs" stroke={COLORS.green} fill="url(#ftdGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
          <h4 style={{ color: COLORS.white, margin: '0 0 16px 0', fontSize: '16px' }}>GGR Trend (€k)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cardBorder} />
              <XAxis dataKey="week" tick={{ fill: COLORS.lightGray, fontSize: 12 }} />
              <YAxis tick={{ fill: COLORS.lightGray, fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="ggr" name="GGR (€k)" fill={COLORS.yellow} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
        <h4 style={{ color: COLORS.white, margin: '0 0 16px 0', fontSize: '16px' }}>Weekly Comparison</h4>
        <DataTable
          columns={[
            { header: 'Week', accessor: 'week' },
            { header: 'Date Range', accessor: 'dateRange' },
            { header: 'REG', accessor: 'registrations', align: 'right', format: formatNumber },
            { header: 'FTDs', accessor: 'ftds', align: 'right', format: formatNumber },
            { header: 'Conv %', accessor: 'conversionRate', align: 'center', format: (v) => `${v}%` },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: formatCurrency },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: formatCurrency },
            { header: 'GWM', accessor: 'gwm', align: 'center', format: (v) => `${v}%` },
            { header: 'Actives', accessor: 'activeUsers', align: 'right', format: formatNumber }
          ]}
          data={weeks.map(w => ({ ...w, week: `Week ${w.weekNumber}` }))}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY REPORT VIEW
// ═══════════════════════════════════════════════════════════════════════════════
const WeeklyReportView = ({ data, prevData, allWeeksData }) => {
  if (!data) {
    return <div style={{ padding: '60px', textAlign: 'center' }}><p style={{ color: COLORS.lightGray, fontSize: '18px' }}>Seleziona una settimana o carica nuovi dati dalla sezione Admin</p></div>
  }

  const selectedWeek = data.weekNumber
  const allWeeks = Object.keys(allWeeksData).map(Number).sort((a, b) => b - a)
  const latestWeek = Math.max(...allWeeks)
  const deepDiveWeeks = allWeeks.filter(w => w > latestWeek - 5).sort((a, b) => b - a)
  
  const allDeepDive = []
  Object.values(allWeeksData).forEach(w => {
    if (w.deepDive && deepDiveWeeks.includes(w.weekNumber)) allDeepDive.push(...w.deepDive)
  })
  const filteredDeepDive = allDeepDive.sort((a, b) => b.week - a.week)

  const regChange = prevData ? calcChange(data.registrations, prevData.registrations) : null
  const ftdChange = prevData ? calcChange(data.ftds, prevData.ftds) : null
  const turnoverChange = prevData ? calcChange(data.turnover, prevData.turnover) : null
  const ggrChange = prevData ? calcChange(data.ggr, prevData.ggr) : null

  const pieColors = [COLORS.yellow, COLORS.green, '#00b4d8', '#ff6b6b', '#9b59b6', '#e67e22']

  return (
    <div style={{ padding: '24px' }}>
      {/* Coming Soon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <ComingSoonSection title="Weekly Casino Trading" />
        <ComingSoonSection title="Weekly Sport Trading" />
        <ComingSoonSection title="Weekly Promotion Trading" />
      </div>

      {/* Trading Summary */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Trading Summary" subtitle={`Week ${data.weekNumber} | ${data.dateRange}`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <KPICard label="REGISTRATIONS" value={formatNumber(data.registrations)} subtext={prevData ? `vs W${selectedWeek - 1}` : ''} trendValue={regChange ? `${regChange > 0 ? '+' : ''}${regChange}%` : ''} trend={regChange >= 0 ? 'positive' : 'negative'} />
          <KPICard label="FTDs" value={formatNumber(data.ftds)} subtext={`Conv: ${data.conversionRate}% | Avg: €${data.avgFirstDeposit}`} trend={ftdChange >= 0 ? 'positive' : 'negative'} />
          <KPICard label="NET DEPOSIT" value={formatCurrency(data.netDeposit)} subtext={`Dep ${formatCurrency(data.totalDeposits)} - Wit ${formatCurrency(data.totalWithdrawals)}`} trend="positive" />
          <KPICard label="TOTAL TURNOVER" value={formatCurrency(data.turnover)} trendValue={turnoverChange ? `${turnoverChange > 0 ? '+' : ''}${turnoverChange}%` : ''} trend={turnoverChange >= 0 ? 'positive' : 'negative'} />
          <KPICard label="TOTAL GGR" value={formatCurrency(data.ggr)} trendValue={ggrChange ? `${ggrChange > 0 ? '+' : ''}${ggrChange}%` : ''} trend={ggrChange >= 0 ? 'positive' : 'negative'} />
          <KPICard label="OVERALL GWM" value={`${data.gwm}%`} subtext={prevData ? `${(data.gwm - prevData.gwm).toFixed(1)}pp vs W${selectedWeek - 1}` : ''} />
        </div>
        <div style={{ background: COLORS.black, borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: COLORS.lightGray, fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 6px 0' }}>WEEKLY ACTIVES</p>
            <p style={{ color: COLORS.yellow, fontSize: '42px', fontWeight: '900', margin: 0 }}>{formatNumber(data.activeUsers)}</p>
          </div>
        </div>
      </section>

      {/* Acquisition */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Acquisition & Daily Trend" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
            <h4 style={{ color: COLORS.white, margin: '0 0 16px 0', fontSize: '16px' }}>Daily Registrations & FTDs</h4>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.dailyStats || []}>
                <defs>
                  <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.yellow} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.yellow} stopOpacity={0}/></linearGradient>
                  <linearGradient id="ftdGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.green} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.green} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.cardBorder} />
                <XAxis dataKey="date" tick={{ fill: COLORS.lightGray, fontSize: 12 }} />
                <YAxis tick={{ fill: COLORS.lightGray, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="registrations" name="Registrations" stroke={COLORS.yellow} fill="url(#regGradient)" strokeWidth={3} />
                <Area type="monotone" dataKey="ftds" name="FTDs" stroke={COLORS.green} fill="url(#ftdGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
            <h4 style={{ color: COLORS.white, margin: '0 0 16px 0', fontSize: '16px' }}>Top Sources</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topSources || []} layout="vertical">
                <XAxis type="number" tick={{ fill: COLORS.lightGray, fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fill: COLORS.lightGray, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={COLORS.green} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}`, textAlign: 'center' }}>
            <h4 style={{ color: COLORS.white, margin: '0 0 16px 0', fontSize: '16px' }}>Demographics</h4>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '48px' }}>
              <div><p style={{ color: COLORS.yellow, fontSize: '40px', fontWeight: '900', margin: 0 }}>{data.demographics?.male || 0}%</p><p style={{ color: COLORS.lightGray, fontSize: '14px', margin: 0 }}>Male</p></div>
              <div><p style={{ color: COLORS.green, fontSize: '40px', fontWeight: '900', margin: 0 }}>{data.demographics?.female || 0}%</p><p style={{ color: COLORS.lightGray, fontSize: '14px', margin: 0 }}>Female</p></div>
            </div>
          </div>
          <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
            <h4 style={{ color: COLORS.white, margin: '0 0 12px 0', fontSize: '16px' }}>Age Distribution</h4>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={data.ageGroups || []}><XAxis dataKey="range" tick={{ fill: COLORS.lightGray, fontSize: 10 }} /><YAxis hide /><Tooltip content={<CustomTooltip />} /><Bar dataKey="percent" fill={COLORS.yellow} radius={[6, 6, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
            <h4 style={{ color: COLORS.white, margin: '0 0 12px 0', fontSize: '16px' }}>Top 5 Province</h4>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={data.provinces || []} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={35} tick={{ fill: COLORS.lightGray, fontSize: 11 }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="count" fill={COLORS.green} radius={[0, 6, 6, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Quality Acquisition */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Quality Acquisition" />
        <DataTable
          columns={[
            { header: 'Channel', accessor: 'channel' },
            { header: 'REG', accessor: 'reg', align: 'center', format: formatNumber },
            { header: 'FTDs', accessor: 'ftds', align: 'center', format: formatNumber },
            { header: 'Conv %', accessor: 'conv', align: 'center', format: (v) => <span style={{ color: v >= 60 ? COLORS.green : COLORS.white }}>{v}%</span> },
            { header: 'Activated', accessor: 'activated', align: 'center', format: (v) => <span style={{ color: v >= 85 ? COLORS.green : v <= 75 ? COLORS.red : COLORS.white }}>{v}%</span> },
            { header: 'Avg Age', accessor: 'avgAge', align: 'center', format: (v) => `${v} yrs` }
          ]}
          data={data.qualityAcquisition || []}
        />
      </section>

      {/* Channel Performance */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Performance by Channel" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
          <DataTable
            columns={[
              { header: 'Channel', accessor: 'channel' },
              { header: 'Turnover', accessor: 'turnover', align: 'right', format: formatCurrency },
              { header: 'GGR', accessor: 'ggr', align: 'right', format: formatCurrency },
              { header: 'GWM', accessor: 'gwm', align: 'center', format: (v) => `${v}%` },
              { header: 'Actives', accessor: 'actives', align: 'right', format: formatNumber },
              { header: '% Rev', accessor: 'revShare', align: 'center', format: (v) => `${v}%` }
            ]}
            data={data.channelPerformance || []}
          />
          <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}` }}>
            <h4 style={{ color: COLORS.white, margin: '0 0 16px 0', fontSize: '16px' }}>Revenue Share</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={(data.channelPerformance || []).slice(0, 4)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="revShare" nameKey="channel">{(data.channelPerformance || []).slice(0, 4).map((_, i) => <Cell key={i} fill={pieColors[i]} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Product Performance */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Performance by Product" />
        <DataTable
          columns={[
            { header: 'Product', accessor: 'product' },
            { header: 'Turnover', accessor: 'turnover', align: 'right', format: formatCurrency },
            { header: 'GGR', accessor: 'ggr', align: 'right', format: formatCurrency },
            { header: 'Payout', accessor: 'payout', align: 'center', format: (v) => v ? `${v}%` : '-' },
            { header: 'Actives', accessor: 'actives', align: 'right', format: formatNumber },
            { header: 'ARPU', accessor: 'arpu', align: 'right', format: (v) => `€${v}` }
          ]}
          data={data.productPerformance || []}
        />
      </section>

      {/* Financial Health */}
      <section style={{ marginBottom: '48px' }}>
        <SectionHeader title="Financial Health" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <KPICard label="WITHDRAWAL RATIO" value={`${data.financialHealth?.withdrawalRatio || 0}%`} />
          <KPICard label="DEPOSIT FREQUENCY" value={`${data.financialHealth?.depositFrequency || 0}x`} trend="positive" />
          <KPICard label="BONUS ROI" value={`${data.financialHealth?.bonusROI || 0}x`} trend="positive" />
          <KPICard label="CUSTOMER VALUE" value={`€${data.financialHealth?.customerValue || 0}`} />
          <KPICard label="LOGIN / USER" value={data.financialHealth?.loginPerUser || 0} trend="positive" />
          <KPICard label="AVG SESSION VALUE" value={`€${data.financialHealth?.avgSessionValue || 0}`} />
        </div>
      </section>

      {/* Deep Dive */}
      {filteredDeepDive.length > 0 && (
        <section style={{ marginBottom: '48px' }}>
          <SectionHeader title={`Deep Dive - Last ${deepDiveWeeks.length} Weeks`} subtitle="REG, FTDs, GGR(k) per channel" />
          <div style={{ background: COLORS.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${COLORS.cardBorder}`, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: COLORS.black }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: COLORS.yellow }}></th>
                  <th style={{ padding: '12px', textAlign: 'right', color: COLORS.yellow }}>PVR</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: COLORS.yellow }}>Vivabet+ Academy</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: COLORS.yellow }}>DAZNBET Organic</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: COLORS.yellow }}>DAZN Direct</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: COLORS.yellow }}>Affiliates</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: COLORS.yellow }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeepDive.map((week) => (
                  <React.Fragment key={week.week}>
                    <tr style={{ background: COLORS.black }}><td colSpan={7} style={{ padding: '10px 12px', color: COLORS.yellow, fontWeight: '700' }}>Week {week.week} {week.week === latestWeek && <span style={{ color: COLORS.green, fontSize: '11px', marginLeft: '8px' }}>● LATEST</span>}</td></tr>
                    {['Reg', 'FTDs', 'GGR (k)'].map((metric, mIdx) => {
                      const key = metric === 'Reg' ? 'reg' : metric === 'FTDs' ? 'ftds' : 'ggr'
                      return (
                        <tr key={`${week.week}-${metric}`} style={{ background: mIdx % 2 === 0 ? COLORS.cardBg : '#151515' }}>
                          <td style={{ padding: '8px 12px', color: COLORS.lightGray }}>{metric}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: COLORS.white }}>{week.pvr?.[key] || 0}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: COLORS.white }}>{week.vivabet?.[key] || 0}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: COLORS.white }}>{week.organic?.[key] || 0}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: COLORS.white }}>{week.direct?.[key] || 0}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: COLORS.white }}>{week.affiliates?.[key] || 0}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', color: COLORS.white, fontWeight: '700' }}>{week.total?.[key] || 0}</td>
                        </tr>
                      )
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Thank You */}
      <section style={{ background: COLORS.black, borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ background: COLORS.black, border: `3px solid ${COLORS.white}`, borderRadius: '8px', padding: '12px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}><span style={{ color: COLORS.white, fontSize: '28px', fontWeight: '900' }}>DA</span><span style={{ color: COLORS.white, fontSize: '28px', fontWeight: '900' }}>ZN</span></div>
          <div style={{ background: COLORS.yellow, borderRadius: '8px', padding: '12px 16px', marginLeft: '-2px' }}><span style={{ color: COLORS.black, fontSize: '38px', fontWeight: '900', fontStyle: 'italic' }}>BET</span></div>
        </div>
        <h2 style={{ color: COLORS.yellow, fontSize: '42px', fontWeight: '900', margin: '0 0 16px 0' }}>Thank You</h2>
        <p style={{ color: COLORS.white, fontSize: '18px', margin: '0 0 8px 0' }}>Weekly Trading Report - Week {data.weekNumber} 2025</p>
        <p style={{ color: COLORS.lightGray, fontSize: '16px', margin: 0 }}>DAZN Bet Italy</p>
      </section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('weekly')
  const [weeksData, setWeeksData] = useState({})
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dbStatus, setDbStatus] = useState({ connected: false, message: '' })

  useEffect(() => {
    const loadData = async () => {
      try {
        const connStatus = await checkConnection()
        setDbStatus(connStatus)
        
        const result = await loadAllWeeksData()
        if (result.data && Object.keys(result.data).length > 0) {
          setWeeksData(result.data)
          const weeks = Object.keys(result.data).map(Number)
          if (weeks.length > 0) setSelectedWeek(Math.max(...weeks))
        }
        console.log(`Data loaded from: ${result.source}`)
      } catch (err) { console.error('Load error:', err) }
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleUploadComplete = async (newWeekData) => {
    const updatedData = { ...weeksData, [newWeekData.weekNumber]: newWeekData }
    setWeeksData(updatedData)
    setSelectedWeek(newWeekData.weekNumber)
    const result = await saveWeekData(newWeekData)
    console.log(`Data saved to: ${result.source}`)
    setActiveTab('weekly')
  }

  const handleDeleteWeek = async (weekNum) => {
    if (confirm(`Sei sicuro di voler eliminare Week ${weekNum}?`)) {
      const { [weekNum]: _, ...remaining } = weeksData
      setWeeksData(remaining)
      await deleteWeekData(weekNum)
      const weeks = Object.keys(remaining).map(Number)
      setSelectedWeek(weeks.length > 0 ? Math.max(...weeks) : null)
    }
  }

  const allWeeks = Object.keys(weeksData).map(Number).sort((a, b) => b - a)
  const currentData = selectedWeek ? weeksData[selectedWeek] : null
  const prevData = selectedWeek && weeksData[selectedWeek - 1] ? weeksData[selectedWeek - 1] : null

  if (isLoading) {
    return <div style={{ minHeight: '100vh', background: COLORS.darkBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: COLORS.yellow, fontSize: '20px' }}>⏳ Caricamento...</p></div>
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.darkBg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: COLORS.white }}>
      {/* Header */}
      <header style={{ background: COLORS.black, padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${COLORS.cardBorder}` }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ background: COLORS.black, border: `3px solid ${COLORS.white}`, borderRadius: '6px', padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}><span style={{ color: COLORS.white, fontSize: '18px', fontWeight: '900' }}>DA</span><span style={{ color: COLORS.white, fontSize: '18px', fontWeight: '900' }}>ZN</span></div>
              <div style={{ background: COLORS.yellow, borderRadius: '6px', padding: '8px 12px', marginLeft: '-2px' }}><span style={{ color: COLORS.black, fontSize: '24px', fontWeight: '900', fontStyle: 'italic' }}>BET</span></div>
            </div>
            <div>
              <h1 style={{ color: COLORS.white, fontSize: '18px', fontWeight: '700', margin: 0 }}>Weekly Trading Report</h1>
              <p style={{ color: COLORS.lightGray, fontSize: '13px', margin: 0 }}>ITALY <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: dbStatus.connected ? `${COLORS.green}30` : `${COLORS.orange}30`, color: dbStatus.connected ? COLORS.green : COLORS.orange }}>{dbStatus.connected ? '● DB Online' : '● Local Storage'}</span></p>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[{ id: 'weekly', label: '📊 Weekly Report' }, { id: 'monthly', label: '📅 Monthly Summary' }, { id: 'admin', label: '⚙️ Admin / Upload' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: activeTab === tab.id ? COLORS.yellow : COLORS.cardBg, color: activeTab === tab.id ? COLORS.black : COLORS.white, border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>{tab.label}</button>
            ))}
          </div>

          {/* Week Selector */}
          {activeTab === 'weekly' && allWeeks.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: COLORS.lightGray, fontSize: '14px' }}>Week:</span>
              <select value={selectedWeek || ''} onChange={(e) => setSelectedWeek(Number(e.target.value))} style={{ background: COLORS.cardBg, color: COLORS.white, border: `2px solid ${COLORS.yellow}`, borderRadius: '8px', padding: '10px 16px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                {allWeeks.map(w => <option key={w} value={w}>Week {w}</option>)}
              </select>
              {currentData && <div style={{ background: COLORS.yellow, color: COLORS.black, padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '14px' }}>{currentData.dateRange}</div>}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {activeTab === 'weekly' && <WeeklyReportView data={currentData} prevData={prevData} allWeeksData={weeksData} />}
        {activeTab === 'monthly' && <MonthlySummary weeksData={weeksData} />}
        {activeTab === 'admin' && <AdminUploadPage weeksData={weeksData} onUploadComplete={handleUploadComplete} onDeleteWeek={handleDeleteWeek} />}
      </main>
    </div>
  )
}
