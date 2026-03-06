import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { getBoulesBloq, bloquerBoule, debloquerBoule } from '../../utils/api';

export default function BlocageBoule() {
  const [boules, setBoules] = useState([]);
  const [boule, setBoule]   = useState('');
  const [type, setType]     = useState('P0');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await getBoulesBloq(); setBoules(r.data || []); } catch {}
  };
  const handleBlock = async () => {
    if (!boule) return;
    setSaving(true);
    try { await bloquerBoule({ boule, type }); setBoule(''); load(); }
    catch {} finally { setSaving(false); }
  };
  const handleUnblock = async (id) => {
    try { await debloquerBoule(id); load(); } catch {}
  };

  return (
    <Layout>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <h1 style={{ fontSize:20, fontWeight:800, marginBottom:16 }}>Blocage Boule</h1>
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', marginBottom:16 }}>
          <div style={{ display:'flex', gap:10 }}>
            <input value={boule} onChange={e => setBoule(e.target.value)} placeholder="Nimewo boul (ex: 45)" style={{ flex:1, padding:'10px 14px', border:'1px solid #ddd', borderRadius:8, fontSize:14 }} />
            <select value={type} onChange={e => setType(e.target.value)} style={{ padding:'10px', border:'1px solid #ddd', borderRadius:8 }}>
              <option>P0</option><option>P1</option><option>P2</option><option>P3</option>
            </select>
            <button onClick={handleBlock} disabled={saving} style={{ background:'#dc2626', color:'white', border:'none', borderRadius:8, padding:'10px 18px', fontWeight:700, cursor:'pointer' }}>
              Bloke
            </button>
          </div>
        </div>
        <div style={{ background:'white', borderRadius:8, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          {boules.length === 0 ? <div style={{ padding:30, textAlign:'center', color:'#999' }}>Okenn boul bloke</div>
          : boules.map((b, i) => (
            <div key={b._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom: i < boules.length-1 ? '1px solid #f0f0f0' : 'none' }}>
              <span><strong>{b.boule}</strong> <span style={{ color:'#666', fontSize:12 }}>({b.type})</span></span>
              <button onClick={() => handleUnblock(b._id)} style={{ background:'#16a34a', color:'white', border:'none', borderRadius:20, padding:'4px 14px', fontSize:12, cursor:'pointer' }}>Debloke</button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
