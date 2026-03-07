import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import api from '../utils/api';
import { isLoggedIn } from '../utils/auth';

const TIRAGES = [
  { nom:'Georgia-Matin',  label:'GEORGIA',  periode:'Matin', emoji:'🍑', bg:'#e8f5e9', color:'#16a34a' },
  { nom:'Georgia-Soir',   label:'GEORGIA',  periode:'Soir',  emoji:'🍑', bg:'#e8f5e9', color:'#16a34a' },
  { nom:'Florida matin',  label:'FLORIDA',  periode:'Matin', emoji:'🌴', bg:'#e3f2fd', color:'#1a73e8' },
  { nom:'Florida soir',   label:'FLORIDA',  periode:'Soir',  emoji:'🌴', bg:'#e3f2fd', color:'#1a73e8' },
  { nom:'New-york matin', label:'NEW YORK', periode:'Matin', emoji:'🗽', bg:'#f3e5f5', color:'#7c3aed' },
  { nom:'New-york soir',  label:'NEW YORK', periode:'Soir',  emoji:'🗽', bg:'#f3e5f5', color:'#7c3aed' },
  { nom:'Ohio matin',     label:'OHIO',     periode:'Matin', emoji:'⭕', bg:'#fff3e0', color:'#ea580c' },
  { nom:'Ohio soir',      label:'OHIO',     periode:'Soir',  emoji:'⭕', bg:'#fff3e0', color:'#ea580c' },
  { nom:'Maryland midi',  label:'MARYLAND', periode:'Midi',  emoji:'🦀', bg:'#fce7f3', color:'#be185d' },
  { nom:'Maryland soir',  label:'MARYLAND', periode:'Soir',  emoji:'🦀', bg:'#fce7f3', color:'#be185d' },
];

const TABS = [
  { id:'resultats', label:'Rezilta Tiraj', icon:'🎱' },
  { id:'stats',     label:'Estatistik',    icon:'📊' },
  { id:'acces',     label:'Aksè Rapid',    icon:'⚡' },
];

export default function Dashboard() {
  const router = useRouter();
  const [activeTab,  setActiveTab]  = useState('resultats');
  const [resultats,  setResultats]  = useState({});
  const [stats,      setStats]      = useState({});
  const [loading,    setLoading]    = useState(true);
  const [fetching,   setFetching]   = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get('/api/admin/resultats').catch(() => ({ data: [] })),
        api.get('/api/admin/stats').catch(() => ({ data: {} })),
      ]);
      const data = Array.isArray(r1.data) ? r1.data : [];
      const latest = {};
      data.forEach(res => {
        if (!latest[res.tirage] || new Date(res.date) > new Date(latest[res.tirage].date))
          latest[res.tirage] = res;
      });
      setResultats(latest);
      setStats(r2.data || {});
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
  };

  const handleFetchOnline = async () => {
    setFetching(true);
    try { await api.get('/api/resultats/fetch'); await loadAll(); }
    catch { alert('Entrez manuellement.'); }
    finally { setFetching(false); }
  };

  return (
    <Layout>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* BANNIÈRE */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 20px', marginBottom:16, textAlign:'center', fontWeight:900, fontSize:15, color:'#000' }}>
          LA-PROBITE-BORLETTE
        </div>

        {/* 3 ONGLETS */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                flex:1, padding:'12px 6px', border:'none', borderRadius:10, cursor:'pointer',
                background: activeTab===t.id ? '#f59e0b' : 'white',
                color: activeTab===t.id ? '#000' : '#555',
                fontWeight:900, fontSize:12,
                boxShadow: activeTab===t.id ? '0 2px 8px rgba(245,158,11,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
              }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>

        {/* CONTENU */}
        <div style={{ background:'white', borderRadius:12, padding:18, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>

          {/* ── ONGLET RÉSULTATS ── */}
          {activeTab === 'resultats' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:15 }}>🎱 Dènye Rezilta Tiraj</div>
                  {lastUpdate && <div style={{ fontSize:11, color:'#888' }}>Mizajou: {lastUpdate.toLocaleTimeString('fr')}</div>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={handleFetchOnline} disabled={fetching}
                    style={{ background:fetching?'#ccc':'#16a34a', color:'white', border:'none', borderRadius:6, padding:'8px 14px', fontWeight:700, fontSize:12, cursor:fetching?'not-allowed':'pointer' }}>
                    {fetching ? '🔄 Ap chache...' : '🌐 Chèche Sou Entènèt'}
                  </button>
                  <button onClick={() => router.push('/surveillance/lots-gagnant')}
                    style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'8px 14px', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                    ✏️ Antre Manyèl
                  </button>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>⏳ Ap chaje...</div>
              ) : TIRAGES.map((t, i) => {
                const res = resultats[t.nom] || null;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom: i < TIRAGES.length-1 ? '1px solid #f0f0f0' : 'none' }}>
                    <div style={{ width:62, height:54, borderRadius:8, background:t.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:20 }}>{t.emoji}</span>
                      <span style={{ fontSize:7, fontWeight:900, color:t.color }}>{t.label}</span>
                      <span style={{ fontSize:7, color:t.color, opacity:0.7 }}>{t.periode}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:13 }}>{t.nom}</div>
                      <div style={{ fontSize:10, color:'#999' }}>{res ? new Date(res.date).toLocaleDateString('fr') : 'Pa gen rezilta'}</div>
                    </div>
                    <div style={{ display:'flex', gap:5 }}>
                      {[res?.lot1, res?.lot2, res?.lot3].map((lot, j) => (
                        <div key={j} style={{
                          width:42, height:42, borderRadius:'50%',
                          background: lot ? (j===0?'#16a34a':j===1?'#f59e0b':'#1a73e8') : '#eee',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color: lot?'white':'#bbb', fontWeight:900, fontSize:15,
                          boxShadow: lot ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                        }}>
                          {lot || '--'}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ONGLET STATISTIQUES ── */}
          {activeTab === 'stats' && (
            <div>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>📊 Estatistik Jeneral</div>
              {loading ? (
                <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>⏳ Ap chaje...</div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[
                    { label:'Total Ajan Aktif', val: stats.totalAgents||0,             icon:'👥', color:'#1a73e8', bg:'#dbeafe' },
                    { label:'Total Fichè',       val: stats.totalFiches||0,             icon:'🎫', color:'#16a34a', bg:'#dcfce7' },
                    { label:'Vant Total (G)',     val: stats.venteTotal||'0.00',         icon:'💰', color:'#f59e0b', bg:'#fef9c3' },
                    { label:'POS Konekte',        val: stats.posConnectes||0,            icon:'🟢', color:'#7c3aed', bg:'#f3e8ff' },
                    { label:'Komisyon (G)',        val: stats.commission||'0.00',        icon:'💼', color:'#0891b2', bg:'#cffafe' },
                    { label:'Fichè Jodi a',       val: stats.fichesAujourdhui||0,       icon:'📅', color:'#dc2626', bg:'#fee2e2' },
                  ].map(s => (
                    <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'16px 14px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ fontSize:28 }}>{s.icon}</div>
                      <div>
                        <div style={{ fontWeight:900, fontSize:20, color:s.color }}>{s.val}</div>
                        <div style={{ fontSize:11, color:'#555' }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ONGLET ACCÈS RAPIDE ── */}
          {activeTab === 'acces' && (
            <div>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>⚡ Aksè Rapid</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[
                  { label:'🏆 Lots Gagnant',   path:'/surveillance/lots-gagnant',  color:'#16a34a', bg:'#dcfce7' },
                  { label:'📊 Statistiques',   path:'/surveillance/statistiques',  color:'#f59e0b', bg:'#fef9c3' },
                  { label:'🟢 POS Connectés',  path:'/surveillance/pos-connectes', color:'#7c3aed', bg:'#f3e8ff' },
                  { label:'👥 Agents / POS',   path:'/agents',                     color:'#1a73e8', bg:'#dbeafe' },
                  { label:'💰 Paiement',        path:'/paiement',                  color:'#dc2626', bg:'#fee2e2' },
                  { label:'🎫 Fiches Vendu',   path:'/rapport/fiches-vendu',       color:'#0891b2', bg:'#cffafe' },
                  { label:'⚙️ Configurations', path:'/configurations/tirages',     color:'#374151', bg:'#f3f4f6' },
                  { label:'📈 Journalier',     path:'/rapport/journalier',         color:'#065f46', bg:'#d1fae5' },
                  { label:'🔒 Blocaj Boule',   path:'/surveillance/blocage-boule', color:'#92400e', bg:'#fef3c7' },
                ].map(b => (
                  <button key={b.path} onClick={() => router.push(b.path)}
                    style={{ background:b.bg, border:`2px solid ${b.color}44`, borderRadius:10, padding:'16px 8px', cursor:'pointer', fontWeight:800, fontSize:11, color:b.color, textAlign:'center', lineHeight:1.4 }}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
