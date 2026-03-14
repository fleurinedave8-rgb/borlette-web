import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

// ── DONE DEFÒLT ─────────────────────────────────────────────
const DEFOLT = [
  // GÉNÉRAL
  { code:'20',  cat:'general', type:'Borlette',              prime:'50 / 20 / 10' },
  { code:'30',  cat:'general', type:'Loto 3',                prime:'500'          },
  { code:'40',  cat:'general', type:'Mariage',               prime:'1000'         },
  { code:'41',  cat:'general', type:'L401',                  prime:'5000'         },
  { code:'42',  cat:'general', type:'L402',                  prime:'5000'         },
  { code:'43',  cat:'general', type:'L403',                  prime:'5000'         },
  { code:'51',  cat:'general', type:'L501',                  prime:'25000'        },
  { code:'52',  cat:'general', type:'L502',                  prime:'25000'        },
  { code:'53',  cat:'general', type:'L503',                  prime:'25000'        },
  { code:'44',  cat:'general', type:'Mariage Gratuit',       prime:'3000'         },
  { code:'105', cat:'general', type:'Tèt Fich Loto3 Dwat',   prime:'500'          },
  { code:'106', cat:'general', type:'Tèt Fich Mariage Dwat', prime:'500'          },
  { code:'107', cat:'general', type:'Tèt Fich Loto3 Goch',   prime:'500'          },
  { code:'108', cat:'general', type:'Tèt Fich Mariage Goch', prime:'500'          },
  // PAR TIRAGE
  { code:'T01', cat:'tirage',  type:'Florida Matin',         prime:'50 / 20 / 10' },
  { code:'T02', cat:'tirage',  type:'Florida Soir',          prime:'50 / 20 / 10' },
  { code:'T03', cat:'tirage',  type:'New-York Matin',        prime:'50 / 20 / 10' },
  { code:'T04', cat:'tirage',  type:'New-York Soir',         prime:'50 / 20 / 10' },
  { code:'T05', cat:'tirage',  type:'Georgia Matin',         prime:'50 / 20 / 10' },
  { code:'T06', cat:'tirage',  type:'Georgia Soir',          prime:'50 / 20 / 10' },
  // BOULE PAIRE & GRAPPE
  { code:'P01', cat:'paire',   type:'Boule Pè (00-99)',      prime:'10'           },
  { code:'P02', cat:'paire',   type:'Grappe 3 Boul',         prime:'100'          },
  { code:'P03', cat:'paire',   type:'Grappe 4 Boul',         prime:'500'          },
  { code:'P04', cat:'paire',   type:'Grappe 5 Boul',         prime:'2000'         },
];

const TABS = [
  { key:'general', label:'Général',              color:'#1a73e8', bg:'#eff6ff' },
  { key:'tirage',  label:'Par Tiraj',             color:'#16a34a', bg:'#f0fdf4' },
  { key:'paire',   label:'Boule Paire & Grappe',  color:'#ca8a04', bg:'#fefce8' },
];

export default function Primes() {
  const [tab,     setTab]    = useState('general');
  const [primes,  setPrimes] = useState(DEFOLT);
  const [loading, setLoading]= useState(true);
  const [msg,     setMsg]    = useState({ t:'', ok:true });

  // Modal modifier
  const [editing, setEditing]= useState(null); // obje prime aktyèl
  const [valEdit, setValEdit]= useState('');

  // Modal ajoute
  const [showAdd, setShowAdd]= useState(false);
  const [newP,    setNewP]   = useState({ code:'', cat:'general', type:'', prime:'' });
  const [saving,  setSaving] = useState(false);

  // Konfirmasyon efase
  const [delConf, setDelConf]= useState(null);

  // Menu aksyon — kode prime ki gen menu ouvè
  const [menuOpen,setMenuOpen]=useState(null);

  useEffect(() => {
    api.get('/api/admin/primes')
      .then(r => { if (Array.isArray(r.data) && r.data.length > 0) setPrimes(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const notify = (t, ok=true) => {
    setMsg({t,ok});
    setTimeout(() => setMsg({t:'',ok:true}), 3500);
  };

  const saveToDB = async (list) => {
    try {
      await api.put('/api/admin/primes', list);
      notify('✅ Sove avèk siksè!');
    } catch { notify('⚠️ Sove lokalman sèlman', false); }
  };

  // Ouvri modal Modifier
  const openEdit = (p) => {
    setEditing(p);
    setValEdit(p.prime || '');
    setMenuOpen(null);
  };

  // Sove modifikasyon
  const saveEdit = async () => {
    if (!valEdit.trim()) return;
    setSaving(true);
    const updated = primes.map(p =>
      p.code === editing.code ? { ...p, prime: valEdit.trim() } : p
    );
    setPrimes(updated);
    await saveToDB(updated);
    setSaving(false);
    setEditing(null);
  };

  // Ajoute nouvo prime
  const doAdd = async () => {
    if (!newP.code.trim() || !newP.type.trim()) {
      alert('Kòd ak Type obligatwa!'); return;
    }
    if (primes.find(p => p.code === newP.code.trim())) {
      alert('Kòd sa deja egziste!'); return;
    }
    setSaving(true);
    const entry = { code:newP.code.trim(), cat:newP.cat,
                    type:newP.type.trim(), prime:newP.prime.trim()||'0' };
    const updated = [...primes, entry];
    setPrimes(updated);
    await saveToDB(updated);
    setSaving(false);
    setShowAdd(false);
    setNewP({ code:'', cat:'general', type:'', prime:'' });
    setTab(entry.cat);
  };

  // Efase
  const doDelete = async (code) => {
    const updated = primes.filter(p => p.code !== code);
    setPrimes(updated);
    await saveToDB(updated);
    setDelConf(null);
    notify('🗑️ Prime efase');
  };

  const visible = primes.filter(p => (p.cat||'general') === tab);
  const cfg = TABS.find(t => t.key === tab);

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 8px 40px' }}
        onClick={() => menuOpen && setMenuOpen(null)}>

        {/* ── BANNIÈRE ── */}
        <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12, padding:'14px 20px', marginBottom:16,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'#f59e0b', fontWeight:900, fontSize:18 }}>
              💎 PRIMES — PAYOUT SISTÈM
            </div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>
              LA-PROBITE-BORLETTE · Jere tout prim ak payout yo
            </div>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ background:'#f59e0b', color:'#111', border:'none',
              borderRadius:10, padding:'10px 18px', fontWeight:900,
              fontSize:13, cursor:'pointer' }}>
            ➕ Ajoute Prime
          </button>
        </div>

        {/* ── NOTIFIKASYON ── */}
        {msg.t && (
          <div style={{ background:msg.ok?'#dcfce7':'#fef9c3',
            border:`1.5px solid ${msg.ok?'#16a34a':'#ca8a04'}`,
            color:msg.ok?'#166534':'#854d0e',
            padding:'10px 16px', borderRadius:10, marginBottom:14, fontWeight:700 }}>
            {msg.t}
          </div>
        )}

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:8, marginBottom:0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:'12px 8px',
                border:`2px solid ${t.color}`, borderRadius:'12px 12px 0 0',
                background: tab===t.key ? t.color : 'white',
                color: tab===t.key ? 'white' : t.color,
                fontWeight:800, fontSize:13, cursor:'pointer',
                borderBottom: tab===t.key ? `2px solid ${t.color}` : '2px solid #e5e7eb',
                transition:'all .15s' }}>
              {t.key==='general' ? '🔵' : t.key==='tirage' ? '🟢' : '🟡'} {t.label}
            </button>
          ))}
        </div>

        {/* ── TABLO ── */}
        {loading ? (
          <div style={{ background:'white', borderRadius:'0 0 12px 12px',
            padding:48, textAlign:'center', color:'#888',
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
            ⏳ Ap chaje primes...
          </div>
        ) : (
          <div style={{ background:'white', borderRadius:'0 0 12px 12px',
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflow:'hidden',
            border:`2px solid ${cfg.color}`, borderTop:'none' }}>

            {/* Tèt tablo */}
            <div style={{ background:cfg.color, padding:'10px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'white', fontWeight:900, fontSize:13 }}>
                {cfg.key==='general'?'🔵':'🟢'} {cfg.label}
              </span>
              <span style={{ color:'rgba(255,255,255,0.75)', fontSize:12 }}>
                {visible.length} prime
              </span>
            </div>

            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8f9fa',
                  borderBottom:'2px solid #e5e7eb' }}>
                  {['Code','Type','Prime','Action'].map((h,i) => (
                    <th key={h} style={{ padding:'12px 16px',
                      fontWeight:800, fontSize:12, color:'#374151',
                      textAlign: i===3 ? 'center' : 'left',
                      letterSpacing:0.5 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding:32, textAlign:'center',
                      color:'#aaa', fontStyle:'italic' }}>
                      Pa gen primes — klike ➕ Ajoute Prime
                    </td>
                  </tr>
                ) : visible.map((p, i) => (
                  <tr key={p.code}
                    style={{ borderBottom:'1px solid #f0f0f0',
                      background: i%2===0 ? 'white' : '#fafafa',
                      transition:'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background='#f8f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background=i%2===0?'white':'#fafafa'}>

                    {/* CODE */}
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ background:cfg.bg, color:cfg.color,
                        borderRadius:8, padding:'4px 12px',
                        fontWeight:900, fontSize:13, fontFamily:'monospace' }}>
                        {p.code}
                      </span>
                    </td>

                    {/* TYPE */}
                    <td style={{ padding:'13px 16px',
                      fontWeight:700, fontSize:14, color:'#111' }}>
                      {p.type}
                    </td>

                    {/* PRIME */}
                    <td style={{ padding:'13px 16px' }}>
                      <span style={{ background:'#dcfce7', color:'#166534',
                        borderRadius:20, padding:'5px 16px',
                        fontWeight:900, fontSize:14 }}>
                        {p.prime} G
                      </span>
                    </td>

                    {/* ACTION */}
                    <td style={{ padding:'13px 16px', textAlign:'center',
                      position:'relative' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen===p.code?null:p.code); }}
                        style={{ background:'#1a73e8', color:'white',
                          border:'none', borderRadius:8, padding:'8px 20px',
                          fontWeight:700, fontSize:13, cursor:'pointer',
                          display:'inline-flex', alignItems:'center', gap:6 }}>
                        Action ▾
                      </button>

                      {/* Menu dropdown */}
                      {menuOpen === p.code && (
                        <div onClick={e=>e.stopPropagation()}
                          style={{ position:'absolute', top:'100%', right:8,
                            background:'white', borderRadius:10, zIndex:100,
                            boxShadow:'0 8px 24px rgba(0,0,0,0.15)',
                            border:'1px solid #e5e7eb', minWidth:140,
                            overflow:'hidden' }}>
                          <button onClick={() => openEdit(p)}
                            style={{ width:'100%', padding:'11px 16px',
                              background:'none', border:'none', textAlign:'left',
                              fontWeight:700, fontSize:13, cursor:'pointer',
                              color:'#1a73e8', display:'flex', alignItems:'center', gap:8,
                              borderBottom:'1px solid #f0f0f0' }}
                            onMouseEnter={e=>e.currentTarget.style.background='#eff6ff'}
                            onMouseLeave={e=>e.currentTarget.style.background='none'}>
                            ✏️ Modifier
                          </button>
                          <button onClick={() => { setDelConf(p); setMenuOpen(null); }}
                            style={{ width:'100%', padding:'11px 16px',
                              background:'none', border:'none', textAlign:'left',
                              fontWeight:700, fontSize:13, cursor:'pointer',
                              color:'#dc2626', display:'flex', alignItems:'center', gap:8 }}
                            onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                            onMouseLeave={e=>e.currentTarget.style.background='none'}>
                            🗑️ Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════ MODAL MODIFIER ════ */}
        {editing && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            zIndex:2000, display:'flex', alignItems:'center',
            justifyContent:'center', padding:20 }}
            onClick={() => setEditing(null)}>
            <div style={{ background:'white', borderRadius:16, padding:28,
              maxWidth:420, width:'100%' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight:900, fontSize:18, marginBottom:4 }}>
                ✏️ Modifier Prime
              </div>
              <div style={{ color:'#888', fontSize:13, marginBottom:20 }}>
                Kòd <span style={{ fontFamily:'monospace', fontWeight:800,
                  color:cfg.color }}>{editing.code}</span>
                {' — '}{editing.type}
              </div>

              <label style={{ display:'block', fontWeight:700, fontSize:13,
                marginBottom:6, color:'#555' }}>
                Nouvo Valè Prime (G)
              </label>
              <input
                value={valEdit}
                onChange={e => setValEdit(e.target.value)}
                placeholder="ex: 50 / 20 / 10  oswa  500"
                autoFocus
                style={{ width:'100%', padding:'13px 16px',
                  border:`2px solid ${cfg.color}`, borderRadius:10,
                  fontSize:16, fontWeight:700, boxSizing:'border-box',
                  fontFamily:'monospace', color:cfg.color }}
              />
              <div style={{ fontSize:11, color:'#888', marginTop:6 }}>
                Pou Borlette: ekri <strong>50 / 20 / 10</strong> (1e / 2e / 3e pozisyon)
              </div>

              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button onClick={() => setEditing(null)}
                  style={{ flex:1, padding:'12px', background:'#f3f4f6',
                    border:'none', borderRadius:10, fontWeight:700,
                    cursor:'pointer', fontSize:14 }}>
                  Anile
                </button>
                <button onClick={saveEdit} disabled={saving||!valEdit.trim()}
                  style={{ flex:2, padding:'12px',
                    background: saving||!valEdit.trim() ? '#ccc' : '#1a73e8',
                    color:'white', border:'none', borderRadius:10,
                    fontWeight:900, cursor: saving?'default':'pointer', fontSize:14 }}>
                  {saving ? '⏳...' : '✅ Sove Chanjman'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ MODAL AJOUTE ════ */}
        {showAdd && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
            zIndex:2000, display:'flex', alignItems:'flex-end',
            justifyContent:'center' }}
            onClick={() => setShowAdd(false)}>
            <div style={{ background:'white', borderRadius:'20px 20px 0 0',
              width:'100%', maxWidth:520, padding:'0 0 44px' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ width:44,height:5,background:'#ddd',
                borderRadius:3,margin:'12px auto 16px'}} />
              <div style={{ padding:'0 20px 14px',
                display:'flex', justifyContent:'space-between', alignItems:'center',
                borderBottom:'1px solid #f0f0f0', marginBottom:16 }}>
                <span style={{ fontWeight:900, fontSize:17 }}>➕ Ajoute Nouvo Prime</span>
                <button onClick={() => setShowAdd(false)}
                  style={{ background:'none',border:'none',fontSize:22,
                    cursor:'pointer',color:'#888' }}>✕</button>
              </div>
              <div style={{ padding:'0 20px' }}>

                {/* Kategori */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    marginBottom:6, color:'#555' }}>📂 Kategori</label>
                  <div style={{ display:'flex', gap:6 }}>
                    {TABS.map(t => (
                      <button key={t.key} onClick={() => setNewP(p=>({...p,cat:t.key}))}
                        type="button"
                        style={{ flex:1, padding:'9px',
                          border:`2px solid ${t.color}`, borderRadius:10,
                          background: newP.cat===t.key ? t.color : 'white',
                          color: newP.cat===t.key ? 'white' : t.color,
                          fontWeight:700, cursor:'pointer', fontSize:11 }}>
                        {t.key==='general'?'🔵':'🟢'} {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kòd + Type */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontWeight:700, fontSize:12,
                      marginBottom:4, color:'#555' }}>Code *</label>
                    <input value={newP.code} onChange={e=>setNewP(p=>({...p,code:e.target.value}))}
                      placeholder="ex: 20"
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                        borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:700, fontSize:12,
                      marginBottom:4, color:'#555' }}>Type Jwèt *</label>
                    <input value={newP.type} onChange={e=>setNewP(p=>({...p,type:e.target.value}))}
                      placeholder="ex: Borlette"
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                        borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                  </div>
                </div>

                {/* Prime */}
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    marginBottom:4, color:'#555' }}>Prime (G) *</label>
                  <input value={newP.prime} onChange={e=>setNewP(p=>({...p,prime:e.target.value}))}
                    placeholder="ex: 500  oswa  50 / 20 / 10"
                    style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                      borderRadius:8, fontSize:14, fontFamily:'monospace',
                      fontWeight:700, boxSizing:'border-box' }} />
                </div>

                <button onClick={doAdd} disabled={saving}
                  style={{ width:'100%', padding:'14px',
                    background: saving ? '#ccc' : '#1a73e8',
                    color:'white', border:'none', borderRadius:12,
                    fontWeight:900, fontSize:15, cursor: saving?'default':'pointer' }}>
                  {saving ? '⏳...' : '✅ Ajoute Prime'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ KONFIRMASYON EFASE ════ */}
        {delConf && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            zIndex:2000, display:'flex', alignItems:'center',
            justifyContent:'center', padding:20 }}
            onClick={() => setDelConf(null)}>
            <div style={{ background:'white', borderRadius:16, padding:28,
              maxWidth:340, width:'100%', textAlign:'center' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:44, marginBottom:10 }}>🗑️</div>
              <div style={{ fontWeight:900, fontSize:17, marginBottom:6 }}>
                Efase prime sa?
              </div>
              <div style={{ background:'#f8f9fa', borderRadius:8, padding:'8px 14px',
                marginBottom:20, display:'inline-block' }}>
                <span style={{ fontFamily:'monospace', fontWeight:800 }}>
                  {delConf.code}
                </span>
                {' — '}{delConf.type}
                <div style={{ color:'#16a34a', fontWeight:900, marginTop:2 }}>
                  {delConf.prime} G
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setDelConf(null)}
                  style={{ flex:1, padding:'11px', background:'#f3f4f6',
                    border:'none', borderRadius:10, fontWeight:700,
                    cursor:'pointer', fontSize:14 }}>
                  Anile
                </button>
                <button onClick={() => doDelete(delConf.code)}
                  style={{ flex:1, padding:'11px', background:'#dc2626',
                    color:'white', border:'none', borderRadius:10,
                    fontWeight:900, cursor:'pointer', fontSize:14 }}>
                  Efase
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
