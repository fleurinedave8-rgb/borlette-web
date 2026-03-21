import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const DEFAULT_LIMITS = [
  { key:'borlette', label:'Borlette',  icon:'🎯' },
  { key:'loto3',    label:'Lotto 3',    icon:'3️⃣' },
  { key:'mariage',  label:'Mariage',   icon:'💍' },
  { key:'l4o1',     label:'L4 — P1',   icon:'4️⃣' },
  { key:'l4o2',     label:'L4 — P2',   icon:'4️⃣' },
  { key:'l4o3',     label:'L4 — P3',   icon:'4️⃣' },
];

export default function Limites() {
  const [tab,      setTab]      = useState('general');
  const [limits,   setLimits]   = useState({});
  const [boules,   setBoules]   = useState([]);
  const [agents,   setAgents]   = useState([]);
  const [tirages,  setTirages]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState('');
  const [newBoule, setNewBoule] = useState({ tirage:'', boule:'', limite:'' });
  const [editAgent, setEditAgent] = useState(null); // { id, field, value }
  const [savingAgent, setSavingAgent] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [limRes, bouleRes, agRes, tirRes] = await Promise.all([
        api.get('/api/admin/limites').catch(() => ({ data: {} })),
        api.get('/api/admin/boules-bloquees').catch(() => ({ data: [] })),
        api.get('/api/admin/agents').catch(() => ({ data: [] })),
        api.get('/api/tirages').catch(() => ({ data: [] })),
      ]);
      setLimits(limRes.data || {});
      // Filtre sèlman boules ki gen limite (pa bloke)
      setBoules(Array.isArray(bouleRes.data) ? bouleRes.data.filter(b => b.limite) : []);
      setAgents(Array.isArray(agRes.data) ? agRes.data : []);
      setTirages(Array.isArray(tirRes.data) ? tirRes.data : []);
    } finally { setLoading(false); }
  };

  const notify = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // ── Sove limit general ────────────────────────────────────
  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await api.put('/api/admin/limites', limits);
      notify('✅ Limite jeneral sove!');
    } catch (e) { alert('Erè: ' + e.message); }
    setSaving(false);
  };

  // ── Ajoute limit boul ────────────────────────────────────
  const handleAddBoule = async () => {
    if (!newBoule.boule || !newBoule.limite) return alert('Boule ak limite obligatwa!');
    try {
      await api.post('/api/admin/boules-bloquees', {
        boule: newBoule.boule,
        tirage: newBoule.tirage || 'Tout',
        limite: parseFloat(newBoule.limite),
        type: 'limite',
      });
      setNewBoule({ tirage:'', boule:'', limite:'' });
      notify('✅ Limite boul ajoute!');
      loadAll();
    } catch (e) { alert('Erè: ' + e.message); }
  };

  // ── Efase limit boul ─────────────────────────────────────
  const handleDeleteBoule = async (id) => {
    if (!confirm('Efase limit boul sa a?')) return;
    try {
      await api.delete(`/api/admin/boules-bloquees/${id}`);
      notify('✅ Efase!');
      loadAll();
    } catch {}
  };

  const s = (key) => ({
    width:'100%', padding:'9px 12px',
    border: `1.5px solid ${limits[key] ? '#1a73e8' : '#ddd'}`,
    borderRadius:8, fontSize:14, fontWeight:700, boxSizing:'border-box',
  });

  // ── Sove limite ajan ──────────────────────────────────────
  const saveAgentLimite = async () => {
    if (!editAgent) return;
    setSavingAgent(true);
    try {
      await api.put(`/api/admin/agents/${editAgent.id}/limite`, {
        [editAgent.field]: editAgent.value
      });
      notify('✅ Limite ajan mete ajou!');
      setEditAgent(null);
      loadAll();
    } catch (e) { alert('Erè: ' + (e?.response?.data?.message || e.message)); }
    setSavingAgent(false);
  };

  return (
    <Layout>
      <div>
        {msg && <div style={{ background:'#dcfce7', border:'1px solid #16a34a', color:'#15803d', padding:'10px 16px', borderRadius:8, marginBottom:14, fontWeight:700 }}>{msg}</div>}

        <div className="card">
          {/* TABS */}
          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {[['general','🔵 Limite Jeneral'],['boul','🟡 Limite pa Boul'],['agent','🟢 Limite pa Ajan']].map(([k,l]) => (
              <button key={k} onClick={() => setTab(k)}
                style={{ padding:'9px 18px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
                  background: tab===k ? '#1a73e8' : '#f3f4f6',
                  color: tab===k ? 'white' : '#374151',
                }}>
                {l}
              </button>
            ))}
          </div>

          {loading ? <div style={{ textAlign:'center', padding:40, color:'#888' }}>⏳ Chajman...</div> : <>

            {/* ── TAB GÉNÉRAL ── */}
            {tab === 'general' && (
              <div>
                <p style={{ margin:'0 0 16px', fontSize:13, color:'#666' }}>
                  💡 Mete <strong>0</strong> pou retire tout limit sou yon tip jeu.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:12 }}>
                  {DEFAULT_LIMITS.map(({ key, label, icon }) => (
                    <div key={key} style={{ background:'#f8faff', border:'1px solid #e0eaff', borderRadius:10, padding:14 }}>
                      <label style={{ display:'block', fontSize:12, color:'#555', marginBottom:6, fontWeight:700 }}>
                        {icon} {label}
                      </label>
                      <input
                        type="number" min="0"
                        value={limits[key] ?? ''}
                        onChange={e => setLimits(p => ({ ...p, [key]: e.target.value }))}
                        placeholder="0 = Illimité"
                        style={s(key)}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveGeneral} disabled={saving}
                  style={{ marginTop:18, padding:'12px 32px', background: saving?'#ccc':'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:800, cursor:'pointer', fontSize:14 }}>
                  {saving ? '⏳ Enregistrement...' : '💾 Sove Limite Jeneral'}
                </button>
              </div>
            )}

            {/* ── TAB BOUL ── */}
            {tab === 'boul' && (
              <div>
                {/* Fòm ajoute */}
                <div style={{ background:'#f8faff', border:'1px solid #dbeafe', borderRadius:10, padding:16, marginBottom:16 }}>
                  <h4 style={{ margin:'0 0 12px', fontSize:14, fontWeight:800, color:'#1e40af' }}>➕ Ajoute Limite pa Boul</h4>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <select value={newBoule.tirage} onChange={e => setNewBoule(p => ({ ...p, tirage: e.target.value }))}
                      style={{ flex:2, minWidth:140, padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13 }}>
                      <option value="">Tout Tiraj</option>
                      {tirages.map(t => <option key={t._id} value={t.nom}>{t.nom}</option>)}
                    </select>
                    <input placeholder="Boul (egz: 07)" value={newBoule.boule}
                      onChange={e => setNewBoule(p => ({ ...p, boule: e.target.value }))}
                      style={{ flex:1, minWidth:80, padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13 }} />
                    <input placeholder="Limite HTG" type="number" value={newBoule.limite}
                      onChange={e => setNewBoule(p => ({ ...p, limite: e.target.value }))}
                      style={{ flex:1, minWidth:100, padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:8, fontSize:13 }} />
                    <button onClick={handleAddBoule}
                      style={{ padding:'9px 20px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                      ➕ Ajoute
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX:'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>{['Tiraj','Boul','Limite (HTG)','Suprime'].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {boules.length === 0
                        ? <tr><td colSpan={4} style={{ padding:24, textAlign:'center', color:'#888' }}>Aucun limit boul. Ajoute youn anwo.</td></tr>
                        : boules.map(b => (
                          <tr key={b._id}>
                            <td>{b.tirage || 'Tout'}</td>
                            <td style={{ fontWeight:900, fontSize:15, color:'#1a73e8' }}>{b.boule}</td>
                            <td style={{ fontWeight:800, color:'#dc2626' }}>{b.limite} HTG</td>
                            <td>
                              <button onClick={() => handleDeleteBoule(b._id)}
                                style={{ background:'#dc2626', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>
                                🗑
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── TAB AGENT ── */}
            {tab === 'agent' && (
              <div style={{ overflowX:'auto' }}>
                <p style={{ margin:'0 0 14px', fontSize:13, color:'#16a34a', fontWeight:700 }}>
                  ✏️ Klike sou valè yo pou modifye limite chak ajan dirèkteman.
                </p>
                <table className="data-table">
                  <thead>
                    <tr>{['Ajan','Username','Limite Gain','Kredi Vant','% Komisyon','Aksyon'].map(h => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {agents.filter(a => a.role !== 'admin' && a.role !== 'superadmin').length === 0
                      ? <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'#888' }}>Aucun ajan</td></tr>
                      : agents.filter(a => a.role !== 'admin' && a.role !== 'superadmin').map(a => (
                        <tr key={a._id || a.id}>
                          <td style={{ fontWeight:700 }}>{a.prenom} {a.nom}</td>
                          <td style={{ fontFamily:'monospace', color:'#1a73e8', fontSize:12 }}>{a.username}</td>
                          {/* LIMITE GAIN — editable inline */}
                          <td>
                            {editAgent?.id===(a._id||a.id) && editAgent.field==='limiteGain' ? (
                              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                                <input autoFocus value={editAgent.value}
                                  onChange={e => setEditAgent(ea => ({...ea, value: e.target.value}))}
                                  onKeyDown={e => { if(e.key==='Enter') saveAgentLimite(); if(e.key==='Escape') setEditAgent(null); }}
                                  style={{ width:90, padding:'4px 8px', border:'2px solid #f59e0b', borderRadius:6, fontWeight:800, fontSize:13 }} />
                                <button onClick={saveAgentLimite} disabled={savingAgent}
                                  style={{ background:'#16a34a', color:'white', border:'none', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                                  {savingAgent ? '...' : '✓'}
                                </button>
                                <button onClick={() => setEditAgent(null)}
                                  style={{ background:'#dc2626', color:'white', border:'none', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontSize:11 }}>✕</button>
                              </div>
                            ) : (
                              <span onClick={() => setEditAgent({ id:a._id||a.id, field:'limiteGain', value:a.limiteGain||'Illimité' })}
                                style={{ color:'#f59e0b', fontWeight:800, cursor:'pointer', borderBottom:'1px dashed #f59e0b', padding:'2px 4px' }}
                                title="Klike pou modifye">
                                {a.limiteGain || 'Illimité'} ✏️
                              </span>
                            )}
                          </td>
                          {/* KREDI — editable */}
                          <td>
                            {editAgent?.id===(a._id||a.id) && editAgent.field==='credit' ? (
                              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                                <input autoFocus value={editAgent.value}
                                  onChange={e => setEditAgent(ea => ({...ea, value: e.target.value}))}
                                  onKeyDown={e => { if(e.key==='Enter') saveAgentLimite(); if(e.key==='Escape') setEditAgent(null); }}
                                  style={{ width:90, padding:'4px 8px', border:'2px solid #16a34a', borderRadius:6, fontWeight:800, fontSize:13 }} />
                                <button onClick={saveAgentLimite} disabled={savingAgent}
                                  style={{ background:'#16a34a', color:'white', border:'none', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                                  {savingAgent ? '...' : '✓'}
                                </button>
                                <button onClick={() => setEditAgent(null)}
                                  style={{ background:'#dc2626', color:'white', border:'none', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontSize:11 }}>✕</button>
                              </div>
                            ) : (
                              <span onClick={() => setEditAgent({ id:a._id||a.id, field:'credit', value:a.credit||'Illimité' })}
                                style={{ color:'#16a34a', fontWeight:800, cursor:'pointer', borderBottom:'1px dashed #16a34a', padding:'2px 4px' }}
                                title="Klike pou modifye">
                                {a.credit || 'Illimité'} ✏️
                              </span>
                            )}
                          </td>
                          {/* % KOMISYON */}
                          <td>
                            {editAgent?.id===(a._id||a.id) && editAgent.field==='agentPct' ? (
                              <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                                <input autoFocus type="number" min="0" max="100" value={editAgent.value}
                                  onChange={e => setEditAgent(ea => ({...ea, value: e.target.value}))}
                                  onKeyDown={e => { if(e.key==='Enter') saveAgentLimite(); if(e.key==='Escape') setEditAgent(null); }}
                                  style={{ width:70, padding:'4px 8px', border:'2px solid #7c3aed', borderRadius:6, fontWeight:800, fontSize:13 }} />
                                <button onClick={saveAgentLimite} disabled={savingAgent}
                                  style={{ background:'#16a34a', color:'white', border:'none', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                                  {savingAgent ? '...' : '✓'}
                                </button>
                                <button onClick={() => setEditAgent(null)}
                                  style={{ background:'#dc2626', color:'white', border:'none', borderRadius:5, padding:'4px 8px', cursor:'pointer', fontSize:11 }}>✕</button>
                              </div>
                            ) : (
                              <span onClick={() => setEditAgent({ id:a._id||a.id, field:'agentPct', value:String(a.agentPct||10) })}
                                style={{ color:'#7c3aed', fontWeight:800, cursor:'pointer', borderBottom:'1px dashed #7c3aed', padding:'2px 4px' }}
                                title="Klike pou modifye">
                                {a.agentPct||10}% ✏️
                              </span>
                            )}
                          </td>
                          <td>
                            <button onClick={() => setEditAgent({ id:a._id||a.id, field:'limiteGain', value:a.limiteGain||'Illimité' })}
                              style={{ background:'#f3f4f6', border:'1px solid #ddd', borderRadius:5, padding:'4px 10px', cursor:'pointer', fontWeight:700, fontSize:11 }}>
                              ✏️ Modifye
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}

          </>}
        </div>
      </div>
    </Layout>
  );
}
