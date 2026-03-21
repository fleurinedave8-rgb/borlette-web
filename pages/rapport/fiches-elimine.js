import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES = ['Tout','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir',
  'New-york matin','New-york soir','Ohio matin','Ohio soir','Chicago matin','Chicago soir',
  'Maryland midi','Maryland soir','Tennessee matin','Tennessee soir'];

export default function FichesElimine() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,  setDebut]  = useState(today);
  const [fin,    setFin]    = useState(today);
  const [tirage, setTirage] = useState('Tout');
  const [result, setResult] = useState(null);
  const [loading,setLoading]= useState(false);
  const [search, setSearch] = useState('');
  const [page,   setPage]   = useState(0);
  const PER_PAGE = 15;

  const load = async () => {
    setLoading(true);
    try {
      const params = { debut, fin };
      if (tirage !== 'Tout') params.tirage = tirage;
      const r = await api.get('/api/rapport/eliminer', { params });
      const data = r.data?.data || r.data || [];
      setResult(Array.isArray(data) ? data : []);
      setPage(0);
    } catch { setResult([]); }
    finally { setLoading(false); }
  };

  const fiches = result || [];
  const filtered = fiches.filter(f => !search ||
    [f.ticket, f.agent, f.tirage, f.posId, f.heure]
      .some(v => String(v||'').toLowerCase().includes(search.toLowerCase())));
  const paginated = filtered.slice(page * PER_PAGE, (page+1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const totalVente = filtered.reduce((s,f) => s + parseFloat(f.vente||f.total||0), 0);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—';
  const fmtHeure = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  };

  const handleExcel = () => {
    const rows = [
      ['No Ticket','Agent','POS ID','Tirage','Date','Heure','Montant'],
      ...filtered.map(f => [f.ticket, f.agent, f.posId||'—', f.tirage,
        fmtDate(f.date||f.dateVente), fmtHeure(f.date||f.dateVente), f.vente||f.total||0])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `fiches-elimine-${debut}-${fin}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#dc2626', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15, color:'white' }}>❌ LA-PROBITE-BORLETTE — Fichè Elimine</span>
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
              style={{ padding:'9px 24px', background: loading?'#ccc':'#dc2626', color:'white', border:'none', borderRadius:6, fontWeight:800, fontSize:14, cursor: loading?'not-allowed':'pointer', height:40 }}>
              {loading ? '⏳' : '🔍 Chèche'}
            </button>
          </div>

          {/* STATS */}
          {result !== null && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[
                { label:'Total Elimine', val: filtered.length,              icon:'❌', color:'#dc2626' },
                { label:'Total Montant', val: `${totalVente.toFixed(2)} G`, icon:'💰', color:'#f59e0b' },
                { label:'Mwayèn/Fich',  val: filtered.length ? `${(totalVente/filtered.length).toFixed(0)} G` : '—', icon:'📊', color:'#1a73e8' },
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
                {[['KOPYE', () => { navigator.clipboard?.writeText(filtered.map(f=>`${f.ticket}\t${f.agent}\t${f.tirage}`).join('\n')); alert('Kopye!'); }],
                  ['EXCEL', handleExcel],
                  ['IMPRIMER', () => window.print()]
                ].map(([l,fn]) => (
                  <button key={l} onClick={fn} style={{ background:'white', border:'1px solid #ccc', borderRadius:4, padding:'6px 14px', fontWeight:700, fontSize:12, cursor:'pointer' }}>{l}</button>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <label style={{ fontWeight:700, fontSize:12 }}>Chèche:</label>
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                  style={{ padding:'6px 10px', border:'1px solid #ccc', borderRadius:4, fontSize:12, width:180 }}
                  placeholder="ticket, agent..." />
              </div>
            </div>

            {/* TABLEAU */}
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #dee2e6' }}>
                    {['No Ticket','Agent','POS ID','Tiraj','Dat','⏰ Lè','💰 Montant'].map(h => (
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:800, fontSize:12, color:'#333' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding:30, textAlign:'center', color:'#888', fontStyle:'italic' }}>
                      Aucun fichè elimine pou peryòd sa
                    </td></tr>
                  ) : paginated.map((f, i) => (
                    <tr key={f.ticket||i} style={{ borderBottom:'1px solid #f0f0f0', background: i%2===0?'white':'#fafafa' }}>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ color:'#dc2626', fontWeight:800, fontFamily:'monospace' }}>{f.ticket||'—'}</span>
                      </td>
                      <td style={{ padding:'10px 14px', fontWeight:600 }}>{f.agent||'—'}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ color:'#1a73e8', fontWeight:700, fontSize:11, fontFamily:'monospace' }}>{f.posId||'—'}</span>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, color:'#555' }}>{f.tirage||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, color:'#888' }}>{fmtDate(f.date||f.dateVente)}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:12, padding:'3px 10px', fontWeight:800, fontSize:12 }}>
                          ⏰ {fmtHeure(f.date||f.dateVente)}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:12, padding:'4px 12px', fontWeight:900, fontSize:13 }}>
                          {parseFloat(f.vente||f.total||0).toFixed(0)} G
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr style={{ background:'#fef2f2', fontWeight:900, borderTop:'2px solid #dee2e6' }}>
                      <td colSpan={6} style={{ padding:'10px 14px', textAlign:'right', color:'#555', fontWeight:800 }}>
                        TOTAL — {filtered.length} fichè elimine:
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ color:'#dc2626', fontSize:15, fontWeight:900 }}>{totalVente.toFixed(2)} G</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* PAGINATION */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:14, color:'#666', fontSize:13 }}>
              <span>Montre {filtered.length===0?0:page*PER_PAGE+1} a {Math.min((page+1)*PER_PAGE,filtered.length)} nan {filtered.length} fichè</span>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}
                  style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:4, background:'white', cursor:page===0?'default':'pointer', color:page===0?'#aaa':'#333' }}>← Anvan</button>
                <span style={{ padding:'5px 10px', background:'#dc2626', color:'white', borderRadius:4, fontWeight:700 }}>{page+1}/{Math.max(1,totalPages)}</span>
                <button onClick={() => setPage(p => Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
                  style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:4, background:'white', cursor:page>=totalPages-1?'default':'pointer', color:page>=totalPages-1?'#aaa':'#333' }}>Suiv →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
