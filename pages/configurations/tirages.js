import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { getTirages, toggleTirage } from '../../utils/api';

export default function Tirages() {
  const [tirages, setTirages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await getTirages(); setTirages(r.data || []); }
    catch { } finally { setLoading(false); }
  };

  const toggle = async (t) => {
    try {
      await toggleTirage(t._id || t.id, { actif: !t.actif });
      load();
    } catch {}
  };

  return (
    <Layout>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Tirages</h1>
        <div style={{ background:'white', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          {loading ? <div style={{ padding:30, textAlign:'center', color:'#999' }}>Chargement...</div>
          : tirages.map((t, i) => (
            <div key={t._id||t.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom: i < tirages.length-1 ? '1px solid #f0f0f0' : 'none' }}>
              <span style={{ fontWeight:600 }}>{t.nom}</span>
              <button onClick={() => toggle(t)} style={{ background: t.actif ? '#16a34a' : '#dc2626', color:'white', border:'none', borderRadius:20, padding:'5px 18px', fontWeight:700, cursor:'pointer', fontSize:12 }}>
                {t.actif ? '✓ Aktif' : '✗ Inactif'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
