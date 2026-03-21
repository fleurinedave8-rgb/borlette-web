import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const ACTION_COLORS = {
  'Koneksyon':'#1a73e8','Kreye Fich':'#16a34a','Elimine Fich':'#dc2626',
  'Ajoute Ajan':'#7c3aed','Antre Rezilta':'#f59e0b','Bloke Boule':'#dc2626',
};
const fmtTime = d => {
  if (!d) return '—';
  const dt = new Date(d), p = n => String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
};
const roleColor = r => r==='admin'?'#1a73e8':r==='superadmin'?'#7c3aed':'#16a34a';

export default function Tracabilite() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,   setDebut]   = useState(today);
  const [fin,     setFin]     = useState(today);
  const [action,  setAction]  = useState('');
  const [logs,    setLogs]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(0);
  const [live,    setLive]    = useState(false);
  const PER = 20;

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/logs',
        { params: { debut, fin, action: action || undefined } });
      setLogs(Array.isArray(r.data) ? r.data : []);
      setPage(0);
    } catch { setLogs([]); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    let t;
    if (live) t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [live]);

  const filtered = (logs || []).filter(l => !search ||
    [l.username, l.action, l.route, l.ip, l.role]
      .some(v => String(v || '').toLowerCase().includes(search.toLowerCase())));
  const paged = filtered.slice(page * PER, (page + 1) * PER);
  const totalPages = Math.ceil(filtered.length / PER);

  return (
    <Layout>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 8px 40px' }}>

        <div style={{ background:'#1e293b', borderRadius:8, padding:'12px 20px',
          marginBottom:14, display:'flex',
          justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:15, color:'white' }}>
            🔍 Traçabilité — Audit Log
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:'#94a3b8', fontSize:12 }}>Live</span>
            <div onClick={() => setLive(l => !l)}
              style={{ width:42, height:24, borderRadius:12,
                background:live?'#16a34a':'#475569',
                cursor:'pointer', position:'relative' }}>
              <div style={{ position:'absolute', top:2,
                left:live?20:2, width:20, height:20,
                borderRadius:'50%', background:'white',
                transition:'left 0.2s' }} />
            </div>
          </div>
        </div>

        <div style={{ background:'white', borderRadius:8, padding:16,
          boxShadow:'0 1px 3px rgba(0,0,0,0.08)', marginBottom:14 }}>
          <div style={{ display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, alignItems:'end' }}>
            {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([l,v,s]) => (
              <div key={l}>
                <label style={{ display:'block', fontWeight:700,
                  fontSize:12, marginBottom:5, color:'#555' }}>{l}</label>
                <input type="date" value={v} onChange={e => s(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px',
                    border:'1.5px solid #ddd', borderRadius:6,
                    fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ display:'block', fontWeight:700,
                fontSize:12, marginBottom:5, color:'#555' }}>
                Filtre Aksyon
              </label>
              <input value={action} onChange={e => setAction(e.target.value)}
                placeholder="ex: Koneksyon..."
                style={{ width:'100%', padding:'9px 12px',
                  border:'1.5px solid #ddd', borderRadius:6,
                  fontSize:13, boxSizing:'border-box' }} />
            </div>
            <button onClick={load} disabled={loading}
              style={{ padding:'9px 24px',
                background:loading?'#ccc':'#1e293b',
                color:'white', border:'none', borderRadius:6,
                fontWeight:800, cursor:'pointer', height:40 }}>
              {loading ? '⏳' : '🔍'}
            </button>
          </div>
        </div>

        {logs !== null && (
          <div style={{ background:'white', borderRadius:8, padding:20,
            boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:14 }}>
              <span style={{ fontWeight:800, fontSize:14 }}>
                📋 {filtered.length} Aksyon
              </span>
              <input value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Rechèch..."
                style={{ padding:'6px 10px', border:'1px solid #ccc',
                  borderRadius:4, fontSize:12, width:180 }} />
            </div>

            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead>
                  <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #dee2e6' }}>
                    {['Dat & Lè','Itilizatè','Wòl','Aksyon','Route','IP','Statut'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left',
                        fontWeight:700, fontSize:11, color:'#555' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding:30, textAlign:'center',
                        color:'#888', fontStyle:'italic' }}>
                        Aucun logs — klike 🔍
                      </td>
                    </tr>
                  ) : paged.map((l, i) => (
                    <tr key={l._id || i}
                      style={{ borderBottom:'1px solid #f0f0f0',
                        background:i%2===0?'white':'#fafafa' }}>
                      <td style={{ padding:'8px 12px', fontFamily:'monospace',
                        fontSize:11, color:'#555' }}>
                        {fmtTime(l.createdAt)}
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:700 }}>
                        {l.username || '—'}
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ background:roleColor(l.role)+'22',
                          color:roleColor(l.role), borderRadius:10,
                          padding:'2px 8px', fontWeight:700, fontSize:10 }}>
                          {l.role || '—'}
                        </span>
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ background:(ACTION_COLORS[l.action]||'#555')+'22',
                          color:ACTION_COLORS[l.action]||'#555',
                          borderRadius:10, padding:'2px 8px',
                          fontWeight:700, fontSize:11 }}>
                          {l.action || '—'}
                        </span>
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:10,
                        color:'#888', fontFamily:'monospace',
                        maxWidth:150, overflow:'hidden',
                        textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {l.route || '—'}
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:10,
                        fontFamily:'monospace', color:'#888' }}>
                        {l.ip || '—'}
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ color:l.statut==='success'?'#16a34a':'#dc2626',
                          fontWeight:700 }}>
                          {l.statut === 'success' ? '✅' : '❌'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginTop:12,
                color:'#666', fontSize:12 }}>
                <span>
                  {page*PER+1}–{Math.min((page+1)*PER, filtered.length)}
                  {' / '}{filtered.length}
                </span>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => setPage(p => Math.max(0, p-1))}
                    disabled={page === 0}
                    style={{ padding:'4px 12px', border:'1px solid #ddd',
                      borderRadius:4, background:'white', cursor:'pointer',
                      color:page===0?'#aaa':'#333' }}>
                    ←
                  </button>
                  <span style={{ padding:'4px 10px', background:'#1e293b',
                    color:'white', borderRadius:4, fontWeight:700 }}>
                    {page+1}/{Math.max(1, totalPages)}
                  </span>
                  <button onClick={() => setPage(p => Math.min(totalPages-1, p+1))}
                    disabled={page >= totalPages-1}
                    style={{ padding:'4px 12px', border:'1px solid #ddd',
                      borderRadius:4, background:'white', cursor:'pointer',
                      color:page>=totalPages-1?'#aaa':'#333' }}>
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      </div>
    </Layout>
  );
}
