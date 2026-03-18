import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d => {
  if (!d) return '—';
  const dt = new Date(d), p = n => String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()}`;
};

export default function FichesAgent() {
  const [agents,   setAgents]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [fiches,   setFiches]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [loadFich, setLoadFich] = useState(false);
  const [search,   setSearch]   = useState('');
  const [debut,    setDebut]    = useState('');
  const [fin,      setFin]      = useState('');
  const [page,     setPage]     = useState(0);
  const PER = 10;

  useEffect(() => {
    api.get('/api/admin/agents')
      .then(r => setAgents(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  const loadFiches = async (agent) => {
    setSelected(agent);
    setLoadFich(true);
    setFiches([]);
    try {
      const params = { agentId: agent._id || agent.id };
      if (debut) params.debut = debut;
      if (fin)   params.fin   = fin;
      const r = await api.get('/api/admin/fiches', { params });
      setFiches(Array.isArray(r.data) ? r.data : []);
    } catch { setFiches([]); }
    setLoadFich(false);
  };

  const filtered = agents.filter(a => !search ||
    [a.nom,a.prenom,a.username].some(v =>
      String(v||'').toLowerCase().includes(search.toLowerCase())));

  const pages  = Math.ceil(filtered.length / PER);
  const paged  = filtered.slice(page*PER,(page+1)*PER);

  const tVente  = fiches.reduce((s,f)=>s+(f.total||0),0);
  const tGanyan = fiches.filter(f=>f.statut==='gagnant').length;
  const tGain   = fiches.reduce((s,f)=>s+(f.gainTotal||f.montantGagne||0),0);
  const net     = tVente - tGain;

  const STATUT_STYLE = {
    gagnant: { bg:'#dcfce7', color:'#166534' },
    elimine: { bg:'#fee2e2', color:'#991b1b' },
    actif:   { bg:'#eff6ff', color:'#1d4ed8' },
  };

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 8px 40px' }}>

        <div style={{ background:'#f59e0b', borderRadius:10,
          padding:'11px 20px', marginBottom:14,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:16, color:'#111' }}>
            LA-PROBITE-BORLETTE
          </span>
          <span style={{ fontSize:11, color:'#78350f', fontWeight:700 }}>
            Fiches pa Ajan
          </span>
        </div>

        {/* Si ajan seleksyone — montre info li ANWO */}
        {selected ? (
          <div>
            {/* Header ajan */}
            <div style={{ background:'white', borderRadius:12, padding:16,
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:16 }}>
                    {selected.prenom} {selected.nom}
                  </div>
                  <div style={{ fontSize:12, color:'#888' }}>
                    @{selected.username}
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setFiches([]); }}
                  style={{ background:'#f3f4f6', border:'none',
                    borderRadius:8, padding:'8px 14px',
                    cursor:'pointer', fontWeight:700, fontSize:12 }}>
                  ← Retou
                </button>
              </div>

              {/* Filtè dat */}
              <div style={{ display:'grid',
                gridTemplateColumns:'1fr 1fr auto', gap:8 }}>
                {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([l,v,s])=>(
                  <div key={l}>
                    <label style={{ display:'block', fontSize:11,
                      fontWeight:700, color:'#888', marginBottom:3 }}>{l}</label>
                    <input type="date" value={v}
                      onChange={e=>s(e.target.value)}
                      style={{ width:'100%', padding:'8px 10px',
                        border:'1.5px solid #ddd', borderRadius:8,
                        fontSize:12, boxSizing:'border-box' }} />
                  </div>
                ))}
                <button onClick={() => loadFiches(selected)}
                  style={{ alignSelf:'flex-end', padding:'8px 14px',
                    background:'#1a73e8', color:'white',
                    border:'none', borderRadius:8,
                    fontWeight:700, cursor:'pointer', fontSize:12 }}>
                  🔍
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
              {[
                ['Fiches', fiches.length, '#1a73e8'],
                ['Vente', `${fmt(tVente)}G`, '#16a34a'],
                ['Ganyan', tGanyan, '#f59e0b'],
                ['Net', `${fmt(net)}G`, net>=0?'#16a34a':'#dc2626'],
              ].map(([l,v,c])=>(
                <div key={l} style={{ background:'white', borderRadius:10,
                  padding:'10px', textAlign:'center',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
                  borderTop:`3px solid ${c}` }}>
                  <div style={{ fontWeight:900, fontSize:15, color:c }}>{v}</div>
                  <div style={{ fontSize:10, color:'#888', fontWeight:700 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Lis fiches */}
            {loadFich ? (
              <div style={{ textAlign:'center', padding:32,
                background:'white', borderRadius:12 }}>
                ⏳ Ap chaje fiches...
              </div>
            ) : fiches.length === 0 ? (
              <div style={{ textAlign:'center', padding:32,
                background:'white', borderRadius:12, color:'#aaa' }}>
                Pa gen fich pou ajan sa
              </div>
            ) : (
              <div style={{ background:'white', borderRadius:12,
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflowX:'auto' }}>
                <table style={{ width:'100%',
                  borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa',
                      borderBottom:'2px solid #e5e7eb' }}>
                      {['Ticket','Tiraj','Total','Gain','Dat','Statut'].map(h=>(
                        <th key={h} style={{ padding:'10px 12px',
                          fontWeight:700, fontSize:11,
                          color:'#555', textAlign:'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fiches.map((f,i)=>{
                      const st = f.statut||'actif';
                      const stStyle = STATUT_STYLE[st] || STATUT_STYLE.actif;
                      return (
                        <tr key={f._id||i}
                          style={{ borderBottom:'1px solid #f0f0f0',
                            background:i%2===0?'white':'#fafafa' }}>
                          <td style={{ padding:'9px 12px',
                            fontFamily:'monospace', color:'#f59e0b',
                            fontWeight:700 }}>{f.ticket}</td>
                          <td style={{ padding:'9px 12px',
                            fontSize:12 }}>{f.tirage||'—'}</td>
                          <td style={{ padding:'9px 12px',
                            fontWeight:700, color:'#16a34a' }}>
                            {fmt(f.total||0)}G
                          </td>
                          <td style={{ padding:'9px 12px',
                            fontWeight:700,
                            color:st==='gagnant'?'#dc2626':'#ccc' }}>
                            {st==='gagnant'
                              ? `${fmt(f.gainTotal||f.montantGagne||0)}G`
                              : '—'}
                          </td>
                          <td style={{ padding:'9px 12px',
                            fontSize:12, color:'#666' }}>
                            {fmtD(f.dateVente||f.createdAt)}
                          </td>
                          <td style={{ padding:'9px 12px' }}>
                            <span style={{ background:stStyle.bg,
                              color:stStyle.color, borderRadius:20,
                              padding:'2px 8px', fontSize:10,
                              fontWeight:700 }}>
                              {st}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        ) : (
          /* Lis ajan yo */
          <div style={{ background:'white', borderRadius:12, padding:16,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin:'0 0 14px', fontWeight:800, fontSize:16 }}>
              👤 Chwazi yon Ajan
            </h3>

            <input value={search}
              onChange={e=>{ setSearch(e.target.value); setPage(0); }}
              placeholder="🔍 Chèche ajan..."
              style={{ width:'100%', padding:'9px 12px',
                border:'1.5px solid #ddd', borderRadius:8,
                fontSize:13, marginBottom:12, boxSizing:'border-box' }} />

            {loading ? (
              <div style={{ textAlign:'center', padding:20, color:'#888' }}>
                ⏳ Ap chaje...
              </div>
            ) : paged.length === 0 ? (
              <div style={{ textAlign:'center', padding:20, color:'#aaa' }}>
                Pa gen ajan
              </div>
            ) : (
              <>
                {paged.map(a => (
                  <div key={a._id}
                    onClick={() => loadFiches(a)}
                    style={{ display:'flex', alignItems:'center',
                      justifyContent:'space-between',
                      padding:'12px 14px', borderRadius:10,
                      marginBottom:8, cursor:'pointer',
                      background:'#f8f9fa',
                      border:'1.5px solid #e5e7eb',
                      transition:'all .15s' }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:14 }}>
                        {a.prenom} {a.nom}
                      </div>
                      <div style={{ fontSize:11, color:'#888',
                        fontFamily:'monospace' }}>
                        @{a.username}
                      </div>
                    </div>
                    <div style={{ display:'flex',
                      alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:10, padding:'2px 8px',
                        borderRadius:10, fontWeight:700,
                        background:a.actif?'#dcfce7':'#fee2e2',
                        color:a.actif?'#16a34a':'#dc2626' }}>
                        {a.actif?'Aktif':'Inaktif'}
                      </span>
                      <span style={{ color:'#888', fontSize:16 }}>›</span>
                    </div>
                  </div>
                ))}

                {pages > 1 && (
                  <div style={{ display:'flex',
                    justifyContent:'center', gap:8, marginTop:12 }}>
                    <button
                      onClick={()=>setPage(p=>Math.max(0,p-1))}
                      disabled={page===0}
                      style={{ padding:'5px 12px',
                        border:'1px solid #ddd', borderRadius:6,
                        background:'white', cursor:'pointer',
                        color:page===0?'#ccc':'#333' }}>
                      ←
                    </button>
                    <span style={{ fontSize:12, alignSelf:'center',
                      color:'#666' }}>
                      {page+1}/{pages}
                    </span>
                    <button
                      onClick={()=>setPage(p=>Math.min(pages-1,p+1))}
                      disabled={page>=pages-1}
                      style={{ padding:'5px 12px',
                        border:'1px solid #ddd', borderRadius:6,
                        background:'white', cursor:'pointer',
                        color:page>=pages-1?'#ccc':'#333' }}>
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
