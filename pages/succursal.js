import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const PRIMES = ['60/20/10', '50/15/5', '70/25/15', '80/30/20', 'Personnalisé'];

export default function SuccursalPage() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState({ text:'', ok:true });
  const [filter,  setFilter]  = useState('tous');

  const [showAdd,      setShowAdd]      = useState(false);
  const [showModifier, setShowModifier] = useState(false);
  const [showLimite,   setShowLimite]   = useState(false);
  const [showPrime,    setShowPrime]    = useState(false);
  const [showAcces,    setShowAcces]    = useState(false);
  const [showPOS,      setShowPOS]      = useState(false);   // NEW: Modal POS ID + Logo
  const [selected,     setSelected]     = useState(null);
  const [saving,       setSaving]       = useState(false);

  const emptyForm = { nom:'', bank:'', limite:'', limiteGain:'', prime:'60/20/10', message:'', mariage:false };
  const [form, setForm] = useState(emptyForm);

  // POS form
  const [posForm,   setPosForm]   = useState({ posId:'', logoB64:'' });
  const [logoPreview, setLogoPreview] = useState('');
  const fileRef = useRef();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/succursales');
      setList(Array.isArray(res.data) ? res.data : []);
    } catch { setList([]); }
    setLoading(false);
  };

  const notify = (text, ok=true) => { setMsg({ text, ok }); setTimeout(() => setMsg({text:'',ok:true}), 4000); };

  const handleAdd      = async () => {
    if (!form.nom) return alert('Non succursal obligatwa!');
    setSaving(true);
    try {
      await api.post('/api/admin/succursales', form);
      notify('✅ Succursal ajoute!');
      setShowAdd(false); setForm(emptyForm); loadData();
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSaving(false);
  };
  const handleModifier = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/succursales/${selected._id}`, form);
      notify('✅ Modifye!'); setShowModifier(false); loadData();
    } catch (e) { alert('Erè: ' + e.message); }
    setSaving(false);
  };
  const handleLimite   = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/succursales/${selected._id}`, { limite:form.limite, limiteGain:form.limiteGain });
      notify('✅ Limite mete ajou!'); setShowLimite(false); loadData();
    } catch (e) { alert('Erè: ' + e.message); }
    setSaving(false);
  };
  const handlePrime    = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/succursales/${selected._id}`, { prime:form.prime });
      notify('✅ Prime mete ajou!'); setShowPrime(false); loadData();
    } catch (e) { alert('Erè: ' + e.message); }
    setSaving(false);
  };
  const handleToggle   = async (s) => {
    if (!confirm(`${s.actif?'Dezaktive':'Aktive'} ${s.nom}?`)) return;
    try { await api.put(`/api/admin/succursales/${s._id}/toggle`); loadData(); } catch {}
  };

  // ── SOVE POS ID + LOGO ────────────────────────────────────
  const handleSavePOS = async () => {
    if (!posForm.posId.trim()) return alert('POS ID obligatwa!');
    setSaving(true);
    try {
      const payload = { posId: posForm.posId.trim() };
      if (posForm.logoB64) payload.logo = posForm.logoB64;
      await api.put(`/api/admin/succursales/${selected._id}/pos`, payload);
      notify('✅ POS ID ak Logo mete ajou!');
      setShowPOS(false);
      loadData();
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSaving(false);
  };

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) { alert('Logo twò gwo (maks 200KB)'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result;
      setLogoPreview(b64);
      setPosForm(f => ({ ...f, logoB64: b64 }));
    };
    reader.readAsDataURL(file);
  };

  const openModifier = (s) => { setSelected(s); setForm({...s}); setShowModifier(true); };
  const openLimite   = (s) => { setSelected(s); setForm({ limite:s.limite||'', limiteGain:s.limiteGain||'' }); setShowLimite(true); };
  const openPrime    = (s) => { setSelected(s); setForm({ prime:s.prime||'60/20/10' }); setShowPrime(true); };
  const openAcces    = (s) => { setSelected(s); setShowAcces(true); };
  const openPOS      = (s) => {
    setSelected(s);
    setPosForm({ posId: s.posId || s._id?.slice(-8).toUpperCase() || '', logoB64: '' });
    setLogoPreview(s.logo || '');
    setShowPOS(true);
  };

  const filtered = list.filter(s =>
    filter==='tous' ? true : filter==='actif' ? s.actif : !s.actif
  );

  const inp = (label, field, type='text', placeholder='') => (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4, color:'#374151' }}>{label}</label>
      {type==='select' ? (
        <select value={form[field]||''} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
          style={{ width:'100%', padding:'9px 10px', border:'1.5px solid #d1d5db', borderRadius:6, fontSize:13 }}>
          {placeholder.split(',').map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type==='checkbox' ? (
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <input type="checkbox" checked={!!form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.checked}))}
            style={{ width:16, height:16 }} />
          <span style={{ fontSize:13 }}>{placeholder}</span>
        </label>
      ) : (
        <input type={type} value={form[field]||''} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
          placeholder={placeholder}
          style={{ width:'100%', padding:'9px 10px', border:'1.5px solid #d1d5db', borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
      )}
    </div>
  );

  const ModalWrap = ({ title, onSave, onClose, children, color='#1a73e8' }) => (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:2000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}>
      <div style={{ background:'white', borderRadius:12, padding:24, width:'100%',
        maxWidth:460, maxHeight:'90vh', overflowY:'auto' }}
        onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:900, color }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' }}>✕</button>
        </div>
        {children}
        <div style={{ display:'flex', gap:10, marginTop:16 }}>
          <button onClick={onClose} style={{ flex:1, padding:11, background:'#f3f4f6', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Anile</button>
          <button onClick={onSave} disabled={saving}
            style={{ flex:2, padding:11, background:saving?'#ccc':color, color:'white', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:14 }}>
            {saving ? '⏳...' : '✅ Sove'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div>
        {msg.text && (
          <div style={{ background: msg.ok?'#dcfce7':'#fee2e2',
            border:`1px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color: msg.ok?'#15803d':'#dc2626',
            padding:'10px 16px', borderRadius:8, marginBottom:14, fontWeight:700 }}>
            {msg.text}
          </div>
        )}

        <div className="card">
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowAdd(true); }}>
              ➕ Ajouter Succursal
            </button>
            {['tous','actif','inactif'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'7px 14px', borderRadius:6, border:'none', cursor:'pointer', fontWeight:700, fontSize:12,
                  background: filter===f ? '#1a73e8' : '#f3f4f6',
                  color: filter===f ? 'white' : '#374151' }}>
                {f==='tous' ? '📋 Tout' : f==='actif' ? '🟢 Aktif' : '🔴 Inaktif'}
              </button>
            ))}
            <span style={{ marginLeft:'auto', fontSize:12, color:'#888' }}>{filtered.length} succursal</span>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:40, color:'#888' }}>⏳ Ap chaje...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'#888' }}>
              Pa gen succursal. Klike <strong>Ajouter</strong> pou kreye youn.
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['Succursal / POS ID','Logo','Bank','Limite','Prime','M.Gratuit','Statut','Aksyon'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div style={{ fontWeight:900, fontSize:14 }}>{s.nom}</div>
                        <div style={{ fontFamily:'monospace', color:'#1a73e8', fontSize:11, marginTop:2 }}>
                          🖥️ {s.posId || <span style={{ color:'#aaa' }}>PA DEFINI</span>}
                        </div>
                      </td>
                      <td>
                        {s.logo
                          ? <img src={s.logo} alt="logo" style={{ width:36, height:36, borderRadius:4, objectFit:'cover', border:'1px solid #ddd' }} />
                          : <span style={{ fontSize:11, color:'#aaa' }}>—</span>
                        }
                      </td>
                      <td>{s.bank || '—'}</td>
                      <td><span style={{ color:'#1a73e8', fontWeight:700 }}>{s.limite || 'Illimité'}</span></td>
                      <td><span style={{ color:'#f59e0b', fontWeight:700 }}>{s.prime || '60/20/10'}</span></td>
                      <td>
                        <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:700,
                          background: s.mariage?'#dcfce7':'#f3f4f6', color: s.mariage?'#16a34a':'#888' }}>
                          {s.mariage ? '✅ Wi' : 'Non'}
                        </span>
                      </td>
                      <td>
                        <span style={{ padding:'3px 10px', borderRadius:10, fontSize:11, fontWeight:700,
                          background: s.actif?'#dcfce7':'#fee2e2', color: s.actif?'#16a34a':'#dc2626' }}>
                          {s.actif ? '🟢 Aktif' : '🔴 Inaktif'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          <button onClick={() => openPOS(s)}
                            style={{ padding:'4px 8px', borderRadius:4, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:'#0891b2', color:'white' }}>
                            🖥️ POS/Logo
                          </button>
                          <button onClick={() => openModifier(s)}
                            style={{ padding:'4px 8px', borderRadius:4, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:'#f59e0b', color:'white' }}>
                            ✏️ Modifye
                          </button>
                          <button onClick={() => handleToggle(s)}
                            style={{ padding:'4px 8px', borderRadius:4, border:'none', cursor:'pointer', fontSize:11, fontWeight:700,
                              background: s.actif?'#dc2626':'#16a34a', color:'white' }}>
                            {s.actif ? '🔴 Dezaktive' : '🟢 Aktive'}
                          </button>
                          <button onClick={() => openLimite(s)}
                            style={{ padding:'4px 8px', borderRadius:4, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:'#16a34a', color:'white' }}>
                            💰 Limite
                          </button>
                          <button onClick={() => openPrime(s)}
                            style={{ padding:'4px 8px', borderRadius:4, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:'#1a73e8', color:'white' }}>
                            🏆 Prime
                          </button>
                          <button onClick={() => openAcces(s)}
                            style={{ padding:'4px 8px', borderRadius:4, border:'none', cursor:'pointer', fontSize:11, fontWeight:700, background:'#7c3aed', color:'white' }}>
                            👁️ Detay
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ══ MODAL AJOUTER ══ */}
        {showAdd && (
          <ModalWrap title="➕ Ajouter Succursal" onSave={handleAdd} onClose={() => setShowAdd(false)}>
            {inp('Nom Succursal *', 'nom', 'text', 'egz: Central, Nord, Sud...')}
            {inp('Bank', 'bank', 'text', 'egz: BNC, BUH, SOGEBANK...')}
            {inp('Limite Mise (HTG)', 'limite', 'text', 'Illimité')}
            {inp('Limite Gain (HTG)', 'limiteGain', 'text', 'Illimité')}
            {inp('Prime', 'prime', 'select', PRIMES.join(','))}
            {inp('Mariage Gratuit', 'mariage', 'checkbox', 'Aktive Mariage Gratuit')}
            {inp('Message / Note', 'message', 'text', 'Opsyonèl...')}
          </ModalWrap>
        )}

        {/* ══ MODAL MODIFIER ══ */}
        {showModifier && selected && (
          <ModalWrap title={`✏️ Modifye — ${selected.nom}`} onSave={handleModifier} onClose={() => setShowModifier(false)} color="#f59e0b">
            {inp('Nom Succursal', 'nom', 'text')}
            {inp('Bank', 'bank', 'text')}
            {inp('Prime', 'prime', 'select', PRIMES.join(','))}
            {inp('Mariage Gratuit', 'mariage', 'checkbox', 'Aktive Mariage Gratuit')}
            {inp('Message / Note', 'message', 'text')}
          </ModalWrap>
        )}

        {/* ══ MODAL POS ID + LOGO ══ */}
        {showPOS && selected && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:2000,
            display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
            onClick={() => setShowPOS(false)}>
            <div style={{ background:'white', borderRadius:14, padding:24, width:'100%', maxWidth:460 }}
              onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <h3 style={{ margin:0, fontSize:16, fontWeight:900, color:'#0891b2' }}>
                  🖥️ POS ID & Logo — {selected.nom}
                </h3>
                <button onClick={() => setShowPOS(false)}
                  style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#888' }}>✕</button>
              </div>

              {/* POS ID */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontWeight:800, fontSize:13, marginBottom:6, color:'#0891b2' }}>
                  🆔 POS ID (Idantifyan machin)
                </label>
                <input
                  value={posForm.posId}
                  onChange={e => setPosForm(f => ({ ...f, posId: e.target.value.toUpperCase() }))}
                  placeholder="egz: POS-001, CENTRAL-A..."
                  style={{ width:'100%', padding:'10px 12px', border:'2px solid #0891b2',
                    borderRadius:8, fontSize:15, fontWeight:700, fontFamily:'monospace',
                    boxSizing:'border-box', letterSpacing:1 }}
                />
                <p style={{ margin:'5px 0 0', fontSize:11, color:'#888' }}>
                  Sa se ID machin POS a — li parèt sou ticket la
                </p>
              </div>

              {/* LOGO */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontWeight:800, fontSize:13, marginBottom:6, color:'#7c3aed' }}>
                  🖼️ Logo POS (opsyonèl)
                </label>

                {/* Preview */}
                <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:10 }}>
                  <div style={{ width:80, height:80, borderRadius:8, border:'2px dashed #d1d5db',
                    display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
                    background:'#f9f9f9' }}>
                    {logoPreview
                      ? <img src={logoPreview} alt="logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontSize:28 }}>🔑</span>
                    }
                  </div>
                  <div>
                    <button onClick={() => fileRef.current?.click()}
                      style={{ padding:'9px 18px', background:'#7c3aed', color:'white',
                        border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>
                      📁 Chwazi Foto
                    </button>
                    <p style={{ margin:'6px 0 0', fontSize:11, color:'#888' }}>PNG/JPG · Maks 200KB</p>
                    {logoPreview && selected.logo !== logoPreview && (
                      <p style={{ margin:'4px 0 0', fontSize:11, color:'#16a34a', fontWeight:700 }}>
                        ✓ Nouvo logo chwazi
                      </p>
                    )}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
                  onChange={handleLogoFile} />
              </div>

              {/* Boutons */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowPOS(false)}
                  style={{ flex:1, padding:11, background:'#f3f4f6', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>
                  Anile
                </button>
                <button onClick={handleSavePOS} disabled={saving}
                  style={{ flex:2, padding:11, background:saving?'#ccc':'#0891b2', color:'white',
                    border:'none', borderRadius:8, fontWeight:800, cursor:'pointer', fontSize:14 }}>
                  {saving ? '⏳...' : '✅ Sove POS ID & Logo'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL LIMITE ══ */}
        {showLimite && selected && (
          <ModalWrap title={`💰 Limite — ${selected.nom}`} onSave={handleLimite} onClose={() => setShowLimite(false)} color="#16a34a">
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:12, marginBottom:16 }}>
              <p style={{ margin:0, fontSize:12, color:'#15803d' }}>
                💡 Mete <strong>Illimité</strong> osinon kite vid pou retire tout limit.
              </p>
            </div>
            {inp('Limite Mise (HTG)', 'limite', 'text', 'Illimité')}
            {inp('Limite Gain (HTG)', 'limiteGain', 'text', 'Illimité')}
          </ModalWrap>
        )}

        {/* ══ MODAL PRIME ══ */}
        {showPrime && selected && (
          <ModalWrap title={`🏆 Prime — ${selected.nom}`} onSave={handlePrime} onClose={() => setShowPrime(false)}>
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12, marginBottom:16 }}>
              <p style={{ margin:0, fontSize:12, color:'#1d4ed8' }}>
                Prime aktyèl: <strong>{selected.prime || '60/20/10'}</strong>
              </p>
            </div>
            {inp('Nouvo Prime', 'prime', 'select', PRIMES.join(','))}
          </ModalWrap>
        )}

        {/* ══ MODAL DETAY ══ */}
        {showAcces && selected && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:2000,
            display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
            onClick={() => setShowAcces(false)}>
            <div style={{ background:'white', borderRadius:12, padding:24, width:'100%', maxWidth:480 }}
              onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <h3 style={{ margin:0, fontSize:16, fontWeight:900, color:'#7c3aed' }}>👁️ Detay — {selected.nom}</h3>
                <button onClick={() => setShowAcces(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer' }}>✕</button>
              </div>
              <div style={{ background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:8, padding:14 }}>
                {[
                  ['Non', selected.nom],
                  ['POS ID', selected.posId || '—'],
                  ['Bank', selected.bank || '—'],
                  ['Limite Mise', selected.limite || 'Illimité'],
                  ['Limite Gain', selected.limiteGain || 'Illimité'],
                  ['Prime', selected.prime || '60/20/10'],
                  ['Mariage Gratuit', selected.mariage ? '✅ Wi' : 'Non'],
                  ['Statut', selected.actif ? '🟢 Aktif' : '🔴 Inaktif'],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #f3e8ff' }}>
                    <span style={{ fontSize:13, color:'#666', fontWeight:600 }}>{l}</span>
                    <span style={{ fontSize:13, fontWeight:800, color:'#7c3aed' }}>{v}</span>
                  </div>
                ))}
              </div>
              {selected.message && (
                <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:12, marginTop:12 }}>
                  <p style={{ margin:0, fontSize:13, color:'#92400e' }}>📝 {selected.message}</p>
                </div>
              )}
              <button onClick={() => setShowAcces(false)}
                style={{ width:'100%', padding:12, background:'#7c3aed', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', marginTop:16 }}>
                Fèmen
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
