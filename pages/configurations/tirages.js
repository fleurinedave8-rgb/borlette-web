import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const ETATS = ['Florida','New-York','Georgia','Ohio','Chicago','Maryland','Tennessee','Connecticut','Massachusetts','Pennsylvania','New-Jersey','California'];

const TIRAGES_DEFAULT = [
  { nom:'Florida matin',   etat:'Florida',   ouverture:'10:00', fermeture:'10:30', prime:100, limite:2000, actif:true },
  { nom:'Florida soir',    etat:'Florida',   ouverture:'21:00', fermeture:'21:30', prime:100, limite:2000, actif:true },
  { nom:'New-york matin',  etat:'New-York',  ouverture:'12:29', fermeture:'12:30', prime:100, limite:2000, actif:true },
  { nom:'New-york soir',   etat:'New-York',  ouverture:'22:30', fermeture:'23:00', prime:100, limite:2000, actif:true },
  { nom:'Georgia-Matin',   etat:'Georgia',   ouverture:'12:29', fermeture:'12:30', prime:100, limite:2000, actif:true },
  { nom:'Georgia-Soir',    etat:'Georgia',   ouverture:'18:00', fermeture:'18:30', prime:100, limite:2000, actif:true },
  { nom:'Ohio matin',      etat:'Ohio',      ouverture:'10:30', fermeture:'11:00', prime:100, limite:2000, actif:true },
  { nom:'Ohio soir',       etat:'Ohio',      ouverture:'22:00', fermeture:'22:30', prime:100, limite:2000, actif:true },
  { nom:'Chicago matin',   etat:'Chicago',   ouverture:'09:00', fermeture:'09:30', prime:100, limite:2000, actif:true },
  { nom:'Chicago soir',    etat:'Chicago',   ouverture:'20:00', fermeture:'20:30', prime:100, limite:2000, actif:true },
  { nom:'Maryland midi',   etat:'Maryland',  ouverture:'13:00', fermeture:'13:30', prime:100, limite:2000, actif:true },
  { nom:'Maryland soir',   etat:'Maryland',  ouverture:'19:00', fermeture:'19:30', prime:100, limite:2000, actif:true },
  { nom:'Tennessee matin', etat:'Tennessee', ouverture:'11:00', fermeture:'11:30', prime:100, limite:2000, actif:true },
  { nom:'Tennessee soir',  etat:'Tennessee', ouverture:'21:30', fermeture:'22:00', prime:100, limite:2000, actif:true },
];

function getStatut(ouverture, fermeture) {
  const now = new Date();
  const [oh, om] = ouverture.split(':').map(Number);
  const [fh, fm] = fermeture.split(':').map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = oh * 60 + om;
  const closeMin = fh * 60 + fm;
  if (nowMin >= openMin && nowMin <= closeMin) return 'en_cours';
  if (nowMin > closeMin) return 'ferme';
  return 'bientot';
}

export default function TiragesPage() {
  const [activeTab,   setActiveTab]   = useState('liste');
  const [tirages,     setTirages]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [filtre,      setFiltre]      = useState('tous');
  const [etatChoisi,  setEtatChoisi]  = useState('');
  const [showAdd,     setShowAdd]     = useState(false);
  const [showModPrime, setShowModPrime] = useState(null);
  const [showModLimite, setShowModLimite] = useState(null);
  const [msg,         setMsg]         = useState('');
  const [form,        setForm]        = useState({ nom:'', etat:'Florida', ouverture:'10:00', fermeture:'10:30', prime:100, limite:2000 });
  const [modVal,      setModVal]      = useState('');

  useEffect(() => { loadTirages(); }, []);

  const loadTirages = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/tirages');
      const data = Array.isArray(r.data) ? r.data : [];
      if (data.length === 0) {
        // Initialiser avec tirages par défaut
        for (const t of TIRAGES_DEFAULT) {
          await api.post('/api/tirages', t).catch(() => {});
        }
        const r2 = await api.get('/api/tirages');
        setTirages(Array.isArray(r2.data) ? r2.data : TIRAGES_DEFAULT);
      } else {
        setTirages(data);
      }
    } catch { setTirages(TIRAGES_DEFAULT); }
    finally { setLoading(false); }
  };

  const filtered = tirages.filter(t => {
    if (filtre === 'actif')   return t.actif !== false;
    if (filtre === 'inactif') return t.actif === false;
    return true;
  });

  const handleToggle = async (t) => {
    try {
      await api.put(`/api/tirages/${t._id}`, { actif: !t.actif });
      await loadTirages();
      showMsg(`✅ ${t.nom} ${!t.actif ? 'aktivé' : 'désaktivé'}`);
    } catch {}
  };

  const handleModPrime = async () => {
    try {
      await api.put(`/api/tirages/${showModPrime._id}`, { prime: Number(modVal) });
      setShowModPrime(null); setModVal('');
      await loadTirages();
      showMsg('✅ Prime modifié!');
    } catch {}
  };

  const handleModLimite = async () => {
    try {
      await api.put(`/api/tirages/${showModLimite._id}`, { limite: Number(modVal) });
      setShowModLimite(null); setModVal('');
      await loadTirages();
      showMsg('✅ Limite modifiée!');
    } catch {}
  };

  const handleAdd = async () => {
    if (!form.nom) return alert('Mete non tiraj la!');
    try {
      await api.post('/api/tirages', { ...form, actif: true });
      setShowAdd(false);
      await loadTirages();
      showMsg('✅ Tiraj ajoute!');
    } catch {}
  };

  const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const TABS = [
    { key:'liste',     label:'Paramètres' },
    { key:'statut',    label:'Statuts' },
    { key:'horaires',  label:'Horaires' },
    { key:'infos',     label:'Infos Tirage' },
    { key:'resultats', label:'Résultats Loterie' },
  ];

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Configurations Tirages</span>
        </div>

        {msg && (
          <div style={{ background:'#dcfce7', border:'1px solid #16a34a', borderRadius:8, padding:12, marginBottom:12, color:'#16a34a', fontWeight:700 }}>
            {msg}
          </div>
        )}

        {/* BOUTONS PRINCIPAUX */}
        <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <button onClick={() => setShowAdd(true)}
            style={{ background:'#16a34a', color:'white', border:'none', borderRadius:6, padding:'9px 18px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
            ➕ Ajouter
          </button>
          {['tous','actif','inactif'].map(f => (
            <button key={f} onClick={() => setFiltre(f)}
              style={{ background: filtre===f ? '#1a73e8':'white', color: filtre===f?'white':'#1a73e8', border:'1.5px solid #1a73e8', borderRadius:6, padding:'9px 18px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {f==='tous'?'📋 Lister':f==='actif'?'✅ Actif':'❌ Inactif'}
            </button>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:0, borderBottom:'2px solid #dee2e6', overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding:'10px 16px', border:'none', background: activeTab===t.key?'#1a73e8':'#f8f9fa', color: activeTab===t.key?'white':'#444', fontWeight:700, cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ background:'white', borderRadius:'0 0 8px 8px', padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>

          {/* ── PAGE 1: PARAMÈTRES ── */}
          {activeTab === 'liste' && (
            <>
              <h3 style={{ margin:'0 0 14px', fontWeight:800 }}>📋 Liste des Tirages disponible — Paramètres</h3>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa' }}>
                      {['Nom','État','Prime (HTG)','Limite (HTG)','Ouverture','Action'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} style={{ padding:20, textAlign:'center' }}>Chargement...</td></tr>
                    ) : filtered.map((t, i) => (
                      <tr key={t._id||i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                        <td style={{ padding:'10px 12px', fontWeight:700 }}>{t.nom}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ background:'#eff6ff', color:'#1a73e8', borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{t.etat||'—'}</span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ fontWeight:700, color:'#16a34a' }}>{t.prime||100} G</span>
                          <button onClick={() => { setShowModPrime(t); setModVal(t.prime||100); }}
                            style={{ marginLeft:8, background:'#f59e0b', color:'white', border:'none', borderRadius:3, padding:'3px 8px', fontSize:10, cursor:'pointer', fontWeight:700 }}>
                            ✏️ Modifier
                          </button>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ fontWeight:700, color:'#7c3aed' }}>{t.limite||2000} G</span>
                          <button onClick={() => { setShowModLimite(t); setModVal(t.limite||2000); }}
                            style={{ marginLeft:8, background:'#7c3aed', color:'white', border:'none', borderRadius:3, padding:'3px 8px', fontSize:10, cursor:'pointer', fontWeight:700 }}>
                            ✏️ Modifier
                          </button>
                        </td>
                        <td style={{ padding:'10px 12px', color:'#888' }}>{t.ouverture||'—'}</td>
                        <td style={{ padding:'10px 12px' }}>
                          <button onClick={() => handleToggle(t)}
                            style={{ background: t.actif!==false?'#dc2626':'#16a34a', color:'white', border:'none', borderRadius:4, padding:'5px 10px', cursor:'pointer', fontSize:11, fontWeight:700 }}>
                            {t.actif!==false ? '🔴 Désactiver' : '🟢 Activer'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── PAGE 2: STATUTS ── */}
          {activeTab === 'statut' && (
            <>
              <h3 style={{ margin:'0 0 14px', fontWeight:800 }}>🔴🟢 Liste des Tirages — Statuts en temps réel</h3>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa' }}>
                      {['Nom','Fermeture','Statut','Actif'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, i) => {
                      const statut = getStatut(t.ouverture||'00:00', t.fermeture||'23:59');
                      return (
                        <tr key={t._id||i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                          <td style={{ padding:'10px 12px', fontWeight:700 }}>{t.nom}</td>
                          <td style={{ padding:'10px 12px', color:'#888' }}>{t.fermeture||'—'}</td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background: statut==='en_cours'?'#dcfce7':statut==='bientot'?'#fef9c3':'#fee2e2', color: statut==='en_cours'?'#16a34a':statut==='bientot'?'#ca8a04':'#dc2626', borderRadius:20, padding:'4px 12px', fontWeight:700, fontSize:12 }}>
                              {statut==='en_cours'?'🟢 En cours':statut==='bientot'?'🟡 Bientôt':'🔴 Fermé'}
                            </span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            {t.actif!==false ? (
                              <span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:20, padding:'4px 12px', fontWeight:700, fontSize:12 }}>✅ Oui</span>
                            ) : (
                              <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:20, padding:'4px 12px', fontWeight:700, fontSize:12 }}>❌ Désactivé</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p style={{ color:'#888', fontSize:11, marginTop:8 }}>⏱ La page se met à jour automatiquement selon l'heure actuelle.</p>
            </>
          )}

          {/* ── PAGE 3: HORAIRES ── */}
          {activeTab === 'horaires' && (
            <>
              <h3 style={{ margin:'0 0 14px', fontWeight:800 }}>🕐 Liste des Tirages — Horaires Complets</h3>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8f9fa' }}>
                      {['Nom','État','Ouverture','Fermeture','Durée'].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, i) => {
                      const [oh,om] = (t.ouverture||'00:00').split(':').map(Number);
                      const [fh,fm] = (t.fermeture||'00:30').split(':').map(Number);
                      const duree = ((fh*60+fm) - (oh*60+om));
                      return (
                        <tr key={t._id||i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                          <td style={{ padding:'10px 12px', fontWeight:700 }}>{t.nom}</td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background:'#eff6ff', color:'#1a73e8', borderRadius:4, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{t.etat||'—'}</span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:4, padding:'4px 10px', fontWeight:700, fontSize:12 }}>🟢 {t.ouverture||'—'}</span>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ background:'#fee2e2', color:'#dc2626', borderRadius:4, padding:'4px 10px', fontWeight:700, fontSize:12 }}>🔴 {t.fermeture||'—'}</span>
                          </td>
                          <td style={{ padding:'10px 12px', color:'#888', fontSize:12 }}>{duree > 0 ? `${duree} min` : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── PAGE 4: INFOS TIRAGE ── */}
          {activeTab === 'infos' && (
            <>
              <h3 style={{ margin:'0 0 6px', fontWeight:800 }}>🎲 Informations sur les tirages</h3>
              <p style={{ margin:'0 0 16px', color:'#888', fontSize:13 }}>Jeux de loterie par État</p>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:14, marginBottom:8 }}>Sélectionnez un État :</label>
                <select value={etatChoisi} onChange={e => setEtatChoisi(e.target.value)}
                  style={{ padding:'10px 16px', border:'2px solid #1a73e8', borderRadius:8, fontSize:14, minWidth:280, cursor:'pointer' }}>
                  <option value="">-- Choisir un État --</option>
                  {ETATS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {etatChoisi && (
                <div>
                  <h4 style={{ margin:'0 0 12px', color:'#1a73e8', fontWeight:800 }}>
                    🗺️ Tirages disponibles — {etatChoisi}
                  </h4>
                  <div style={{ display:'grid', gap:10 }}>
                    {tirages.filter(t => t.etat === etatChoisi).length === 0 ? (
                      <div style={{ padding:20, textAlign:'center', color:'#888', background:'#f8f9fa', borderRadius:8 }}>
                        Pa gen tiraj pou {etatChoisi}
                      </div>
                    ) : tirages.filter(t => t.etat === etatChoisi).map((t, i) => {
                      const statut = getStatut(t.ouverture||'00:00', t.fermeture||'23:59');
                      return (
                        <div key={i} style={{ background:'#f8f9fa', borderRadius:8, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${statut==='en_cours'?'#bbf7d0':'#dee2e6'}` }}>
                          <div>
                            <div style={{ fontWeight:800, fontSize:14 }}>{t.nom}</div>
                            <div style={{ fontSize:12, color:'#888', marginTop:4 }}>
                              🟢 {t.ouverture} → 🔴 {t.fermeture}
                            </div>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span style={{ background: statut==='en_cours'?'#dcfce7':'#fee2e2', color: statut==='en_cours'?'#16a34a':'#dc2626', borderRadius:20, padding:'4px 12px', fontWeight:700, fontSize:12 }}>
                              {statut==='en_cours'?'🟢 En cours':'🔴 Fermé'}
                            </span>
                            <span style={{ background:'#eff6ff', color:'#1a73e8', borderRadius:20, padding:'4px 12px', fontWeight:700, fontSize:12 }}>
                              Prime: {t.prime||100}G
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── PAGE 5: RÉSULTATS ── */}
          {activeTab === 'resultats' && (
            <>
              <h3 style={{ margin:'0 0 14px', fontWeight:800 }}>🏆 Résultats Loterie</h3>
              <button onClick={() => window.location.href='/surveillance/lots-gagnant'}
                style={{ background:'#16a34a', color:'white', border:'none', borderRadius:6, padding:'10px 20px', fontWeight:700, cursor:'pointer', fontSize:14 }}>
                ➕ Ajouter / Voir Résultats →
              </button>
            </>
          )}

        </div>

        {/* ── MODAL MODIFIER PRIME ── */}
        {showModPrime && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:12, padding:24, width:320 }}>
              <h3 style={{ margin:'0 0 16px', fontWeight:800 }}>✏️ Modifier Prime — {showModPrime.nom}</h3>
              <input type="number" value={modVal} onChange={e => setModVal(e.target.value)}
                style={{ width:'100%', padding:'10px', border:'2px solid #f59e0b', borderRadius:6, fontSize:16, fontWeight:700, boxSizing:'border-box', marginBottom:12 }} />
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowModPrime(null)}
                  style={{ flex:1, padding:10, background:'#f3f4f6', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Anile</button>
                <button onClick={handleModPrime}
                  style={{ flex:2, padding:10, background:'#f59e0b', color:'white', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>✅ Sove</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL MODIFIER LIMITE ── */}
        {showModLimite && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:12, padding:24, width:320 }}>
              <h3 style={{ margin:'0 0 16px', fontWeight:800 }}>✏️ Modifier Limite — {showModLimite.nom}</h3>
              <input type="number" value={modVal} onChange={e => setModVal(e.target.value)}
                style={{ width:'100%', padding:'10px', border:'2px solid #7c3aed', borderRadius:6, fontSize:16, fontWeight:700, boxSizing:'border-box', marginBottom:12 }} />
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowModLimite(null)}
                  style={{ flex:1, padding:10, background:'#f3f4f6', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Anile</button>
                <button onClick={handleModLimite}
                  style={{ flex:2, padding:10, background:'#7c3aed', color:'white', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>✅ Sove</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL AJOUTER TIRAGE ── */}
        {showAdd && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'white', borderRadius:12, padding:24, width:'90%', maxWidth:440 }}>
              <h3 style={{ margin:'0 0 16px', fontWeight:800 }}>➕ Ajouter Nouveau Tirage</h3>
              {[['nom','Nom du tirage *','text'],['ouverture','Heure ouverture','time'],['fermeture','Heure fermeture','time'],['prime','Prime (HTG)','number'],['limite','Limite (HTG)','number']].map(([key,label,type]) => (
                <div key={key} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontWeight:700, fontSize:12, marginBottom:4 }}>État</label>
                <select value={form.etat} onChange={e => setForm(f => ({...f,etat:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:13 }}>
                  {ETATS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowAdd(false)}
                  style={{ flex:1, padding:11, background:'#f3f4f6', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>Anile</button>
                <button onClick={handleAdd}
                  style={{ flex:2, padding:11, background:'#16a34a', color:'white', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer' }}>✅ Ajouter</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
