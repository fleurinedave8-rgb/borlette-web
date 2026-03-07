import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES = ['Tout','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir',
  'New-york matin','New-york soir','Ohio matin','Ohio soir','Chicago matin','Chicago soir',
  'Maryland midi','Maryland soir','Tennessee matin','Tennessee soir'];

export default function FichesVendu() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,  setDebut]  = useState(today);
  const [fin,    setFin]    = useState(today);
  const [tirage, setTirage] = useState('Tout');
  const [result, setResult] = useState(null);
  const [loading,setLoading]= useState(false);
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);
  const [groupBy,setGroupBy]= useState('fiche'); // 'fiche' | 'pos'
  const PER_PAGE = 15;

  const load = async () => {
    setLoading(true);
    try {
      const params = { debut, fin };
      if (tirage !== 'Tout') params.tirage = tirage;
      const r = await api.get('/api/admin/fiches', { params });
      const fiches = r.data?.fiches || r.data || [];
      setResult(Array.isArray(fiches) ? fiches : []);
      setPage(0);
    } catch { setResult([]); }
    finally { setLoading(false); }
  };

  const fiches = result || [];
  const filtered = fiches.filter(f => !search || [f.ticket,f.agent,f.tirage,f.posId,f.posNom,f.heure]
    .some(v => String(v||'').toLowerCase().includes(search.toLowerCase())));
  const paginated = filtered.slice(page * PER_PAGE, (page+1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const totalVente = filtered.reduce((s,f) => s + parseFloat(f.vente||f.total||0), 0);

  // Grouper par POS
  const posSummary = filtered.reduce((acc, f) => {
    const key = f.posId || f.agent || '—';
    if (!acc[key]) acc[key] = { posId: key, posNom: f.posNom||f.agent||'—', count: 0, total: 0, fiches: [] };
    acc[key].count++;
    acc[key].total += parseFloat(f.vente||f.total||0);
    acc[key].fiches.push(f);
    return acc;
  }, {});

  const handleExcel = () => {
    const rows = [
      ['No Ticket','POS ID','POS Nom','Agent','Tirage','Date','Heure','Montant','Statut'],
      ...filtered.map(f => [f.ticket, f.posId, f.posNom, f.agent, f.tirage,
        f.date ? new Date(f.date).toLocaleDateString('fr') : '—',
        f.heure || '—', f.vente||f.total||0, f.statut||'actif'])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `fiches-vendu-${debut}-${fin}.csv`;
    a.click();
  };
  const handleCopy = () => {
    const text = filtered.map(f => `${f.ticket}\t${f.posId}\t${f.agent}\t${f.tirage}\t${f.heure||'—'}\t${f.vente||f.total}`).join('\n');
    navigator.clipboard?.writeText(text);
    alert('Kopye!');
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr', { day:'2-digit', month:'2-digit', year:'2-digit' });
  };

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Fichè Vann</span>
        </div>

        {/* FILTRES */}
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', marginBottom:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, marginBottom:14, alignItems:'end' }}>
            {[['Debut', debut, setDebut], ['Fin', fin, setFin]].map(([l,v,s]) => (
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
            <button onClick={load} disabled={loading}
              style={{ padding:'9px 24px', background: loading?'#ccc':'#1a73e8', color:'white', border:'none', borderRadius:6, fontWeight:800, fontSize:14, cursor: loading?'not-allowed':'pointer', height:40 }}>
              {loading ? '⏳' : '🔍 Chèche'}
            </button>
          </div>

          {/* STATS CARDS */}
          {result !== null && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {[
                { label:'Total Fichè', val: filtered.length,                             icon:'🎫', color:'#1a73e8' },
                { label:'Total Vant',  val: `${totalVente.toFixed(2)} G`,               icon:'💰', color:'#16a34a' },
                { label:'POS Aktif',   val: Object.keys(posSummary).length,             icon:'🖥️', color:'#7c3aed' },
                { label:'Mwayèn/Fich', val: filtered.length ? `${(totalVente/filtered.length).toFixed(0)} G` : '—', icon:'📊', color:'#f59e0b' },
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

        {result !== null && (
          <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>

            {/* TOOLBAR */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', gap:8 }}>
                {[['KOPYE', handleCopy], ['EXCEL', handleExcel], ['IMPRIMER', () => window.print()]].map(([l,fn]) => (
                  <button key={l} onClick={fn} style={{ background:'white', border:'1px solid #ccc', borderRadius:4, padding:'6px 14px', fontWeight:700, fontSize:12, cursor:'pointer' }}>{l}</button>
                ))}
              </div>

              {/* TOGGLE VUE */}
              <div style={{ display:'flex', gap:6 }}>
                {[['fiche','📋 Pa Fichè'],['pos','🖥️ Pa POS']].map(([k,l]) => (
                  <button key={k} onClick={() => setGroupBy(k)}
                    style={{ padding:'7px 14px', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer',
                      background: groupBy===k ? '#1a73e8' : '#f8f9fa', color: groupBy===k ? 'white' : '#555' }}>
                    {l}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <label style={{ fontWeight:700, fontSize:12 }}>Chèche:</label>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                  style={{ padding:'6px 10px', border:'1px solid #ccc', borderRadius:4, fontSize:12, width:180 }}
                  placeholder="ticket, agent, POS..." />
              </div>
            </div>

            {/* ══ VUE PAR FICHE ══ */}
            {groupBy === 'fiche' && (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #dee2e6' }}>
                      {['No Ticket','POS ID','Ajan','Tiraj','Dat','⏰ Lè','💰 Montant','Statut'].map(h => (
                        <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:800, fontSize:12, color:'#333' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding:30, textAlign:'center', color:'#888', fontStyle:'italic' }}>
                        Pa gen fichè pou peryòd sa — klike Chèche
                      </td></tr>
                    ) : paginated.map((f, i) => (
                      <tr key={f.ticket||i} style={{ borderBottom:'1px solid #f0f0f0', background: i%2===0?'white':'#fafafa' }}>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ color:'#f59e0b', fontWeight:800, fontFamily:'monospace' }}>{f.ticket || '—'}</span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ color:'#1a73e8', fontWeight:700, fontSize:11, fontFamily:'monospace' }}>{f.posId || '—'}</span>
                          {f.posNom && f.posNom !== f.posId && (
                            <div style={{ color:'#888', fontSize:10 }}>{f.posNom}</div>
                          )}
                        </td>
                        <td style={{ padding:'10px 14px', fontWeight:600 }}>{f.agent || '—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:12, color:'#555' }}>{f.tirage || '—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:11, color:'#888' }}>{fmtDate(f.date)}</td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:12, padding:'3px 10px', fontWeight:800, fontSize:12 }}>
                            ⏰ {f.heure || '—'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:12, padding:'4px 12px', fontWeight:900, fontSize:13 }}>
                            {parseFloat(f.vente||f.total||0).toFixed(0)} G
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{
                            background: f.statut==='elimine' ? '#fee2e2' : '#dcfce7',
                            color: f.statut==='elimine' ? '#dc2626' : '#16a34a',
                            borderRadius:12, padding:'3px 10px', fontWeight:700, fontSize:11
                          }}>
                            {f.statut === 'elimine' ? '❌ Elimine' : '✅ Aktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {filtered.length > 0 && (
                    <tfoot>
                      <tr style={{ background:'#f0fdf4', fontWeight:900, borderTop:'2px solid #dee2e6' }}>
                        <td colSpan={6} style={{ padding:'10px 14px', textAlign:'right', color:'#555', fontWeight:800 }}>
                          TOTAL — {filtered.length} fichè:
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ color:'#16a34a', fontSize:15, fontWeight:900 }}>{totalVente.toFixed(2)} G</span>
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* ══ VUE PAR POS ══ */}
            {groupBy === 'pos' && (
              <div>
                {Object.values(posSummary).sort((a,b) => b.total - a.total).map((pos, i) => (
                  <div key={pos.posId} style={{ marginBottom:16, border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden' }}>
                    {/* HEADER POS */}
                    <div style={{ background:'#1e293b', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <span style={{ color:'white', fontWeight:900, fontSize:14 }}>🖥️ {pos.posId}</span>
                        {pos.posNom && <span style={{ color:'#94a3b8', fontSize:12, marginLeft:10 }}>{pos.posNom}</span>}
                      </div>
                      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                        <span style={{ color:'#94a3b8', fontSize:12 }}>{pos.count} fichè</span>
                        <span style={{ background:'#16a34a', color:'white', borderRadius:8, padding:'4px 14px', fontWeight:900, fontSize:14 }}>
                          {pos.total.toFixed(0)} G
                        </span>
                      </div>
                    </div>

                    {/* FICHES DU POS */}
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                          {['No Ticket','Ajan','Tiraj','⏰ Lè','💰 Montant','Statut'].map(h => (
                            <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontWeight:700, color:'#64748b', fontSize:11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pos.fiches.slice(0, 20).map((f, j) => (
                          <tr key={f.ticket||j} style={{ borderBottom:'1px solid #f1f5f9', background: j%2===0?'white':'#fafafa' }}>
                            <td style={{ padding:'8px 14px', fontFamily:'monospace', color:'#f59e0b', fontWeight:700 }}>{f.ticket||'—'}</td>
                            <td style={{ padding:'8px 14px' }}>{f.agent||'—'}</td>
                            <td style={{ padding:'8px 14px', color:'#64748b' }}>{f.tirage||'—'}</td>
                            <td style={{ padding:'8px 14px' }}>
                              <span style={{ background:'#fef3c7', color:'#92400e', borderRadius:10, padding:'2px 8px', fontWeight:800 }}>
                                {f.heure||'—'}
                              </span>
                            </td>
                            <td style={{ padding:'8px 14px', fontWeight:800, color:'#16a34a' }}>{parseFloat(f.vente||f.total||0).toFixed(0)} G</td>
                            <td style={{ padding:'8px 14px' }}>
                              <span style={{ color: f.statut==='elimine'?'#dc2626':'#16a34a', fontWeight:700, fontSize:11 }}>
                                {f.statut==='elimine'?'❌':'✅'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {pos.fiches.length > 20 && (
                          <tr><td colSpan={6} style={{ padding:'8px 14px', color:'#94a3b8', fontStyle:'italic', textAlign:'center' }}>
                            +{pos.fiches.length - 20} fichè anplis...
                          </td></tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr style={{ background:'#f0fdf4', borderTop:'1px solid #bbf7d0' }}>
                          <td colSpan={4} style={{ padding:'8px 14px', fontWeight:800, color:'#555', textAlign:'right' }}>Total POS {pos.posId}:</td>
                          <td style={{ padding:'8px 14px', fontWeight:900, color:'#16a34a', fontSize:14 }}>{pos.total.toFixed(0)} G</td>
                          <td />
                        </tr>
                      </tfoot>
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
                <span>Montre {filtered.length===0?0:page*PER_PAGE+1} a {Math.min((page+1)*PER_PAGE,filtered.length)} nan {filtered.length} fichè</span>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                    style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:4, background:'white', cursor:page===0?'default':'pointer', color:page===0?'#aaa':'#333' }}>
                    ← Anvan
                  </button>
                  <span style={{ padding:'5px 10px', background:'#1a73e8', color:'white', borderRadius:4, fontWeight:700 }}>{page+1}/{Math.max(1,totalPages)}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                    style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:4, background:'white', cursor:page>=totalPages-1?'default':'pointer', color:page>=totalPages-1?'#aaa':'#333' }}>
                    Suiv →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
