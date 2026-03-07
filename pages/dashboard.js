import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { isLoggedIn, getUser, clearAuth } from '../utils/auth';

const TIRAGES = [
  { nom:'Georgia-Matin',  label:'GEORGIA',  periode:'Matin', emoji:'🍑', bg:'#e8f5e9', color:'#16a34a' },
  { nom:'Georgia-Soir',   label:'GEORGIA',  periode:'Soir',  emoji:'🍑', bg:'#e8f5e9', color:'#16a34a' },
  { nom:'Florida matin',  label:'FLORIDA',  periode:'Matin', emoji:'🌴', bg:'#e3f2fd', color:'#1a73e8' },
  { nom:'Florida soir',   label:'FLORIDA',  periode:'Soir',  emoji:'🌴', bg:'#e3f2fd', color:'#1a73e8' },
  { nom:'New-york matin', label:'NEW YORK', periode:'Matin', emoji:'🗽', bg:'#f3e5f5', color:'#7c3aed' },
  { nom:'New-york soir',  label:'NEW YORK', periode:'Soir',  emoji:'🗽', bg:'#f3e5f5', color:'#7c3aed' },
];

const MENU_ITEMS = [
  { href:'/dashboard',   icon:'🏠', label:'Tableau de bord' },
  { href:'/mon-compte',  icon:'👤', label:'Mon compte' },
  { href:'/paiement',    icon:'💳', label:'Paiement' },
  { href:'/agents',      icon:'🖥️', label:'Agents / POS' },
  { href:'/succursal',   icon:'🏢', label:'Succursal' },
];

const SOUS_MENUS = [
  { icon:'⚙️', label:'Configurations', items:[
    { href:'/configurations/tirages',         label:'Tirages' },
    { href:'/configurations/primes',          label:'Primes' },
    { href:'/configurations/tete-fiche',      label:'Tête Fiche' },
    { href:'/configurations/mariage-gratuit', label:'Mariage Gratuit' },
    { href:'/configurations/utilisateurs',    label:'Utilisateurs' },
  ]},
  { icon:'👁️', label:'Surveillance', items:[
    { href:'/surveillance/lots-gagnant',         label:'Lots Gagnant' },
    { href:'/surveillance/statistiques',         label:'Statistiques' },
    { href:'/surveillance/pos-connectes',        label:'POS Connectés 🟢' },
    { href:'/surveillance/blocage-boule',        label:'Blocage Boule' },
    { href:'/surveillance/controle-agent',       label:'Contrôle Agent' },
    { href:'/surveillance/fiches-agent',         label:'Fiches par Agent' },
    { href:'/surveillance/tracabilite',          label:'Traçabilité' },
    { href:'/surveillance/demmande-elimination', label:'Demande Élimination' },
  ]},
  { icon:'📊', label:'Rapport', items:[
    { href:'/rapport/journalier',        label:'Journalier' },
    { href:'/rapport/fiches-vendu',      label:'Fiches Vendu' },
    { href:'/rapport/fiches-gagnant',    label:'Fiches Gagnant' },
    { href:'/rapport/fiches-elimine',    label:'Fiches Éliminé' },
    { href:'/rapport/ventes-fin-tirage', label:'Ventes Fin Tirage' },
    { href:'/rapport/ventes-matin-soir', label:'Ventes Matin/Soir' },
    { href:'/rapport/jeux-virtuel',      label:'Jeux Virtuel' },
  ]},
];

export default function Dashboard() {
  const router = useRouter();
  const user   = getUser();
  const [openSub,    setOpenSub]    = useState(null);
  const [stats,      setStats]      = useState({ totalAgents:0, totalFiches:0, venteTotal:'0.00', posConnectes:0 });
  const [resultats,  setResultats]  = useState({});
  const [loading,    setLoading]    = useState(true);
  const [fetching,   setFetching]   = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/'); return; }
    loadAll();
    const t = setInterval(loadResultats, 5*60*1000);
    return () => clearInterval(t);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadResultats()]);
    setLoading(false);
  };

  const loadStats = async () => {
    try { const r = await api.get('/api/admin/stats'); setStats(r.data||{}); } catch {}
  };

  const loadResultats = async () => {
    try {
      const r = await api.get('/api/admin/resultats');
      const data = Array.isArray(r.data) ? r.data : [];
      const latest = {};
      data.forEach(res => {
        if (!latest[res.tirage] || new Date(res.date) > new Date(latest[res.tirage].date))
          latest[res.tirage] = res;
      });
      setResultats(latest);
      setLastUpdate(new Date());
    } catch {}
  };

  const handleFetchOnline = async () => {
    setFetching(true);
    try { await api.get('/api/resultats/fetch'); await loadResultats(); }
    catch { alert('Entrez manuellement.'); }
    finally { setFetching(false); }
  };

  const go = (path) => router.push(path);

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f1f5f9', fontFamily:'system-ui,sans-serif' }}>

      {/* ══════════ SIDEBAR ══════════ */}
      <div style={{ width:215, background:'#1e293b', display:'flex', flexDirection:'column', height:'100vh', flexShrink:0, overflowY:'auto' }}>

        {/* logo */}
        <div style={{ background:'#f59e0b', padding:'12px 10px', textAlign:'center', flexShrink:0 }}>
          <div style={{ fontWeight:900, fontSize:12, color:'#000' }}>🎰 LA-PROBITE-BORLETTE</div>
          {user && <div style={{ fontSize:10, color:'#333', marginTop:2 }}>{user.prenom} {user.nom} — {user.role}</div>}
        </div>

        {/* items simples */}
        {MENU_ITEMS.map(m => (
          <div key={m.href} onClick={() => go(m.href)}
            style={{ padding:'9px 14px', cursor:'pointer', fontSize:12, fontWeight:700, color: router.pathname===m.href ? '#f59e0b' : '#cbd5e1', background: router.pathname===m.href ? 'rgba(245,158,11,0.15)' : 'transparent', display:'flex', alignItems:'center', gap:8 }}>
            {m.icon} {m.label}
          </div>
        ))}

        {/* sous-menus */}
        {SOUS_MENUS.map((sm, idx) => {
          const actif = sm.items.some(x => router.pathname === x.href);
          const ouvert = openSub === idx;
          return (
            <div key={idx}>
              <div onClick={() => setOpenSub(ouvert ? null : idx)}
                style={{ padding:'9px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', background: actif ? 'rgba(245,158,11,0.1)' : 'transparent' }}>
                <span style={{ fontSize:12, fontWeight:700, color: actif ? '#f59e0b' : '#cbd5e1' }}>{sm.icon} {sm.label}</span>
                <span style={{ fontSize:9, color:'#64748b' }}>{ouvert ? '▲' : '▼'}</span>
              </div>
              {ouvert && sm.items.map(s => (
                <div key={s.href} onClick={() => go(s.href)}
                  style={{ padding:'7px 14px 7px 28px', cursor:'pointer', fontSize:11, color: router.pathname===s.href ? '#f59e0b' : '#94a3b8', fontWeight: router.pathname===s.href ? 700 : 400, background: router.pathname===s.href ? 'rgba(245,158,11,0.08)' : 'rgba(0,0,0,0.15)' }}>
                  {s.label}
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ flex:1 }} />

        {/* logout */}
        <div style={{ padding:10, borderTop:'1px solid rgba(255,255,255,0.1)', flexShrink:0 }}>
          <button onClick={() => { clearAuth(); router.push('/'); }}
            style={{ width:'100%', padding:9, background:'#dc2626', color:'white', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* ══════════ CONTENU ══════════ */}
      <div style={{ flex:1, overflowY:'auto', padding:18 }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>

          {/* bannière */}
          <div style={{ background:'#f59e0b', borderRadius:8, padding:'10px 18px', marginBottom:14, textAlign:'center', fontWeight:900, fontSize:15, color:'#000' }}>
            LA-PROBITE-BORLETTE — Tableau de bord
          </div>

          {/* stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, marginBottom:14 }}>
            {[
              { label:'Agents',        val: stats.totalAgents||0,          icon:'👥', c:'#1a73e8' },
              { label:'Fiches',        val: stats.totalFiches||0,          icon:'🎫', c:'#16a34a' },
              { label:'Vente',         val:`${stats.venteTotal||0} G`,     icon:'💰', c:'#f59e0b' },
              { label:'POS Connectés', val: stats.posConnectes||0,         icon:'🟢', c:'#7c3aed' },
            ].map(s => (
              <div key={s.label} style={{ background:'white', borderRadius:8, padding:12, borderTop:`3px solid ${s.c}`, boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize:20 }}>{s.icon}</div>
                <div style={{ fontWeight:900, fontSize:18, color:s.c, marginTop:4 }}>{s.val}</div>
                <div style={{ fontSize:11, color:'#888' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* résultats tirages */}
          <div style={{ background:'white', borderRadius:8, padding:16, marginBottom:14, boxShadow:'0 1px 3px rgba(0,0,0,0.07)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:15 }}>Dènye Rezilta Tiraj</div>
                {lastUpdate && <div style={{ fontSize:11, color:'#888' }}>Mizajou: {lastUpdate.toLocaleTimeString('fr')}</div>}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleFetchOnline} disabled={fetching}
                  style={{ background: fetching?'#ccc':'#16a34a', color:'white', border:'none', borderRadius:6, padding:'8px 14px', fontWeight:700, fontSize:12, cursor: fetching?'not-allowed':'pointer' }}>
                  {fetching ? '🔄 Ap chache...' : '🌐 Chèche Sou Entènèt'}
                </button>
                <button onClick={() => go('/surveillance/lots-gagnant')}
                  style={{ background:'#1a73e8', color:'white', border:'none', borderRadius:6, padding:'8px 14px', fontWeight:700, fontSize:12, cursor:'pointer' }}>
                  ✏️ Antre Manyèl
                </button>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:30, color:'#aaa' }}>Chargement...</div>
            ) : TIRAGES.map((t, i) => {
              const res = resultats[t.nom] || null;
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i < TIRAGES.length-1 ? '1px solid #f0f0f0':'none' }}>
                  {/* icone état */}
                  <div style={{ width:64, height:54, borderRadius:8, background:t.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <span style={{ fontSize:20 }}>{t.emoji}</span>
                    <span style={{ fontSize:8, fontWeight:900, color:t.color }}>{t.label}</span>
                    <span style={{ fontSize:8, color:t.color, opacity:0.7 }}>{t.periode}</span>
                  </div>
                  {/* nom */}
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:13 }}>{t.nom}</div>
                    <div style={{ fontSize:11, color:'#999' }}>{res ? new Date(res.date).toLocaleDateString('fr') : 'Pa gen rezilta'}</div>
                  </div>
                  {/* boules */}
                  <div style={{ display:'flex', gap:6 }}>
                    {[res?.lot1, res?.lot2, res?.lot3].map((lot, j) => (
                      <div key={j} style={{
                        width:40, height:40, borderRadius:'50%',
                        background: lot ? (j===0?'#16a34a':j===1?'#f59e0b':'#1a73e8') : '#eee',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color: lot ? 'white' : '#bbb',
                        fontWeight:900, fontSize:14,
                      }}>
                        {lot || '--'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ══ ACCÈS RAPIDE — 3 GROS BOUTONS ══ */}
          <div style={{ background:'white', borderRadius:8, padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.07)', marginBottom:20 }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>⚡ Aksè Rapid</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              {[
                { label:'🏆 Lots Gagnant',  path:'/surveillance/lots-gagnant',  color:'#16a34a', bg:'#dcfce7' },
                { label:'📊 Statistiques',  path:'/surveillance/statistiques',  color:'#f59e0b', bg:'#fef9c3' },
                { label:'🟢 POS Connectés', path:'/surveillance/pos-connectes', color:'#7c3aed', bg:'#f3e8ff' },
                { label:'👥 Agents / POS',  path:'/agents',                      color:'#1a73e8', bg:'#dbeafe' },
                { label:'💰 Paiement',       path:'/paiement',                   color:'#dc2626', bg:'#fee2e2' },
                { label:'🎫 Fiches Vendu',  path:'/rapport/fiches-vendu',        color:'#0891b2', bg:'#cffafe' },
              ].map(btn => (
                <button key={btn.path} onClick={() => go(btn.path)}
                  style={{
                    background: btn.bg,
                    border: `2px solid ${btn.color}`,
                    borderRadius: 10,
                    padding: '18px 10px',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: 13,
                    color: btn.color,
                    width: '100%',
                    textAlign: 'center',
                    lineHeight: 1.4,
                  }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
