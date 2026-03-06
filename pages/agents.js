import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../utils/api';

export default function Agents() {
  const [agents, setAgents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [showDelete, setShowDelete] = useState(null);
  const [form, setForm] = useState({ nom:'', prenom:'', username:'', password:'', telephone:'', credit:'Illimité', limiteGain:'Illimité' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { const r = await getAgents(); setAgents(r.data || []); }
    catch { setAgents([]); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditAgent(null); setForm({ nom:'', prenom:'', username:'', password:'', telephone:'', credit:'Illimité', limiteGain:'Illimité' }); setError(''); setShowModal(true); };
  const openEdit   = (a) => { setEditAgent(a); setForm({ nom:a.nom, prenom:a.prenom||'', username:a.username, password:'', telephone:a.telephone||'', credit:a.credit, limiteGain:a.limiteGain }); setError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nom || !form.username) { setError('Nom ak username obligatwa'); return; }
    if (!editAgent && !form.password) { setError('Modpas obligatwa'); return; }
    setSaving(true); setError('');
    try {
      if (editAgent) await updateAgent(editAgent.id, form);
      else           await createAgent(form);
      setShowModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Erè'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await deleteAgent(id); setShowDelete(null); load(); } catch {}
  };

  const handleBlock = async (a) => {
    try { await updateAgent(a.id, { actif: !a.actif }); load(); } catch {}
  };

  const filtered = agents.filter(a =>
    a.nom?.toLowerCase().includes(search.toLowerCase()) ||
    a.username?.toLowerCase().includes(search.toLowerCase()) ||
    a.telephone?.includes(search)
  );

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <h1 style={{ margin:0, fontSize:20, fontWeight:800 }}>Agents / POS ({agents.length})</h1>
          <div style={{ display:'flex', gap:10 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Rechercher..."
              style={{ padding:'8px 14px', border:'1px solid #ddd', borderRadius:8, fontSize:13 }} />
            <button onClick={openCreate} style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, cursor:'pointer' }}>
              + Nouvo Ajan
            </button>
          </div>
        </div>

        <div style={{ background:'white', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', overflow:'auto' }}>
          {loading ? <div style={{ padding:40, textAlign:'center', color:'#999' }}>Chargement...</div>
          : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  {['#','Non','Username','Téléphone','Crédit','Statut','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'#555', borderBottom:'2px solid #eee' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7} style={{ padding:30, textAlign:'center', color:'#999' }}>Okenn ajan</td></tr>
                  : filtered.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                    <td style={{ padding:'10px 14px', fontSize:13 }}>{i+1}</td>
                    <td style={{ padding:'10px 14px', fontWeight:700 }}>{a.prenom} {a.nom}</td>
                    <td style={{ padding:'10px 14px', color:'#1a73e8', fontFamily:'monospace' }}>{a.username}</td>
                    <td style={{ padding:'10px 14px' }}>{a.telephone || '-'}</td>
                    <td style={{ padding:'10px 14px' }}>{a.credit}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ background: a.actif ? '#d1fae5' : '#fee2e2', color: a.actif ? '#065f46' : '#991b1b', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                        {a.actif ? 'Aktif' : 'Inaktif'}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:5 }}>
                        <button onClick={() => openEdit(a)} title="Modifier"
                          style={{ background:'#f59e0b', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>✏️</button>
                        <button onClick={() => handleBlock(a)} title={a.actif ? 'Bloquer' : 'Débloquer'}
                          style={{ background: a.actif ? '#dc2626' : '#16a34a', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>
                          {a.actif ? '🔒' : '🔓'}
                        </button>
                        <button onClick={() => setShowDelete(a)} title="Supprimer"
                          style={{ background:'#6b7280', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL CRÉER/MODIFIER */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:12, padding:28, width:'100%', maxWidth:440, maxHeight:'90vh', overflow:'auto' }}>
            <h3 style={{ margin:'0 0 20px', fontWeight:800 }}>{editAgent ? '✏️ Modifye Ajan' : '➕ Nouvo Ajan'}</h3>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #dc2626', borderRadius:6, padding:'8px 12px', marginBottom:14, color:'#dc2626', fontSize:13 }}>{error}</div>}
            {[
              ['nom','Non *','text'], ['prenom','Prénom','text'],
              ['username','Username *','text'], ['password', editAgent ? 'Nouvo modpas (optionnel)' : 'Modpas *','password'],
              ['telephone','Téléphone','tel'], ['credit','Crédit vente','text'], ['limiteGain','Limite gain','text'],
            ].map(([key,label,type]) => (
              <div key={key} style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(p=>({...p,[key]:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:1, padding:'11px', background:'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                {saving ? 'Anregistre...' : '✓ Anregistre'}
              </button>
              <button onClick={() => setShowModal(false)}
                style={{ flex:1, padding:'11px', background:'#f0f0f0', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>Anile</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {showDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:12, padding:28, width:'100%', maxWidth:360, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
            <h3 style={{ margin:'0 0 8px', fontWeight:800 }}>Konfime sipresyon</h3>
            <p style={{ color:'#666', marginBottom:20 }}>Ou vle dezaktive <strong>{showDelete.prenom} {showDelete.nom}</strong> ?</p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => handleDelete(showDelete.id)}
                style={{ flex:1, padding:'11px', background:'#dc2626', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                Wi, Dezaktive
              </button>
              <button onClick={() => setShowDelete(null)}
                style={{ flex:1, padding:'11px', background:'#f0f0f0', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>Anile</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
