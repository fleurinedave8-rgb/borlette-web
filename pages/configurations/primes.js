import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

// ── DONE DEFÒLT PRIMES ─────────────────────────────────────────
const PRIMES_DEFOLT = [
  // ── JENERAL (bleu) ──
  { code:20,  categorie:'general', type:'Borlette',            prime1:50,  prime2:20,  prime3:500,  desc:'1er: 1G→50 | 2em: 1G→20 | 3em: 1G→500' },
  { code:30,  categorie:'general', type:'Loto 3',              prime1:500, prime2:0,   prime3:0,    desc:'1G → 500G' },
  { code:40,  categorie:'general', type:'Mariage',             prime1:5000,prime2:0,   prime3:0,    desc:'1G → 5000G' },
  { code:41,  categorie:'general', type:'L4O1 (Loto4 Pos1)',   prime1:500, prime2:0,   prime3:0,    desc:'1G → 500G (1ère pos)' },
  { code:43,  categorie:'general', type:'L4O3 (Loto4 Pos3)',   prime1:500, prime2:0,   prime3:0,    desc:'1G → 500G (3ème pos)' },
  { code:51,  categorie:'general', type:'L5O1 (Loto5 Pos1)',   prime1:25000,prime2:0,  prime3:0,   desc:'1G → 25000G' },
  { code:52,  categorie:'general', type:'L5O2 (Loto5 Pos2)',   prime1:25000,prime2:0,  prime3:0,   desc:'1G → 25000G' },
  { code:53,  categorie:'general', type:'L5O3 (Loto5 Pos3)',   prime1:25000,prime2:0,  prime3:0,   desc:'1G → 25000G' },
  { code:44,  categorie:'general', type:'Mariage Gratuit',     prime1:2000,prime2:0,   prime3:0,    desc:'Fiks: 2000G' },
  // ── TÈT FICH (jeneral tou) ──
  { code:105, categorie:'general', type:'Tèt Fich (Borlette)', prime1:0,   prime2:0,   prime3:0,    desc:'—' },
  { code:106, categorie:'general', type:'Tèt Fich Loto3 Dwat', prime1:0,   prime2:0,   prime3:0,    desc:'—' },
  { code:107, categorie:'general', type:'Tèt Fich Mariage Dwat',prime1:0,  prime2:0,   prime3:0,    desc:'—' },
  { code:108, categorie:'general', type:'Tèt Fich Loto3 Goch', prime1:0,   prime2:0,   prime3:0,    desc:'—' },
  { code:109, categorie:'general', type:'Tèt Fich Mariage Goch',prime1:0,  prime2:0,   prime3:0,    desc:'—' },
];

const CAT_CFG = {
  general: { label:'🔵 Général',          color:'#1a73e8', bg:'#eff6ff', border:'#bfdbfe', header:'#1a73e8' },
  tirage:  { label:'🟢 Par Tiraj',         color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', header:'#16a34a' },
  paire:   { label:'🟡 Boule Paire & Grappe',color:'#854d0e',bg:'#fefce8',border:'#fde68a', header:'#ca8a04' },
};
const TABS = ['general','tirage','paire'];

export default function Primes() {
  const [tab,      setTab]      = useState('general');
  const [primes,   setPrimes]   = useState(PRIMES_DEFOLT);
  const [editing,  setEditing]  = useState(null);  // prime aktyèl k ap edite
  const [form,     setForm]     = useState({});
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{
    api.get('/api/admin/primes').then(r=>{
      if (Array.isArray(r.data) && r.data.length>0) setPrimes(r.data);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const notify = (text,ok=true) => {
    setMsg(text);
    setTimeout(()=>setMsg(''),3500);
  };

  const openEdit = (p) => {
    setEditing(p.code);
    setForm({
      prime1: p.prime1||0,
      prime2: p.prime2||0,
      prime3: p.prime3||0,
      desc:   p.desc||'',
    });
  };

  const cancelEdit = () => { setEditing(null); setForm({}); };

  const saveEdit = async (code) => {
    setSaving(true);
    const updated = primes.map(p =>
      p.code===code ? {...p, prime1:Number(form.prime1||0),
        prime2:Number(form.prime2||0), prime3:Number(form.prime3||0), desc:form.desc||p.desc} : p
    );
    setPrimes(updated);
    try {
      await api.put('/api/admin/primes', updated);
      notify('✅ Prime modifye avèk siksè!');
    } catch { notify('⚠️ Sove lokalman — backend pa disponib', false); }
    setSaving(false);
    setEditing(null);
  };

  const visiblePrimes = primes.filter(p => p.categorie === tab || (!p.categorie && tab==='general'));
  const cfg = CAT_CFG[tab];

  return (
    <Layout>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'0 8px'}}>

        {/* BANNIÈRE */}
        <div style={{background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12,padding:'14px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#f59e0b',fontWeight:900,fontSize:18}}>💎 KONFIGURASYON PRIMES</div>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:12}}>LA-PROBITE-BORLETTE</div>
          </div>
          <div style={{textAlign:'right',color:'rgba(255,255,255,0.6)',fontSize:11}}>
            <div>Minimum vant: 1 Goud</div>
            <div>Mariage Gratuit: 2,000 G</div>
          </div>
        </div>

        {msg && (
          <div style={{background:msg.includes('✅')?'#dcfce7':'#fef9c3',
            border:`1px solid ${msg.includes('✅')?'#16a34a':'#ca8a04'}`,
            color:msg.includes('✅')?'#166534':'#854d0e',
            padding:'10px 16px',borderRadius:10,marginBottom:12,fontWeight:700}}>
            {msg}
          </div>
        )}

        {/* TABS */}
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {TABS.map(k=>{
            const c=CAT_CFG[k];
            return (
              <button key={k} onClick={()=>setTab(k)}
                style={{flex:1,padding:'12px 8px',border:`2px solid ${c.color}`,borderRadius:12,
                  background:tab===k?c.color:'white',color:tab===k?'white':c.color,
                  fontWeight:800,cursor:'pointer',fontSize:13,transition:'all 0.15s'}}>
                {c.label}
              </button>
            );
          })}
        </div>

        {/* LÉGENDE */}
        <div style={{background:cfg.bg,border:`1px solid ${cfg.border}`,
          borderRadius:10,padding:'10px 16px',marginBottom:14,
          display:'flex',gap:20,flexWrap:'wrap'}}>
          <div style={{fontSize:12,color:cfg.color,fontWeight:700}}>
            ℹ️ {tab==='general'
              ? 'Primes jeneral pou tout tiraj — Borlette: 1G→1er:50G | 2em:20G | 3em:500G'
              : tab==='tirage'
              ? 'Primes spesyal pa tiraj — diferan de primes jeneral yo'
              : 'Boule paire (2,4,6...) ak grappe (seri 3 boul) — prime espesyal'}
          </div>
        </div>

        {loading
          ? <div style={{textAlign:'center',padding:40,color:'#888'}}>⏳ Ap chaje primes...</div>
          : (
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden'}}>

            {/* TABLE HEADER */}
            <div style={{background:cfg.header,padding:'12px 16px'}}>
              <span style={{color:'white',fontWeight:900,fontSize:14}}>{cfg.label}</span>
              <span style={{color:'rgba(255,255,255,0.7)',fontSize:12,marginLeft:12}}>
                {visiblePrimes.length} tip jeu
              </span>
            </div>

            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8f9fa',borderBottom:'2px solid #e5e7eb'}}>
                  {['Kòd','Type Jeu','Prime 1er (pou 1G)','Prime 2em','Prime 3em','Aksyon'].map(h=>(
                    <th key={h} style={{padding:'10px 14px',fontWeight:800,fontSize:11,
                      color:'#374151',textAlign:'left',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiblePrimes.length===0
                  ? <tr><td colSpan={6} style={{padding:24,textAlign:'center',color:'#888',fontStyle:'italic'}}>
                      Pa gen primes pou kategori sa — Ajoute yo pi ba
                    </td></tr>
                  : visiblePrimes.map((p,i)=>(
                    <tr key={p.code} style={{borderBottom:'1px solid #f3f4f6',
                      background:editing===p.code?`${cfg.bg}`:i%2===0?'white':'#fafafa'}}>
                      
                      {/* KÒD */}
                      <td style={{padding:'12px 14px'}}>
                        <span style={{background:cfg.bg,color:cfg.color,
                          borderRadius:8,padding:'4px 10px',fontWeight:800,
                          fontSize:13,fontFamily:'monospace'}}>
                          {p.code}
                        </span>
                      </td>

                      {/* TYPE */}
                      <td style={{padding:'12px 14px',fontWeight:700,fontSize:13,color:'#111'}}>
                        {p.type}
                      </td>

                      {/* PRIMES — EDIT MODE */}
                      {editing===p.code ? (
                        <>
                          {['prime1','prime2','prime3'].map((f,idx)=>(
                            <td key={f} style={{padding:'8px 14px'}}>
                              <div style={{display:'flex',alignItems:'center',gap:4}}>
                                <span style={{fontSize:11,color:'#888'}}>1G→</span>
                                <input type="number" min="0" value={form[f]||0}
                                  onChange={e=>setForm(prev=>({...prev,[f]:e.target.value}))}
                                  style={{width:90,padding:'7px 10px',border:`2px solid ${cfg.color}`,
                                    borderRadius:8,fontSize:14,fontWeight:700,
                                    textAlign:'right',color:cfg.color}}/>
                                <span style={{fontSize:11,color:'#888'}}>G</span>
                              </div>
                            </td>
                          ))}
                          <td style={{padding:'8px 14px'}}>
                            <div style={{display:'flex',gap:6}}>
                              <button onClick={()=>saveEdit(p.code)} disabled={saving}
                                style={{background:'#16a34a',color:'white',border:'none',
                                  borderRadius:8,padding:'8px 16px',fontWeight:700,
                                  cursor:'pointer',fontSize:12}}>
                                {saving?'⏳':'✅ Sove'}
                              </button>
                              <button onClick={cancelEdit}
                                style={{background:'#f3f4f6',color:'#555',border:'none',
                                  borderRadius:8,padding:'8px 12px',fontWeight:700,
                                  cursor:'pointer',fontSize:12}}>
                                ✕
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* AFFICHAGE PRIMES */}
                          <td style={{padding:'12px 14px'}}>
                            {p.prime1>0 ? (
                              <span style={{background:'#dcfce7',color:'#166534',
                                borderRadius:20,padding:'4px 12px',fontWeight:800,fontSize:13}}>
                                1G → {Number(p.prime1).toLocaleString('fr')} G
                              </span>
                            ) : <span style={{color:'#ccc',fontSize:12}}>—</span>}
                          </td>
                          <td style={{padding:'12px 14px'}}>
                            {p.prime2>0 ? (
                              <span style={{background:'#fef9c3',color:'#854d0e',
                                borderRadius:20,padding:'4px 12px',fontWeight:800,fontSize:13}}>
                                1G → {Number(p.prime2).toLocaleString('fr')} G
                              </span>
                            ) : <span style={{color:'#ccc',fontSize:12}}>—</span>}
                          </td>
                          <td style={{padding:'12px 14px'}}>
                            {p.prime3>0 ? (
                              <span style={{background:'#eff6ff',color:'#1e40af',
                                borderRadius:20,padding:'4px 12px',fontWeight:800,fontSize:13}}>
                                1G → {Number(p.prime3).toLocaleString('fr')} G
                              </span>
                            ) : <span style={{color:'#ccc',fontSize:12}}>—</span>}
                          </td>

                          {/* AKSYON */}
                          <td style={{padding:'12px 14px'}}>
                            <button onClick={()=>openEdit(p)}
                              style={{background:cfg.color,color:'white',border:'none',
                                borderRadius:8,padding:'7px 16px',fontWeight:700,
                                cursor:'pointer',fontSize:12,transition:'opacity 0.15s'}}
                              onMouseEnter={e=>e.currentTarget.style.opacity='0.85'}
                              onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                              ✏️ Modifye
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                }
              </tbody>
            </table>

            {/* NOTE REFERANS */}
            <div style={{background:'#f8f9fa',padding:'12px 16px',
              borderTop:'1px solid #e5e7eb',fontSize:11,color:'#666'}}>
              <strong>Referans Prime Standar:</strong>
              {' '}Borlette: 1er→50G | 2em→20G | 3em→500G
              {' '}· Loto3: 500G · Mariage: 5,000G · Loto4: 500G · Loto5: 25,000G · Mariage Gratuit: 2,000G (fiks)
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
