import { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES=['Tout','Georgia-Matin','Georgia-Soir','Florida matin','Florida soir','New-york matin','New-york soir'];
const SUCCURSALES=['Tout','Central','Nord','Sud'];

export default function FichesElimine() {
  const today=new Date().toISOString().split('T')[0];
  const [debut,setDebut]=useState(today);
  const [fin,setFin]=useState(today);
  const [succursal,setSuccursal]=useState('Tout');
  const [tirage,setTirage]=useState('Tout');
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(0);
  const PER_PAGE=10;

  const load=async()=>{
    setLoading(true);
    try{
      const r=await api.get('/api/rapport/eliminer',{params:{debut,fin,succursal,tirage}});
      setResult({fiches:Array.isArray(r.data)?r.data:[]});
    }catch{ setResult({fiches:[]}); }
    finally{ setLoading(false); }
  };

  const fiches=result?.fiches||[];
  const filtered=fiches.filter(f=>!search||Object.values(f).some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));
  const paginated=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const totalPages=Math.ceil(filtered.length/PER_PAGE);

  return (
    <Layout>
      <div style={{maxWidth:1000,margin:'0 auto'}}>
        <div style={{background:'#f59e0b',borderRadius:8,padding:'12px 20px',marginBottom:14,textAlign:'center'}}>
          <span style={{fontWeight:900,fontSize:15}}>LA-PROBITE-BORLETTE</span>
        </div>
        <div style={{background:'white',borderRadius:8,padding:20,boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
          <h2 style={{margin:'0 0 4px',fontWeight:700}}>Fiche éliminé</h2>
          <p style={{color:'#666',fontSize:14,marginBottom:16}}>Lis fich ki deja siprime</p>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}}>
            {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([l,v,s])=>(
              <div key={l}>
                <label style={{display:'block',fontWeight:700,fontSize:13,marginBottom:6}}>{l}</label>
                <div style={{display:'flex',alignItems:'center',border:'1px solid #ccc',borderRadius:4,padding:'8px 12px'}}>
                  <input type="date" value={v} onChange={e=>s(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:14}}/>
                  <span style={{color:'#16a34a',fontWeight:900}}>✓</span>
                </div>
              </div>
            ))}
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:13,marginBottom:6}}>Succursal</label>
              <div style={{display:'flex',alignItems:'center',border:'1px solid #ccc',borderRadius:4,padding:'8px 12px'}}>
                <select value={succursal} onChange={e=>setSuccursal(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:14}}>
                  {SUCCURSALES.map(s=><option key={s}>{s}</option>)}
                </select>
                <span style={{color:'#16a34a',fontWeight:900}}>✓</span>
              </div>
            </div>
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:13,marginBottom:6}}>Tirage</label>
              <div style={{display:'flex',alignItems:'center',border:'1px solid #ccc',borderRadius:4,padding:'8px 12px'}}>
                <select value={tirage} onChange={e=>setTirage(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:14}}>
                  {TIRAGES.map(t=><option key={t}>{t}</option>)}
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
              <div style={{textAlign:'center',marginBottom:14,padding:14,border:'1px solid #eee',borderRadius:8}}>
                <div style={{fontWeight:900,fontSize:16}}>LA-PROBITE-BORLETTE</div>
                <div style={{fontWeight:700,fontSize:15}}>Fiches éliminé</div>
                <div style={{fontSize:12,color:'#666'}}>Succursal : {succursal} &nbsp;|&nbsp; Tirage : {tirage}</div>
                <div style={{fontSize:12,color:'#666'}}>Debut : {debut} &nbsp; Fin : {fin}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <label style={{fontWeight:700,fontSize:13}}>Search:</label>
                <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} style={{padding:'6px 10px',border:'1px solid #ccc',borderRadius:4,fontSize:13,width:200}}/>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead><tr style={{background:'#f8f9fa'}}>
                    {['Agent','POS','No Ticket','Tirage','Vente'].map(h=>(
                      <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,borderBottom:'2px solid #dee2e6'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {paginated.length===0
                      ? <tr><td colSpan={5} style={{padding:20,textAlign:'center',color:'#666',fontStyle:'italic'}}>No data available in table</td></tr>
                      : paginated.map((f,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #dee2e6',background:i%2===0?'white':'#f8f9fa'}}>
                          <td style={{padding:'10px 14px'}}>{f.agent}</td>
                          <td style={{padding:'10px 14px'}}>{f.pos||f.posId||'-'}</td>
                          <td style={{padding:'10px 14px',color:'#dc2626',fontWeight:700}}>{f.ticket}</td>
                          <td style={{padding:'10px 14px'}}>{f.tirage}</td>
                          <td style={{padding:'10px 14px',fontWeight:700}}>{f.vente||f.total}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,color:'#666',fontSize:13}}>
                <span>Showing {filtered.length===0?0:page*PER_PAGE+1} to {Math.min((page+1)*PER_PAGE,filtered.length)} of {filtered.length} entries</span>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{padding:'5px 14px',border:'1px solid #dee2e6',borderRadius:3,background:'white',cursor:page===0?'default':'pointer',color:page===0?'#aaa':'#333'}}>Previous</button>
                  <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1} style={{padding:'5px 14px',border:'1px solid #dee2e6',borderRadius:3,background:'white',cursor:page>=totalPages-1?'default':'pointer',color:page>=totalPages-1?'#aaa':'#333'}}>Next</button>
                </div>
              </div>
              <div style={{textAlign:'center',marginTop:16}}>
                <button onClick={()=>window.print()} style={{background:'#1a73e8',color:'white',border:'none',borderRadius:4,padding:'11px 40px',fontWeight:700,fontSize:14,cursor:'pointer'}}>Imprimer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
