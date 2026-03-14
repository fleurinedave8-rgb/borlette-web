import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const DEFOLT_GENERAL = [
  { code:'20',  type:'Borlette',              prime:'60|20|10' },
  { code:'30',  type:'Loto 3',                prime:'500'      },
  { code:'40',  type:'Mariage',               prime:'1000'     },
  { code:'41',  type:'L401',                  prime:'5000'     },
  { code:'42',  type:'L402',                  prime:'5000'     },
  { code:'43',  type:'L403',                  prime:'5000'     },
  { code:'51',  type:'L501',                  prime:'25000'    },
  { code:'52',  type:'L502',                  prime:'25000'    },
  { code:'53',  type:'L503',                  prime:'25000'    },
  { code:'44',  type:'Mariage Gratuit',        prime:'2000'     },
  { code:'105', type:'Tet fich loto3 dwat',    prime:'0'        },
  { code:'106', type:'Tet fich mariaj dwat',   prime:'0'        },
  { code:'107', type:'Tet fich loto3 gauch',   prime:'0'        },
  { code:'108', type:'Tet fich mariaj gauch',  prime:'0'        },
];

const DEFOLT_TIRAGE = [
  { code:'T01', type:'Florida Matin',  prime:'60|20|10' },
  { code:'T02', type:'Florida Soir',   prime:'60|20|10' },
  { code:'T03', type:'New-York Matin', prime:'60|20|10' },
  { code:'T04', type:'New-York Soir',  prime:'60|20|10' },
  { code:'T05', type:'Georgia Matin',  prime:'60|20|10' },
  { code:'T06', type:'Georgia Soir',   prime:'60|20|10' },
];

const DEFOLT_PAIRE = [
  { code:'P01', type:'Boule Pè (00-99)', prime:'10'   },
  { code:'P02', type:'Grappe 3 Boul',    prime:'100'  },
  { code:'P03', type:'Grappe 4 Boul',    prime:'500'  },
  { code:'P04', type:'Grappe 5 Boul',    prime:'2000' },
];

export default function Primes() {
  const [tab,     setTab]     = useState('general');
  const [general, setGeneral] = useState(DEFOLT_GENERAL);
  const [tirage,  setTirage]  = useState(DEFOLT_TIRAGE);
  const [paire,   setPaire]   = useState(DEFOLT_PAIRE);
  const [loading, setLoading] = useState(true);
  const [menuOpen,setMenuOpen]= useState(null);
  const [editing, setEditing] = useState(null);
  const [valEdit, setValEdit] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');

  useEffect(() => {
    api.get('/api/admin/primes').then(r => {
      if (Array.isArray(r.data) && r.data.length > 0) {
        setGeneral(r.data.filter(p => (p.cat||'general')==='general'));
        setTirage( r.data.filter(p => p.cat==='tirage'));
        setPaire(  r.data.filter(p => p.cat==='paire'));
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const notify = (t) => { setMsg(t); setTimeout(()=>setMsg(''), 3000); };

  const getList   = () => tab==='general' ? general : tab==='tirage' ? tirage : paire;
  const setList   = (fn) => {
    if (tab==='general') setGeneral(fn);
    else if (tab==='tirage') setTirage(fn);
    else setPaire(fn);
  };

  const saveAll = async (g, t, p) => {
    const all = [
      ...g.map(x=>({...x,cat:'general'})),
      ...t.map(x=>({...x,cat:'tirage'})),
      ...p.map(x=>({...x,cat:'paire'})),
    ];
    try {
      await api.put('/api/admin/primes', all);
      notify('✅ Sove avèk siksè!');
    } catch { notify('⚠️ Pa kapab sove sou sèvè'); }
  };

  const openEdit = (p) => {
    setEditing(p); setValEdit(p.prime||''); setMenuOpen(null);
  };

  const doSave = async () => {
    if (!valEdit.trim()) return;
    setSaving(true);
    const next = getList().map(p =>
      p.code===editing.code ? {...p, prime:valEdit.trim()} : p
    );
    setList(() => next);
    const ng = tab==='general'?next:general;
    const nt = tab==='tirage' ?next:tirage;
    const np = tab==='paire'  ?next:paire;
    await saveAll(ng, nt, np);
    setSaving(false);
    setEditing(null);
  };

  const TABS = [
    { key:'general', label:'Général',             color:'#1a73e8' },
    { key:'tirage',  label:'Par Tirage',           color:'#16a34a' },
    { key:'paire',   label:'Boule paire et grappe',color:'#ca8a04' },
  ];

  const rows = getList();

  return (
    <Layout>
      <div style={{ maxWidth:860, margin:'0 auto', padding:'0 12px 40px' }}
        onClick={() => menuOpen && setMenuOpen(null)}>

        {/* TITRE */}
        <h1 style={{ fontSize:26, fontWeight:900, color:'#111',
          margin:'0 0 20px', paddingTop:8 }}>
          Primes
        </h1>

        {/* NOTIF */}
        {msg && (
          <div style={{ background: msg.startsWith('✅')?'#dcfce7':'#fef9c3',
            border:`1px solid ${msg.startsWith('✅')?'#16a34a':'#ca8a04'}`,
            color: msg.startsWith('✅')?'#166534':'#854d0e',
            padding:'10px 16px', borderRadius:8, marginBottom:14, fontWeight:700 }}>
            {msg}
          </div>
        )}

        {/* ONGLETS */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding:'10px 20px', borderRadius:8, border:'none',
                background: tab===t.key ? t.color : '#e5e7eb',
                color: tab===t.key ? 'white' : '#374151',
                fontWeight:700, fontSize:13, cursor:'pointer',
                transition:'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TABLEAU */}
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#888' }}>
            Chargement...
          </div>
        ) : (
          <div style={{ background:'white', borderRadius:10,
            boxShadow:'0 1px 4px rgba(0,0,0,0.09)', overflow:'visible' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                  {['Code','Type','Prime','Action'].map((h,i) => (
                    <th key={h} style={{ padding:'12px 16px', fontWeight:700,
                      fontSize:12, color:'#555', textAlign:'left',
                      letterSpacing:0.5,
                      width: h==='Code'?'80px': h==='Action'?'100px':'auto' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.code}
                    style={{ borderBottom:'1px solid #f0f0f0',
                      background: i%2===0 ? 'white' : '#fafafa' }}>

                    {/* CODE */}
                    <td style={{ padding:'12px 16px',
                      fontFamily:'monospace', fontWeight:800,
                      fontSize:14, color:'#374151' }}>
                      {p.code}
                    </td>

                    {/* TYPE */}
                    <td style={{ padding:'12px 16px',
                      fontWeight:600, fontSize:14, color:'#111' }}>
                      {p.type}
                    </td>

                    {/* PRIME */}
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontWeight:800, fontSize:14, color:'#16a34a' }}>
                        {p.prime}
                      </span>
                    </td>

                    {/* ACTION */}
                    <td style={{ padding:'12px 16px', position:'relative' }}>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen===p.code?null:p.code); }}
                        style={{ background:'#1a73e8', color:'white', border:'none',
                          borderRadius:6, padding:'7px 14px', fontWeight:700,
                          fontSize:13, cursor:'pointer' }}>
                        Action ▾
                      </button>

                      {menuOpen === p.code && (
                        <div onClick={e=>e.stopPropagation()}
                          style={{ position:'absolute', top:'110%', left:0,
                            background:'white', borderRadius:8, zIndex:999,
                            boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
                            border:'1px solid #e5e7eb', minWidth:130,
                            overflow:'hidden' }}>
                          <button onClick={() => openEdit(p)}
                            style={{ width:'100%', padding:'10px 16px',
                              background:'none', border:'none', textAlign:'left',
                              fontWeight:700, fontSize:13, cursor:'pointer', color:'#111' }}
                            onMouseEnter={e=>e.currentTarget.style.background='#f0f0f0'}
                            onMouseLeave={e=>e.currentTarget.style.background='none'}>
                            ✏️ Modifier
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

        {/* ── MODAL MODIFIER ── */}
        {editing && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
            zIndex:2000, display:'flex', alignItems:'center',
            justifyContent:'center', padding:20 }}
            onClick={() => setEditing(null)}>
            <div style={{ background:'white', borderRadius:14, padding:28,
              maxWidth:400, width:'100%' }}
              onClick={e=>e.stopPropagation()}>
              <div style={{ fontWeight:900, fontSize:17, marginBottom:4 }}>
                Modifier Prime
              </div>
              <div style={{ color:'#888', fontSize:13, marginBottom:18 }}>
                Code <strong>{editing.code}</strong> — {editing.type}
              </div>

              <label style={{ display:'block', fontWeight:700, fontSize:13,
                color:'#555', marginBottom:6 }}>Valeur de la prime</label>
              <input value={valEdit} onChange={e=>setValEdit(e.target.value)}
                autoFocus
                placeholder="ex: 500  ou  60|20|10"
                style={{ width:'100%', padding:'12px 14px',
                  border:'2px solid #1a73e8', borderRadius:8,
                  fontSize:15, fontWeight:700, fontFamily:'monospace',
                  boxSizing:'border-box', color:'#1a73e8' }} />
              {editing.code==='20' && (
                <div style={{ fontSize:11, color:'#888', marginTop:5 }}>
                  Format Borlette: <strong>1er|2em|3em</strong> — ex: 60|20|10
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button onClick={() => setEditing(null)}
                  style={{ flex:1, padding:'11px', background:'#f3f4f6',
                    border:'none', borderRadius:8, fontWeight:700,
                    cursor:'pointer', fontSize:14 }}>
                  Annuler
                </button>
                <button onClick={doSave} disabled={saving||!valEdit.trim()}
                  style={{ flex:2, padding:'11px',
                    background: saving ? '#ccc' : '#1a73e8',
                    color:'white', border:'none', borderRadius:8,
                    fontWeight:900, cursor:'pointer', fontSize:14 }}>
                  {saving ? '...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
