import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function FichesGagnant() {
  const today=new Date().toISOString().split('T')[0];
  const [statut,setStatut]=useState('tout');
  const [debut,setDebut]=useState(today);
  const [fin,setFin]=useState(today);
  const [agent,setAgent]=useState('Tout');
  const [agents,setAgents]=useState([]);
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);

  const load=async()=>{
    setLoading(true);
    try{
      const r=await api.get('/api/rapport/gagnant',{params:{debut,fin,agent,statut}});
      setResult(r.data||{totalMise:'0.00',totalGain:'0.00',fiches:[]});
    }catch{ setResult({totalMise:'0.00',totalGain:'0.00',fiches:[]}); }
    finally{ setLoading(false); }
  };

  const TABS=[['tout','Tout','#1a73e8'],['payee','Payée','#16a34a'],['nonpayee','Non Payée','#f59e0b']];

  return (
    <Layout>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <div style={{background:'#f59e0b',borderRadius:8,padding:'12px 20px',marginBottom:14,textAlign:'center'}}>
          <span style={{fontWeight:900,fontSize:15}}>LA-PROBITE-BORLETTE</span>
        </div>
        <div style={{background:'white',borderRadius:8,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            {TABS.map(([k,l,c])=>(
              <button key={k} onClick={()=>setStatut(k)}
                style={{background:statut===k?c:'white',color:statut===k?'white':c,border:`1px solid ${c}`,borderRadius:4,padding:'6px 16px',fontWeight:700,cursor:'pointer',fontSize:13}}>
                {l}
              </button>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            {[['Debut',debut,setDebut,'date'],['Fin',fin,setFin,'date']].map(([l,v,s,t])=>(
              <div key={l}>
                <label style={{display:'block',fontWeight:700,fontSize:13,marginBottom:6}}>{l}</label>
                <div style={{display:'flex',alignItems:'center',border:'1px solid #ccc',borderRadius:4,padding:'8px 12px'}}>
                  <input type={t} value={v} onChange={e=>s(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:14}}/>
                  <span style={{color:'#16a34a',fontWeight:900}}>✓</span>
                </div>
              </div>
            ))}
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:13,marginBottom:6}}>Agent</label>
              <div style={{display:'flex',alignItems:'center',border:'1px solid #ccc',borderRadius:4,padding:'8px 12px'}}>
                <select value={agent} onChange={e=>setAgent(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:14}}>
                  <option>Tout</option>
                  {agents.map(a=><option key={a.id}>{a.prenom} {a.nom}</option>)}
                </select>
                <span style={{color:'#16a34a',fontWeight:900}}>✓</span>
              </div>
            </div>
          </div>
          <button onClick={load} disabled={loading} style={{width:'100%',padding:13,background:'#1a73e8',color:'white',border:'none',borderRadius:4,fontSize:15,fontWeight:700,cursor:'pointer',marginBottom:16}}>
            {loading?'Chargement...':'Rechercher'}
          </button>

          {result && (
            <div>
              <div style={{textAlign:'center',marginBottom:16,padding:16,border:'1px solid #eee',borderRadius:8}}>
                <div style={{fontWeight:900,fontSize:16,marginBottom:4}}>LA-PROBITE-BORLETTE</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>Rapport Fiche gagnant</div>
                <div style={{fontSize:13,color:'#666'}}>Vendeur : {agent}</div>
                <div style={{fontSize:13,color:'#666'}}>Debut : {debut} &nbsp; Fin : {fin}</div>
                <div style={{display:'flex',justifyContent:'center',gap:30,marginTop:12}}>
                  <div><div style={{fontWeight:700}}>TOTAL MISE</div><div style={{fontSize:20,fontWeight:900,color:'#1a73e8'}}>{result.totalMise}</div></div>
                  <div><div style={{fontWeight:700}}>TOTAL GAIN</div><div style={{fontSize:20,fontWeight:900,color:'#16a34a'}}>{result.totalGain}</div></div>
                </div>
              </div>
              <div style={{textAlign:'center'}}>
                <button onClick={()=>window.print()} style={{background:'#1a73e8',color:'white',border:'none',borderRadius:4,padding:'11px 40px',fontWeight:700,fontSize:14,cursor:'pointer'}}>Imprimer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
