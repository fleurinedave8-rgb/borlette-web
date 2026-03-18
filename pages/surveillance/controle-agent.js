import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt  = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d => {
  if(!d)return'—';
  const dt=new Date(d),p=n=>String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()}`;
};

export default function ControleAgent() {
  const today = new Date().toISOString().split('T')[0];
  const [agents,   setAgents]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [debut,    setDebut]    = useState(today);
  const [fin,      setFin]      = useState(today);

  useEffect(()=>{
    api.get('/api/admin/agents')
      .then(r=>setAgents(Array.isArray(r.data)?r.data:[]))
      .catch(()=>{});
  },[]);

  const load = async (agent) => {
    setSelected(agent);
    setLoading(true);
    setData(null);
    try {
      const r = await api.get('/api/rapport/journalier', {
        params:{ debut, fin, agentId: agent._id||agent.id }
      });
      setData(r.data||{});
    } catch { setData({}); }
    setLoading(false);
  };

  const net = Number(data?.vente||0) - Number(data?.gain||0);

  return (
    <Layout>
      <div style={{maxWidth:900,margin:'0 auto',padding:'0 8px 40px'}}>

        <div style={{background:'#7c3aed',borderRadius:10,
          padding:'11px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:900,fontSize:16,color:'white'}}>📊 Kontwòl Ajan</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700}}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        {/* FILTÈ */}
        <div style={{background:'white',borderRadius:12,padding:16,
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)',marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([l,v,s])=>(
              <div key={l}>
                <label style={{display:'block',fontSize:11,fontWeight:700,
                  color:'#888',marginBottom:3}}>{l}</label>
                <input type="date" value={v} onChange={e=>s(e.target.value)}
                  style={{width:'100%',padding:'8px 10px',border:'1.5px solid #ddd',
                    borderRadius:8,fontSize:12,boxSizing:'border-box'}} />
              </div>
            ))}
          </div>

          {/* Ajan yo */}
          <div style={{fontWeight:700,fontSize:12,color:'#555',marginBottom:8}}>
            Chwazi yon Ajan:
          </div>
          <div style={{display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:6}}>
            {agents.filter(a=>a.role==='agent').map(a=>(
              <button key={a._id}
                onClick={()=>load(a)}
                style={{padding:'10px 12px',border:'none',borderRadius:8,
                  background:selected?._id===a._id?'#7c3aed':'#f3f4f6',
                  color:selected?._id===a._id?'white':'#333',
                  fontWeight:700,cursor:'pointer',fontSize:12,textAlign:'left'}}>
                <div>{a.prenom} {a.nom}</div>
                <div style={{fontSize:10,opacity:0.7}}>@{a.username}</div>
              </button>
            ))}
          </div>
        </div>

        {/* REZILTA */}
        {loading && (
          <div style={{textAlign:'center',padding:32,background:'white',borderRadius:12,color:'#888'}}>
            ⏳ Ap chaje...
          </div>
        )}

        {!loading && data && selected && (
          <div>
            {/* Header ajan */}
            <div style={{background:'white',borderRadius:12,padding:16,
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)',marginBottom:12}}>
              <h3 style={{margin:'0 0 4px',fontWeight:900,fontSize:16}}>
                {selected.prenom} {selected.nom}
              </h3>
              <div style={{fontSize:12,color:'#888'}}>
                @{selected.username} | {debut} → {fin}
              </div>
            </div>

            {/* Stats prensipal — menm jan ak aplikasyon an */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:12}}>
              {[
                ['🎫 Fich Vendu',  data.fiches||0,     '#1a73e8', `${fmt(data.vente||0)} G`],
                ['🏆 Fich Ganyan', data.fichesGagnant||0,'#dc2626',`${fmt(data.gain||0)} G`],
                ['❌ Fich Elimine',data.fichesElimine||0,'#f59e0b',`${fmt(data.elimine||0)} G`],
                ['💰 Net',         '',                  net>=0?'#16a34a':'#dc2626',
                  `${fmt(Math.abs(net))} G ${net<0?'DEFISI':'BENEFIS'}`],
              ].map(([l,c,color,sub])=>(
                <div key={l} style={{background:'white',borderRadius:10,padding:'14px',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
                  borderLeft:`4px solid ${color}`}}>
                  <div style={{fontSize:11,color:'#888',fontWeight:700,marginBottom:4}}>{l}</div>
                  {c!=='' && <div style={{fontWeight:900,fontSize:24,color,marginBottom:2}}>{c}</div>}
                  <div style={{fontWeight:700,fontSize:14,color}}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Bilan final */}
            <div style={{background:'#1e293b',borderRadius:12,padding:20,
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{color:'#94a3b8',fontSize:12,marginBottom:4}}>BILAN FINAL</div>
                <div style={{color:'white',fontSize:13}}>
                  Vente {fmt(data.vente||0)}G − Ganyan {fmt(data.gain||0)}G
                </div>
              </div>
              <div>
                <div style={{fontWeight:900,fontSize:28,
                  color:net>=0?'#4ade80':'#f87171'}}>
                  {fmt(Math.abs(net))} G
                </div>
                <div style={{textAlign:'right',fontSize:12,
                  color:net>=0?'#4ade80':'#f87171',fontWeight:700}}>
                  {net>=0?'✅ BENEFIS':'❌ DEFISI'}
                </div>
              </div>
            </div>

            {/* Detay pa ajan si disponib */}
            {(data.agents||[]).filter(a=>a.id===selected._id||a.agent===`${selected.prenom} ${selected.nom}`.trim()).map(a=>(
              <div key={a.id} style={{background:'white',borderRadius:12,padding:16,
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)',marginTop:12}}>
                <h4 style={{margin:'0 0 12px',fontWeight:800,fontSize:14}}>📋 Detay</h4>
                {[
                  ['Fiches Vendu', a.ficheCount],
                  ['Vente Total',  `${fmt(a.vente)} G`],
                  ['Pèman Ganyan', `${fmt(a.gain)} G`],
                  ['Net',          `${fmt(a.net)} G`],
                ].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',
                    padding:'8px 0',borderBottom:'1px solid #f0f0f0',fontSize:13}}>
                    <span style={{color:'#666',fontWeight:600}}>{l}</span>
                    <span style={{fontWeight:800}}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
