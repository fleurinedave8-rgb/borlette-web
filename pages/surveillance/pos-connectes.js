import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function PosConnectes() {
  const [data, setData]       = useState({ count:0, pos:[] });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh 30s
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/pos-connectes');
      setData(r.data || { count:0, pos:[] });
      setLastUpdate(new Date());
    } catch {} finally { setLoading(false); }
  };

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — POS Connectés</span>
        </div>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
          <div style={{ background:'#16a34a', borderRadius:8, padding:16, textAlign:'center', color:'white' }}>
            <div style={{ fontSize:36, fontWeight:900 }}>{data.count}</div>
            <div style={{ fontSize:13, fontWeight:700 }}>🟢 POS Connectés</div>
          </div>
          <div style={{ background:'white', borderRadius:8, padding:16, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize:36, fontWeight:900, color:'#1a73e8' }}>{Array.isArray(data.pos) ? data.pos.length : 0}</div>
            <div style={{ fontSize:13, color:'#888' }}>Total POS actifs</div>
          </div>
          <div style={{ background:'white', borderRadius:8, padding:16, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#888', marginTop:10 }}>
              {lastUpdate ? `Dènye: ${lastUpdate.toLocaleTimeString('fr')}` : '...'}
            </div>
            <button onClick={load} style={{ marginTop:8, background:'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontWeight:700, fontSize:12 }}>
              🔄 Rafraîchir
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background:'white', borderRadius:8, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin:'0 0 14px', fontWeight:800 }}>🖥️ Liste des POS Connectés</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8f9fa' }}>
                  {['POS ID','Nom','Adresse','Dernière activité','Statut'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:700, borderBottom:'2px solid #dee2e6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding:20, textAlign:'center', color:'#888' }}>Chargement...</td></tr>
                ) : !data.pos?.length ? (
                  <tr><td colSpan={5} style={{ padding:20, textAlign:'center', color:'#888', fontStyle:'italic' }}>Okenn POS konekte kounye a</td></tr>
                ) : data.pos.map((p, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #dee2e6', background:i%2===0?'white':'#f8f9fa' }}>
                    <td style={{ padding:'10px 12px', fontFamily:'monospace', color:'#1a73e8', fontWeight:700, fontSize:11 }}>{p.posId}</td>
                    <td style={{ padding:'10px 12px', fontWeight:700 }}>{p.nom}</td>
                    <td style={{ padding:'10px 12px', color:'#888' }}>{p.adresse||'-'}</td>
                    <td style={{ padding:'10px 12px', color:'#888', fontSize:12 }}>
                      {p.lastSeen ? new Date(p.lastSeen).toLocaleTimeString('fr') : '-'}
                    </td>
                    <td style={{ padding:'10px 12px' }}>
                      <span style={{ background:'#dcfce7', color:'#16a34a', borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:11 }}>
                        🟢 En ligne
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color:'#888', fontSize:11, marginTop:10 }}>⏱ Rafraîchissement automatique toutes les 30 secondes</p>
        </div>
      </div>
    </Layout>
  );
}
