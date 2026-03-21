import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d => {
  if(!d)return'—';
  const dt=new Date(d),p=n=>String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()}`;
};

const TIRAGES = ['Tout','Florida matin','Florida soir',
  'New-york matin','New-york soir','Georgia-Matin','Georgia-Soir',
  'Ohio matin','Ohio soir','Chicago matin','Chicago soir'];

export default function VentesFinTirage() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,   setDebut]   = useState(today);
  const [fin,     setFin]     = useState(today);
  const [tirage,  setTirage]  = useState('Tout');
  const [agents,  setAgents]  = useState([]);
  const [selAjan, setSelAjan] = useState('Tout');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [detAjan, setDetAjan] = useState(null);

  useEffect(()=>{
    api.get('/api/admin/agents')
      .then(r=>setAgents((r.data||[]).filter(a=>a.role==='agent')))
      .catch(()=>{});
  },[]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { debut, fin };
      if (tirage!=='Tout') params.tirage = tirage;
      if (selAjan!=='Tout') params.agentId = selAjan;
      const r = await api.get('/api/rapport/tirage', { params });
      setResult(r.data||{});
      setDetAjan(null);
    } catch { setResult({}); }
    setLoading(false);
  };

  const agentList = result?.agents || [];
  const tVente = result?.vente || 0;
  const tGain  = result?.ganyan || 0;
  const tNet   = Number(tVente) - Number(tGain);

  return (
    <Layout>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'0 8px 40px'}}>

        <div style={{background:'#0891b2',borderRadius:10,
          padding:'11px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:900,fontSize:16,color:'white'}}>
            📊 Ventes Fin Tirage
          </span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700}}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        {/* FILTÈ */}
        <div style={{background:'white',borderRadius:12,padding:16,
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)',marginBottom:14}}>
          <div style={{display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:10,alignItems:'flex-end'}}>
            {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([l,v,s])=>(
              <div key={l}>
                <label style={{display:'block',fontSize:11,fontWeight:700,
                  color:'#888',marginBottom:3}}>{l}</label>
                <input type="date" value={v} onChange={e=>s(e.target.value)}
                  style={{width:'100%',padding:'8px 10px',border:'1.5px solid #ddd',
                    borderRadius:8,fontSize:12,boxSizing:'border-box'}} />
              </div>
            ))}
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,
                color:'#888',marginBottom:3}}>Tiraj</label>
              <select value={tirage} onChange={e=>setTirage(e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:12}}>
                {TIRAGES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,
                color:'#888',marginBottom:3}}>Ajan</label>
              <select value={selAjan} onChange={e=>setSelAjan(e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:12}}>
                <option value="Tout">Tout</option>
                {agents.map(a=>(
                  <option key={a._id||a.id} value={a._id||a.id}>
                    {a.prenom} {a.nom}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={load} disabled={loading}
              style={{padding:'8px 20px',background:'#0891b2',color:'white',
                border:'none',borderRadius:8,fontWeight:700,
                cursor:'pointer',fontSize:13}}>
              {loading?'⏳':'🔍 Chèche'}
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* STATS GLOBAL */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',
              gap:8,marginBottom:14}}>
              {[
                ['Ventes totales',   `${fmt(tVente)} G`, '#16a34a'],
                ['Paiements Gagnants',  `${fmt(tGain)} G`,  '#dc2626'],
                ['Net (Vant-Gan)',`${fmt(tNet)} G`,    tNet>=0?'#16a34a':'#dc2626'],
              ].map(([l,v,c])=>(
                <div key={l} style={{background:'white',borderRadius:10,
                  padding:'14px',textAlign:'center',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
                  borderTop:`3px solid ${c}`}}>
                  <div style={{fontWeight:900,fontSize:18,color:c}}>{v}</div>
                  <div style={{fontSize:11,color:'#888',fontWeight:700}}>{l}</div>
                </div>
              ))}
            </div>

            {/* EN-TÈT RAPÒ */}
            <div style={{background:'white',borderRadius:12,padding:16,
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)',marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:900,fontSize:15}}>
                    Rapport — {fmtD(debut)} → {fmtD(fin)}
                  </div>
                  <div style={{fontSize:12,color:'#888',marginTop:2}}>
                    Tiraj: {tirage} | {result.fiches||0} fiches |
                    Dat: {new Date().toLocaleDateString('fr')} {new Date().toLocaleTimeString('fr')}
                  </div>
                </div>
                <button onClick={()=>window.print()}
                  style={{background:'#374151',color:'white',border:'none',
                    borderRadius:8,padding:'8px 16px',fontWeight:700,
                    cursor:'pointer',fontSize:12}}>
                  🖨️ Enprime
                </button>
              </div>
            </div>

            {/* TABLO PA AJAN */}
            {agentList.length>0 && (
              <div style={{background:'white',borderRadius:12,
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden',
                marginBottom:12}}>
                <div style={{background:'#0f172a',padding:'12px 16px'}}>
                  <span style={{color:'white',fontWeight:900,fontSize:14}}>
                    👤 Detay pa Ajan
                  </span>
                </div>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{background:'#f8f9fa',borderBottom:'2px solid #e5e7eb'}}>
                      {['Ajan','Fiches','Vente','Ganyan','Net','Detay'].map(h=>(
                        <th key={h} style={{padding:'10px 12px',fontWeight:700,
                          fontSize:11,color:'#555',textAlign:'left'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agentList.map((a,i)=>{
                      const n = Number(a.net||a.vente-a.gain||0);
                      return (
                        <tr key={a._id||i}
                          style={{borderBottom:'1px solid #f0f0f0',
                            background:detAjan===a._id?'#eff6ff':i%2===0?'white':'#fafafa'}}>
                          <td style={{padding:'10px 12px',fontWeight:700}}>
                            {a.prenom||''} {a.nom||a.username||'—'}
                          </td>
                          <td style={{padding:'10px 12px'}}>{a.ficheCount||0}</td>
                          <td style={{padding:'10px 12px',fontWeight:700,
                            color:'#16a34a'}}>{fmt(a.vente)} G</td>
                          <td style={{padding:'10px 12px',color:'#dc2626',
                            fontWeight:700}}>{fmt(a.gain)} G</td>
                          <td style={{padding:'10px 12px',fontWeight:900,
                            color:n>=0?'#16a34a':'#dc2626'}}>
                            {fmt(n)} G
                            {n<0&&<span style={{fontSize:9,background:'#fee2e2',
                              color:'#991b1b',borderRadius:10,padding:'1px 5px',
                              marginLeft:4,fontWeight:700}}>DEFISI</span>}
                          </td>
                          <td style={{padding:'10px 12px'}}>
                            <button
                              onClick={()=>setDetAjan(detAjan===a._id?null:a._id)}
                              style={{background:'#0891b2',color:'white',
                                border:'none',borderRadius:6,
                                padding:'4px 10px',cursor:'pointer',
                                fontSize:11,fontWeight:700}}>
                              {detAjan===a._id?'Fèmen':'Detay'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{background:'#0f172a'}}>
                      <td style={{padding:'10px 12px',color:'white',fontWeight:800}}>
                        TOTAL
                      </td>
                      <td style={{padding:'10px 12px',color:'#94a3b8'}}>
                        {result.fiches||0}
                      </td>
                      <td style={{padding:'10px 12px',color:'#4ade80',fontWeight:900}}>
                        {fmt(tVente)} G
                      </td>
                      <td style={{padding:'10px 12px',color:'#f87171',fontWeight:900}}>
                        {fmt(tGain)} G
                      </td>
                      <td style={{padding:'10px 12px',fontWeight:900,fontSize:15,
                        color:tNet>=0?'#4ade80':'#f87171'}}>
                        {fmt(tNet)} G
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* DETAY AJAN SELEKSYONE */}
            {detAjan && agentList.find(a=>a._id===detAjan) && (
              <div style={{background:'white',borderRadius:12,padding:16,
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                borderLeft:'4px solid #0891b2'}}>
                {(()=>{
                  const a = agentList.find(x=>x._id===detAjan);
                  return (
                    <>
                      <h3 style={{margin:'0 0 12px',fontWeight:900,fontSize:15}}>
                        📋 {a.prenom||''} {a.nom||a.username}
                      </h3>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                        <thead>
                          <tr style={{background:'#f8f9fa'}}>
                            {['Ticket','Tiraj','Total','Statut','Dat'].map(h=>(
                              <th key={h} style={{padding:'8px 10px',fontWeight:700,
                                fontSize:11,color:'#555',textAlign:'left'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(a.fiches||[]).slice(0,30).map((f,i)=>(
                            <tr key={i} style={{borderBottom:'1px solid #f0f0f0'}}>
                              <td style={{padding:'7px 10px',fontFamily:'monospace',
                                color:'#f59e0b',fontWeight:700}}>{f.ticket}</td>
                              <td style={{padding:'7px 10px',fontSize:11}}>{f.tirage||'—'}</td>
                              <td style={{padding:'7px 10px',fontWeight:700}}>
                                {fmt(f.total||0)} G
                              </td>
                              <td style={{padding:'7px 10px'}}>
                                <span style={{
                                  background:f.statut==='gagnant'?'#dcfce7':f.statut==='elimine'?'#fee2e2':'#f1f5f9',
                                  color:f.statut==='gagnant'?'#166534':f.statut==='elimine'?'#991b1b':'#475569',
                                  borderRadius:20,padding:'2px 6px',fontSize:10,fontWeight:700}}>
                                  {f.statut||'actif'}
                                </span>
                              </td>
                              <td style={{padding:'7px 10px',fontSize:11,color:'#888'}}>
                                {fmtD(f.dateVente)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
