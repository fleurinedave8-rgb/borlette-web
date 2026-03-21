import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES_DEFOLT = [
  { nom:'Florida matin',   ouverture:'10:00', fermeture:'10:30' },
  { nom:'Florida soir',    ouverture:'21:00', fermeture:'21:30' },
  { nom:'New-york matin',  ouverture:'12:29', fermeture:'12:30' },
  { nom:'New-york soir',   ouverture:'22:30', fermeture:'23:00' },
  { nom:'Georgia-Matin',   ouverture:'12:29', fermeture:'12:30' },
  { nom:'Georgia-Soir',    ouverture:'18:00', fermeture:'18:30' },
  { nom:'Ohio matin',      ouverture:'10:30', fermeture:'11:00' },
  { nom:'Ohio soir',       ouverture:'22:00', fermeture:'22:30' },
  { nom:'Maryland midi',   ouverture:'13:00', fermeture:'13:30' },
  { nom:'Maryland soir',   ouverture:'19:00', fermeture:'19:30' },
  { nom:'Tennessee matin', ouverture:'11:00', fermeture:'11:30' },
  { nom:'Tennessee soir',  ouverture:'21:30', fermeture:'22:00' },
];

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const isOpen = (t) => {
  if (t.actif === false) return false;
  if (!t.ouverture || !t.fermeture) return t.actif !== false;
  const cur = now();
  return cur >= t.ouverture && cur <= t.fermeture;
};

export default function TiragesPage() {
  const [tirages,  setTirages]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('liste');
  const [showForm, setShowForm] = useState(false);
  const [editT,    setEditT]    = useState(null);
  const [form,     setForm]     = useState({ nom:'', ouverture:'', fermeture:'', actif:true });
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState({ t:'', ok:true });
  const [filter,   setFilter]   = useState('tout');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/tirages');
      let list = Array.isArray(r.data) ? r.data : [];
      if (list.length === 0) {
        for (const t of TIRAGES_DEFOLT) {
          await api.post('/api/tirages', { ...t, actif: true }).catch(()=>{});
        }
        const r2 = await api.get('/api/admin/tirages');
        list = Array.isArray(r2.data) ? r2.data : [];
      }
      setTirages(list);
    } catch { setTirages([]); }
    setLoading(false);
  };

  const notify = (t, ok=true) => {
    setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3000);
  };

  const openAdd = () => {
    setForm({ nom:'', ouverture:'', fermeture:'', actif:true });
    setEditT(null); setShowForm(true);
  };

  const openEdit = t => {
    setForm({ nom:t.nom||'', ouverture:t.ouverture||'',
      fermeture:t.fermeture||'', actif:t.actif!==false });
    setEditT(t); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) { notify('⚠️ Non tiraj obligatwa', false); return; }
    setSaving(true);
    try {
      if (editT) {
        await api.put(`/api/tirages/${editT._id}`, form);
        notify('✅ Tiraj modifye!');
      } else {
        await api.post('/api/tirages', { ...form, actif: true });
        notify('✅ Tiraj ajoute!');
      }
      setShowForm(false); await load();
    } catch(e) { notify(`❌ ${e?.response?.data?.message||'Erè'}`, false); }
    setSaving(false);
  };

  const handleToggle = async t => {
    try {
      await api.put(`/api/tirages/${t._id}/${t.actif!==false?'femen':'ouvri'}`);
      notify(`✅ Tiraj ${t.actif!==false?'fèmen':'ouvri'}!`);
      await load();
    } catch { notify('❌ Erè', false); }
  };

  const handleDelete = async t => {
    if (!window.confirm(`Efase "${t.nom}"?`)) return;
    try { await api.delete(`/api/tirages/${t._id}`); await load(); }
    catch { notify('❌ Erè', false); }
  };

  const filtered = tirages.filter(t =>
    filter === 'tout' ? true :
    filter === 'actif' ? t.actif !== false :
    t.actif === false
  );

  const TABS = [
    { k:'ajoute', l:'➕ Ajoute', c:'#1a73e8' },
    { k:'liste',  l:'📋 Liste',  c:'#16a34a' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 8px 40px' }}>

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {TABS.map(({ k, l, c }) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding:'9px 20px', border:'none', borderRadius:10,
                background: tab===k ? c : '#f3f4f6',
                color: tab===k ? 'white' : '#555',
                fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {l}
            </button>
          ))}
        </div>

        {msg.t && (
          <div style={{ background: msg.ok?'#dcfce7':'#fee2e2',
            border:`1.5px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color: msg.ok?'#166534':'#991b1b',
            padding:'10px 16px', borderRadius:8,
            marginBottom:12, fontWeight:700 }}>
            {msg.t}
          </div>
        )}

        {/* AJOUTE TIRAJ */}
        {tab === 'ajoute' && (
          <div style={{ background:'white', borderRadius:12, padding:24,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin:'0 0 20px', fontWeight:900, fontSize:17 }}>
              ➕ Nouvo Tiraj
            </h2>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontWeight:700, fontSize:12,
                color:'#555', marginBottom:4 }}>Non Tiraj *</label>
              <input value={form.nom}
                onChange={e => setForm(f => ({...f, nom:e.target.value}))}
                placeholder="ex: Florida matin"
                style={{ width:'100%', padding:'11px 12px',
                  border:'1.5px solid #ddd', borderRadius:8,
                  fontSize:14, boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              {[['ouverture','Ouverture','time'],['fermeture','Fermeture','time']].map(([k,l,t]) => (
                <div key={k}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12,
                    color:'#555', marginBottom:4 }}>{l}</label>
                  <input type={t} value={form[k]||''}
                    onChange={e => setForm(f => ({...f, [k]:e.target.value}))}
                    style={{ width:'100%', padding:'11px 12px',
                      border:'1.5px solid #ddd', borderRadius:8,
                      fontSize:14, boxSizing:'border-box' }} />
                </div>
              ))}
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ width:'100%', padding:'13px',
                background: saving ? '#ccc' : '#16a34a',
                color:'white', border:'none', borderRadius:10,
                fontWeight:900, fontSize:15, cursor:'pointer' }}>
              {saving ? '⏳ Enregistrement...' : '✅ Ajoute Tiraj'}
            </button>
          </div>
        )}

        {/* LISTE TIRAJ */}
        {tab === 'liste' && (
          <div>
            {/* Stats + Filtè */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
              gap:8, marginBottom:12 }}>
              {[
                { l:'Total', v:tirages.length, c:'#1a73e8' },
                { l:'✅ Actif', v:tirages.filter(t=>t.actif!==false).length, c:'#16a34a' },
                { l:'❌ Fèmen', v:tirages.filter(t=>t.actif===false).length, c:'#dc2626' },
              ].map(s => (
                <div key={s.l} onClick={() => setFilter(
                  s.l==='Total'?'tout':s.l.includes('Actif')?'actif':'inactif'
                )}
                  style={{ background:'white', borderRadius:10,
                    padding:'12px', textAlign:'center', cursor:'pointer',
                    boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
                    borderTop:`3px solid ${s.c}` }}>
                  <div style={{ fontWeight:900, fontSize:22, color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:11, color:'#888', fontWeight:700 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Tablo */}
            {loading ? (
              <div style={{ textAlign:'center', padding:40, color:'#888' }}>⏳</div>
            ) : (
              <div style={{ background:'white', borderRadius:12,
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#1e293b' }}>
                      {['Nom Tirage','Ouverture','Fermeture','Statut','Aksyon'].map(h => (
                        <th key={h} style={{ padding:'11px 14px', color:'white',
                          fontWeight:700, fontSize:11, textAlign:'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding:32,
                        textAlign:'center', color:'#aaa' }}>
                        Aucun tiraj
                      </td></tr>
                    ) : filtered.map((t, i) => {
                      const open = isOpen(t);
                      return (
                        <tr key={t._id||i}
                          style={{ borderBottom:'1px solid #f0f0f0',
                            background: i%2===0 ? 'white' : '#fafafa' }}>
                          <td style={{ padding:'12px 14px', fontWeight:800, fontSize:14 }}>
                            {t.nom}
                          </td>
                          <td style={{ padding:'12px 14px',
                            fontFamily:'monospace', color:'#1a73e8', fontWeight:700 }}>
                            {t.ouverture||'—'}
                          </td>
                          <td style={{ padding:'12px 14px',
                            fontFamily:'monospace', color:'#7c3aed', fontWeight:700 }}>
                            {t.fermeture||'—'}
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{
                              background: t.actif===false ? '#fee2e2' :
                                open ? '#dcfce7' : '#fef9c3',
                              color: t.actif===false ? '#991b1b' :
                                open ? '#166534' : '#854d0e',
                              borderRadius:20, padding:'3px 12px',
                              fontSize:11, fontWeight:800 }}>
                              {t.actif===false ? '❌ Dezaktive' :
                                open ? '🟢 Ouvè' : '🟡 Fèmen'}
                            </span>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', gap:6 }}>
                              <button onClick={() => openEdit(t)}
                                style={{ background:'#1a73e8', color:'white',
                                  border:'none', borderRadius:7,
                                  padding:'6px 10px', cursor:'pointer',
                                  fontSize:12, fontWeight:700 }}>
                                ✏️
                              </button>
                              <button onClick={() => handleToggle(t)}
                                style={{ background: t.actif!==false?'#fee2e2':'#dcfce7',
                                  color: t.actif!==false?'#dc2626':'#16a34a',
                                  border:'none', borderRadius:7,
                                  padding:'6px 10px', cursor:'pointer',
                                  fontSize:12, fontWeight:700 }}>
                                {t.actif!==false ? '🔒' : '🔓'}
                              </button>
                              <button onClick={() => handleDelete(t)}
                                style={{ background:'#f3f4f6', color:'#dc2626',
                                  border:'none', borderRadius:7,
                                  padding:'6px 10px', cursor:'pointer',
                                  fontSize:12, fontWeight:700 }}>
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MODAL MODIFYE */}
        {showForm && editT && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
            zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
            onClick={() => setShowForm(false)}>
            <div style={{ background:'white', borderRadius:16, padding:28,
              maxWidth:420, width:'100%' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ fontWeight:900, fontSize:17, marginBottom:20 }}>
                ✏️ Modifye: {editT.nom}
              </div>
              <div style={{ marginBottom:14 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12,
                  color:'#555', marginBottom:4 }}>Non Tiraj *</label>
                <input value={form.nom}
                  onChange={e => setForm(f => ({...f, nom:e.target.value}))}
                  style={{ width:'100%', padding:'11px 12px',
                    border:'1.5px solid #ddd', borderRadius:8,
                    fontSize:14, boxSizing:'border-box' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                {[['ouverture','Ouverture','time'],['fermeture','Fermeture','time']].map(([k,l,t]) => (
                  <div key={k}>
                    <label style={{ display:'block', fontWeight:700, fontSize:12,
                      color:'#555', marginBottom:4 }}>{l}</label>
                    <input type={t} value={form[k]||''}
                      onChange={e => setForm(f => ({...f, [k]:e.target.value}))}
                      style={{ width:'100%', padding:'11px 12px',
                        border:'1.5px solid #ddd', borderRadius:8,
                        fontSize:14, boxSizing:'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
                <label style={{ fontWeight:700, fontSize:12, color:'#555' }}>Statut:</label>
                <button onClick={() => setForm(f => ({...f, actif:!f.actif}))}
                  style={{ padding:'7px 16px', border:'none', borderRadius:8,
                    background: form.actif ? '#dcfce7' : '#fee2e2',
                    color: form.actif ? '#166534' : '#991b1b',
                    fontWeight:700, cursor:'pointer', fontSize:13 }}>
                  {form.actif ? '✅ Actif' : '❌ Fèmen'}
                </button>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:'12px', background:'#f3f4f6',
                    border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex:2, padding:'12px',
                    background: saving ? '#ccc' : '#1a73e8',
                    color:'white', border:'none', borderRadius:10,
                    fontWeight:900, fontSize:14, cursor:'pointer' }}>
                  {saving ? '⏳' : '✅ Sove'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
