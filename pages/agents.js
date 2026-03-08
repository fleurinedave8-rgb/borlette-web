import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const TIRAGES_PRIMES = ['60|20|10', '50|15|5', '70|25|15', 'Personnalisé'];

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState('branches');
  const [showForm,  setShowForm]  = useState(false);
  const [filter,    setFilter]    = useState('actif');
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(0);
  const [pos,          setPos]          = useState([]);
  const [agents,       setAgents]       = useState([]);
  const [superviseurs, setSuperviseurs] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [msg,          setMsg]          = useState('');
  const PER_PAGE = 10;

  // Formulaire ajout POS
  const [form, setForm] = useState({
    succursale:'', deviceId:'', zone:'', nom:'', prenom:'',
    telephone:'', identifiant:'', password:'',
    agentPct:0, supPct:0, credit:'Libre', balanceGain:'Libre',
    prime:'60|20|10', superviseurId:'',
    // Tete fich pou enpresyon
    tete1:'', tete2:'', tete3:'', tete4:'Fich sa valid pou 90 jou', messageAdmin:'',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [posRes, agentsRes, supRes] = await Promise.all([
        api.get('/api/admin/pos').catch(() => ({ data: [] })),
        api.get('/api/admin/agents').catch(() => ({ data: [] })),
        api.get('/api/admin/superviseurs').catch(() => ({ data: [] })),
      ]);
      setPos(Array.isArray(posRes.data) ? posRes.data : []);
      setAgents(Array.isArray(agentsRes.data) ? agentsRes.data : []);
      setSuperviseurs(Array.isArray(supRes.data) ? supRes.data : []);
    } finally { setLoading(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.deviceId)    e.deviceId    = true;
    if (!form.nom)         e.nom         = true;
    if (!form.prenom)      e.prenom      = true;
    if (!form.identifiant) e.identifiant = true;
    if (!form.password)    e.password    = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Créer l'agent
      await api.post('/api/admin/agents', {
        nom: form.nom, prenom: form.prenom,
        username: form.identifiant, password: form.password,
        telephone: form.telephone, role: 'agent',
        credit: form.credit, limiteGain: form.balanceGain,
      });
      // Enregistrer le POS
      await api.post('/api/admin/pos', {
        posId: form.deviceId, nom: `${form.prenom} ${form.nom}`,
        adresse: form.zone, telephone: form.telephone,
        succursale: form.succursale, prime: form.prime,
        agentPct: form.agentPct, supPct: form.supPct,
        credit: form.credit,
        agentUsername: form.identifiant,
        messageAdmin: form.messageAdmin || '',
        tete: {
          ligne1: form.tete1 || `${form.prenom} ${form.nom}`,
          ligne2: form.tete2 || form.zone || '',
          ligne3: form.tete3 || form.telephone || '',
          ligne4: form.tete4 || 'Fich sa valid pou 90 jou',
        }
      });
      setMsg('✅ POS enregistré avec succès!');
      setShowForm(false);
      setForm({ succursale:'', deviceId:'', zone:'', nom:'', prenom:'', telephone:'', identifiant:'', password:'', agentPct:0, supPct:0, credit:'Libre', balanceGain:'Libre', prime:'60|20|10', superviseurId:'', tete1:'', tete2:'', tete3:'', tete4:'Fich sa valid pou 90 jou', messageAdmin:'' });
      await loadData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      alert('Erè: ' + (err?.response?.data?.message || err.message));
    } finally { setSaving(false); }
  };

  const handleToggle = async (id, actif) => {
    try {
      await api.put(`/api/admin/agents/${id}/toggle`);
      await loadData();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Efase POS sa a?')) return;
    try {
      await api.delete(`/api/admin/pos/${id}`);
      await loadData();
    } catch {}
  };

  const handleCopy = (data) => {
    const text = data.map(r => Object.values(r).join('\t')).join('\n');
    navigator.clipboard?.writeText(text);
  };

  const handleExcel = (data, filename) => {
    const csv = data.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=filename+'.csv'; a.click();
  };

  const filteredPos    = pos.filter(p => filter==='actif' ? p.actif!==false : p.actif===false);
  const filteredAgents = agents.filter(a => filter==='actif' ? a.actif!==false : a.actif===false);
  const searched = (arr) => !search ? arr : arr.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())));

  const TABS = [
    { key:'branches',     label:'Branches POS' },
    { key:'appareils',    label:'Appareils POS' },
    { key:'agentspos',    label:'Agents & POS' },
    { key:'superviseurs', label:'Superviseurs' },
  ];

  const Field = ({ label, name, required, type='text', placeholder='' }) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4, color: errors[name] ? '#dc2626' : '#444' }}>
        {label} {required && <span style={{ color:'#dc2626' }}>*</span>}
      </label>
      <div style={{ position:'relative' }}>
        <input
          type={type}
          value={form[name]}
          onChange={e => { setForm(f=>({...f,[name]:e.target.value})); setErrors(er=>({...er,[name]:false})); }}
          placeholder={placeholder}
          style={{ width:'100%', padding:'9px 36px 9px 12px', border:`1.5px solid ${errors[name]?'#dc2626':'#ddd'}`, borderRadius:6, fontSize:13, boxSizing:'border-box' }}
        />
        <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:14 }}>
          {errors[name] ? '✖' : form[name] ? '✔' : ''}
        </span>
      </div>
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Agents / POS</span>
        </div>

        {msg && (
          <div style={{ background:'#dcfce7', border:'1px solid #16a34a', borderRadius:8, padding:12, marginBottom:12, color:'#16a34a', fontWeight:700 }}>
            {msg}
          </div>
        )}

        {/* BOUTONS PRINCIPAUX */}
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <button onClick={() => setShowForm(true)}
            style={{ background:'#16a34a', color:'white', border:'none', borderRadius:6, padding:'9px 20px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
            ➕ Ajouter
          </button>
          <button onClick={() => setFilter('actif')}
            style={{ background: filter==='actif' ? '#1a73e8' : 'white', color: filter==='actif'?'white':'#1a73e8', border:'1.5px solid #1a73e8', borderRadius:6, padding:'9px 20px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
            ✅ Lister Actif
          </button>
          <button onClick={() => setFilter('inactif')}
            style={{ background: filter==='inactif' ? '#dc2626' : 'white', color: filter==='inactif'?'white':'#dc2626', border:'1.5px solid #dc2626', borderRadius:6, padding:'9px 20px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
            ❌ Lister Inactif
          </button>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:0, marginBottom:0, borderBottom:'2px solid #dee2e6' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding:'10px 20px', border:'none', background: activeTab===t.key ? '#1a73e8' : '#f8f9fa', color: activeTab===t.key ? 'white' : '#444', fontWeight:700, cursor:'pointer', fontSize:13, borderBottom: activeTab===t.key ? '2px solid #1a73e8' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background:'white', borderRadius:'0 0 8px 8px', padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>

          {/* EXPORT + SEARCH */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', gap:6 }}>
              {['Copier','Excel','PDF','Imprimer'].map(btn => (
                <button key={btn} onClick={() => btn==='Imprimer' ? window.print() : btn==='Excel' ? handleExcel(filteredPos, 'pos') : btn==='Copier' ? handleCopy(filteredPos) : window.print()}
                  style={{ background:'white', border:'1px solid #ccc', borderRadius:3, padding:'5px 12px', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  {btn}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontWeight:700, fontSize:13 }}>Search:</label>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                style={{ padding:'6px 10px', border:'1px solid #ddd', borderRadius:4, fontSize:13, width:180 }} />
            </div>
          </div>

          {/* ── TAB 1: BRANCHES POS ── */}
          {activeTab === 'branches' && (
            <>
              <h3 style={{ margin:'0 0 12px', fontWeight:800, color: filter==='actif'?'#16a34a':'#dc2626' }}>
                POS {filter.toUpperCase()}
              </h3>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa' }}>
                      {['Prime','D.exp','Crédit','Suc/Adr','Statut','Action'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'#888' }}>Chargement...</td></tr>
                    ) : searched(filteredPos).length === 0 ? (
                      <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'#888', fontStyle:'italic' }}>Pa gen POS — Klike "Ajouter"</td></tr>
                    ) : searched(filteredPos).map((p, i) => (
                      <tr key={p._id||i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ background:'#dbeafe', color:'#1a73e8', borderRadius:4, padding:'2px 8px', fontWeight:700, fontSize:12 }}>
                            {p.prime || '60|20|10'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px', color:'#888', fontSize:12 }}>{p.dexp || 'Illimité'}</td>
                        <td style={{ padding:'10px 12px', fontWeight:700 }}>{p.credit || 'Illimité'}</td>
                        <td style={{ padding:'10px 12px' }}>{p.succursale || p.adresse || '-'}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ background: p.actif!==false?'#dcfce7':'#fee2e2', color: p.actif!==false?'#16a34a':'#dc2626', borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                            {p.actif!==false ? 'Aktif' : 'Inaktif'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <button onClick={() => handleDelete(p._id)}
                            style={{ background:'#dc2626', color:'white', border:'none', borderRadius:4, padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                            Action
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── TAB 2: APPAREILS POS ── */}
          {activeTab === 'appareils' && (
            <>
              <h3 style={{ margin:'0 0 12px', fontWeight:800, color: filter==='actif'?'#16a34a':'#dc2626' }}>
                POS {filter.toUpperCase()}
              </h3>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa' }}>
                      {['Device ID','%Agent','%Sup','Statut','Message','Action'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ padding:20, textAlign:'center' }}>Chargement...</td></tr>
                    ) : searched(filteredPos).length === 0 ? (
                      <tr><td colSpan={6} style={{ padding:20, textAlign:'center', color:'#888', fontStyle:'italic' }}>Pa gen POS</td></tr>
                    ) : searched(filteredPos).map((p, i) => (
                      <tr key={p._id||i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                        <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:11, color:'#1a73e8', fontWeight:700 }}>{p.posId || '-'}</td>
                        <td style={{ padding:'10px 12px', fontWeight:700 }}>{p.agentPct || 0}%</td>
                        <td style={{ padding:'10px 12px', fontWeight:700 }}>{p.supPct || 0}%</td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ background: p.actif!==false?'#dcfce7':'#fee2e2', color: p.actif!==false?'#16a34a':'#dc2626', borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                            {p.actif!==false ? 'Aktif' : 'Inaktif'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'center' }}>
                          <span style={{ background:'#f3f4f6', borderRadius:20, padding:'3px 10px', fontSize:12 }}>0</span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <button onClick={() => handleDelete(p._id)}
                            style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:4, padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                            Action
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── TAB 3: AGENTS & POS ── */}
          {activeTab === 'agentspos' && (
            <>
              <h3 style={{ margin:'0 0 12px', fontWeight:800, color: filter==='actif'?'#16a34a':'#dc2626' }}>
                POS {filter.toUpperCase()}
              </h3>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa' }}>
                      {['Sup','Agent','Device ID','%Agent','%Sup','Statut','Action'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} style={{ padding:20, textAlign:'center' }}>Chargement...</td></tr>
                    ) : searched(filteredAgents).length === 0 ? (
                      <tr><td colSpan={7} style={{ padding:20, textAlign:'center', color:'#888', fontStyle:'italic' }}>Pa gen agent</td></tr>
                    ) : searched(filteredAgents).map((a, i) => {
                      const posAgent = pos.find(p => p.agentId === a.id || p.nom?.includes(a.nom));
                      return (
                        <tr key={a.id||i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                          <td style={{ padding:'10px 12px', color:'#888' }}>-</td>
                          <td style={{ padding:'10px 12px', fontWeight:700 }}>{a.prenom} {a.nom}</td>
                          <td style={{ padding:'10px 12px', fontFamily:'monospace', fontSize:11, color:'#1a73e8' }}>{posAgent?.posId || a.deviceId || '-'}</td>
                          <td style={{ padding:'10px 12px' }}>{posAgent?.agentPct || 0}%</td>
                          <td style={{ padding:'10px 12px' }}>{posAgent?.supPct || 0}%</td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background: a.actif!==false?'#dcfce7':'#fee2e2', color: a.actif!==false?'#16a34a':'#dc2626', borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                              {a.actif!==false ? 'Aktif' : 'Inaktif'}
                            </span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <button onClick={() => handleToggle(a.id, a.actif)}
                              style={{ background: a.actif!==false?'#f59e0b':'#16a34a', color:'white', border:'none', borderRadius:4, padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                              {a.actif!==false ? 'Bloke' : 'Aktive'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── TAB 4: SUPERVISEURS ── */}
          {activeTab === 'superviseurs' && (
            <SuperviseurTab superviseurs={superviseurs} agents={agents} onRefresh={loadData} api={api} />
          )}

        </div>

        {/* ── MODAL AJOUT POS ── */}
        {showForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', overflowY:'auto' }}>
            <div style={{ background:'white', borderRadius:12, padding:24, width:'95%', maxWidth:550, maxHeight:'90vh', overflowY:'auto', margin:'20px auto' }}>
              <h3 style={{ margin:'0 0 20px', fontWeight:900, fontSize:18, color:'#1a73e8' }}>➕ Ajouter POS</h3>

              {/* DEVICE ID */}
              <div style={{ background:'#eff6ff', borderRadius:8, padding:12, marginBottom:16, border:'1px solid #bfdbfe' }}>
                <label style={{ display:'block', fontWeight:800, fontSize:12, marginBottom:6, color:'#1a73e8' }}>
                  🆔 Device ID — POS ID * <span style={{ color:'#dc2626' }}>OBLIGATWA</span>
                </label>
                <div style={{ position:'relative' }}>
                  <input
                    value={form.deviceId}
                    onChange={e => { setForm(f=>({...f,deviceId:e.target.value})); setErrors(er=>({...er,deviceId:false})); }}
                    placeholder="POS-XXXX-XXXX-XXXX"
                    style={{ width:'100%', padding:'10px 36px 10px 12px', border:`2px solid ${errors.deviceId?'#dc2626':'#1a73e8'}`, borderRadius:6, fontSize:13, fontFamily:'monospace', fontWeight:700, boxSizing:'border-box' }}
                  />
                  <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:16, color: errors.deviceId?'#dc2626':'#16a34a' }}>
                    {errors.deviceId ? '✖' : form.deviceId ? '✔' : ''}
                  </span>
                </div>
                <p style={{ color:'#666', fontSize:11, margin:'6px 0 0' }}>
                  💡 L'ID est généré automatiquement par l'app POS. L'agent doit vous donner son ID.
                </p>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Succursale (Groupe)</label>
                  <select value={form.succursale} onChange={e=>setForm(f=>({...f,succursale:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }}>
                    <option value="">Chwazi...</option>
                    <option>CENTRAL</option>
                    <option>DELMAS</option>
                    <option>PETION-VILLE</option>
                    <option>CAP-HAITIEN</option>
                    <option>GONAIVES</option>
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Prime (Plan tarif)</label>
                  <select value={form.prime} onChange={e=>setForm(f=>({...f,prime:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }}>
                    {TIRAGES_PRIMES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginTop:12 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>👤 Superviseur (opsyonèl)</label>
                <select value={form.superviseurId} onChange={e=>setForm(f=>({...f,superviseurId:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, boxSizing:'border-box' }}>
                  <option value=''>— Klike si li gen yon superviseur —</option>
                  {superviseurs.map(s => (
                    <option key={s.id} value={s.id}>{s.prenom} {s.nom} ({s.username})</option>
                  ))}
                  {agents.filter(a=>a.role==='superviseur').map(s => (
                    <option key={s.id} value={s.id}>{s.prenom} {s.nom} — Sup ({s.username})</option>
                  ))}
                </select>
                <p style={{ color:'#666', fontSize:11, margin:'4px 0 0' }}>
                  💡 Si ajan an travay anba yon superviseur, chwazi l isit.
                </p>
              </div>

              <div style={{ marginTop:12 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>Zone / Adresse</label>
                <input value={form.zone} onChange={e=>setForm(f=>({...f,zone:e.target.value}))}
                  placeholder="Delmas 32, Port-au-Prince"
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
                {[['nom','Nom *',true],['prenom','Prénom *',true],['telephone','Téléphone',false],['identifiant','Identifiant *',true]].map(([name,label,req]) => (
                  <div key={name}>
                    <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4, color:errors[name]?'#dc2626':'#444' }}>
                      {label}
                    </label>
                    <div style={{ position:'relative' }}>
                      <input value={form[name]} onChange={e=>{setForm(f=>({...f,[name]:e.target.value}));setErrors(er=>({...er,[name]:false}));}}
                        style={{ width:'100%', padding:'9px 30px 9px 10px', border:`1.5px solid ${errors[name]?'#dc2626':'#ddd'}`, borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
                      <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:errors[name]?'#dc2626':'#16a34a', fontSize:13 }}>
                        {errors[name]?'✖':form[name]?'✔':''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:12 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4, color:errors.password?'#dc2626':'#444' }}>
                  Mot de passe *
                </label>
                <div style={{ position:'relative' }}>
                  <input type="password" value={form.password} onChange={e=>{setForm(f=>({...f,password:e.target.value}));setErrors(er=>({...er,password:false}));}}
                    style={{ width:'100%', padding:'9px 30px 9px 10px', border:`1.5px solid ${errors.password?'#dc2626':'#ddd'}`, borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
                  <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:errors.password?'#dc2626':'#16a34a', fontSize:13 }}>
                    {errors.password?'✖':form.password?'✔':''}
                  </span>
                </div>
              </div>

              {/* PARAMÈTRES */}
              <div style={{ background:'#f8f9fa', borderRadius:8, padding:12, marginTop:14 }}>
                <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:800 }}>⚙️ Paramètres</h4>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[['agentPct','%Agent','0'],['supPct','%Superviseur','0'],['credit','Limite Crédit','Libre'],['balanceGain','Limite Balance Gain','Libre']].map(([name,label,placeholder]) => (
                    <div key={name}>
                      <label style={{ display:'block', fontWeight:700, fontSize:11, marginBottom:4 }}>{label}</label>
                      <input value={form[name]} onChange={e=>setForm(f=>({...f,[name]:e.target.value}))}
                        placeholder={placeholder}
                        style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* BOULE AUTOMATIQUE (GRAP) */}
              <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, padding:12, marginTop:14 }}>
                <h4 style={{ margin:'0 0 8px', fontSize:13, fontWeight:800, color:'#92400e' }}>🎯 Boule Otomatik (GRAP)</h4>
                <p style={{ margin:'0 0 8px', fontSize:12, color:'#78350f' }}>
                  Si opsyon sa aktive, POS la ka jenere tout boule pou yon chif otomatikman.<br/>
                  Egz: GRAP 5 = 05, 15, 25, 35, 45, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 65, 75, 85, 95
                </p>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type='checkbox' id='grapActive' checked={form.grapActive||false}
                    onChange={e=>setForm(f=>({...f,grapActive:e.target.checked}))}
                    style={{ width:18, height:18, cursor:'pointer' }} />
                  <label htmlFor='grapActive' style={{ fontWeight:700, fontSize:13, cursor:'pointer', color:'#92400e' }}>
                    Aktive GRAP pou POS sa a
                  </label>
                </div>
              </div>

              {/* TETE FICH — Info enpresyon pou chak POS */}
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:12, marginTop:14 }}>
                <h4 style={{ margin:'0 0 10px', fontSize:13, fontWeight:800, color:'#1e40af' }}>🖨️ Tete Fich (Enpresyon)</h4>
                <p style={{ margin:'0 0 10px', fontSize:11, color:'#3b82f6' }}>
                  Chak POS ka gen tete fich diferan ki ap parèt sou bilye enprime yo.
                </p>
                {[
                  ['tete1', 'Liy 1 — Non POS / Biznès', `${form.prenom} ${form.nom}`],
                  ['tete2', 'Liy 2 — Adrès', form.zone || ''],
                  ['tete3', 'Liy 3 — Telefòn', form.telephone || ''],
                  ['tete4', 'Liy 4 — Mesaj pye fich', 'Fich sa valid pou 90 jou'],
                ].map(([name, label, ph]) => (
                  <div key={name} style={{ marginBottom:8 }}>
                    <label style={{ display:'block', fontWeight:700, fontSize:11, marginBottom:3, color:'#1e40af' }}>{label}</label>
                    <input
                      value={form[name] || ''}
                      onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                      placeholder={ph}
                      style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #bfdbfe', borderRadius:6, fontSize:13, boxSizing:'border-box' }}
                    />
                  </div>
                ))}
              </div>

              {/* MESSAGE ADMIN */}
              <div style={{ background:'#fef3c7', border:'1px solid #f59e0b', borderRadius:8, padding:12, marginTop:14 }}>
                <h4 style={{ margin:'0 0 8px', fontSize:13, fontWeight:800, color:'#92400e' }}>📢 Mesaj Admin pou POS sa a</h4>
                <p style={{ margin:'0 0 8px', fontSize:11, color:'#78350f' }}>
                  Mesaj sa ap parèt nan ekran akèy aplikasyon POS lan (notifikasyon, avètisman, enstriksyon).
                </p>
                <textarea
                  value={form.messageAdmin || ''}
                  onChange={e => setForm(f => ({ ...f, messageAdmin: e.target.value }))}
                  placeholder="Egz: Bienveni! Ou ka vann jiska 10pm. Kontak: +509 xxxx xxxx"
                  rows={3}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #f59e0b', borderRadius:6, fontSize:13, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
                />
              </div>

              {/* BOUTONS */}
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:12, background:'#f3f4f6', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>
                  Anile
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex:2, padding:12, background:saving?'#ccc':'#16a34a', color:'white', border:'none', borderRadius:6, fontWeight:700, cursor:saving?'default':'pointer', fontSize:14 }}>
                  {saving ? 'Ap sove...' : '✅ Enregistrer POS'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}

// ── COMPOSANT SUPERVISEUR TAB ──────────────────────────────────────────────
function SuperviseurTab({ superviseurs, agents, onRefresh, api }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [form, setForm]         = useState({
    nom:'', prenom:'', username:'', password:'', telephone:'',
    commission: 0, agentIds: [],
  });

  const handleSave = async () => {
    if (!form.nom || !form.prenom || !form.username || !form.password) {
      setMsg('❌ Ranpli tout chan obligatwa yo'); return;
    }
    setSaving(true);
    try {
      await api.post('/api/admin/agents', {
        nom: form.nom, prenom: form.prenom,
        username: form.username, password: form.password,
        telephone: form.telephone, role: 'superviseur',
        commission: form.commission,
      });
      setMsg('✅ Superviseur kreye!');
      setShowForm(false);
      setForm({ nom:'', prenom:'', username:'', password:'', telephone:'', commission:0, agentIds:[] });
      onRefresh();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('❌ Erè — eseye ankò'); }
    finally { setSaving(false); }
  };

  const supList = [...superviseurs, ...agents.filter(a => a.role === 'superviseur')];
  // deduplicate
  const seen = new Set();
  const uniqueSups = supList.filter(s => { if (seen.has(s.id||s._id)) return false; seen.add(s.id||s._id); return true; });

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ margin:0, fontWeight:800, fontSize:16, color:'#7c3aed' }}>👔 Superviseurs</h3>
        <button onClick={() => setShowForm(true)}
          style={{ background:'#7c3aed', color:'white', border:'none', borderRadius:6, padding:'9px 18px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
          ➕ Kreye Superviseur
        </button>
      </div>

      {msg && (
        <div style={{ background: msg.startsWith('✅')?'#dcfce7':'#fee2e2', border:`1px solid ${msg.startsWith('✅')?'#16a34a':'#dc2626'}`, borderRadius:8, padding:12, marginBottom:12, fontWeight:700, color: msg.startsWith('✅')?'#16a34a':'#dc2626' }}>
          {msg}
        </div>
      )}

      {/* TABLE SUPERVISEURS */}
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#f3e8ff' }}>
              {['Superieur','Nom','Prénom','Pseudo','Rôle',''].map(h => (
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #7c3aed', color:'#7c3aed' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueSups.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:'#888', fontStyle:'italic' }}>
                Pa gen superviseur. Klike "Kreye Superviseur" pou ajoute youn.
              </td></tr>
            ) : uniqueSups.map((s, i) => (
              <tr key={s.id||s._id||i} style={{ borderBottom:'1px solid #e9d5ff', background: i%2===0?'white':'#faf5ff' }}>
                <td style={{ padding:'10px 12px', color:'#888' }}>n/a</td>
                <td style={{ padding:'10px 12px', fontWeight:700 }}>{s.nom}</td>
                <td style={{ padding:'10px 12px' }}>{s.prenom}</td>
                <td style={{ padding:'10px 12px', color:'#7c3aed', fontWeight:700 }}>{s.username}</td>
                <td style={{ padding:'10px 12px' }}>
                  <span style={{ background:'#f3e8ff', color:'#7c3aed', borderRadius:12, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                    superviseur
                  </span>
                </td>
                <td style={{ padding:'10px 12px' }}>
                  <button onClick={() => {
                    if (confirm(`Efase superviseur ${s.prenom} ${s.nom}?`)) {
                      api.delete(`/api/admin/agents/${s.id||s._id}`).then(onRefresh).catch(() => alert('Erè'));
                    }
                  }}
                    style={{ background:'#dc2626', color:'white', border:'none', borderRadius:4, padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                    Efase
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CRÉER SUPERVISEUR */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'white', borderRadius:12, padding:24, width:'95%', maxWidth:480, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 20px', fontWeight:900, fontSize:18, color:'#7c3aed' }}>👔 Kreye Superviseur</h3>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              {[['nom','Nom *',''],['prenom','Prénom *',''],['username','Pseudo (Login) *',''],['password','Mot de passe *',''],['telephone','Téléphone',''],['commission','% Commission','0']].map(([key,label,ph]) => (
                <div key={key} style={{ gridColumn: key==='username'||key==='password' ? 'span 1' : undefined }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4, color:'#555' }}>{label}</label>
                  <input
                    type={key==='password'?'password':'text'}
                    value={form[key]}
                    onChange={e => setForm(f => ({...f,[key]:e.target.value}))}
                    placeholder={ph}
                    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, boxSizing:'border-box' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ background:'#f3e8ff', borderRadius:8, padding:10, marginBottom:16, fontSize:12, color:'#7c3aed' }}>
              💡 Superviseur an pral gen aksè a yon tableau de bord espesyal. Li ka wè ak jere ajan ki anba li.
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:1, padding:'12px', background:saving?'#ccc':'#7c3aed', color:'white', border:'none', borderRadius:8, fontWeight:800, fontSize:14, cursor:saving?'not-allowed':'pointer' }}>
                {saving ? '⏳ Ap kreye...' : '✅ Kreye Superviseur'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ flex:1, padding:'12px', background:'#f1f5f9', color:'#555', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                Anile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
