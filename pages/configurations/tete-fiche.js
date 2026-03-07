import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function TeteFiche() {
  const [form, setForm] = useState({ ligne1:'LA-PROBITE-BORLETTE', ligne2:'Sistèm Jesyon Loto', ligne3:'', ligne4:'', actif:true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/api/admin/tete-fiche').then(r => { if(r.data) setForm(r.data); }).catch(()=>{});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/admin/tete-fiche', form);
      setMsg('✅ Tête fiche sauvegardée!');
      setTimeout(() => setMsg(''), 3000);
    } catch { alert('Erè'); }
    finally { setSaving(false); }
  };

  return (
    <Layout>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — Tête Fiche</span>
        </div>
        {msg && <div style={{ background:'#dcfce7', border:'1px solid #16a34a', borderRadius:8, padding:12, marginBottom:12, color:'#16a34a', fontWeight:700 }}>{msg}</div>}

        <div style={{ background:'white', borderRadius:8, padding:24, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin:'0 0 20px', fontWeight:800 }}>🧾 Personnaliser la Tête de Fiche</h3>
          <p style={{ color:'#888', fontSize:13, marginBottom:20 }}>Ces lignes apparaîtront en haut de chaque ticket imprimé.</p>

          {['ligne1','ligne2','ligne3','ligne4'].map((key, i) => (
            <div key={key} style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontWeight:700, fontSize:13, marginBottom:6 }}>Ligne {i+1} {i===0?'*':''}</label>
              <input value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))}
                placeholder={i===0?'Nom du système':i===1?'Sous-titre':'Ligne optionnelle'}
                style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #ddd', borderRadius:6, fontSize:14, boxSizing:'border-box' }} />
            </div>
          ))}

          {/* PRÉVISUALISATION TICKET */}
          <div style={{ background:'#000', color:'white', borderRadius:8, padding:20, marginTop:20, fontFamily:'monospace', textAlign:'center' }}>
            <p style={{ margin:'2px 0', fontWeight:900, fontSize:14 }}>{'================================'}</p>
            {[form.ligne1, form.ligne2, form.ligne3, form.ligne4].filter(Boolean).map((l, i) => (
              <p key={i} style={{ margin:'2px 0', fontWeight:700, fontSize:13 }}>{l}</p>
            ))}
            <p style={{ margin:'2px 0', fontSize:12 }}>{'================================'}</p>
            <p style={{ margin:'4px 0', fontSize:12 }}>Ticket: 20260307-ABCD</p>
            <p style={{ margin:'2px 0', fontSize:12 }}>Tirage: Florida matin</p>
            <p style={{ margin:'4px 0', fontSize:12 }}>{'--------------------------------'}</p>
            <p style={{ margin:'2px 0', fontSize:12 }}>03   Borlette   100G</p>
            <p style={{ margin:'2px 0', fontSize:12 }}>45   Borlette   200G</p>
            <p style={{ margin:'4px 0', fontSize:12 }}>{'--------------------------------'}</p>
            <p style={{ margin:'2px 0', fontWeight:900, fontSize:14 }}>TOTAL: 300 HTG</p>
            <p style={{ margin:'2px 0', fontSize:11 }}>Mèsi! Bòn chans!</p>
            <p style={{ margin:'2px 0', fontWeight:900, fontSize:14 }}>{'================================'}</p>
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width:'100%', marginTop:20, padding:14, background:saving?'#ccc':'#16a34a', color:'white', border:'none', borderRadius:8, fontWeight:900, fontSize:15, cursor:saving?'default':'pointer' }}>
            {saving ? 'Ap sove...' : '✅ Sove Tête Fiche'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
