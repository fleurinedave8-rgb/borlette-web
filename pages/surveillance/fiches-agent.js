import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function FichesAgent() {
  const [agents, setAgents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(0);
  const [showVentes, setShowVentes] = useState(null);
  const PER_PAGE = 10;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/agents');
      setAgents(Array.isArray(r.data) ? r.data : []);
    } catch { setAgents([]); }
    finally { setLoading(false); }
  };

  const filtered = agents.filter(a => !search ||
    [a.nom,a.prenom,a.succursal,a.superviseur,a.imei].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));
  const paginated = filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const totalPages = Math.ceil(filtered.length/PER_PAGE);

  const handleCopy = () => {
    const txt = filtered.map(a=>`${a.prenom} ${a.nom}\t${a.succursal||'central'}\t${a.superviseur||'admin admin'}\t${a.imei||a.id}`).join('\n');
    navigator.clipboard?.writeText(txt); alert('Copié!');
  };
  const handleExcel = () => {
    const csv=[['Vendeur','Succursal','Superviseur','IMEI'],...filtered.map(a=>[`${a.prenom} ${a.nom}`,a.succursal||'central',a.superviseur||'admin admin',a.imei||a.id])].map(r=>r.join(',')).join('\n');
    const el=document.createElement('a'); el.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); el.download='agents.csv'; el.click();
  };

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE</span>
        </div>
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ margin:'0 0 16px', fontWeight:700 }}>Vente Par POS</h2>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            {[['COPIER',handleCopy],['EXCEL',handleExcel],['PDF',()=>window.print()],['IMPRIMER',()=>window.print()]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{ background:'white', border:'1px solid #ccc', borderRadius:3, padding:'6px 14px', fontWeight:700, fontSize:13, cursor:'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <label style={{ fontWeight:700, fontSize:13 }}>Search:</label>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{ padding:'6px 10px', border:'1px solid #ccc', borderRadius:4, fontSize:13, width:200 }} />
          </div>
          {loading ? <div style={{ padding:30, textAlign:'center', color:'#999' }}>Chargement...</div>
          : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead><tr style={{ background:'#f8f9fa' }}>
                  {['','Vendeur','Succursal','Superviseur','IMEI'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {paginated.length===0
                    ? <tr><td colSpan={5} style={{ padding:20, textAlign:'center', color:'#666', fontStyle:'italic' }}>No data available in table</td></tr>
                    : paginated.map((a,i)=>(
                      <tr key={a.id||i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                        <td style={{ padding:'10px 14px' }}>
                          <button onClick={()=>setShowVentes(a)} style={{ background:'white', border:'1px solid #f59e0b', color:'#f59e0b', borderRadius:4, padding:'4px 12px', fontSize:12, fontWeight:700, cursor:'pointer' }}>Ventes</button>
                        </td>
                        <td style={{ padding:'10px 14px', color:'#16a34a', fontWeight:600 }}>{a.prenom} {a.nom}</td>
                        <td style={{ padding:'10px 14px', color:'#16a34a' }}>{a.succursal||'central'}</td>
                        <td style={{ padding:'10px 14px', color:'#16a34a' }}>{a.superviseur||'admin admin'}</td>
                        <td style={{ padding:'10px 14px', color:'#16a34a', fontFamily:'monospace' }}>{a.imei||a.id||'-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, color:'#666', fontSize:13 }}>
            <span>Showing {filtered.length===0?0:page*PER_PAGE+1} to {Math.min((page+1)*PER_PAGE,filtered.length)} of {filtered.length} entries</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:3, background:'white', cursor:page===0?'default':'pointer', color:page===0?'#aaa':'#333' }}>Previous</button>
              <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{ padding:'5px 14px', border:'1px solid #dee2e6', borderRadius:3, background:'white', cursor:page>=totalPages-1?'default':'pointer', color:page>=totalPages-1?'#aaa':'#333' }}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL VENTES */}
      {showVentes && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:12, padding:24, width:'100%', maxWidth:500 }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800 }}>Ventes — {showVentes.prenom} {showVentes.nom}</h3>
            <p style={{ color:'#666' }}>Okenn vant disponib pou ajan sa a.</p>
            <button onClick={()=>setShowVentes(null)} style={{ width:'100%', padding:'11px', background:'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>Fèmen</button>
          </div>
        </div>
      )}
    </Layout>
  );
}
