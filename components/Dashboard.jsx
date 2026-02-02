'use client'

import React, { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { saveWeekData, loadAllWeeksData, deleteWeekData, checkConnection } from '../lib/supabase'

// COLORS
const C = {
  primary: '#CCFF00', primaryDim: 'rgba(204,255,0,0.1)', bg: '#0A0A0A', card: '#111111', border: '#222',
  text: '#FFF', textSec: '#888', textMuted: '#555', success: '#00D26A', successDim: 'rgba(0,210,106,0.1)',
  danger: '#FF4757', dangerDim: 'rgba(255,71,87,0.1)', blue: '#3B82F6', purple: '#8B5CF6', orange: '#F59E0B',
  chart: ['#CCFF00', '#00D26A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899']
}

// FILES
const FILES = [
  { key: 'anagrafica', name: 'Anagrafica.xlsx', path: 'Modifica Conto Telematico → Ricerca anagrafica' },
  { key: 'anagrafica2', name: 'Anagrafica2.xlsx', path: 'Statistica Conti' },
  { key: 'total', name: 'Anagrafica_TOTAL.xlsx', path: 'Stats Multilivello → GRID senza selezioni' },
  { key: 'categoria', name: 'Anagrafica_CATEGORIA.xlsx', path: 'Stats Multilivello → GRID Categoria' },
  { key: 'daznbet', name: 'Anagrafica_DAZNBET.xlsx', path: 'Stats Multilivello → DAZNBET SKIN' },
  { key: 'organic', name: 'Anagrafica_ORGANIC.xlsx', path: 'DAZNBET SKIN, PV: www.daznbet.it → GRID Categoria' },
  { key: 'organicTotal', name: 'Anagrafica_ORGANIC_TOTAL.xlsx', path: 'DAZNBET SKIN, PV: www.daznbet.it → GRID senza selezioni' },
  { key: 'skin', name: 'Anagrafica_SKIN.xlsx', path: 'Stats Multilivello → GRID SKIN e Categoria' },
  { key: 'skinTotal', name: 'Anagrafica_SKIN_TOTAL.xlsx', path: 'Stats Multilivello → GRID SKIN' },
  { key: 'academyTotal', name: 'Anagrafica_ACCADEMY_TOTAL.xlsx', path: 'VIVABET SKIN, Promoter: Academy' }
]

// UTILS
const parseNum = v => { if (typeof v === 'number') return v; if (typeof v === 'string') return parseFloat(v.replace(/[.]/g,'').replace(',','.').replace(/[^\d.-]/g,'')) || 0; return 0 }
const fmtCurrency = (v, c=true) => { if (!v || isNaN(v)) return '€0'; if (c) { if (Math.abs(v)>=1e6) return `€${(v/1e6).toFixed(2)}M`; if (Math.abs(v)>=1e3) return `€${(v/1e3).toFixed(0)}k` } return `€${v.toLocaleString('it-IT')}` }
const fmtNum = v => (!v || isNaN(v)) ? '0' : v.toLocaleString('it-IT')
const calcChange = (cur, prev) => (!prev || prev===0) ? null : ((cur-prev)/prev*100).toFixed(1)

// CHANNEL CLASSIFICATION
const classifyChannel = row => {
  const skin = String(row["Skin"]||"").toUpperCase(), promoter = String(row["Promoter"]||"").toLowerCase(), pv = String(row["Punto vendita"]||"").toUpperCase()
  if (!skin.includes("DAZNBET") && !skin.includes("VIVABET")) { if (!["dazn","funpoints","igaming.com ltd","one click marketing ltd"].some(p=>promoter.includes(p))) return "PVR" }
  if (skin.includes("VIVABET")) return promoter.includes("nsg social web") ? "VIVABET/GLAD" : "Tipster Academy"
  if (skin.includes("DAZNBET")) {
    if (pv.includes("WWW.DAZNBET.IT") || pv==="DAZNBET") return "DAZNBET Organic"
    if (["dazn","funpoints"].some(p=>promoter.includes(p)) || pv.includes("SUPERPRONOSTICO")) return "DAZN Direct"
    return "AFFILIATES"
  }
  return "OTHER"
}

// DATA PROCESSOR
const processData = (files, weekNum, dateRange) => {
  const ana = files.anagrafica||[], ana2 = files.anagrafica2||[], total = files.total||[], cat = files.categoria||[], skinTotal = files.skinTotal||[], academyTotal = files.academyTotal||[], organicTotal = files.organicTotal||[]
  const reg = ana.length, channelGroups = {}
  ana.forEach(r => { const ch = classifyChannel(r); if (!channelGroups[ch]) channelGroups[ch] = {rows:[],ages:[]}; channelGroups[ch].rows.push(r); if(r["Nato il"]) channelGroups[ch].ages.push(r["Nato il"]) })
  
  const qualityAcq = Object.entries(channelGroups).map(([ch, d]) => {
    const r = d.rows.length, f = d.rows.filter(x=>x["Primo deposito"]||parseNum(x["Depositi"])>0).length, act = d.rows.filter(x=>String(x["Stato conto"]||"").includes("ATTIVATO")).length
    const avgAge = d.ages.length ? Math.round(d.ages.map(x=>(new Date()-new Date(x))/(365.25*24*60*60*1000)).reduce((a,b)=>a+b,0)/d.ages.length) : 0
    return { channel: ch, reg: r, ftds: f, conv: r>0 ? parseFloat((f/r*100).toFixed(1)) : 0, activated: r>0 ? Math.round(act/r*100) : 0, avgAge }
  }).filter(c=>c.channel!=="OTHER").sort((a,b)=>b.reg-a.reg)

  const daily = ana2.map(r => { const d = r["Data"]; return { date: d ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) : '', registrations: parseNum(r["Registrati AAMS"])||0, ftds: parseNum(r["Primo deposito"])||0, deposits: parseNum(r["Importo depositi"])||0, withdrawals: parseNum(r["Importo prelievi processati"])||0, bonus: parseNum(r["Importo bonus"])||0 }})
  
  const ftds = daily.reduce((s,d)=>s+d.ftds,0), totalDep = daily.reduce((s,d)=>s+d.deposits,0), totalWit = daily.reduce((s,d)=>s+d.withdrawals,0), totalBonus = daily.reduce((s,d)=>s+d.bonus,0), avgFirstDep = ana2.reduce((s,r)=>s+parseNum(r["Importo primo deposito"]),0)
  
  // TOTALS from Anagrafica_TOTAL
  const totRow = total[0]||{}
  const turnover = parseNum(totRow["Giocato"])||total.reduce((s,r)=>s+parseNum(r["Giocato"]),0)
  const ggr = parseNum(totRow["ggr"])||parseNum(totRow["rake"])||total.reduce((s,r)=>s+(parseNum(r["ggr"])||parseNum(r["rake"])),0)
  const actives = parseNum(totRow["conti attivi"])||total.reduce((m,r)=>Math.max(m,parseNum(r["conti attivi"])),0)

  const products = cat.map(r => ({ product: r["Categoria"]||'', turnover: parseNum(r["Giocato"]), ggr: parseNum(r["ggr"]), actives: parseNum(r["conti attivi"]), payout: parseNum(r["Giocato"])>0 ? parseFloat((parseNum(r["vinto"])/parseNum(r["Giocato"])*100).toFixed(1)) : null })).filter(p=>p.product)

  // Channel Performance
  const chanPerf = []; let totGgr = 0
  let pvrT=0, pvrG=0, pvrA=0
  skinTotal.forEach(r => { const s = String(r["Skin"]||"").toUpperCase(); if (s && !s.includes("VIVABET") && !s.includes("DAZNBET")) { pvrT+=parseNum(r["Giocato"]); pvrG+=parseNum(r["ggr"])||parseNum(r["rake"]); pvrA+=parseNum(r["conti attivi"]) }})
  if (pvrT>0||pvrA>0) { chanPerf.push({channel:'PVR',turnover:pvrT,ggr:pvrG,gwm:pvrT>0?parseFloat((pvrG/pvrT*100).toFixed(1)):0,actives:pvrA}); totGgr+=pvrG }
  
  const vivRow = skinTotal.find(r=>String(r["Skin"]||"").toUpperCase().includes("VIVABET")), acadRow = academyTotal[0]
  if (vivRow) {
    const vT=parseNum(vivRow["Giocato"]), vG=parseNum(vivRow["ggr"])||parseNum(vivRow["rake"]), vA=parseNum(vivRow["conti attivi"])
    const aT=acadRow?parseNum(acadRow["Giocato"]):0, aG=acadRow?(parseNum(acadRow["ggr"])||parseNum(acadRow["rake"])):0, aA=acadRow?parseNum(acadRow["conti attivi"]):0
    chanPerf.push({channel:'VIVABET/GLAD',turnover:vT-aT,ggr:vG-aG,gwm:(vT-aT)>0?parseFloat(((vG-aG)/(vT-aT)*100).toFixed(1)):0,actives:vA-aA}); totGgr+=vG-aG
    if (aT>0||aA>0) { chanPerf.push({channel:'Tipster Academy',turnover:aT,ggr:aG,gwm:aT>0?parseFloat((aG/aT*100).toFixed(1)):0,actives:aA}); totGgr+=aG }
  }
  const orgRow = organicTotal[0]
  if (orgRow) { const oT=parseNum(orgRow["Giocato"]), oG=parseNum(orgRow["ggr"])||parseNum(orgRow["rake"]), oA=parseNum(orgRow["conti attivi"]); chanPerf.push({channel:'DAZNBET Organic',turnover:oT,ggr:oG,gwm:oT>0?parseFloat((oG/oT*100).toFixed(1)):0,actives:oA}); totGgr+=oG }
  chanPerf.forEach(c => { c.revShare = totGgr>0 ? parseFloat((c.ggr/totGgr*100).toFixed(1)) : 0 })

  // Demographics
  const genderCount = {M:0,F:0}; ana.forEach(r => { const g = String(r["Sesso"]||"").toUpperCase(); if (g==="M"||g==="F") genderCount[g]++ }); const totGender = genderCount.M+genderCount.F
  const ageGroups = {"18-24":0,"25-34":0,"35-44":0,"45-54":0,"55-64":0,"65+":0}
  ana.forEach(r => { if(r["Nato il"]) { const age = (new Date()-new Date(r["Nato il"]))/(365.25*24*60*60*1000); if(age<25)ageGroups["18-24"]++;else if(age<35)ageGroups["25-34"]++;else if(age<45)ageGroups["35-44"]++;else if(age<55)ageGroups["45-54"]++;else if(age<65)ageGroups["55-64"]++;else ageGroups["65+"]++ }})
  const totAges = Object.values(ageGroups).reduce((a,b)=>a+b,0)
  const provinces = Object.entries(ana.reduce((acc,r)=>{const p=r["Provincia di residenza"];if(p)acc[p]=(acc[p]||0)+1;return acc},{})).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>({name,count}))
  const sources = Object.entries(ana.reduce((acc,r)=>{let s=r["Cod Punto"]||r["Punto vendita"]||"Unknown";if(s.toLowerCase().includes("daznbet"))s="DAZNBET (Organic)";acc[s]=(acc[s]||0)+1;return acc},{})).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,count])=>({name:name.substring(0,20),count}))

  return { weekNumber:weekNum, dateRange, registrations:reg, ftds, conversionRate:reg>0?parseFloat((ftds/reg*100).toFixed(1)):0, avgFirstDeposit:ftds>0?Math.round(avgFirstDep/ftds):0, totalDeposits:totalDep, totalWithdrawals:totalWit, netDeposit:totalDep-totalWit, turnover, ggr, gwm:turnover>0?parseFloat((ggr/turnover*100).toFixed(1)):0, activeUsers:actives, totalBonus, demographics:{male:totGender>0?Math.round(genderCount.M/totGender*100):0,female:totGender>0?Math.round(genderCount.F/totGender*100):0}, ageGroups:Object.entries(ageGroups).map(([range,count])=>({range,percent:totAges>0?Math.round(count/totAges*100):0})), provinces, topSources:sources, dailyStats:daily, qualityAcquisition:qualityAcq, channelPerformance:chanPerf, productPerformance:products }
}

// ANIMATED KPI
const KPI = ({ label, value, sub, change, delay=0, cur=false, pct=false }) => {
  const [vis, setVis] = useState(false)
  const [anim, setAnim] = useState(0)
  const numVal = typeof value==='number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g,''))||0
  
  useEffect(() => { setTimeout(()=>setVis(true), delay) }, [delay])
  useEffect(() => {
    if (!vis) return
    const start = Date.now(), dur = 1200
    const tick = () => {
      const p = Math.min((Date.now()-start)/dur, 1)
      setAnim(numVal * (1-Math.pow(1-p,3)))
      if (p<1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [vis, numVal])

  const display = cur ? fmtCurrency(anim) : pct ? `${anim.toFixed(1)}%` : fmtNum(Math.round(anim))
  
  return (
    <div style={{ background:C.card, borderRadius:'16px', padding:'clamp(16px,2vw,28px)', border:`1px solid ${C.border}`, opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(20px)', transition:'all 0.5s ease', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, width:'4px', height:'100%', background:`linear-gradient(180deg,${C.primary},transparent)` }} />
      <p style={{ color:C.textSec, fontSize:'clamp(11px,1.2vw,14px)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 10px 0' }}>{label}</p>
      <p style={{ color:C.text, fontSize:'clamp(28px,3.5vw,42px)', fontWeight:700, margin:'0 0 6px 0' }}>{display}</p>
      {sub && <p style={{ color:C.textMuted, fontSize:'clamp(11px,1.1vw,14px)', margin:'0 0 4px 0' }}>{sub}</p>}
      {change && <p style={{ color:parseFloat(change)>=0?C.success:C.danger, fontSize:'clamp(12px,1.2vw,15px)', fontWeight:600, margin:0 }}>{parseFloat(change)>0?'↑':'↓'} {Math.abs(parseFloat(change))}%</p>}
    </div>
  )
}

// TOOLTIP
const Tip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'10px', padding:'12px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
    <p style={{ color:C.text, margin:'0 0 8px 0', fontWeight:600, fontSize:'14px' }}>{label}</p>
    {payload.map((e,i) => <p key={i} style={{ color:e.color, margin:'4px 0', fontSize:'13px' }}>{e.name}: <b>{typeof e.value==='number' && e.value>1000 ? fmtNum(e.value) : e.value}</b></p>)}
  </div>
) : null

// SECTION
const Section = ({ title, sub, children }) => (
  <section style={{ marginBottom:'clamp(32px,4vw,56px)' }}>
    <div style={{ marginBottom:'clamp(16px,2vw,24px)' }}>
      <h2 style={{ color:C.text, fontSize:'clamp(20px,2.5vw,28px)', fontWeight:700, margin:'0 0 4px 0', display:'flex', alignItems:'center', gap:'12px' }}>
        <span style={{ width:'4px', height:'28px', background:C.primary, borderRadius:'2px' }} />{title}
      </h2>
      {sub && <p style={{ color:C.textSec, fontSize:'clamp(12px,1.3vw,15px)', margin:0, paddingLeft:'16px' }}>{sub}</p>}
    </div>
    {children}
  </section>
)

// CARD
const Card = ({ children, style={} }) => <div style={{ background:C.card, borderRadius:'16px', padding:'clamp(16px,2vw,28px)', border:`1px solid ${C.border}`, ...style }}>{children}</div>

// TABLE
const Table = ({ cols, data }) => (
  <div style={{ overflowX:'auto', borderRadius:'12px', border:`1px solid ${C.border}` }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'clamp(12px,1.3vw,15px)' }}>
      <thead><tr style={{ background:C.bg }}>{cols.map((c,i) => <th key={i} style={{ padding:'clamp(10px,1.5vw,16px)', textAlign:c.align||'left', color:C.primary, fontWeight:600, fontSize:'clamp(10px,1.1vw,13px)', textTransform:'uppercase', borderBottom:`2px solid ${C.primary}` }}>{c.header}</th>)}</tr></thead>
      <tbody>{data.map((r,ri) => <tr key={ri} style={{ background:ri%2===0?C.card:C.bg }}>{cols.map((c,ci) => { const v = c.accessor ? r[c.accessor] : ''; return <td key={ci} style={{ padding:'clamp(10px,1.4vw,14px) clamp(10px,1.5vw,16px)', textAlign:c.align||'left', color:C.text, borderBottom:`1px solid ${C.border}` }}>{c.format ? c.format(v,r) : v}</td> })}</tr>)}</tbody>
    </table>
  </div>
)

// UPLOAD PAGE
const UploadPage = ({ weeksData, onUpload, onDelete }) => {
  const [week, setWeek] = useState('')
  const [dates, setDates] = useState('')
  const [files, setFiles] = useState({})
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const exists = week && weeksData[parseInt(week)]

  const readFile = async f => new Promise((res, rej) => { const r = new FileReader(); r.onload = e => { try { const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array',cellDates:true}); res(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])) } catch(err){rej(err)} }; r.onerror = rej; r.readAsArrayBuffer(f) })
  const handleFile = async (e, key) => { const f = e.target.files[0]; if (f) { try { const d = await readFile(f); setFiles(p=>({...p,[key]:{name:f.name,data:d,rows:d.length}})); setMsg(null) } catch { setMsg({t:'error',m:'Errore file'}) }}}
  const handleUpload = async () => {
    if (!week || !dates) { setMsg({t:'error',m:'Inserisci settimana e date'}); return }
    const missing = FILES.filter(f => !files[f.key])
    if (missing.length) { setMsg({t:'error',m:`Mancano ${missing.length} file`}); return }
    setLoading(true)
    try {
      const fd = {}; Object.entries(files).forEach(([k,v]) => fd[k] = v.data)
      const proc = processData(fd, parseInt(week), dates)
      await onUpload(proc)
      setMsg({t:'success',m:exists?`Week ${week} aggiornata!`:`Week ${week} caricata!`})
      setWeek(''); setDates(''); setFiles({})
    } catch { setMsg({t:'error',m:'Errore elaborazione'}) }
    setLoading(false)
  }

  return (
    <div style={{ padding:'clamp(20px,3vw,40px)' }}>
      <Section title="Upload Week Data" sub="Carica i 10 file Excel dal Back Office">
        <Card style={{ marginBottom:'24px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'20px' }}>
            <div>
              <label style={{ color:C.textSec, fontSize:'12px', display:'block', marginBottom:'8px', fontWeight:600 }}>NUMERO SETTIMANA</label>
              <input type="number" value={week} onChange={e=>setWeek(e.target.value)} placeholder="es. 6" style={{ width:'100%', background:C.bg, border:`2px solid ${exists?C.orange:C.border}`, borderRadius:'12px', padding:'14px', color:C.text, fontSize:'18px', fontWeight:600 }} />
              {exists && <p style={{ color:C.orange, fontSize:'12px', marginTop:'8px' }}>⚠️ Week {week} verrà sovrascritta</p>}
            </div>
            <div>
              <label style={{ color:C.textSec, fontSize:'12px', display:'block', marginBottom:'8px', fontWeight:600 }}>DATE RANGE</label>
              <input type="text" value={dates} onChange={e=>setDates(e.target.value)} placeholder="es. 03 - 09 Feb 2025" style={{ width:'100%', background:C.bg, border:`2px solid ${C.border}`, borderRadius:'12px', padding:'14px', color:C.text, fontSize:'18px' }} />
            </div>
          </div>
        </Card>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'14px', marginBottom:'24px' }}>
          {FILES.map((f,i) => {
            const up = files[f.key]
            return (
              <div key={f.key} style={{ background:C.card, borderRadius:'12px', padding:'16px', border:`2px solid ${up?C.success:C.border}`, animation:`fadeIn 0.4s ease ${i*0.04}s both` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                  <span style={{ color:up?C.success:C.text, fontWeight:700, fontSize:'14px' }}>{up?'✓':'○'} {f.name}</span>
                  {up && <span style={{ color:C.success, fontSize:'11px', background:C.successDim, padding:'3px 8px', borderRadius:'6px' }}>{up.rows} righe</span>}
                </div>
                <p style={{ color:C.textMuted, fontSize:'11px', margin:'0 0 10px 0', padding:'6px 10px', background:C.bg, borderRadius:'6px', borderLeft:`3px solid ${C.primary}` }}>{f.path}</p>
                <input type="file" accept=".xlsx,.xls" onChange={e=>handleFile(e,f.key)} style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'10px', color:C.text, fontSize:'12px', cursor:'pointer' }} />
              </div>
            )
          })}
        </div>

        {msg && <div style={{ background:msg.t==='success'?C.successDim:C.dangerDim, border:`1px solid ${msg.t==='success'?C.success:C.danger}`, borderRadius:'12px', padding:'14px', marginBottom:'20px' }}><p style={{ color:msg.t==='success'?C.success:C.danger, margin:0, fontWeight:600 }}>{msg.m}</p></div>}

        <div style={{ display:'flex', gap:'20px', alignItems:'center', marginBottom:'40px' }}>
          <button onClick={handleUpload} disabled={loading || Object.keys(files).length<10} style={{ background:Object.keys(files).length>=10?`linear-gradient(135deg,${C.primary},#a8cc00)`:C.border, color:C.bg, border:'none', borderRadius:'12px', padding:'16px 40px', fontSize:'16px', fontWeight:700, cursor:Object.keys(files).length>=10?'pointer':'not-allowed' }}>{loading?'⏳ Elaborazione...':exists?`🔄 Aggiorna Week ${week}`:`📥 Carica Week ${week||'X'}`}</button>
          <span style={{ color:C.textSec, fontSize:'16px' }}><b style={{ color:Object.keys(files).length>=10?C.success:C.text, fontSize:'24px' }}>{Object.keys(files).length}</b>/10</span>
        </div>

        {Object.keys(weeksData).length > 0 && (
          <>
            <h3 style={{ color:C.text, fontSize:'18px', margin:'0 0 16px 0' }}>📅 Settimane Caricate</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'16px' }}>
              {Object.values(weeksData).sort((a,b)=>b.weekNumber-a.weekNumber).map(w => (
                <Card key={w.weekNumber} style={{ position:'relative' }}>
                  <button onClick={()=>onDelete(w.weekNumber)} style={{ position:'absolute', top:'14px', right:'14px', background:C.dangerDim, color:C.danger, border:`1px solid ${C.danger}`, borderRadius:'8px', padding:'6px 12px', fontSize:'12px', cursor:'pointer' }}>🗑️</button>
                  <h3 style={{ color:C.primary, margin:'0 0 6px 0', fontSize:'24px', fontWeight:700 }}>Week {w.weekNumber}</h3>
                  <p style={{ color:C.textSec, margin:'0 0 14px 0', fontSize:'13px' }}>{w.dateRange}</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <div><span style={{ color:C.textMuted, fontSize:'11px' }}>REG</span><p style={{ color:C.text, fontSize:'18px', fontWeight:600, margin:0 }}>{fmtNum(w.registrations)}</p></div>
                    <div><span style={{ color:C.textMuted, fontSize:'11px' }}>FTDs</span><p style={{ color:C.text, fontSize:'18px', fontWeight:600, margin:0 }}>{fmtNum(w.ftds)}</p></div>
                    <div><span style={{ color:C.textMuted, fontSize:'11px' }}>GGR</span><p style={{ color:C.success, fontSize:'18px', fontWeight:600, margin:0 }}>{fmtCurrency(w.ggr)}</p></div>
                    <div><span style={{ color:C.textMuted, fontSize:'11px' }}>Actives</span><p style={{ color:C.text, fontSize:'18px', fontWeight:600, margin:0 }}>{fmtNum(w.activeUsers)}</p></div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </Section>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}

// MONTHLY
const Monthly = ({ weeksData }) => {
  const weeks = Object.values(weeksData).sort((a,b)=>a.weekNumber-b.weekNumber)
  if (!weeks.length) return <div style={{ padding:'60px', textAlign:'center' }}><p style={{ color:C.textSec, fontSize:'18px' }}>Carica almeno una settimana</p></div>

  const tot = { reg:weeks.reduce((s,w)=>s+(w.registrations||0),0), ftds:weeks.reduce((s,w)=>s+(w.ftds||0),0), dep:weeks.reduce((s,w)=>s+(w.totalDeposits||0),0), wit:weeks.reduce((s,w)=>s+(w.totalWithdrawals||0),0), turn:weeks.reduce((s,w)=>s+(w.turnover||0),0), ggr:weeks.reduce((s,w)=>s+(w.ggr||0),0) }
  const avgAct = Math.round(weeks.reduce((s,w)=>s+(w.activeUsers||0),0)/weeks.length)
  const trend = weeks.map(w => ({ week:`W${w.weekNumber}`, REG:w.registrations, FTDs:w.ftds, GGR:Math.round(w.ggr/1000) }))

  return (
    <div style={{ padding:'clamp(20px,3vw,40px)' }}>
      <Section title="Monthly Summary" sub={`Week ${weeks[0].weekNumber} - ${weeks[weeks.length-1].weekNumber} | ${weeks.length} settimane`}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'clamp(12px,1.5vw,20px)', marginBottom:'clamp(24px,3vw,40px)' }}>
          <KPI label="Total REG" value={tot.reg} delay={0} />
          <KPI label="Total FTDs" value={tot.ftds} sub={`Conv: ${(tot.ftds/tot.reg*100).toFixed(1)}%`} delay={100} />
          <KPI label="Net Deposit" value={tot.dep-tot.wit} cur delay={200} />
          <KPI label="Turnover" value={tot.turn} cur delay={300} />
          <KPI label="GGR" value={tot.ggr} sub={`GWM: ${(tot.ggr/tot.turn*100).toFixed(1)}%`} cur delay={400} />
          <KPI label="Avg Actives" value={avgAct} delay={500} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))', gap:'clamp(16px,2vw,28px)', marginBottom:'clamp(24px,3vw,40px)' }}>
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 16px 0', fontSize:'16px', fontWeight:600 }}>📈 REG & FTD Trend</h4>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend}>
                <defs><linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.3}/><stop offset="95%" stopColor={C.primary} stopOpacity={0}/></linearGradient><linearGradient id="gF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.3}/><stop offset="95%" stopColor={C.success} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{fill:C.textMuted,fontSize:12}} /><YAxis tick={{fill:C.textMuted,fontSize:12}} /><Tooltip content={<Tip/>} /><Legend />
                <Area type="monotone" dataKey="REG" stroke={C.primary} fill="url(#gR)" strokeWidth={3} animationDuration={1500} />
                <Area type="monotone" dataKey="FTDs" stroke={C.success} fill="url(#gF)" strokeWidth={3} animationDuration={1500} animationBegin={300} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 16px 0', fontSize:'16px', fontWeight:600 }}>💰 GGR Trend (€k)</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="week" tick={{fill:C.textMuted,fontSize:12}} /><YAxis tick={{fill:C.textMuted,fontSize:12}} /><Tooltip content={<Tip/>} /><Bar dataKey="GGR" fill={C.primary} radius={[6,6,0,0]} animationDuration={1200} /></BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Table cols={[{header:'Week',accessor:'weekNumber',format:v=><span style={{color:C.primary,fontWeight:700}}>Week {v}</span>},{header:'Date',accessor:'dateRange'},{header:'REG',accessor:'registrations',align:'right',format:fmtNum},{header:'FTDs',accessor:'ftds',align:'right',format:fmtNum},{header:'Conv%',accessor:'conversionRate',align:'center',format:v=>`${v}%`},{header:'Turnover',accessor:'turnover',align:'right',format:fmtCurrency},{header:'GGR',accessor:'ggr',align:'right',format:v=><span style={{color:C.success,fontWeight:600}}>{fmtCurrency(v)}</span>},{header:'GWM',accessor:'gwm',align:'center',format:v=>`${v}%`},{header:'Actives',accessor:'activeUsers',align:'right',format:fmtNum}]} data={weeks} />
      </Section>
    </div>
  )
}

// WEEKLY
const Weekly = ({ data, prev, allData }) => {
  if (!data) return <div style={{ padding:'60px', textAlign:'center' }}><p style={{ color:C.textSec, fontSize:'18px' }}>Seleziona o carica una settimana</p></div>

  const regCh = prev ? calcChange(data.registrations, prev.registrations) : null
  const ftdCh = prev ? calcChange(data.ftds, prev.ftds) : null
  const turnCh = prev ? calcChange(data.turnover, prev.turnover) : null
  const ggrCh = prev ? calcChange(data.ggr, prev.ggr) : null
  const actCh = prev ? calcChange(data.activeUsers, prev.activeUsers) : null

  return (
    <div style={{ padding:'clamp(20px,3vw,40px)' }}>
      {/* TRADING SUMMARY */}
      <Section title="Trading Summary" sub={`Week ${data.weekNumber} | ${data.dateRange}`}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'clamp(12px,1.5vw,20px)', marginBottom:'clamp(20px,2.5vw,32px)' }}>
          <KPI label="Registrations" value={data.registrations} change={regCh} delay={0} />
          <KPI label="FTDs" value={data.ftds} sub={`Conv: ${data.conversionRate}% | Avg: €${data.avgFirstDeposit}`} change={ftdCh} delay={100} />
          <KPI label="Net Deposit" value={data.netDeposit} sub={`Dep ${fmtCurrency(data.totalDeposits)} - Wit ${fmtCurrency(data.totalWithdrawals)}`} cur delay={200} />
          <KPI label="Turnover" value={data.turnover} change={turnCh} cur delay={300} />
          <KPI label="GGR" value={data.ggr} change={ggrCh} cur delay={400} />
          <KPI label="GWM" value={data.gwm} sub={prev?`${(data.gwm-prev.gwm)>=0?'+':''}${(data.gwm-prev.gwm).toFixed(1)}pp`:null} pct delay={500} />
        </div>

        <Card style={{ background:`linear-gradient(135deg,${C.card},${C.bg})`, marginBottom:'clamp(24px,3vw,40px)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'20px' }}>
            <div>
              <p style={{ color:C.textSec, fontSize:'clamp(12px,1.3vw,16px)', fontWeight:600, textTransform:'uppercase', margin:'0 0 8px 0' }}>WEEKLY ACTIVES</p>
              <p style={{ color:C.primary, fontSize:'clamp(40px,6vw,64px)', fontWeight:800, margin:0 }}>{fmtNum(data.activeUsers)}</p>
              {actCh && <p style={{ color:parseFloat(actCh)>=0?C.success:C.danger, fontSize:'clamp(14px,1.5vw,18px)', margin:'8px 0 0 0' }}>{parseFloat(actCh)>0?'↑':'↓'} {Math.abs(parseFloat(actCh))}% vs prev</p>}
            </div>
            <div style={{ fontSize:'clamp(60px,8vw,100px)', opacity:0.1 }}>👥</div>
          </div>
        </Card>
      </Section>

      {/* ACQUISITION */}
      <Section title="Acquisition" sub="Daily trends & demographics">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))', gap:'clamp(16px,2vw,28px)', marginBottom:'clamp(20px,2.5vw,32px)' }}>
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 16px 0', fontSize:'16px', fontWeight:600 }}>📈 Daily REG & FTDs</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.dailyStats||[]}>
                <defs><linearGradient id="dR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.primary} stopOpacity={0.4}/><stop offset="95%" stopColor={C.primary} stopOpacity={0}/></linearGradient><linearGradient id="dF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.success} stopOpacity={0.4}/><stop offset="95%" stopColor={C.success} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{fill:C.textMuted,fontSize:12}} /><YAxis tick={{fill:C.textMuted,fontSize:12}} /><Tooltip content={<Tip/>} /><Legend />
                <Area type="monotone" dataKey="registrations" name="REG" stroke={C.primary} fill="url(#dR)" strokeWidth={3} animationDuration={1500} />
                <Area type="monotone" dataKey="ftds" name="FTDs" stroke={C.success} fill="url(#dF)" strokeWidth={3} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 16px 0', fontSize:'16px', fontWeight:600 }}>🏆 Top Sources</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topSources||[]} layout="vertical"><XAxis type="number" tick={{fill:C.textMuted,fontSize:11}} /><YAxis dataKey="name" type="category" width={110} tick={{fill:C.textMuted,fontSize:11}} /><Tooltip content={<Tip/>} /><Bar dataKey="count" fill={C.success} radius={[0,6,6,0]} animationDuration={1200} /></BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'clamp(16px,2vw,28px)', marginBottom:'clamp(24px,3vw,40px)' }}>
          <Card style={{ textAlign:'center' }}>
            <h4 style={{ color:C.textSec, margin:'0 0 20px 0', fontSize:'13px', fontWeight:600, textTransform:'uppercase' }}>👤 Gender</h4>
            <div style={{ display:'flex', justifyContent:'center', gap:'clamp(32px,5vw,60px)' }}>
              <div><p style={{ color:C.blue, fontSize:'clamp(36px,5vw,52px)', fontWeight:700, margin:0 }}>{data.demographics?.male||0}%</p><p style={{ color:C.textMuted, fontSize:'14px' }}>Male</p></div>
              <div><p style={{ color:C.purple, fontSize:'clamp(36px,5vw,52px)', fontWeight:700, margin:0 }}>{data.demographics?.female||0}%</p><p style={{ color:C.textMuted, fontSize:'14px' }}>Female</p></div>
            </div>
          </Card>
          <Card>
            <h4 style={{ color:C.textSec, margin:'0 0 12px 0', fontSize:'13px', fontWeight:600, textTransform:'uppercase' }}>📊 Age Distribution</h4>
            <ResponsiveContainer width="100%" height={150}><BarChart data={data.ageGroups||[]}><XAxis dataKey="range" tick={{fill:C.textMuted,fontSize:10}} /><YAxis hide /><Tooltip content={<Tip/>} /><Bar dataKey="percent" fill={C.primary} radius={[6,6,0,0]} animationDuration={1000}>{(data.ageGroups||[]).map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]} />)}</Bar></BarChart></ResponsiveContainer>
          </Card>
          <Card>
            <h4 style={{ color:C.textSec, margin:'0 0 12px 0', fontSize:'13px', fontWeight:600, textTransform:'uppercase' }}>🗺️ Top Provinces</h4>
            <ResponsiveContainer width="100%" height={150}><BarChart data={(data.provinces||[]).slice(0,5)} layout="vertical"><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={50} tick={{fill:C.textMuted,fontSize:10}} /><Tooltip content={<Tip/>} /><Bar dataKey="count" fill={C.blue} radius={[0,6,6,0]} animationDuration={1000} /></BarChart></ResponsiveContainer>
          </Card>
        </div>
      </Section>

      {/* QUALITY ACQUISITION */}
      <Section title="Quality Acquisition" sub="Performance per canale">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))', gap:'clamp(16px,2vw,28px)', marginBottom:'clamp(24px,3vw,40px)' }}>
          <Table cols={[{header:'Channel',accessor:'channel',format:v=><span style={{fontWeight:600}}>{v}</span>},{header:'REG',accessor:'reg',align:'right',format:fmtNum},{header:'FTDs',accessor:'ftds',align:'right',format:fmtNum},{header:'Conv%',accessor:'conv',align:'center',format:v=><span style={{color:v>=55?C.success:v>=45?C.orange:C.danger,fontWeight:600}}>{v}%</span>},{header:'Activated',accessor:'activated',align:'center',format:v=>`${v}%`},{header:'Avg Age',accessor:'avgAge',align:'center',format:v=>`${v} yrs`}]} data={data.qualityAcquisition||[]} />
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 12px 0', fontSize:'16px', fontWeight:600 }}>🎯 Conversion by Channel</h4>
            <ResponsiveContainer width="100%" height={250}><BarChart data={data.qualityAcquisition||[]} layout="vertical"><XAxis type="number" domain={[0,80]} tick={{fill:C.textMuted,fontSize:11}} /><YAxis dataKey="channel" type="category" width={110} tick={{fill:C.textMuted,fontSize:11}} /><Tooltip content={<Tip/>} /><Bar dataKey="conv" name="Conv%" fill={C.primary} radius={[0,6,6,0]} animationDuration={1200}>{(data.qualityAcquisition||[]).map((e,i)=><Cell key={i} fill={e.conv>=55?C.success:e.conv>=45?C.orange:C.danger} />)}</Bar></BarChart></ResponsiveContainer>
          </Card>
        </div>
      </Section>

      {/* CHANNEL PERFORMANCE */}
      <Section title="Performance by Channel">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))', gap:'clamp(16px,2vw,28px)', marginBottom:'clamp(24px,3vw,40px)' }}>
          <Table cols={[{header:'Channel',accessor:'channel',format:v=><span style={{fontWeight:600}}>{v}</span>},{header:'Turnover',accessor:'turnover',align:'right',format:fmtCurrency},{header:'GGR',accessor:'ggr',align:'right',format:v=><span style={{color:C.success,fontWeight:600}}>{fmtCurrency(v)}</span>},{header:'GWM',accessor:'gwm',align:'center',format:v=>`${v}%`},{header:'Actives',accessor:'actives',align:'right',format:fmtNum},{header:'Rev Share',accessor:'revShare',align:'center',format:v=><span style={{color:C.primary,fontWeight:600}}>{v}%</span>}]} data={data.channelPerformance||[]} />
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 12px 0', fontSize:'16px', fontWeight:600 }}>📊 Revenue Share</h4>
            <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={(data.channelPerformance||[]).filter(c=>c.revShare>0)} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="revShare" nameKey="channel" animationDuration={1200}>{(data.channelPerformance||[]).map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]} />)}</Pie><Tooltip content={<Tip/>} /><Legend /></PieChart></ResponsiveContainer>
          </Card>
        </div>
      </Section>

      {/* PRODUCT PERFORMANCE */}
      <Section title="Performance by Product">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))', gap:'clamp(16px,2vw,28px)', marginBottom:'clamp(24px,3vw,40px)' }}>
          <Table cols={[{header:'Product',accessor:'product',format:v=><span style={{fontWeight:600}}>{v}</span>},{header:'Turnover',accessor:'turnover',align:'right',format:fmtCurrency},{header:'GGR',accessor:'ggr',align:'right',format:v=><span style={{color:C.success,fontWeight:600}}>{fmtCurrency(v)}</span>},{header:'Payout',accessor:'payout',align:'center',format:v=>v?`${v}%`:'-'},{header:'Actives',accessor:'actives',align:'right',format:fmtNum}]} data={data.productPerformance||[]} />
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 12px 0', fontSize:'16px', fontWeight:600 }}>💰 GGR by Product</h4>
            <ResponsiveContainer width="100%" height={250}><BarChart data={(data.productPerformance||[]).slice(0,6)} layout="vertical"><XAxis type="number" tick={{fill:C.textMuted,fontSize:11}} tickFormatter={v=>`€${(v/1000).toFixed(0)}k`} /><YAxis dataKey="product" type="category" width={100} tick={{fill:C.textMuted,fontSize:11}} /><Tooltip content={<Tip/>} formatter={v=>fmtCurrency(v)} /><Bar dataKey="ggr" fill={C.primary} radius={[0,6,6,0]} animationDuration={1200}>{(data.productPerformance||[]).map((_,i)=><Cell key={i} fill={C.chart[i%C.chart.length]} />)}</Bar></BarChart></ResponsiveContainer>
          </Card>
        </div>
      </Section>

      {/* FINANCIAL */}
      <Section title="Financial Health">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(400px,1fr))', gap:'clamp(16px,2vw,28px)', marginBottom:'clamp(24px,3vw,40px)' }}>
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 16px 0', fontSize:'16px', fontWeight:600 }}>💵 Daily Cash Flow</h4>
            <ResponsiveContainer width="100%" height={250}><BarChart data={data.dailyStats||[]}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{fill:C.textMuted,fontSize:11}} /><YAxis tick={{fill:C.textMuted,fontSize:11}} tickFormatter={v=>`€${(v/1000).toFixed(0)}k`} /><Tooltip content={<Tip/>} /><Legend /><Bar dataKey="deposits" name="Deposits" fill={C.success} radius={[4,4,0,0]} animationDuration={1000} /><Bar dataKey="withdrawals" name="Withdrawals" fill={C.danger} radius={[4,4,0,0]} animationDuration={1000} /></BarChart></ResponsiveContainer>
          </Card>
          <Card>
            <h4 style={{ color:C.text, margin:'0 0 16px 0', fontSize:'16px', fontWeight:600 }}>🎁 Daily Bonus</h4>
            <ResponsiveContainer width="100%" height={250}><AreaChart data={data.dailyStats||[]}><defs><linearGradient id="bG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.4}/><stop offset="95%" stopColor={C.orange} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="date" tick={{fill:C.textMuted,fontSize:11}} /><YAxis tick={{fill:C.textMuted,fontSize:11}} tickFormatter={v=>`€${(v/1000).toFixed(0)}k`} /><Tooltip content={<Tip/>} /><Area type="monotone" dataKey="bonus" name="Bonus" stroke={C.orange} fill="url(#bG)" strokeWidth={3} animationDuration={1200} /></AreaChart></ResponsiveContainer>
          </Card>
        </div>
      </Section>

      {/* FOOTER */}
      <Card style={{ textAlign:'center', background:`linear-gradient(135deg,${C.bg},${C.card})`, padding:'clamp(40px,5vw,80px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px' }}>
          <div style={{ background:C.bg, border:`3px solid ${C.text}`, borderRadius:'8px', padding:'12px 16px', display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1 }}><span style={{ color:C.text, fontSize:'clamp(20px,3vw,28px)', fontWeight:900 }}>DA</span><span style={{ color:C.text, fontSize:'clamp(20px,3vw,28px)', fontWeight:900 }}>ZN</span></div>
          <div style={{ background:C.primary, borderRadius:'8px', padding:'12px 16px', marginLeft:'-2px' }}><span style={{ color:C.bg, fontSize:'clamp(28px,4vw,36px)', fontWeight:900, fontStyle:'italic' }}>BET</span></div>
        </div>
        <h2 style={{ color:C.primary, fontSize:'clamp(28px,4vw,40px)', fontWeight:700, margin:'0 0 12px 0' }}>Thank You</h2>
        <p style={{ color:C.text, fontSize:'clamp(16px,2vw,20px)', margin:'0 0 4px 0' }}>Weekly Trading Report - Week {data.weekNumber} 2025</p>
        <p style={{ color:C.textSec, fontSize:'clamp(14px,1.5vw,18px)', margin:0 }}>DAZN Bet Italy</p>
      </Card>
    </div>
  )
}

// MAIN
export default function Dashboard() {
  const [tab, setTab] = useState('weekly')
  const [weeks, setWeeks] = useState({})
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [db, setDb] = useState({connected:false})

  useEffect(() => { (async () => { try { const c = await checkConnection(); setDb(c); const r = await loadAllWeeksData(); if (r.data && Object.keys(r.data).length) { setWeeks(r.data); setSelected(Math.max(...Object.keys(r.data).map(Number))) }} catch(e){console.error(e)} setLoading(false) })() }, [])

  const handleUpload = async d => { const u = {...weeks,[d.weekNumber]:d}; setWeeks(u); setSelected(d.weekNumber); await saveWeekData(d); setTab('weekly') }
  const handleDelete = async n => { if (!confirm(`Eliminare Week ${n}?`)) return; const {[n]:_,...rest} = weeks; setWeeks(rest); await deleteWeekData(n); setSelected(Object.keys(rest).length ? Math.max(...Object.keys(rest).map(Number)) : null) }

  const weekNums = Object.keys(weeks).map(Number).sort((a,b)=>b-a)
  const current = selected ? weeks[selected] : null
  const prev = selected && weeks[selected-1] ? weeks[selected-1] : null

  if (loading) return <div style={{ minHeight:'100vh', background:C.bg, display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ textAlign:'center' }}><div style={{ width:'48px', height:'48px', border:`3px solid ${C.border}`, borderTopColor:C.primary, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} /><p style={{ color:C.primary, fontSize:'18px' }}>Loading...</p></div><style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style></div>

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color:C.text }}>
      {/* HEADER */}
      <header style={{ background:C.card, padding:'clamp(12px,1.5vw,20px) clamp(16px,3vw,40px)', position:'sticky', top:0, zIndex:100, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'clamp(12px,2vw,24px)' }}>
            <div style={{ display:'flex', alignItems:'center' }}>
              <div style={{ background:C.bg, border:`2px solid ${C.text}`, borderRadius:'6px', padding:'5px 8px', display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1 }}><span style={{ color:C.text, fontSize:'clamp(10px,1.2vw,14px)', fontWeight:900 }}>DA</span><span style={{ color:C.text, fontSize:'clamp(10px,1.2vw,14px)', fontWeight:900 }}>ZN</span></div>
              <div style={{ background:C.primary, borderRadius:'6px', padding:'5px 8px', marginLeft:'-2px' }}><span style={{ color:C.bg, fontSize:'clamp(14px,1.8vw,20px)', fontWeight:900, fontStyle:'italic' }}>BET</span></div>
            </div>
            <div>
              <h1 style={{ color:C.text, fontSize:'clamp(14px,1.8vw,20px)', fontWeight:700, margin:0 }}>Weekly Trading Report</h1>
              <p style={{ color:C.textSec, fontSize:'clamp(10px,1.1vw,13px)', margin:0 }}>ITALY <span style={{ marginLeft:'8px', fontSize:'10px', padding:'2px 8px', borderRadius:'4px', background:db.connected?C.successDim:C.primaryDim, color:db.connected?C.success:C.primary }}>{db.connected?'● Cloud':'● Local'}</span></p>
            </div>
          </div>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {[{id:'weekly',icon:'📊',label:'Weekly'},{id:'monthly',icon:'📅',label:'Monthly'},{id:'upload',icon:'⬆️',label:'Upload'}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ background:tab===t.id?C.primary:'transparent', color:tab===t.id?C.bg:C.text, border:`1px solid ${tab===t.id?C.primary:C.border}`, borderRadius:'8px', padding:'clamp(8px,1vw,12px) clamp(14px,2vw,24px)', fontSize:'clamp(12px,1.3vw,15px)', fontWeight:600, cursor:'pointer' }}>{t.icon} {t.label}</button>
            ))}
          </div>
          {tab==='weekly' && weekNums.length>0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
              <select value={selected||''} onChange={e=>setSelected(Number(e.target.value))} style={{ background:C.bg, color:C.text, border:`2px solid ${C.primary}`, borderRadius:'8px', padding:'clamp(8px,1vw,12px) clamp(12px,1.5vw,20px)', fontSize:'clamp(13px,1.4vw,16px)', fontWeight:600, cursor:'pointer', minWidth:'120px' }}>{weekNums.map(w=><option key={w} value={w}>Week {w}</option>)}</select>
              {current && <span style={{ background:C.primary, color:C.bg, padding:'clamp(8px,1vw,12px) clamp(12px,1.5vw,20px)', borderRadius:'8px', fontWeight:600, fontSize:'clamp(12px,1.3vw,15px)' }}>{current.dateRange}</span>}
            </div>
          )}
        </div>
      </header>
      <main>
        {tab==='weekly' && <Weekly data={current} prev={prev} allData={weeks} />}
        {tab==='monthly' && <Monthly weeksData={weeks} />}
        {tab==='upload' && <UploadPage weeksData={weeks} onUpload={handleUpload} onDelete={handleDelete} />}
      </main>
    </div>
  )
}
