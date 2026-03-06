import { useState } from 'react';
import Layout from '../../components/Layout';

const defaultLimits = [
  { key:'borlette', label:'Borlette',      val:2000 },
  { key:'loto3',    label:'Loto 3',         val:150  },
  { key:'mariage',  label:'Mariage',        val:50   },
  { key:'l4o1',     label:'L4O1',           val:25   },
  { key:'l4o2',     label:'L4O2',           val:25   },
  { key:'l4o3',     label:'L4O3',           val:25   },
  { key:'l5o1',     label:'L5O1',           val:3    },
  { key:'l5o2',     label:'L5O2',           val:3    },
  { key:'l5o3',     label:'L5O3',           val:3    },
];

export default function Limites() {
  const [tab, setTab]       = useState('general');
  const [limits, setLimits] = useState(defaultLimits);
  const [saved, setSaved]   = useState(false);
  const [boules, setBoules] = useState([]);
  const [newBoule, setNewBoule] = useState({ tirage:'', boule:'', limite:'' });

  const handleSave = ()=>{
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const handleAddBoule = ()=>{
    if(!newBoule.boule||!newBoule.limite) return;
    setBoules(b=>[...b,{ ...newBoule, id:Date.now() }]);
    setNewBoule({ tirage:'', boule:'', limite:'' });
  };

  const handleDeleteBoule = (id)=>{ setBoules(b=>b.filter(x=>x.id!==id)); };

  return (
    <Layout>
      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Limit vant</h1>
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[['general','🔵 Général'],['agent','🟢 Agent'],['boul','🟡 Boul']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{ background:tab===k?'#1a73e8':'#e5e7eb', color:tab===k?'white':'#333', border:'none', borderRadius:8, padding:'8px 16px', fontWeight:700, cursor:'pointer' }}>{l}</button>
          ))}
        </div>

        {saved && <div style={{ background:'#d1fae5', border:'1px solid #16a34a', borderRadius:8, padding:'10px 16px', marginBottom:12, color:'#065f46', fontWeight:700 }}>✅ Limite sove!</div>}

        {tab==='general' && (
          <div style={{ background:'white', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {limits.map(l=>(
                <div key={l.key} style={{ background:'#f8f9fa', borderRadius:8, padding:14 }}>
                  <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:6, fontWeight:600 }}>{l.label}</label>
                  <input type="number" value={l.val} onChange={e=>setLimits(prev=>prev.map(x=>x.key===l.key?{...x,val:Number(e.target.value)}:x))}
                    style={{ width:'100%', padding:'8px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14, fontWeight:700, boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <button onClick={handleSave} style={{ marginTop:16, width:'100%', padding:'12px', background:'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
              💾 Sove Limit yo
            </button>
          </div>
        )}

        {tab==='boul' && (
          <div>
            <div style={{ background:'white', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:12 }}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <input placeholder="Tirage" value={newBoule.tirage} onChange={e=>setNewBoule(p=>({...p,tirage:e.target.value}))}
                  style={{ flex:1, padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, minWidth:100 }} />
                <input placeholder="Boule" value={newBoule.boule} onChange={e=>setNewBoule(p=>({...p,boule:e.target.value}))}
                  style={{ flex:1, padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, minWidth:80 }} />
                <input placeholder="Limite" type="number" value={newBoule.limite} onChange={e=>setNewBoule(p=>({...p,limite:e.target.value}))}
                  style={{ flex:1, padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, minWidth:80 }} />
                <button onClick={handleAddBoule} style={{ padding:'9px 18px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>+ Ajouter</button>
              </div>
            </div>
            <div style={{ background:'white', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', overflow:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead><tr style={{ background:'#f8f9fa' }}>
                  {['Tirage','Boule','Limite','Supprimer'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:700, borderBottom:'2px solid #eee' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {boules.length===0 ? <tr><td colSpan={4} style={{ padding:20, textAlign:'center', color:'#999' }}>Okenn limit boul</td></tr>
                  : boules.map(b=>(
                    <tr key={b.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                      <td style={{ padding:'10px 14px' }}>{b.tirage||'-'}</td>
                      <td style={{ padding:'10px 14px', fontWeight:700 }}>{b.boule}</td>
                      <td style={{ padding:'10px 14px', color:'#dc2626', fontWeight:700 }}>{b.limite}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <button onClick={()=>handleDeleteBoule(b.id)} style={{ background:'#dc2626', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer' }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab==='agent' && (
          <div style={{ background:'white', borderRadius:12, padding:30, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', textAlign:'center', color:'#999' }}>
            Limit pa ajan — Ankou disponib
          </div>
        )}
      </div>
    </Layout>
  );
}
