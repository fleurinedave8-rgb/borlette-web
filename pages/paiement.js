import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

export default function Paiement() {
  const [agents, setAgents]   = useState([]);
  const [selected, setSelected] = useState('');
  const [montant, setMontant] = useState('');
  const [type, setType]       = useState('depot');
  const [note, setNote]       = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [transactions, setTransactions] = useState([]);
  const safeSetTransactions = (data) => setTransactions(Array.isArray(data) ? data : []);

  useEffect(()=>{
    api.get('/api/admin/agents').then(r=>{ setAgents(r.data||[]); if(r.data?.[0]) setSelected(r.data[0].id); }).catch(()=>{});
    api.get('/api/rapport/transactions').then(r=>safeSetTransactions(r.data)).catch(()=>{});
  },[]);

  const handleSubmit = async ()=>{
    if(!selected||!montant) return;
    setSaving(true);
    try{
      await api.post('/api/admin/paiement',{ agentId:selected, montant:Number(montant), type, note }).catch(()=>{});
      setSaved(true); setTimeout(()=>setSaved(false),3000);
      setMontant(''); setNote('');
      api.get('/api/rapport/transactions').then(r=>safeSetTransactions(r.data)).catch(()=>{});
    }finally{ setSaving(false); }
  };

  return (
    <Layout>
      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Paiement</h1>

        {saved && <div style={{ background:'#d1fae5', border:'1px solid #16a34a', borderRadius:8, padding:'10px 16px', marginBottom:12, color:'#065f46', fontWeight:700 }}>✅ Tranzaksyon anrejistre!</div>}

        <div style={{ background:'white', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16 }}>
          <h3 style={{ margin:'0 0 16px', fontWeight:800 }}>Nouvo Tranzaksyon</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Agent *</label>
              <select value={selected} onChange={e=>setSelected(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14 }}>
                {agents.map(a=><option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Type</label>
              <select value={type} onChange={e=>setType(e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14 }}>
                <option value="depot">Dépôt</option>
                <option value="retrait">Retrait</option>
                <option value="commission">Commission</option>
              </select>
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Montant (HTG) *</label>
              <input type="number" value={montant} onChange={e=>setMontant(e.target.value)} placeholder="0.00"
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Note</label>
              <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Opsyonèl..."
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving} style={{ width:'100%', padding:'13px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:800, cursor:'pointer', fontSize:15 }}>
            {saving?'Anregistre...':'💳 Anregistre Paiement'}
          </button>
        </div>

        <div style={{ background:'white', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', overflow:'auto' }}>
          <div style={{ padding:'14px 18px', fontWeight:800, borderBottom:'2px solid #eee' }}>Istwa Tranzaksyon</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#f8f9fa' }}>
              {['Date','Agent','Type','Montant','Note'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'#555', borderBottom:'1px solid #eee' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {transactions.length===0
                ? <tr><td colSpan={5} style={{ padding:20, textAlign:'center', color:'#999' }}>Okenn tranzaksyon encore</td></tr>
                : transactions.map((t,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                    <td style={{ padding:'10px 14px', fontSize:12 }}>{new Date(t.date).toLocaleDateString()}</td>
                    <td style={{ padding:'10px 14px' }}>{t.agent}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ background:t.type==='depot'?'#d1fae5':t.type==='retrait'?'#fee2e2':'#eff6ff', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>{t.type}</span></td>
                    <td style={{ padding:'10px 14px', fontWeight:700 }}>{t.montant} HTG</td>
                    <td style={{ padding:'10px 14px', color:'#666', fontSize:12 }}>{t.note||'-'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
