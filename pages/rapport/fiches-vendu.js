import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES = ['Tout','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir',
  'New-york matin','New-york soir','Ohio matin','Ohio soir','Chicago matin','Chicago soir',
  'Maryland midi','Maryland soir','Tennessee matin','Tennessee soir'];

const TYPE_LABELS = { P0:'Borlette', P1:'Loto3-P1', P2:'Loto3-P2', P3:'Loto3-P3', MAR:'Mariage', L4:'Loto 4' };

export default function FichesVendu() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,   setDebut]   = useState(today);
  const [fin,     setFin]     = useState(today);
  const [tirage,  setTirage]  = useState('Tout');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(0);
  const [groupBy, setGroupBy] = useState('fiche');
  const [selFich, setSelFich] = useState(null);
  const [wsConn,  setWsConn]  = useState(false);
  const [newFiches, setNewFiches] = useState([]);
  const [filtreAjan, setFiltreAjan] = useState('Tout'); // NEW: filtre pa ajan
  const [agents,    setAgents]    = useState([]);       // NEW: lis ajan
  const PER_PAGE = 15;

  // ── WebSocket — fich nouvo an tan reyèl ─────────────────────
  useEffect(() => {
    let ws;
    const connect = () => {
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'https://web-production-9549c.up.railway.app')
          .replace('https://','wss://').replace('http://','ws://');
        ws = new WebSocket(`${base}/ws`);
        ws.onopen  = () => setWsConn(true);
        ws.onclose = () => { setWsConn(false); setTimeout(connect, 8000); };
        ws.onerror = () => ws.close();
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'nouvelle_fiche') {
              setNewFiches(prev => [msg, ...prev].slice(0, 50));
            }
          } catch {}
        };
      } catch {}
    };
    connect();
    return () => { try { ws?.close(); } catch {} };
  }, []);

  // Chaje lis ajan
  useEffect(() => {
    api.get('/api/admin/agents').then(r => {
      setAgents(Array.isArray(r.data) ? r.data.filter(a => a.role !== 'admin' && a.role !== 'superadmin') : []);
    }).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    setNewFiches([]);
    try {
      const params = { debut, fin };
      if (tirage !== 'Tout') params.tirage = tirage;
      if (filtreAjan !== 'Tout') params.agent = filtreAjan;
      const r = await api.get('/api/admin/fiches', { params });
      const fiches = r.data?.fiches || r.data || [];
      setResult(Array.isArray(fiches) ? fiches : []);
      setPage(0);
    } catch { setResult([]); }
    finally { setLoading(false); }
  };

  // Merge fiches DB + fiches tan reyèl (dedupe pa ticket)
  const allFiches = (() => {
    if (!result) return [];
    const existing = new Set((result || []).map(f => f.ticket));
    const fresh = newFiches.filter(f => !existing.has(f.ticket));
    return [...fresh, ...(result || [])];
  })();

  const filtered = allFiches.filter(f => !search || [f.ticket,f.agent,f.tirage,f.posId,f.posNom,f.heure]
    .some(v => String(v||'').toLowerCase().includes(search.toLowerCase())));
  const paginated  = filtered.slice(page * PER_PAGE, (page+1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const totalVente = filtered.reduce((s,f) => s + parseFloat(f.vente||f.total||0), 0);
  const totalJwe   = filtered.filter(f => f.statut === 'gagnant').length;
  const totalPete  = filtered.filter(f => f.statut !== 'gagnant' && f.statut !== 'elimine').length;

  const posSummary = filtered.reduce((acc, f) => {
    const key = f.posId || f.agent || '—';
    if (!acc[key]) acc[key] = { posId:key, posNom:f.posNom||f.agent||'—', count:0, total:0, fiches:[] };
    acc[key].count++;
    acc[key].total += parseFloat(f.vente||f.total||0);
    acc[key].fiches.push(f);
    return acc;
  }, {});

  const handleExcel = () => {
    const rows = [
      ['No Ticket','POS ID','POS Nom','Agent','Tiraj','Dat','Lè','Montant','Statut'],
      ...filtered.map(f => [f.ticket,f.posId,f.posNom,f.agent,f.tirage,
        f.date ? new Date(f.date).toLocaleDateString('fr') : '—',
        f.heure||'—', f.vente||f.total||0, f.statut||'actif'])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `fiches-vendu-${debut}-${fin}.csv`;
    a.click();
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr',{day:'2-digit',month:'2-digit',year:'2-digit'}) : '—';

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* BANNIÈRE */}
        <div style={{ background:'linear-gradient(135deg,#1a73e8,#0d47a1)', borderRadius:10, padding:'14px 20px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:15, color:'white' }}>LA-PROBITE-BORLETTE — Fichè Vann</span>
          <span style={{ fontSize:11, color: wsConn?'#86efac':'#fca5a5', fontWeight:700 }}>
            {wsConn ? '🟢 Tan Reyèl Aktif' : '🔴 Hòs Liy'}
          </span>
        </div>

        {/* FILTRES */}
        <div className="card" style={{ marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr auto', gap:12, marginBottom: result!==null ? 14 : 0, alignItems:'end' }}>
            {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([l,v,s]) => (
              <div key={l}>
                <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:5, color:'#555' }}>{l}</label>
                <input type="date" value={v} onChange={e => s(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:5, color:'#555' }}>Tiraj</label>
              <select value={tirage} onChange={e => setTirage(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }}>
                {TIRAGES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:5, color:'#16a34a' }}>
                👤 Ajan
              </label>
              <select value={filtreAjan} onChange={e => setFiltreAjan(e.target.value)}
                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #16a34a', borderRadius:6, fontSize:13 }}>
                <option value="Tout">Tout Ajan</option>
                {agents.map(a => (
                  <option key={a._id||a.id} value={a.username}>
                    {a.prenom} {a.nom} ({a.username})
                  </option>
                ))}
              </select>
            </div>
            <button onClick={load} disabled={loading}
              style={{ padding:'9px 24px', background:loading?'#ccc':'#1a73e8', color:'white', border:'none', borderRadius:6, fontWeight:800, fontSize:14, cursor:loading?'not-allowed':'pointer', height:40 }}>
              {loading ? '⏳' : '🔍 Chèche'}
            </button>
          </div>

          {result !== null && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
              {[
                { label:'Total Fichè', val:filtered.length,                   icon:'🎫', color:'#1a73e8' },
                { label:'Total Vant',  val:`${totalVente.toFixed(0)} G`,      icon:'💰', color:'#16a34a' },
                { label:'🏆 Jwe (Gagnant)', val:totalJwe,                     icon:'🏆', color:'#f59e0b' },
                { label:'Pete (Pèdi)', val:totalPete,                          icon:'❌', color:'#dc2626' },
                { label:'POS Aktif',   val:Object.keys(posSummary).length,    icon:'🖥️', color:'#7c3aed' },
              ].map(s => (
                <div key={s.label} style={{ background:'#f8f9fa', borderRadius:8, padding:'12px 14px', borderLeft:`4px solid ${s.color}` }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
                  <div style={{ fontWeight:900, fontSize:16, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:11, color:'#888' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FICHES TAN REYÈL (si yo prezan avan search) */}
        {newFiches.length > 0 && (
          <div style={{ background:'#f0fdf4', border:'2px solid #16a34a', borderRadius:10, padding:12, marginBottom:14 }}>
            <div style={{ fontWeight:800, fontSize:13, color:'#16a34a', marginBottom:8 }}>
              🔴 LIVE — {newFiches.length} nouvèl fich depi dènye chèche:
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {newFiches.slice(0,8).map((f,i) => (
                <div key={i} onClick={() => setSelFich(f)}
                  style={{ background:'white', border:'1px solid #bbf7d0', borderRadius:8, padding:'8px 12px', cursor:'pointer', fontSize:12 }}>
                  <div style={{ fontWeight:900, color:'#f59e0b', fontFamily:'monospace' }}>{f.ticket}</div>
                  <div style={{ color:'#555' }}>{f.agent} · {f.tirage}</div>
                  <div style={{ color:'#16a34a', fontWeight:700 }}>{f.total} G · {f.heure}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result !== null && (
          <div className="card">
            {/* TOOLBAR */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', gap:8 }}>
                {[['KOPYE',()=>{ const t=filtered.map(f=>`${f.ticket}\t${f.agent}\t${f.tirage}\t${f.heure||'—'}\t${f.total}`).join('\n'); navigator.clipboard?.writeText(t); alert('Kopye!'); }],
                  ['EXCEL',handleExcel],['IMPRIMER',()=>window.print()]].map(([l,fn]) => (
                  <button key={l} onClick={fn} style={{ background:'white', border:'1px solid #ccc', borderRadius:4, padding:'6px 14px', fontWeight:700, fontSize:12, cursor:'pointer' }}>{l}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[['fiche','📋 Pa Fichè'],['pos','🖥️ Pa POS']].map(([k,l]) => (
                  <button key={k} onClick={() => setGroupBy(k)}
                    style={{ padding:'7px 14px', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer',
                      background:groupBy===k?'#1a73e8':'#f8f9fa', color:groupBy===k?'white':'#555' }}>{l}</button>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                  style={{ padding:'6px 10px', border:'1px solid #ccc', borderRadius:4, fontSize:12, width:200 }}
                  placeholder="ticket, agent, POS..." />
              </div>
            </div>

            {/* VUE PA FICH */}
            {groupBy === 'fiche' && (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #dee2e6' }}>
                      {['No Ticket','POS / Ajan','Tiraj','Lè','Montant','Jwe/Pete','Detay'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:800, fontSize:12, color:'#333' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding:30, textAlign:'center', color:'#888' }}>
                        Pa gen fichè — klike Chèche
                      </td></tr>
                    ) : paginated.map((f, i) => {
                      const isNew = newFiches.some(n => n.ticket === f.ticket);
                      const isGagnant = f.statut === 'gagnant';
                      return (
                        <tr key={f.ticket||i}
                          style={{ borderBottom:'1px solid #f0f0f0', background: isNew ? '#f0fdf4' : i%2===0?'white':'#fafafa',
                            animation: isNew ? 'fadeIn 0.5s' : 'none' }}>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ color:'#f59e0b', fontWeight:900, fontFamily:'monospace' }}>{f.ticket||'—'}</span>
                            {isNew && <span style={{ marginLeft:6, background:'#16a34a', color:'white', borderRadius:10, padding:'1px 6px', fontSize:9, fontWeight:700 }}>LIVE</span>}
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <div style={{ fontWeight:700, fontSize:12 }}>{f.agent||'—'}</div>
                            <div style={{ color:'#1a73e8', fontSize:10, fontFamily:'monospace' }}>{f.posId||'—'}</div>
                          </td>
                          <td style={{ padding:'10px 14px', fontSize:12, color:'#555' }}>{f.tirage||'—'}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:12, padding:'3px 10px', fontWeight:800, fontSize:12 }}>
                              {f.heure||fmtDate(f.date)||'—'}
                            </span>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:12, padding:'4px 12px', fontWeight:900, fontSize:13 }}>
                              {parseFloat(f.vente||f.total||0).toFixed(0)} G
                            </span>
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            {isGagnant
                              ? <span style={{ background:'#fef9c3', color:'#854d0e', borderRadius:10, padding:'3px 10px', fontWeight:700, fontSize:11 }}>🏆 JWE</span>
                              : f.statut === 'elimine'
                              ? <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:10, padding:'3px 10px', fontWeight:700, fontSize:11 }}>❌ Elimine</span>
                              : <span style={{ background:'#f1f5f9', color:'#64748b', borderRadius:10, padding:'3px 10px', fontWeight:700, fontSize:11 }}>💨 Pete</span>
                            }
                          </td>
                          <td style={{ padding:'10px 14px' }}>
                            <button onClick={() => setSelFich(f)}
                              style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                              👁️ Wè
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {filtered.length > 0 && (
                    <tfoot>
                      <tr style={{ background:'#f0fdf4', borderTop:'2px solid #dee2e6' }}>
                        <td colSpan={4} style={{ padding:'10px 14px', textAlign:'right', color:'#555', fontWeight:800 }}>
                          TOTAL — {filtered.length} fichè:
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ color:'#16a34a', fontSize:15, fontWeight:900 }}>{totalVente.toFixed(0)} G</span>
                        </td>
                        <td colSpan={2} style={{ padding:'10px 14px', fontSize:11, color:'#888' }}>
                          🏆 {totalJwe} jwe · 💨 {totalPete} pete
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* VUE PA POS */}
            {groupBy === 'pos' && (
              <div>
                {Object.values(posSummary).sort((a,b) => b.total-a.total).map((pos, i) => (
                  <div key={pos.posId} style={{ marginBottom:16, border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                    <div style={{ background:'#1e293b', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <span style={{ color:'white', fontWeight:900, fontSize:14 }}>🖥️ {pos.posId}</span>
                        {pos.posNom && <span style={{ color:'#94a3b8', fontSize:12, marginLeft:10 }}>{pos.posNom}</span>}
                      </div>
                      <div style={{ display:'flex', gap:16 }}>
                        <span style={{ color:'#94a3b8', fontSize:12 }}>{pos.count} fichè</span>
                        <span style={{ background:'#16a34a', color:'white', borderRadius:8, padding:'4px 14px', fontWeight:900 }}>
                          {pos.total.toFixed(0)} G
                        </span>
                      </div>
                    </div>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                          {['Ticket','Ajan','Tiraj','Lè','Montant','Statut','Detay'].map(h => (
                            <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pos.fiches.slice(0,20).map((f, j) => (
                          <tr key={f.ticket||j} style={{ borderBottom:'1px solid #f1f5f9', background:j%2===0?'white':'#fafafa' }}>
                            <td style={{ padding:'8px 14px', fontFamily:'monospace', color:'#f59e0b', fontWeight:700 }}>{f.ticket||'—'}</td>
                            <td style={{ padding:'8px 14px' }}>{f.agent||'—'}</td>
                            <td style={{ padding:'8px 14px', color:'#64748b' }}>{f.tirage||'—'}</td>
                            <td style={{ padding:'8px 14px' }}>
                              <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:10, padding:'2px 8px', fontWeight:800 }}>{f.heure||'—'}</span>
                            </td>
                            <td style={{ padding:'8px 14px', fontWeight:800, color:'#16a34a' }}>{parseFloat(f.vente||f.total||0).toFixed(0)} G</td>
                            <td style={{ padding:'8px 14px' }}>
                              <span style={{ color: f.statut==='gagnant'?'#f59e0b': f.statut==='elimine'?'#dc2626':'#64748b', fontWeight:700, fontSize:11 }}>
                                {f.statut==='gagnant'?'🏆 Jwe': f.statut==='elimine'?'❌':'💨 Pete'}
                              </span>
                            </td>
                            <td style={{ padding:'8px 14px' }}>
                              <button onClick={() => setSelFich(f)}
                                style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:5, padding:'3px 10px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                                👁️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                {Object.keys(posSummary).length === 0 && (
                  <div style={{ padding:40, textAlign:'center', color:'#888' }}>Pa gen done</div>
                )}
              </div>
            )}

            {/* PAGINATION */}
            {groupBy === 'fiche' && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, color:'#666', fontSize:13 }}>
                <span>Montre {filtered.length===0?0:page*PER_PAGE+1}–{Math.min((page+1)*PER_PAGE,filtered.length)} nan {filtered.length}</span>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                    style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:4, background:'white', cursor:page===0?'default':'pointer', color:page===0?'#aaa':'#333' }}>← Anvan</button>
                  <span style={{ padding:'5px 10px', background:'#1a73e8', color:'white', borderRadius:4, fontWeight:700 }}>{page+1}/{Math.max(1,totalPages)}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                    style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:4, background:'white', cursor:page>=totalPages-1?'default':'pointer', color:page>=totalPages-1?'#aaa':'#333' }}>Suiv →</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODAL DETAY FICH ═══ */}
      {selFich && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => setSelFich(null)}>
          <div style={{ background:'white', borderRadius:16, padding:0, width:'100%',
            maxWidth:480, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}
            onClick={e=>e.stopPropagation()}>
            {/* Header modal */}
            <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', padding:'16px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'white', fontWeight:900, fontSize:16, fontFamily:'monospace' }}>
                  #{selFich.ticket}
                </div>
                <div style={{ color:'#94a3b8', fontSize:11, marginTop:2 }}>
                  {selFich.tirage} · {selFich.heure || fmtDate(selFich.date)}
                </div>
              </div>
              <button onClick={() => setSelFich(null)}
                style={{ background:'rgba(255,255,255,0.1)', border:'none', color:'white',
                  borderRadius:8, width:32, height:32, cursor:'pointer', fontSize:16 }}>✕</button>
            </div>

            <div style={{ padding:20 }}>
              {/* Infos */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  ['Ajan', selFich.agent||'—'],
                  ['POS', selFich.posId||'—'],
                  ['Dat', fmtDate(selFich.date)],
                  ['Total', `${parseFloat(selFich.vente||selFich.total||0).toFixed(0)} HTG`],
                ].map(([l,v]) => (
                  <div key={l} style={{ background:'#f8f9fa', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:11, color:'#888', fontWeight:600 }}>{l}</div>
                    <div style={{ fontWeight:800, fontSize:13, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Statut */}
              <div style={{ textAlign:'center', marginBottom:14 }}>
                {selFich.statut==='gagnant'
                  ? <span style={{ background:'#fef9c3', color:'#854d0e', borderRadius:20, padding:'6px 20px', fontWeight:900, fontSize:14 }}>🏆 JWE — GAGNANT!</span>
                  : selFich.statut==='elimine'
                  ? <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:20, padding:'6px 20px', fontWeight:900 }}>❌ ELIMINE</span>
                  : selFich.statut==='bloke'
                  ? <span style={{ background:'#fef3c7', color:'#d97706', borderRadius:20, padding:'6px 20px', fontWeight:900 }}>🔒 BLOKE</span>
                  : <span style={{ background:'#f1f5f9', color:'#475569', borderRadius:20, padding:'6px 20px', fontWeight:900 }}>💨 Pete</span>
                }
              </div>

              {/* Boules */}
              {selFich.rows?.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontWeight:800, fontSize:13, marginBottom:8, color:'#333' }}>Boule yo:</div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#f8f9fa' }}>
                        {['Boule','Type','Mise'].map(h => (
                          <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:700, fontSize:11, color:'#666' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selFich.rows.map((r,i) => (
                        <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                          <td style={{ padding:'8px 12px', fontWeight:900, fontFamily:'monospace', fontSize:15, color:'#1a73e8' }}>
                            {r.boule||'—'}
                          </td>
                          <td style={{ padding:'8px 12px', fontSize:12, color:'#555' }}>
                            {TYPE_LABELS[r.type]||r.type||'—'}
                          </td>
                          <td style={{ padding:'8px 12px', fontWeight:800,
                            color: r.gratuit?'#dc2626':'#16a34a' }}>
                            {r.gratuit ? 'GRATUI' : `${r.mise||r.montant||0} G`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background:'#f0fdf4', borderTop:'2px solid #dee2e6' }}>
                        <td colSpan={2} style={{ padding:'8px 12px', fontWeight:800, color:'#555' }}>TOTAL</td>
                        <td style={{ padding:'8px 12px', fontWeight:900, color:'#16a34a', fontSize:15 }}>
                          {parseFloat(selFich.vente||selFich.total||0).toFixed(0)} HTG
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* ── AKSYON ADMIN ── */}
              {selFich.statut !== 'elimine' && (
                <div style={{ borderTop:'2px solid #f0f0f0', paddingTop:14 }}>
                  <div style={{ fontSize:12, color:'#888', fontWeight:700, marginBottom:10 }}>
                    ⚡ Aksyon Admin
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {/* ELIMINE */}
                    <button
                      onClick={async () => {
                        if (!confirm(`Elimine fich #${selFich.ticket}?\nAksyon sa a pa ka derefè.`)) return;
                        try {
                          await api.delete(`/api/admin/fiches/${selFich._id||selFich.ticket}`);
                          setSelFich(null);
                          load();
                        } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
                      }}
                      style={{ flex:1, padding:'10px 14px', background:'#dc2626', color:'white',
                        border:'none', borderRadius:8, fontWeight:800, cursor:'pointer', fontSize:13 }}>
                      🗑️ Elimine Fich
                    </button>

                    {/* BLOKE / DEBLOKE */}
                    <button
                      onClick={async () => {
                        const action = selFich.statut === 'bloke' ? 'debloke' : 'bloke';
                        if (!confirm(`${action === 'bloke' ? 'Bloke' : 'Debloke'} fich #${selFich.ticket}?`)) return;
                        try {
                          await api.put(`/api/admin/fiches/${selFich._id||selFich.ticket}/statut`, { statut: action === 'bloke' ? 'bloke' : 'actif' });
                          setSelFich(null);
                          load();
                        } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
                      }}
                      style={{ flex:1, padding:'10px 14px',
                        background: selFich.statut==='bloke' ? '#16a34a' : '#f59e0b',
                        color:'white', border:'none', borderRadius:8, fontWeight:800,
                        cursor:'pointer', fontSize:13 }}>
                      {selFich.statut==='bloke' ? '🔓 Debloke' : '🔒 Bloke Fich'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
