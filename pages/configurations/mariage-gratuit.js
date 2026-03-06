import { useState } from 'react';
import Layout from '../../components/Layout';

export default function MariageGratuit() {
  const [rules, setRules]   = useState([
    { id:1, kob:50,  mariaj:1 },
    { id:2, kob:100, mariaj:2 },
    { id:3, kob:150, mariaj:3 },
  ]);
  const [kob, setKob]       = useState('');
  const [mariaj, setMariaj] = useState('');
  const [editId, setEditId] = useState(null);
  const [saved, setSaved]   = useState(false);

  const handleAdd = () => {
    if (!kob || !mariaj) return;
    if (editId) {
      setRules(rules.map(r => r.id===editId ? { id:editId, kob:Number(kob), mariaj:Number(mariaj) } : r));
      setEditId(null);
    } else {
      setRules([...rules, { id:Date.now(), kob:Number(kob), mariaj:Number(mariaj) }]);
    }
    setKob(''); setMariaj('');
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const handleEdit = (r) => { setEditId(r.id); setKob(String(r.kob)); setMariaj(String(r.mariaj)); };
  const handleDelete = (id) => { if(confirm('Efase règ sa a?')) setRules(rules.filter(r=>r.id!==id)); };

  return (
    <Layout>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Configuration mariage gratuit</h1>

        {saved && <div style={{ background:'#d1fae5', border:'1px solid #16a34a', borderRadius:8, padding:'10px 16px', marginBottom:12, color:'#065f46', fontWeight:700 }}>✅ Sove!</div>}

        <div style={{ background:'white', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16 }}>
          <h3 style={{ margin:'0 0 14px', fontWeight:700 }}>{editId ? '✏️ Modifier règle' : '➕ Ajouter règle'}</h3>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <div style={{ flex:1, minWidth:140 }}>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Kantite kòb (HTG)</label>
              <input type="number" value={kob} onChange={e=>setKob(e.target.value)} placeholder="ex: 50"
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
            </div>
            <div style={{ flex:1, minWidth:140 }}>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Kantite mariage</label>
              <input type="number" value={mariaj} onChange={e=>setMariaj(e.target.value)} placeholder="ex: 1"
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
              <button onClick={handleAdd}
                style={{ padding:'9px 20px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                {editId ? '✏️ Modifier' : '➕ Ajouter'}
              </button>
              {editId && <button onClick={()=>{setEditId(null);setKob('');setMariaj('');}}
                style={{ padding:'9px 16px', background:'#f0f0f0', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>Anile</button>}
            </div>
          </div>
        </div>

        <div style={{ background:'white', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8f9fa' }}>
                {['#','Kantite kòb (HTG)','Kantite mariage','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'#555', borderBottom:'2px solid #eee' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r,i)=>(
                <tr key={r.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                  <td style={{ padding:'10px 14px' }}>{i+1}</td>
                  <td style={{ padding:'10px 14px', fontWeight:700 }}>{r.kob} HTG</td>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:'#1a73e8' }}>{r.mariaj}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>handleEdit(r)} style={{ background:'#f59e0b', color:'white', border:'none', borderRadius:5, padding:'5px 12px', fontSize:12, cursor:'pointer', fontWeight:700 }}>✏️</button>
                      <button onClick={()=>handleDelete(r.id)} style={{ background:'#dc2626', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
