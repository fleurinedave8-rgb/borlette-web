import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function Journalier() {
  const today = new Date().toISOString().split('T')[0];
  const [debut, setDebut]   = useState(today);
  const [fin, setFin]       = useState(today);
  const [qtyPos, setQtyPos] = useState(0);
  const [agents, setAgents] = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [recap, setRecap]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/journalier', { params:{ debut, fin } });
      setAgents(Array.isArray(r.data?.agents)?r.data.agents:[]);
      setSuperviseurs(Array.isArray(r.data?.superviseurs)?r.data.superviseurs:[]);
      setRecap(r.data?.recap||null);
      setQtyPos(r.data?.qtyPos||0);
    } catch {
      setAgents([]); setSuperviseurs([]); setRecap(null);
    } finally { setLoading(false); }
  };

  const filteredAgents = agents.filter(a => !search || [a.agent,a.tfiche,a.vente].some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));

  const handleCopy  = () => { navigator.clipboard?.writeText(filteredAgents.map((a,i)=>`${i+1}\t${a.agent}\t${a.tfiche}\t${a.vente}\t${a.apaye}\t${a.pctAgent}\t${a.ppSans}\t${a.ppAvec}\t${a.pctSup}\t${a.bFinal}`).join('\n')); alert('Copié!'); };
  const handleExcel = () => {
    const csv=[['No','Agent','TFiche','Vente','A payé','%Agent','P/P sans %agent','P/P avec %agent','%Sup','B.Final'],...filteredAgents.map((a,i)=>[i+1,a.agent,a.tfiche,a.vente,a.apaye,a.pctAgent,a.ppSans,a.ppAvec,a.pctSup,a.bFinal])].map(r=>r.join(',')).join('\n');
    const el=document.createElement('a'); el.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); el.download='journalier.csv'; el.click();
  };

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE</span>
        </div>
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <h2 style={{ textAlign:'center', fontWeight:900, fontSize:22, marginBottom:16 }}>Rapport journalier</h2>

          {/* FILTRES */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end', marginBottom:16 }}>
            {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([label,val,setter])=>(
              <div key={label}>
                <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>{label}</label>
                <div style={{ display:'flex', alignItems:'center', border:'1px solid #ccc', borderRadius:4, padding:'8px 12px' }}>
                  <input type="date" value={val} onChange={e=>setter(e.target.value)} style={{ border:'none', outline:'none', fontSize:14 }} />
                  <span style={{ color:'#16a34a', fontWeight:900 }}>✓</span>
                </div>
              </div>
            ))}
            <div>
              <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>Quantité POS</label>
              <div style={{ border:'1px solid #ccc', borderRadius:4, padding:'8px 12px', fontWeight:700, minWidth:60, textAlign:'center' }}>{qtyPos}</div>
            </div>
            <button onClick={load} disabled={loading}
              style={{ padding:'10px 24px', background:'#1a73e8', color:'white', border:'none', borderRadius:4, fontWeight:700, cursor:'pointer', fontSize:14, alignSelf:'flex-end' }}>
              {loading?'...':'Rechercher'}
            </button>
          </div>

          {/* SECTION AGENTS */}
          <h3 style={{ fontWeight:800, marginBottom:10 }}>Agents</h3>
          <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
            {[['COPIER',handleCopy],['EXCEL',handleExcel],['PDF',()=>window.print()],['IMPRIMER',()=>window.print()]].map(([l,fn])=>(
              <button key={l} onClick={fn} style={{ background:'white', border:'1px solid #ccc', borderRadius:3, padding:'6px 14px', fontWeight:700, fontSize:13, cursor:'pointer' }}>{l}</button>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <label style={{ fontWeight:700, fontSize:13 }}>Search:</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:'6px 10px', border:'1px solid #ccc', borderRadius:4, fontSize:13, width:200 }} />
          </div>
          <div style={{ overflowX:'auto', marginBottom:20 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr style={{ background:'#f8f9fa' }}>
                {['No','Agent','Tfiche','Vente','A payé','%Agent','P/P sans %agent','P/P avec %agent','%Sup','B.Final'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredAgents.length===0
                  ? <tr><td colSpan={10} style={{ padding:20, textAlign:'center', color:'#666', fontStyle:'italic' }}>No data available in table</td></tr>
                  : filteredAgents.map((a,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                      <td style={{ padding:'8px 10px' }}>{i+1}</td>
                      <td style={{ padding:'8px 10px', fontWeight:600 }}>{a.agent}</td>
                      <td style={{ padding:'8px 10px', textAlign:'center' }}>{a.tfiche||0}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{a.vente||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{a.apaye||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{a.pctAgent||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{a.ppSans||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{a.ppAvec||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{a.pctSup||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:'#16a34a' }}>{a.bFinal||'0.00'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* SECTION SUPERVISEUR */}
          <h3 style={{ fontWeight:800, marginBottom:10 }}>Superviseur</h3>
          <div style={{ overflowX:'auto', marginBottom:20 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead><tr style={{ background:'#f8f9fa' }}>
                {['Superviseur','Total ventes','A payé','Pourcentage','Balance'].map(h=>(
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {superviseurs.length===0
                  ? <tr><td colSpan={5} style={{ padding:20, textAlign:'center', color:'#666', fontStyle:'italic' }}>No data available in table</td></tr>
                  : superviseurs.map((s,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #dee2e6' }}>
                      <td style={{ padding:'8px 10px', fontWeight:600 }}>{s.superviseur}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{s.totalVentes||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{s.apaye||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right' }}>{s.pourcentage||'0.00'}</td>
                      <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:'#16a34a' }}>{s.balance||'0.00'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* RÉCAP */}
          <div style={{ background:'#f8f9fa', borderRadius:8, padding:16, marginBottom:16 }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead><tr style={{ background:'#e5e7eb' }}>
                  {['TFiche','Vente','A payé','%Agent','Balance Sans %agent','Balance Avec %age','%Superviseur','Balance Sans %superviseur','Balance Avec %supervise'].map(h=>(
                    <th key={h} style={{ padding:'8px 10px', fontWeight:700, borderBottom:'2px solid #dee2e6', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  <tr>
                    {[recap?.tfiche||0, recap?.vente||'1,405.00', recap?.apaye||'0.00', recap?.pctAgent||'0.00',
                      recap?.balSans||'1,405.00', recap?.balAvec||'1,405.00', recap?.pctSup||'0.00',
                      recap?.balSupSans||'1,405.00', recap?.balSupAvec||'1,405.00'].map((v,i)=>(
                      <td key={i} style={{ padding:'8px 10px', textAlign:'center', fontWeight:700, borderBottom:'1px solid #dee2e6' }}>{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ textAlign:'center' }}>
            <button onClick={()=>window.print()} style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:4, padding:'11px 40px', fontWeight:700, fontSize:14, cursor:'pointer' }}>Imprimer</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
