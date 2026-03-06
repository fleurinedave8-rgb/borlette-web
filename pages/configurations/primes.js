import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const defaultPrimes = [
  { code:20,  type:'Borlette',             prime:'60|20|10', description:'1er lot 60%, 2em 20%, 3em 10%' },
  { code:30,  type:'Loto 3',               prime:'500',      description:'Pou chak goud' },
  { code:40,  type:'Mariage',              prime:'1000',     description:'Pou chak goud' },
  { code:41,  type:'L4O1',                 prime:'5000',     description:'Loto4 1er position' },
  { code:42,  type:'L4O2',                 prime:'5000',     description:'Loto4 2em position' },
  { code:43,  type:'L4O3',                 prime:'5000',     description:'Loto4 3em position' },
  { code:51,  type:'L5O1',                 prime:'25000',    description:'Loto5 1er position' },
  { code:52,  type:'L5O2',                 prime:'25000',    description:'Loto5 2em position' },
  { code:53,  type:'L5O3',                 prime:'25000',    description:'Loto5 3em position' },
  { code:44,  type:'Mariage Gratuit',      prime:'2000',     description:'Pou chak goud' },
  { code:105, type:'Tet fich',             prime:'0',        description:'Tèt fiche normal' },
  { code:106, type:'Tet fich loto3',       prime:'0',        description:'Tèt fiche loto3' },
  { code:107, type:'Tet fich mariaj dwat', prime:'0',        description:'Tèt fiche mariage droite' },
  { code:108, type:'Tet fich mariaj gauch',prime:'0',        description:'Tèt fiche mariage gauche' },
];

const TABS = [
  { key:'general', label:'🔵 Général' },
  { key:'tirage',  label:'🟢 Par Tirage' },
  { key:'paire',   label:'🟡 Boule paire et grappe' },
];

export default function Primes() {
  const [tab, setTab]           = useState('general');
  const [primes, setPrimes]     = useState(defaultPrimes);
  const [editItem, setEditItem] = useState(null);
  const [primeVal, setPrimeVal] = useState('');
  const [descVal, setDescVal]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const [newPrime, setNewPrime] = useState({ code:'', type:'', prime:'', description:'' });

  const openEdit = (p) => { setEditItem(p); setPrimeVal(p.prime); setDescVal(p.description||''); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = primes.map(p => p.code === editItem.code ? { ...p, prime: primeVal, description: descVal } : p);
      setPrimes(updated);
      await api.put('/api/admin/primes', updated).catch(() => {});
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      setEditItem(null);
    } finally { setSaving(false); }
  };

  const handleAdd = () => {
    if (!newPrime.type || !newPrime.prime) return;
    setPrimes(p => [...p, { ...newPrime, code: Date.now() }]);
    setNewPrime({ code:'', type:'', prime:'', description:'' });
    setShowAdd(false);
  };

  const handleDelete = (code) => {
    if (!confirm('Efase prime sa a?')) return;
    setPrimes(p => p.filter(x => x.code !== code));
  };

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h1 style={{ margin:0, fontSize:20, fontWeight:800 }}>Configuration des Primes</h1>
          <button onClick={() => setShowAdd(true)}
            style={{ background:'#16a34a', color:'white', border:'none', borderRadius:8, padding:'10px 18px', fontWeight:700, cursor:'pointer' }}>
            + Ajouter Prime
          </button>
        </div>

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ background: tab===t.key ? '#1a73e8' : '#e5e7eb', color: tab===t.key ? 'white' : '#333', border:'none', borderRadius:8, padding:'8px 16px', fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {t.label}
            </button>
          ))}
        </div>

        {saved && <div style={{ background:'#d1fae5', border:'1px solid #16a34a', borderRadius:8, padding:'10px 16px', marginBottom:12, color:'#065f46', fontWeight:700 }}>✅ Prime modifye avèk siksè !</div>}

        {/* EDIT FORM */}
        {editItem && (
          <div style={{ background:'white', borderRadius:12, padding:24, marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', border:'2px solid #1a73e8' }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800, color:'#1a73e8' }}>✏️ Modifye : {editItem.type}</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Kòd</label>
                <input value={editItem.code} readOnly style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, background:'#f8f9fa', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Type</label>
                <input value={editItem.type} readOnly style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, background:'#f8f9fa', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Prime *</label>
                <input value={primeVal} onChange={e => setPrimeVal(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:'2px solid #16a34a', borderRadius:6, fontSize:14, fontWeight:700, boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>Deskripsyon</label>
                <input value={descVal} onChange={e => setDescVal(e.target.value)}
                  style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14, boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ flex:1, padding:'11px', background:'#1a73e8', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
                {saving ? 'Sauvegarde...' : '✅ Modifier'}
              </button>
              <button onClick={() => setEditItem(null)}
                style={{ flex:1, padding:'11px', background:'#f0f0f0', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>
                Anile
              </button>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div style={{ background:'white', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', overflow:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8f9fa' }}>
                {['Kòd','Type','Deskripsyon','Prime','Actions'].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:12, fontWeight:700, color:'#555', borderBottom:'2px solid #eee' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {primes.map((p, i) => (
                <tr key={p.code} style={{ borderBottom:'1px solid #f0f0f0', background: editItem?.code===p.code ? '#eff6ff' : 'white' }}>
                  <td style={{ padding:'10px 14px', fontWeight:700, color:'#1a73e8' }}>{p.code}</td>
                  <td style={{ padding:'10px 14px', fontWeight:600 }}>{p.type}</td>
                  <td style={{ padding:'10px 14px', fontSize:12, color:'#666' }}>{p.description || '-'}</td>
                  <td style={{ padding:'10px 14px' }}>
                    <span style={{ background:'#d1fae5', color:'#065f46', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:800 }}>{p.prime}</span>
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => openEdit(p)}
                        style={{ background:'#f59e0b', color:'white', border:'none', borderRadius:5, padding:'5px 12px', fontSize:12, cursor:'pointer', fontWeight:700 }}>✏️ Modifier</button>
                      <button onClick={() => handleDelete(p.code)}
                        style={{ background:'#dc2626', color:'white', border:'none', borderRadius:5, padding:'5px 10px', fontSize:12, cursor:'pointer', fontWeight:700 }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL AJOUTER */}
        {showAdd && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'white', borderRadius:12, padding:28, width:'100%', maxWidth:420 }}>
              <h3 style={{ margin:'0 0 20px', fontWeight:800 }}>➕ Ajouter Prime</h3>
              {[['type','Type *','text'],['prime','Prime *','text'],['description','Deskripsyon','text']].map(([key,label,type]) => (
                <div key={key} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:12, color:'#666', marginBottom:4, fontWeight:600 }}>{label}</label>
                  <input type={type} value={newPrime[key]} onChange={e => setNewPrime(p=>({...p,[key]:e.target.value}))}
                    style={{ width:'100%', padding:'9px 12px', border:'1px solid #ddd', borderRadius:6, fontSize:14, boxSizing:'border-box' }} />
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button onClick={handleAdd} style={{ flex:1, padding:'11px', background:'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>✅ Ajouter</button>
                <button onClick={() => setShowAdd(false)} style={{ flex:1, padding:'11px', background:'#f0f0f0', border:'none', borderRadius:8, cursor:'pointer', fontWeight:700 }}>Anile</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
