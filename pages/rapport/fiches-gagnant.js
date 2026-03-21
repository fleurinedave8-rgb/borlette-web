import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d => {
  if(!d)return'—';
  const dt=new Date(d),p=n=>String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()}`;
};
const TYPE_L={P0:'BORLETTE',P1:'LOTO3-P1',P2:'LOTO3-P2',P3:'LOTO3-P3',
  MAR:'MARIAGE',L4:'LOTO4',MG:'MAR.GRAT'};
const TYPE_C={P0:'#16a34a',P1:'#1a73e8',P2:'#7c3aed',P3:'#f59e0b',
  MAR:'#dc2626',L4:'#0891b2',MG:'#ec4899'};

export default function FichesGagnant() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,   setDebut]   = useState(today);
  const [fin,     setFin]     = useState(today);
  const [agents,  setAgents]  = useState([]);
  const [agent,   setAgent]   = useState('Tout');
  const [statut,  setStatut]  = useState('tout');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [selFich, setSelFich] = useState(null);
  const [payMsg,  setPayMsg]  = useState('');

  useEffect(()=>{
    api.get('/api/admin/agents')
      .then(r=>setAgents((r.data||[]).filter(a=>a.role==='agent')))
      .catch(()=>{});
  },[]);

  const load = async () => {
    setLoading(true);
    try {
      const params = { debut, fin };
      if (agent!=='Tout') params.agent = agent;
      if (statut!=='tout') params.statut = statut;
      const r = await api.get('/api/rapport/gagnant',{params});
      setResult(r.data||{fiches:[],totalMise:'0',totalGain:'0'});
      setSelFich(null);
    } catch { setResult({fiches:[],totalMise:'0',totalGain:'0'}); }
    setLoading(false);
  };

  const handlePaye = async fich => {
    try {
      await api.put(`/api/gagnant/payer/${fich.ticket}`);
      setPayMsg(`✅ Ticket #${fich.ticket} make peye!`);
      setTimeout(()=>setPayMsg(''),3000);
      await load();
    } catch(e) {
      setPayMsg(`❌ ${e?.response?.data?.message||'Erè'}`);
      setTimeout(()=>setPayMsg(''),3000);
    }
  };

  const fiches = result?.fiches||[];
  const tGain  = fiches.reduce((s,f)=>s+Number(f.gain||f.gainTotal||f.montantGagne||0),0);
  const tMise  = fiches.reduce((s,f)=>s+Number(f.mise||f.total||0),0);

  return (
    <Layout>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 8px 40px'}}>

        <div style={{background:'linear-gradient(135deg,#16a34a,#15803d)',
          borderRadius:10,padding:'11px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:900,fontSize:16,color:'white'}}>🏆 Fiches Gagnant</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700}}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        {payMsg && (
          <div style={{background:payMsg.startsWith('✅')?'#dcfce7':'#fee2e2',
            border:`1.5px solid ${payMsg.startsWith('✅')?'#16a34a':'#dc2626'}`,
            color:payMsg.startsWith('✅')?'#166534':'#991b1b',
            padding:'10px 16px',borderRadius:8,marginBottom:12,fontWeight:700}}>
            {payMsg}
          </div>
        )}

        {/* FILTÈ */}
        <div style={{background:'white',borderRadius:12,padding:16,
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)',marginBottom:14}}>

          <div style={{display:'flex',gap:8,marginBottom:12}}>
            {[['tout','Tout'],['nonpayee','Non Payé'],['payee','Payé']].map(([k,l])=>(
              <button key={k} onClick={()=>setStatut(k)}
                style={{padding:'7px 16px',border:'none',borderRadius:8,
                  background:statut===k?'#16a34a':'#f3f4f6',
                  color:statut===k?'white':'#333',
                  fontWeight:700,cursor:'pointer',fontSize:12}}>
                {l}
              </button>
            ))}
          </div>

          <div style={{display:'grid',
            gridTemplateColumns:'1fr 1fr 1fr auto',gap:10,alignItems:'flex-end'}}>
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
                color:'#888',marginBottom:3}}>Ajan</label>
              <select value={agent} onChange={e=>setAgent(e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:12}}>
                <option value="Tout">Tout Ajan</option>
                {agents.map(a=>(
                  <option key={a._id||a.id} value={a.username}>
                    {a.prenom} {a.nom}
                  </option>
                ))}
              </select>
            </div>
            <button onClick={load} disabled={loading}
              style={{padding:'8px 20px',background:'#16a34a',color:'white',
                border:'none',borderRadius:8,fontWeight:700,
                cursor:'pointer',fontSize:13}}>
              {loading?'⏳':'🔍'}
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* STATS */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',
              gap:8,marginBottom:14}}>
              {[
                ['Total Fiches Gagnantes', fiches.length, '#16a34a'],
                ['Total Mise',        `${fmt(tMise)} G`, '#1a73e8'],
                ['Total Gain',        `${fmt(tGain)} G`, '#dc2626'],
              ].map(([l,v,c])=>(
                <div key={l} style={{background:'white',borderRadius:10,
                  padding:'12px',textAlign:'center',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
                  borderTop:`3px solid ${c}`}}>
                  <div style={{fontWeight:900,fontSize:18,color:c}}>{v}</div>
                  <div style={{fontSize:10,color:'#888',fontWeight:700}}>{l}</div>
                </div>
              ))}
            </div>

            {/* TABLO + DETAY */}
            <div style={{display:'grid',
              gridTemplateColumns:selFich?'1fr 360px':'1fr',
              gap:12,alignItems:'start'}}>

              {/* Tablo */}
              <div style={{background:'white',borderRadius:12,
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{background:'#f8f9fa',borderBottom:'2px solid #e5e7eb'}}>
                      {['Ticket','Ajan','Tiraj','Mise','Gain','Statut Pèman','Aksyon'].map(h=>(
                        <th key={h} style={{padding:'10px 12px',fontWeight:700,
                          fontSize:11,color:'#555',textAlign:'left'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fiches.length===0 ? (
                      <tr><td colSpan={7} style={{padding:32,textAlign:'center',color:'#aaa'}}>
                        Aucun fich ganyan
                      </td></tr>
                    ) : fiches.map((f,i)=>{
                      const gain = f.gain||f.gainTotal||f.montantGagne||0;
                      const isSel = selFich?._id===f._id||selFich?.ticket===f.ticket;
                      return (
                        <tr key={f._id||i} onClick={()=>setSelFich(isSel?null:f)}
                          style={{borderBottom:'1px solid #f0f0f0',cursor:'pointer',
                            background:isSel?'#f0fdf4':i%2===0?'white':'#fafafa'}}>
                          <td style={{padding:'9px 12px',fontFamily:'monospace',
                            color:'#f59e0b',fontWeight:700}}>{f.ticket}</td>
                          <td style={{padding:'9px 12px',fontSize:12}}>
                            {f.agent||'—'}
                          </td>
                          <td style={{padding:'9px 12px',fontSize:12}}>
                            {f.tirage||'—'}
                          </td>
                          <td style={{padding:'9px 12px',fontWeight:700}}>
                            {fmt(f.mise||f.total||0)} G
                          </td>
                          <td style={{padding:'9px 12px',fontWeight:900,
                            color:'#16a34a',fontSize:15}}>
                            {fmt(gain)} G
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            <span style={{
                              background:f.paye?'#dcfce7':'#fef9c3',
                              color:f.paye?'#166534':'#854d0e',
                              borderRadius:20,padding:'2px 8px',
                              fontSize:10,fontWeight:700}}>
                              {f.paye?'✅ Peye':'⏳ Pa Peye'}
                            </span>
                          </td>
                          <td style={{padding:'9px 12px'}}>
                            {!f.paye && (
                              <button
                                onClick={e=>{e.stopPropagation();handlePaye(f);}}
                                style={{background:'#16a34a',color:'white',
                                  border:'none',borderRadius:6,
                                  padding:'4px 10px',cursor:'pointer',
                                  fontSize:11,fontWeight:700}}>
                                💰 Peye
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* DETAY FICH GANYAN */}
              {selFich && (
                <div style={{background:'white',borderRadius:12,
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                  position:'sticky',top:16}}>
                  <div style={{background:'#16a34a',borderRadius:'12px 12px 0 0',
                    padding:'12px 16px',display:'flex',
                    justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{color:'white',fontWeight:900,fontSize:14}}>
                      🏆 #{selFich.ticket}
                    </span>
                    <button onClick={()=>setSelFich(null)}
                      style={{background:'none',border:'none',
                        color:'white',fontSize:18,cursor:'pointer'}}>✕</button>
                  </div>
                  <div style={{padding:16}}>
                    {[
                      ['Tiraj',  selFich.tirage||'—'],
                      ['Ajan',   selFich.agent||'—'],
                      ['Dat',    fmtD(selFich.dateVente||selFich.dateGagnant)],
                      ['Lot1',   selFich.lot1||'—'],
                      ['Lot2',   selFich.lot2||'—'],
                      ['Lot3',   selFich.lot3||'—'],
                    ].map(([l,v])=>(
                      <div key={l} style={{display:'flex',
                        justifyContent:'space-between',
                        padding:'5px 0',borderBottom:'1px solid #f0f0f0',
                        fontSize:12}}>
                        <span style={{color:'#888',fontWeight:700}}>{l}:</span>
                        <span style={{fontWeight:700}}>{v}</span>
                      </div>
                    ))}

                    {/* Boul yo */}
                    <div style={{margin:'12px 0 8px',fontWeight:800,fontSize:11,
                      color:'#333',textTransform:'uppercase'}}>
                      Boul Ganyan
                    </div>
                    <div style={{background:'#f8f9fa',borderRadius:8,overflow:'hidden'}}>
                      <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                        <thead>
                          <tr style={{background:'#1e293b'}}>
                            {['Kalite','Boul','Mise','Gain'].map(h=>(
                              <th key={h} style={{padding:'6px 8px',color:'white',
                                fontWeight:700,fontSize:10,textAlign:'left'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(selFich.rowsGagne||selFich.rows||[]).map((r,i)=>(
                            <tr key={i} style={{borderBottom:'1px solid #e5e7eb',
                              background:i%2===0?'white':'#f9fafb'}}>
                              <td style={{padding:'6px 8px',
                                color:TYPE_C[r.type]||'#333',
                                fontWeight:800,fontSize:10}}>
                                {TYPE_L[r.type]||r.type}
                              </td>
                              <td style={{padding:'6px 8px',
                                fontFamily:'monospace',fontWeight:900,fontSize:14}}>
                                {r.boule}
                              </td>
                              <td style={{padding:'6px 8px',fontWeight:700,
                                color:'#16a34a'}}>
                                {fmt(r.mise||0)}G
                              </td>
                              <td style={{padding:'6px 8px',fontWeight:900,
                                color:r.gain>0?'#dc2626':'#ccc'}}>
                                {r.gain>0?`${fmt(r.gain)}G`:'—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total gain */}
                    <div style={{background:'#16a34a',borderRadius:8,
                      padding:'10px 14px',marginTop:10,
                      display:'flex',justifyContent:'space-between',
                      alignItems:'center'}}>
                      <span style={{color:'white',fontWeight:800}}>GAIN TOTAL:</span>
                      <span style={{color:'white',fontWeight:900,fontSize:20}}>
                        {fmt(selFich.gain||selFich.gainTotal||selFich.montantGagne||0)} G
                      </span>
                    </div>

                    {!selFich.paye && (
                      <button onClick={()=>handlePaye(selFich)}
                        style={{width:'100%',marginTop:10,padding:'12px',
                          background:'#16a34a',color:'white',border:'none',
                          borderRadius:10,fontWeight:900,fontSize:14,
                          cursor:'pointer'}}>
                        💰 Mak Kòm Peye
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
