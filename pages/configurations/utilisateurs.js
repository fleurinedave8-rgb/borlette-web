import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../../utils/api';

export default function Utilisateurs() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [form, setForm]           = useState({ nom:'', prenom:'', username:'', password:'', role:'agent', telephone:'' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(()=>{ load(); },[]);
  const load = async ()=>{ setLoading(true); try{ const r=await getAgents(); setUsers(r.data||[]); }catch{} finally{ setLoading(false); } };

  const openCreate = ()=>{ setEditUser(null); setForm({nom:'',prenom:'',username:'',password:'',role:'agent',telephone:''}); setError(''); setShowModal(true); };
  const openEdit   = (u)=>{ setEditUser(u); setForm({nom:u.nom,prenom:u.prenom||'',username:u.username,password:'',role:u.role||'agent',telephone:u.telephone||''}); setError(''); setShowModal(true); };

  const handleSave = async ()=>{
    if(!form.nom||!form.username){ setError('Champ obligatwa'); return; }
    setSaving(true); setError('');
    try{
      if(editUser) await updateAgent(editUser.id, form);
      else         await createAgent(form);
      setShowModal(false); load();
    }catch(err){ setError(err.response?.data?.message||'Erè'); }
    finally{ setSaving(false); }
  };

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h1 style={{ margin:0, fontSize:20, fontWeight:800 }}>Utilisateurs</h1>
          <button onClick={openCreate} style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, cursor:'pointer' }}>+ Ajouter</button>
        </div>
        <div style={{ background:'white', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', overflow:'auto' }}>
          {loading ? <div style={{ padding:30, textAlign:'center', color:'#999' }}>Chargement...</div>
          : <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ background:'#f8f9fa' }}>
                {['#','Non','Username','Rôle','Statut','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'#555', borderBottom:'2px solid #eee' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.map((u,i)=>(
                  <tr key={u.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                    <td style={{ padding:'10px 14px' }}>{i+1}</td>
                    <td style={{ padding:'10px 14px', fontWeight:700 }}>{u.prenom} {u.nom}</td>
                    <td style={{ padding:'10px 14px', color:'#1a73e8', fontFamily:'monospace' }}>{u.username}</td>
                    <td style={{ padding:'10px 14px' }}><span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>{u.role||'agent'}</span></td>
                    <td style={{ padding:'10px 14px' }}><span style={{ background:u.actif?'#d1fae5':'#fee2e2', color:u.actif?'#065f46':'#991b1b', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>{u.actif?'Aktif':'Inaktif'}</span></td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={()=>openEdit(u)} style={{ background:'#f59e0b', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>✏️</button>
                        <button onClick={()=>updateAgent(u.id,{actif:!u.actif}).then(load)} style={{ background:u.actif?'#dc2626':'#16a34a', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>{u.actif?'🔒':'🔓'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', borderRadius:12, padding:28, width:'100%', maxWidth:420 }}>
            <h3 style={{ margin:'0 0 20px', fontWeight:800 }}>{editUser?'✏️ Modifier':'➕ Nouvo Itilizatè'}</h3>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #dc2626', borderRadius:6, padding:'8px 12px', marginBottom:14, color:'#dc2626', fontSize:13 }}>{error}</div>}
            {[['nom','Non *','text'],['prenom','Prénom','text'],['username','Username *','text'],['password',editUser?'Nouvo modpas':'Modpas *','password'],['telephone','Téléphone','tel']].map(([key,label,type])=>(
              <div key={key} style={{ marginBottom:12 }}>
                <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:12 }}>
              <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Rôle</label>
              <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
                style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14 }}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
                <option value="superviseur">Superviseur</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'11px', background:'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>{saving?'...':'✓ Sove'}</button>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:'11px', background:'#f0f0f0', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>Anile</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
