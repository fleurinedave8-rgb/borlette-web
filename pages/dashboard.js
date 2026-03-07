import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useRouter } from 'next/router';
import { isLoggedIn } from '../utils/auth';

const TIRAGES = [
  { nom:'Georgia-Matin',  label:'GEORGIA',   periode:'Matin', emoji:'🍑', color:'#e8f5e9', dark:'#16a34a' },
  { nom:'Georgia-Soir',   label:'GEORGIA',   periode:'Soir',  emoji:'🍑', color:'#e8f5e9', dark:'#16a34a' },
  { nom:'Florida matin',  label:'FLORIDA',   periode:'Matin', emoji:'🌴', color:'#e3f2fd', dark:'#1a73e8' },
  { nom:'Florida soir',   label:'FLORIDA',   periode:'Soir',  emoji:'🌴', color:'#e3f2fd', dark:'#1a73e8' },
  { nom:'New-york matin', label:'NEW YORK',  periode:'Matin', emoji:'🗽', color:'#f3e5f5', dark:'#7c3aed' },
  { nom:'New-york soir',  label:'NEW YORK',  periode:'Soir',  emoji:'🗽', color:'#f3e5f5', dark:'#7c3aed' },
];

export default function Dashboard() {
  const router = useRouter();
  const [stats,     setStats]     = useState({ totalAgents:0, totalFiches:0, venteTotal:'0.00', commission:'0.00' });
  const [resultats, setResultats] = useState({});
  const [loading,   setLoading]   = useState(true);
  const [fetching,  setFetching]  = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/'); return; }
    loadAll();
    // Rafraîchir automatiquement toutes les 5 minutes
    const interval = setInterval(loadResultats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadResultats()]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const r = await api.get('/api/admin/stats');
      setStats(r.data || {});
    } catch {}
  };

  const loadResultats = async () => {
    try {
      // Charger les derniers résultats depuis la DB
      const r = await api.get('/api/admin/resultats');
      const data = Array.isArray(r.data) ? r.data : [];

      // Grouper par tirage — garder le plus récent
      const latest = {};
      data.forEach(res => {
        if (!latest[res.tirage] || new Date(res.date) > new Date(latest[res.tirage].date)) {
          latest[res.tirage] = res;
        }
      });
      setResultats(latest);
      setLastUpdate(new Date());
    } catch {}
  };

  // Fetch résultats depuis internet
  const handleFetchOnline = async () => {
    setFetching(true);
    try {
      const r = await api.get('/api/resultats/fetch');
      if (r.data?.results) {
        setResultats(r.data.results);
        setLastUpdate(new Date());
      }
      await loadResultats();
    } catch (err) {
      alert('Impossible de récupérer les résultats en ligne. Entrez-les manuellement.');
    } finally { setFetching(false); }
  };

  const getRes = (nom) => resultats[nom] || null;

  const fmtTime = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* BANNIERE */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'14px 20px', marginBottom:14, textAlign:'center' }}>
          <span style={{ fontWeight:900, fontSize:16, color:'#000', letterSpacing:1 }}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
          {[
            { label:'Agents',     value: stats.totalAgents||0,        icon:'👥', color:'#1a73e8' },
            { label:'Fiches',     value: stats.totalFiches||0,        icon:'🎫', color:'#16a34a' },
            { label:'Vente',      value:`${stats.venteTotal||'0.00'} G`, icon:'💰', color:'#f59e0b' },
            { label:'Commission', value:`${stats.commission||'0.00'} G`, icon:'💸', color:'#7c3aed' },
          ].map(s => (
            <div key={s.label} style={{ background:'white', borderRadius:8, padding:12, boxShadow:'0 1px 3px rgba(0,0,0,0.08)', borderTop:`3px solid ${s.color}` }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontWeight:900, fontSize:16, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#888', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* RÉSULTATS */}
        <div style={{ background:'white', borderRadius:8, padding:16, marginBottom:12, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>

          {/* HEADER */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:800, margin:0 }}>Dènye Rezilta Tiraj</h2>
              {lastUpdate && (
                <span style={{ fontSize:11, color:'#888' }}>
                  Dènye mizajou: {fmtTime(lastUpdate)}
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={handleFetchOnline} disabled={fetching}
                style={{ background: fetching ? '#ccc' : '#16a34a', color:'white', border:'none', borderRadius:5, padding:'7px 14px', fontSize:12, cursor: fetching ? 'default' : 'pointer', fontWeight:700 }}>
                {fetching ? '🔄 Ap chache...' : '🌐 Chèche Sou Entènèt'}
              </button>
              <button onClick={() => router.push('/surveillance/lots-gagnant')}
                style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:5, padding:'7px 14px', fontSize:12, cursor:'pointer', fontWeight:700 }}>
                ✏️ Antre Manyèl
              </button>
            </div>
          </div>

          {/* LISTE TIRAGES */}
          {loading ? (
            <div style={{ textAlign:'center', padding:30, color:'#888' }}>Chargement...</div>
          ) : (
            TIRAGES.map((tirage, i) => {
              const res = getRes(tirage.nom);
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom: i < TIRAGES.length-1 ? '1px solid #f0f0f0' : 'none' }}>

                  {/* LOGO */}
                  <div style={{ width:75, height:65, borderRadius:8, background:tirage.color, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${tirage.dark}22` }}>
                    <span style={{ fontSize:26 }}>{tirage.emoji}</span>
                    <span style={{ fontSize:8, fontWeight:900, color:tirage.dark, letterSpacing:0.5 }}>{tirage.label}</span>
                    <span style={{ fontSize:8, color:tirage.dark, opacity:0.7 }}>{tirage.periode}</span>
                  </div>

                  {/* NOM + DATE */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:13 }}>{tirage.nom}</div>
                    <div style={{ fontSize:11, color:'#888', marginTop:2 }}>
                      {res ? new Date(res.date).toLocaleDateString('fr') : 'Pa gen rezilta'}
                    </div>
                    {res?.source === 'auto' && (
                      <span style={{ fontSize:9, background:'#dcfce7', color:'#16a34a', borderRadius:10, padding:'1px 6px', fontWeight:700 }}>AUTO</span>
                    )}
                  </div>

                  {/* BOULES */}
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {res ? (
                      [res.lot1, res.lot2, res.lot3].map((lot, j) => (
                        <div key={j} style={{
                          width:44, height:44, borderRadius:'50%',
                          background: lot ? (j===0 ? '#16a34a' : j===1 ? '#f59e0b' : '#1a73e8') : '#f0f0f0',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color: lot ? 'white' : '#ccc',
                          fontWeight:900, fontSize:15,
                          boxShadow: lot ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                        }}>
                          {lot || '--'}
                        </div>
                      ))
                    ) : (
                      [1,2,3].map(j => (
                        <div key={j} style={{ width:44, height:44, borderRadius:'50%', background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', fontWeight:900, fontSize:13 }}>
                          --
                        </div>
                      ))
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* ACCÈS RAPIDE */}
        <div style={{ background:'white', borderRadius:8, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin:'0 0 12px', fontWeight:800, fontSize:15 }}>Aksè Rapid</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
            {[
              { label:'Fiches Vendu',  path:'/rapport/fiches-vendu',          icon:'🎫', color:'#1a73e8' },
              { label:'Lots Gagnant',  path:'/surveillance/lots-gagnant',     icon:'🏆', color:'#16a34a' },
              { label:'Statistiques',  path:'/surveillance/statistiques',     icon:'📊', color:'#f59e0b' },
              { label:'Agents',        path:'/configurations/utilisateurs',   icon:'👥', color:'#7c3aed' },
              { label:'Paiement',      path:'/paiement',                      icon:'💰', color:'#dc2626' },
              { label:'Tracabilité',   path:'/surveillance/tracabilite',      icon:'🔍', color:'#0891b2' },
            ].map(item => (
              <button key={item.path} onClick={() => router.push(item.path)}
                style={{ background:'#f8f9fa', border:`1px solid ${item.color}33`, borderRadius:8, padding:'12px 8px', cursor:'pointer', textAlign:'center' }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{item.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:item.color }}>{item.label}</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
