import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TYPES = [
  { key:'P0',  label:'Borlette (2 chif)',    fmt:'2 chif', eg:'47',    maxLen:2 },
  { key:'P1',  label:'Loto3-P1 (3 chif)',    fmt:'3 chif', eg:'047',   maxLen:3 },
  { key:'P2',  label:'Loto3-P2 (3 chif)',    fmt:'3 chif', eg:'023',   maxLen:3 },
  { key:'P3',  label:'Loto3-P3 (3 chif)',    fmt:'3 chif', eg:'089',   maxLen:3 },
  { key:'MAR', label:'Mariage (XX*YY)',       fmt:'XX*YY',  eg:'47*23', maxLen:5 },
  { key:'L4',  label:'Loto4 (4 chif)',        fmt:'4 chif', eg:'4723',  maxLen:4 },
  { key:'MG',  label:'Mariage Gratuit',       fmt:'2 chif', eg:'47',    maxLen:2 },
  { key:'TOUT',label:'Tout kalite',           fmt:'2 chif', eg:'47',    maxLen:2 },
];

const TIRAGES = [
  'Tout','Florida matin','Florida soir',
  'New-york matin','New-york soir',
  'Georgia-Matin','Georgia-Soir',
  'Ohio matin','Ohio soir',
];

const TYPE_COLOR = {
  P0:'#16a34a', P1:'#1a73e8', P2:'#7c3aed', P3:'#f59e0b',
  MAR:'#dc2626', L4:'#0891b2', MG:'#ec4899', TOUT:'#374151',
};

export default function BlockageBoul() {
  const [boules,  setBoules]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ boule:'', type:'P0', tirage:'Tout', raison:'' });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ t:'', ok:true });
  const [search,  setSearch]  = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/boules-bloquees');
      setBoules(Array.isArray(r.data) ? r.data : []);
    } catch { setBoules([]); }
    setLoading(false);
  };

  const notify = (t, ok=true) => {
    setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3500);
  };

  const handleAdd = async () => {
    if (!form.boule.trim()) { notify('⚠️ Mete nimewo boul la', false); return; }
    setSaving(true);
    try {
      await api.post('/api/admin/boules-bloquees', {
        boule:  form.boule.trim(),
        type:   form.type,
        tirage: form.tirage,
        raison: form.raison || 'Bloke pa admin',
        date:   new Date().toISOString(),
      });
      notify('✅ Boul bloke!');
      setForm({ boule:'', type:'P0', tirage:'Tout', raison:'' });
      await load();
    } catch(e) {
      notify(`❌ ${e?.response?.data?.message||'Erè'}`, false);
    }
    setSaving(false);
  };

  const handleDelete = async id => {
    try {
      await api.delete('/api/admin/boules-bloquees/' + id);
      notify('✅ Boul debloke');
      await load();
    } catch { notify('❌ Erè', false); }
  };

  const typeInfo = TYPES.find(t=>t.key===form.type)||TYPES[0];
  const filtered = boules.filter(b => !search ||
    String(b.boule||'').includes(search) ||
    String(b.type||'').toLowerCase().includes(search.toLowerCase()) ||
    String(b.tirage||'').toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div style={{maxWidth:900,margin:'0 auto',padding:'0 8px 40px'}}>

        <div style={{background:'#dc2626',borderRadius:10,
          padding:'11px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:900,fontSize:16,color:'white'}}>🚫 Blocage Boul</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700}}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        {msg.t && (
          <div style={{background:msg.ok?'#dcfce7':'#fee2e2',
            border:`1.5px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color:msg.ok?'#166534':'#991b1b',
            padding:'10px 16px',borderRadius:8,marginBottom:12,fontWeight:700}}>
            {msg.t}
          </div>
        )}

        {/* FÒMILÈ BLOKE */}
        <div style={{background:'white',borderRadius:12,padding:20,
          boxShadow:'0 2px 8px rgba(0,0,0,0.08)',marginBottom:16}}>
          <h3 style={{margin:'0 0 16px',fontWeight:800,fontSize:15}}>
            🔒 Bloke yon Boul
          </h3>

          {/* Tip jwèt */}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontWeight:700,fontSize:12,
              marginBottom:6,color:'#555'}}>
              Kalite Jwèt
            </label>
            <div style={{display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))',gap:6}}>
              {TYPES.map(t=>(
                <button key={t.key}
                  onClick={()=>setForm(f=>({...f,type:t.key,boule:''}))}
                  style={{padding:'8px 6px',border:'none',borderRadius:8,
                    background:form.type===t.key?(TYPE_COLOR[t.key]||'#374151'):'#f3f4f6',
                    color:form.type===t.key?'white':'#333',
                    fontWeight:700,cursor:'pointer',fontSize:11,textAlign:'center'}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            {/* Nimewo boul */}
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,
                marginBottom:4,color:'#555'}}>
                Nimewo Boul ({typeInfo.fmt}) *
              </label>
              <input
                type="text"
                value={form.boule}
                maxLength={typeInfo.maxLen}
                onChange={e=>{
                  let v = e.target.value;
                  if (form.type==='MAR') {
                    v = v.replace(/[^0-9*]/g,'').slice(0,5);
                    if (/^\d{4}$/.test(v)) v=v.slice(0,2)+'*'+v.slice(2);
                  } else {
                    v = v.replace(/\D/g,'').slice(0,typeInfo.maxLen);
                  }
                  setForm(f=>({...f,boule:v}));
                }}
                placeholder={typeInfo.eg}
                style={{width:'100%',padding:'12px',
                  border:`2px solid ${TYPE_COLOR[form.type]||'#ddd'}`,
                  borderRadius:8,fontSize:20,fontWeight:900,
                  textAlign:'center',fontFamily:'monospace',
                  boxSizing:'border-box',
                  color:TYPE_COLOR[form.type]||'#333'}}
              />
            </div>

            {/* Tiraj */}
            <div>
              <label style={{display:'block',fontWeight:700,fontSize:12,
                marginBottom:4,color:'#555'}}>
                Tiraj (oswa Tout)
              </label>
              <select value={form.tirage}
                onChange={e=>setForm(f=>({...f,tirage:e.target.value}))}
                style={{width:'100%',padding:'12px',border:'1.5px solid #ddd',
                  borderRadius:8,fontSize:13,fontWeight:700}}>
                {TIRAGES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Rezon */}
          <div style={{marginBottom:14}}>
            <label style={{display:'block',fontWeight:700,fontSize:12,
              marginBottom:4,color:'#555'}}>
              Rezon (opsyonèl)
            </label>
            <input type="text" value={form.raison}
              onChange={e=>setForm(f=>({...f,raison:e.target.value}))}
              placeholder="ex: Boul sa tro jwe jodi"
              style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',
                borderRadius:8,fontSize:14,boxSizing:'border-box'}} />
          </div>

          <button onClick={handleAdd} disabled={saving||!form.boule.trim()}
            style={{width:'100%',padding:'13px',
              background:saving||!form.boule.trim()?'#ccc':'#dc2626',
              color:'white',border:'none',borderRadius:10,
              fontWeight:900,fontSize:14,cursor:'pointer'}}>
            {saving?'⏳ Enregistrement...':'🚫 Bloke Boul Sa'}
          </button>
        </div>

        {/* LIS BOULES BLOKE */}
        <div style={{background:'white',borderRadius:12,
          boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid #f0f0f0',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <h3 style={{margin:0,fontWeight:800,fontSize:15}}>
              📋 Boul Bloke ({boules.length})
            </h3>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="🔍 Chèche..."
              style={{padding:'6px 10px',border:'1.5px solid #ddd',
                borderRadius:8,fontSize:12,width:150}} />
          </div>

          {loading ? (
            <div style={{padding:32,textAlign:'center',color:'#888'}}>⏳ Chargement...</div>
          ) : filtered.length===0 ? (
            <div style={{padding:32,textAlign:'center',color:'#aaa',fontStyle:'italic'}}>
              Aucun boul bloke
            </div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#f8f9fa',borderBottom:'2px solid #e5e7eb'}}>
                  {['Boul','Kalite','Tiraj','Raison','Action'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',fontWeight:700,
                      fontSize:11,color:'#555',textAlign:'left'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b,i)=>(
                  <tr key={b._id||i}
                    style={{borderBottom:'1px solid #f0f0f0',
                      background:i%2===0?'white':'#fafafa'}}>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{fontFamily:'monospace',fontWeight:900,
                        fontSize:16,
                        color:TYPE_COLOR[b.type]||'#333'}}>
                        {b.boule||b.numero||'—'}
                      </span>
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{background:TYPE_COLOR[b.type]||'#e5e7eb',
                        color:'white',borderRadius:6,padding:'2px 8px',
                        fontSize:11,fontWeight:700}}>
                        {TYPES.find(t=>t.key===b.type)?.label||b.type||'—'}
                      </span>
                    </td>
                    <td style={{padding:'10px 12px',fontSize:12,color:'#666'}}>
                      {b.tirage||'Tout'}
                    </td>
                    <td style={{padding:'10px 12px',fontSize:12,color:'#888'}}>
                      {b.raison||'—'}
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      <button onClick={()=>handleDelete(b._id)}
                        style={{background:'#16a34a',color:'white',
                          border:'none',borderRadius:6,
                          padding:'5px 10px',cursor:'pointer',
                          fontSize:11,fontWeight:700}}>
                        🔓 Debloke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
