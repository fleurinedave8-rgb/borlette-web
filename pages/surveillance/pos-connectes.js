import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function PosConnectes() {
  const [posListe, setPosListe] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const load = async () => {
    try {
      const r = await api.get('/api/admin/pos-connectes');
      const data = r.data?.pos || r.data || [];
      // Ajoute flag connecte selon lastSeen (5 min)
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const liste = Array.isArray(data) ? data.map(p => ({
        ...p,
        connecte: p.lastSeen && new Date(p.lastSeen).getTime() > fiveMinAgo,
      })) : [];
      setPosListe(liste);
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Rafraîchir toutes les 30 secondes
    intervalRef.current = setInterval(load, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const connectes  = posListe.filter(p => p.connecte);
  const deconnectes = posListe.filter(p => !p.connecte);

  const fmtTime = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    const now = new Date();
    const diff = Math.floor((now - dt) / 1000);
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}min ago`;
    return dt.toLocaleTimeString('fr');
  };

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>

        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:16, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:15 }}>LA-PROBITE-BORLETTE — POS Connectés</span>
        </div>

        {/* STATS HAUT */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
          {[
            { label:'Total POS', val: posListe.length, icon:'🖥️', color:'#1a73e8', bg:'#dbeafe' },
            { label:'Connectés 🟢', val: connectes.length, icon:'🟢', color:'#16a34a', bg:'#dcfce7' },
            { label:'Déconnectés 🔴', val: deconnectes.length, icon:'🔴', color:'#dc2626', bg:'#fee2e2' },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'16px 14px', textAlign:'center' }}>
              <div style={{ fontSize:28 }}>{s.icon}</div>
              <div style={{ fontWeight:900, fontSize:26, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:12, color:'#555', fontWeight:700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* REFRESH INFO */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <div style={{ fontSize:12, color:'#888' }}>
            🔄 Rafraîchissement automatik chak 30 sekond
            {lastUpdate && ` — Dènye: ${lastUpdate.toLocaleTimeString('fr')}`}
          </div>
          <button onClick={load}
            style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'7px 16px', fontWeight:700, fontSize:12, cursor:'pointer' }}>
            🔄 Rafraîchi Kounye a
          </button>
        </div>

        {/* TABLE POS */}
        <div style={{ background:'white', borderRadius:10, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#888' }}>⏳ Ap chaje...</div>
          ) : posListe.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'#888' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🖥️</div>
              <div>Pa gen okenn POS anregistre</div>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #dee2e6' }}>
                  {['Statut','Nom POS','Device ID','Dènye Koneksyon','IP / Zone','Fichè Jodi a','Version'].map(h => (
                    <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontWeight:800, fontSize:12, color:'#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posListe.map((p, i) => (
                  <tr key={p._id||i} style={{ borderBottom:'1px solid #f0f0f0', background: i%2===0?'white':'#fafafa' }}>
                    <td style={{ padding:'12px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%', background: p.connecte?'#16a34a':'#dc2626', boxShadow: p.connecte?'0 0 6px #16a34a':'none' }} />
                        <span style={{ fontWeight:700, fontSize:12, color: p.connecte?'#16a34a':'#dc2626' }}>
                          {p.connecte ? 'Konekte' : 'Dekonekte'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 14px', fontWeight:800 }}>{p.nom || '—'}</td>
                    <td style={{ padding:'12px 14px', fontFamily:'monospace', fontSize:11, color:'#1a73e8' }}>{p.posId || '—'}</td>
                    <td style={{ padding:'12px 14px', fontSize:12, color:'#555' }}>{fmtTime(p.lastSeen)}</td>
                    <td style={{ padding:'12px 14px', fontSize:12 }}>{p.ip || p.adresse || '—'}</td>
                    <td style={{ padding:'12px 14px', textAlign:'center' }}>
                      <span style={{ background:'#eff6ff', color:'#1a73e8', borderRadius:20, padding:'3px 10px', fontWeight:700, fontSize:12 }}>
                        {p.fichesAujourdhui || 0}
                      </span>
                    </td>
                    <td style={{ padding:'12px 14px', fontSize:11, color:'#888' }}>{p.version || 'v1.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
      </div>
    </Layout>
  );
}
