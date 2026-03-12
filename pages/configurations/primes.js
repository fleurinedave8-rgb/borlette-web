import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TYPES_DISPONIB = [
  'Borlette','Loto 3','Mariage','L4O1','L4O3',
  'L5O1','L5O2','L5O3','Mariage Gratuit',
  'Tèt Fich Borlette','Tèt Fich Loto3 Dwat','Tèt Fich Loto3 Goch',
  'Tèt Fich Mariage Dwat','Tèt Fich Mariage Goch','Autre'
];

const DEFOLT = [
  { code:'20',  cat:'general', type:'Borlette',              p1:50,    p2:20,  p3:500,  note:'1er→50 | 2em→20 | 3em→500' },
  { code:'30',  cat:'general', type:'Loto 3',                p1:500,   p2:0,   p3:0,    note:'1G → 500G' },
  { code:'40',  cat:'general', type:'Mariage',               p1:5000,  p2:0,   p3:0,    note:'1G → 5000G' },
  { code:'41',  cat:'general', type:'L4O1',                  p1:500,   p2:0,   p3:0,    note:'Loto4 1ère pos' },
  { code:'43',  cat:'general', type:'L4O3',                  p1:500,   p2:0,   p3:0,    note:'Loto4 3ème pos' },
  { code:'51',  cat:'general', type:'L5O1',                  p1:25000, p2:0,   p3:0,    note:'Loto5 1ère pos' },
  { code:'52',  cat:'general', type:'L5O2',                  p1:25000, p2:0,   p3:0,    note:'Loto5 2ème pos' },
  { code:'53',  cat:'general', type:'L5O3',                  p1:25000, p2:0,   p3:0,    note:'Loto5 3ème pos' },
  { code:'44',  cat:'general', type:'Mariage Gratuit',       p1:2000,  p2:0,   p3:0,    note:'Fiks 2000G' },
  { code:'105', cat:'general', type:'Tèt Fich Borlette',     p1:0,     p2:0,   p3:0,    note:'—' },
  { code:'106', cat:'general', type:'Tèt Fich Loto3 Dwat',   p1:0,     p2:0,   p3:0,    note:'—' },
  { code:'107', cat:'general', type:'Tèt Fich Mariage Dwat', p1:0,     p2:0,   p3:0,    note:'—' },
  { code:'108', cat:'general', type:'Tèt Fich Loto3 Goch',   p1:0,     p2:0,   p3:0,    note:'—' },
  { code:'109', cat:'general', type:'Tèt Fich Mariage Goch', p1:0,     p2:0,   p3:0,    note:'—' },
];

const CAT = {
  general: { label:'🔵 Général',            color:'#1a73e8', bg:'#eff6ff' },
  tirage:  { label:'🟢 Par Tiraj',           color:'#16a34a', bg:'#f0fdf4' },
  paire:   { label:'🟡 Boule Paire & Grappe', color:'#ca8a04', bg:'#fefce8' },
};

const NB = n => Number(n||0).toLocaleString('fr');

export default function Primes() {
  const [tab,     setTab]    = useState('general');
  const [primes,  setPrimes] = useState(DEFOLT);
  const [editing, setEditing]= useState(null);
  const [form,    setForm]   = useState({});
  const [saving,  setSaving] = useState(false);
  const [msg,     setMsg]    = useState({ t:'', ok:true });
  const [loading, setLoading]= useState(true);
  const [showAdd, setShowAdd]= useState(false);
  const [newP,    setNewP]   = useState({ code:'', cat:'general', type:'', p1:'', p2:'', p3:'', note:'' });
  const [delConf, setDelConf]= useState(null);

  useEffect(() => {
    api.get('/api/admin/primes')
      .then(r => { if (Array.isArray(r.data) && r.data.length > 0) setPrimes(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const notify = (t, ok=true) => { setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3500); };

  const save = async (newList) => {
    try {
      await api.put('/api/admin/primes', newList);
      notify('✅ Sove avèk siksè!');
    } catch { notify('⚠️ Sove lokalman sèlman', false); }
  };

  const startEdit = p => { setEditing(p.code); setForm({ p1:p.p1||0, p2:p.p2||0, p3:p.p3||0, note:p.note||'' }); };
  const cancelEdit = () => { setEditing(null); setForm({}); };

  const doSave = async code => {
    setSaving(true);
    const updated = primes.map(p => p.code===code
      ? {...p, p1:Number(form.p1||0), p2:Number(form.p2||0), p3:Number(form.p3||0), note:form.note||p.note}
      : p);
    setPrimes(updated);
    await save(updated);
    setSaving(false);
    setEditing(null);
  };

  const doAdd = async () => {
    if (!newP.type.trim() || !newP.code.trim()) { alert('Kòd ak Type obligatwa!'); return; }
    if (primes.find(p => p.code === newP.code.trim())) { alert('Kòd sa deja egziste!'); return; }
    setSaving(true);
    const entry = { code:newP.code.trim(), cat:newP.cat, type:newP.type.trim(),
      p1:Number(newP.p1||0), p2:Number(newP.p2||0), p3:Number(newP.p3||0), note:newP.note||'—' };
    const updated = [...primes, entry];
    setPrimes(updated);
    await save(updated);
    setSaving(false);
    setShowAdd(false);
    setNewP({ code:'', cat:'general', type:'', p1:'', p2:'', p3:'', note:'' });
    setTab(entry.cat);
  };

  const doDelete = async code => {
    const updated = primes.filter(p => p.code !== code);
    setPrimes(updated);
    await save(updated);
    setDelConf(null);
    notify('🗑️ Prime efase');
  };

  const visible = primes.filter(p => (p.cat||'general') === tab);
  const cfg = CAT[tab];

  const inp = (val, setter, ph='') => (
    <input value={val} onChange={e => setter(e.target.value)} placeholder={ph}
      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
        borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
  );

  const numInp = (field, color) => (
    <td style={{ padding:'8px 10px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <input type="number" min="0" value={form[field]||0}
          onChange={e => setForm(f => ({...f, [field]:e.target.value}))}
          style={{ width:88, padding:'7px 8px', border:`2px solid ${color}`,
            borderRadius:8, fontSize:14, fontWeight:700, textAlign:'right', color }} />
        <span style={{ fontSize:11, color:'#888', flexShrink:0 }}>G</span>
      </div>
    </td>
  );

  const badge = (val, bg, col) => val > 0
    ? <span style={{ background:bg, color:col, borderRadius:20, padding:'4px 12px',
        fontWeight:800, fontSize:13, whiteSpace:'nowrap' }}>1G → {NB(val)} G</span>
    : <span style={{ color:'#ccc', fontSize:12 }}>—</span>;

  return (
    <Layout>
      <div style={{ maxWidth:1050, margin:'0 auto', padding:'0 8px 40px' }}>

        {/* ── BANNIÈRE ── */}
        <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12, padding:'14px 20px', marginBottom:14,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ color:'#f59e0b', fontWeight:900, fontSize:18, letterSpacing:.5 }}>
              💎 KONFIGURASYON PRIMES
            </div>
            <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, marginTop:2 }}>
              Minimum vant: 1 Goud · Mariage Gratuit fiks: 2,000 G
            </div>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ background:'#f59e0b', color:'#111', border:'none', borderRadius:10,
              padding:'10px 18px', fontWeight:900, fontSize:13, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6 }}>
            ➕ Ajoute Prime
          </button>
        </div>

        {/* ── NOTIFIKASYON ── */}
        {msg.t && (
          <div style={{ background: msg.ok ? '#dcfce7' : '#fef9c3',
            border:`1.5px solid ${msg.ok ? '#16a34a' : '#ca8a04'}`,
            color: msg.ok ? '#166534' : '#854d0e',
            padding:'10px 16px', borderRadius:10, marginBottom:12, fontWeight:700 }}>
            {msg.t}
          </div>
        )}

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          {Object.entries(CAT).map(([k,c]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex:1, padding:'11px 8px',
                border:`2px solid ${c.color}`, borderRadius:12,
                background: tab===k ? c.color : 'white',
                color: tab===k ? 'white' : c.color,
                fontWeight:800, fontSize:13, cursor:'pointer',
                transition:'all .15s' }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* ── TABLE ── */}
        {loading
          ? <div style={{ textAlign:'center', padding:48, color:'#888', fontSize:15 }}>⏳ Ap chaje...</div>
          : (
          <div style={{ background:'white', borderRadius:12,
            boxShadow:'0 2px 10px rgba(0,0,0,0.09)', overflow:'hidden' }}>

            <div style={{ background:cfg.color, padding:'12px 18px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'white', fontWeight:900, fontSize:14 }}>{cfg.label}</span>
              <span style={{ color:'rgba(255,255,255,0.75)', fontSize:12 }}>
                {visible.length} prime
              </span>
            </div>

            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                    {['Kòd','Type Jeu','Prime 1er (1G→?G)','Prime 2em','Prime 3em','Note','Aksyon'].map(h => (
                      <th key={h} style={{ padding:'10px 12px', fontWeight:800, fontSize:11,
                        color:'#374151', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding:32, textAlign:'center',
                      color:'#aaa', fontStyle:'italic', fontSize:14 }}>
                      Pa gen primes nan tab sa — klike ➕ Ajoute Prime
                    </td></tr>
                  ) : visible.map((p, i) => (
                    <tr key={p.code}
                      style={{ borderBottom:'1px solid #f3f4f6',
                        background: editing===p.code ? cfg.bg : i%2===0 ? 'white' : '#fafafa',
                        transition:'background .1s' }}>

                      {/* KÒD */}
                      <td style={{ padding:'11px 12px' }}>
                        <span style={{ background:cfg.bg, color:cfg.color, borderRadius:8,
                          padding:'4px 10px', fontWeight:800, fontSize:13,
                          fontFamily:'monospace' }}>
                          {p.code}
                        </span>
                      </td>

                      {/* TYPE */}
                      <td style={{ padding:'11px 12px', fontWeight:700, color:'#111' }}>
                        {p.type}
                      </td>

                      {/* ── EDIT MODE ── */}
                      {editing === p.code ? (
                        <>
                          {numInp('p1', cfg.color)}
                          {numInp('p2', cfg.color)}
                          {numInp('p3', cfg.color)}
                          <td style={{ padding:'8px 10px' }}>
                            <input value={form.note||''} onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                              placeholder="Note..."
                              style={{ width:110, padding:'7px 8px', border:'1.5px solid #ddd',
                                borderRadius:8, fontSize:12 }} />
                          </td>
                          <td style={{ padding:'8px 12px' }}>
                            <div style={{ display:'flex', gap:6 }}>
                              <button onClick={() => doSave(p.code)} disabled={saving}
                                style={{ background:'#16a34a', color:'white', border:'none',
                                  borderRadius:8, padding:'8px 14px', fontWeight:700,
                                  cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}>
                                {saving ? '⏳' : '✅ Sove'}
                              </button>
                              <button onClick={cancelEdit}
                                style={{ background:'#f3f4f6', color:'#555', border:'none',
                                  borderRadius:8, padding:'8px 10px', fontWeight:700,
                                  cursor:'pointer', fontSize:12 }}>✕</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding:'11px 12px' }}>{badge(p.p1,'#dcfce7','#166534')}</td>
                          <td style={{ padding:'11px 12px' }}>{badge(p.p2,'#fef9c3','#854d0e')}</td>
                          <td style={{ padding:'11px 12px' }}>{badge(p.p3,'#eff6ff','#1e40af')}</td>
                          <td style={{ padding:'11px 12px', fontSize:11, color:'#888', maxWidth:140,
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {p.note||'—'}
                          </td>
                          <td style={{ padding:'11px 12px' }}>
                            <div style={{ display:'flex', gap:6 }}>
                              <button onClick={() => startEdit(p)}
                                style={{ background:cfg.color, color:'white', border:'none',
                                  borderRadius:8, padding:'7px 14px', fontWeight:700,
                                  cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}>
                                ✏️ Modifye
                              </button>
                              <button onClick={() => setDelConf(p.code)}
                                style={{ background:'#fee2e2', color:'#dc2626', border:'none',
                                  borderRadius:8, padding:'7px 10px', fontWeight:700,
                                  cursor:'pointer', fontSize:13 }}>
                                🗑
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* REFERANS */}
            <div style={{ background:'#f8f9fa', padding:'10px 16px',
              borderTop:'1px solid #e5e7eb', fontSize:11, color:'#666',
              display:'flex', justifyContent:'space-between', alignItems:'center',
              flexWrap:'wrap', gap:8 }}>
              <span>
                <strong>Standar:</strong> Borlette 1er→50 | 2em→20 | 3em→500 ·
                Loto3: 500 · Mariage: 5,000 · Loto4: 500 · Loto5: 25,000 · Mariage Gratuit: 2,000
              </span>
              <button onClick={() => setShowAdd(true)}
                style={{ background:cfg.color, color:'white', border:'none',
                  borderRadius:8, padding:'6px 14px', fontWeight:700,
                  cursor:'pointer', fontSize:12 }}>
                ➕ Ajoute nan {cfg.label}
              </button>
            </div>
          </div>
        )}

        {/* ════ MODAL AJOUTE PRIME ════ */}
        {showAdd && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            zIndex:2000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
            onClick={() => setShowAdd(false)}>
            <div style={{ background:'white', borderRadius:'20px 20px 0 0',
              width:'100%', maxWidth:560, padding:'0 0 40px' }}
              onClick={e => e.stopPropagation()}>
              {/* Drag handle */}
              <div style={{ width:44, height:5, background:'#ddd',
                borderRadius:3, margin:'12px auto 8px' }} />
              <div style={{ padding:'0 20px 16px',
                display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontWeight:900, fontSize:17 }}>➕ Ajoute Nouvo Prime</div>
                <button onClick={() => setShowAdd(false)}
                  style={{ background:'none', border:'none', fontSize:22,
                    cursor:'pointer', color:'#888' }}>✕</button>
              </div>

              <div style={{ padding:'0 20px' }}>
                {/* Kategori */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    marginBottom:6, color:'#555' }}>📂 Kategori</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {Object.entries(CAT).map(([k,c]) => (
                      <button key={k} type="button"
                        onClick={() => setNewP(p => ({...p, cat:k}))}
                        style={{ flex:1, padding:'9px', border:`2px solid ${c.color}`,
                          borderRadius:10, background: newP.cat===k ? c.color : 'white',
                          color: newP.cat===k ? 'white' : c.color,
                          fontWeight:700, cursor:'pointer', fontSize:12 }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kòd + Type */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:10, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontWeight:700, fontSize:12,
                      marginBottom:5, color:'#555' }}>Kòd * <span style={{ color:'#888', fontWeight:400 }}>(ex: 20)</span></label>
                    {inp(newP.code, v => setNewP(p=>({...p,code:v})), 'ex: 20')}
                  </div>
                  <div>
                    <label style={{ display:'block', fontWeight:700, fontSize:12,
                      marginBottom:5, color:'#555' }}>Type Jeu *</label>
                    <select value={newP.type} onChange={e => setNewP(p=>({...p,type:e.target.value}))}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd',
                        borderRadius:8, fontSize:14 }}>
                      <option value="">— Chwazi —</option>
                      {TYPES_DISPONIB.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Primes */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:14 }}>
                  {[['Prime 1er (G)','p1'],['Prime 2em (G)','p2'],['Prime 3em (G)','p3']].map(([l,k]) => (
                    <div key={k}>
                      <label style={{ display:'block', fontWeight:700, fontSize:11,
                        marginBottom:5, color:'#555' }}>{l}</label>
                      <input type="number" min="0" value={newP[k]}
                        onChange={e => setNewP(p=>({...p,[k]:e.target.value}))}
                        placeholder="0"
                        style={{ width:'100%', padding:'10px', border:'1.5px solid #ddd',
                          borderRadius:8, fontSize:14, fontWeight:700, textAlign:'right',
                          boxSizing:'border-box' }} />
                    </div>
                  ))}
                </div>

                {/* Note */}
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    marginBottom:5, color:'#555' }}>📝 Note (opsyonèl)</label>
                  {inp(newP.note, v => setNewP(p=>({...p,note:v})), 'ex: 1G → 50G pou 1er lo')}
                </div>

                <button onClick={doAdd} disabled={saving}
                  style={{ width:'100%', padding:'14px',
                    background: saving ? '#ccc' : CAT[newP.cat]?.color || '#1a73e8',
                    color:'white', border:'none', borderRadius:12,
                    fontWeight:900, fontSize:15, cursor: saving ? 'default' : 'pointer' }}>
                  {saving ? '⏳...' : `✅ Ajoute nan ${CAT[newP.cat]?.label||''}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════ KONFIRMASYON EFASE ════ */}
        {delConf && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center',
            padding:20 }}
            onClick={() => setDelConf(null)}>
            <div style={{ background:'white', borderRadius:16, padding:28,
              maxWidth:360, width:'100%', textAlign:'center' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontSize:44, marginBottom:12 }}>🗑️</div>
              <div style={{ fontWeight:900, fontSize:17, marginBottom:8 }}>
                Efase prime sa?
              </div>
              <div style={{ color:'#888', fontSize:13, marginBottom:20 }}>
                Kòd <strong>{delConf}</strong> — aksyon sa pa ka defèt
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setDelConf(null)}
                  style={{ flex:1, padding:'11px', background:'#f3f4f6', border:'none',
                    borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 }}>
                  Anile
                </button>
                <button onClick={() => doDelete(delConf)}
                  style={{ flex:1, padding:'11px', background:'#dc2626', color:'white',
                    border:'none', borderRadius:10, fontWeight:900, cursor:'pointer', fontSize:14 }}>
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
