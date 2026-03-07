import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { isLoggedIn, getUser, clearAuth } from '../utils/auth';

// ── 3 SECTIONS PRENSIPAL ──────────────────────────────────────
const SECTIONS = [
  {
    id: 'resultats',
    icon: '🎱',
    label: 'Rezilta Tiraj',
    desc: 'Wè dènye rezilta ak boule yo',
    color: '#16a34a',
    bg: '#dcfce7',
  },
  {
    id: 'stats',
    icon: '📊',
    label: 'Statistik',
    desc: 'Vant, fichè, ajan, komisyon',
    color: '#1a73e8',
    bg: '#dbeafe',
  },
  {
    id: 'acces',
    icon: '⚡',
    label: 'Aksè Rapid',
    desc: 'Ale nan nenpòt paj rapid',
    color: '#f59e0b',
    bg: '#fef9c3',
  },
];

const TIRAGES = [
  { nom:'Georgia-Matin',  label:'GEORGIA',  periode:'Matin', emoji:'🍑', bg:'#e8f5e9', color:'#16a34a' },
  { nom:'Georgia-Soir',   label:'GEORGIA',  periode:'Soir',  emoji:'🍑', bg:'#e8f5e9', color:'#16a34a' },
  { nom:'Florida matin',  label:'FLORIDA',  periode:'Matin', emoji:'🌴', bg:'#e3f2fd', color:'#1a73e8' },
  { nom:'Florida soir',   label:'FLORIDA',  periode:'Soir',  emoji:'🌴', bg:'#e3f2fd', color:'#1a73e8' },
  { nom:'New-york matin', label:'NEW YORK', periode:'Matin', emoji:'🗽', bg:'#f3e5f5', color:'#7c3aed' },
  { nom:'New-york soir',  label:'NEW YORK', periode:'Soir',  emoji:'🗽', bg:'#f3e5f5', color:'#7c3aed' },
];

const MENU_ITEMS = [
  { href:'/dashboard',  icon:'🏠', label:'Tableau de bord' },
  { href:'/mon-compte', icon:'👤', label:'Mon compte' },
  { href:'/paiement',   icon:'💳', label:'Paiement' },
  { href:'/agents',     icon:'🖥️', label:'Agents / POS' },
  { href:'/succursal',  icon:'🏢', label:'Succursal' },
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
  const [activeTab,  setActiveTab]  = useState(null); // null = montre 3 bouton yo
  const [stats,      setStats]      = useState({ totalAgents:0, totalFiches:0, venteTotal:'0.00', posConnectes:0 });
  const [resultats,  setResultats]  = useState({});
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/'); return; }
  }, []);

  // Chaje done lè ou klike sou yon seksyon
  const openSection = async (id) => {
    setActiveTab(id);
    if (id === 'resultats') {
      setLoading(true);
      await loadResultats();
      setLoading(false);
    }
    if (id === 'stats') {
      setLoading(true);
      await loadStats();
      setLoading(false);
    }
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

  // ── RENDU KONTNI SEKSYON ──────────────────────────────────
  const renderContent = () => {
    if (!activeTab) return null;

    if (activeTab === 'resultats') return (
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15 }}>🎱 Dènye Rezilta Tiraj</div>
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
          <div style={{ textAlign:'center', padding:40, color:'#aaa', fontSize:14 }}>⏳ Ap chaje...</div>
        ) : TIRAGES.map((t, i) => {
          const res = resultats[t.nom] || null;
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom: i < TIRAGES.length-1 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ width:64, height:54, borderRadius:8, background:t.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:20 }}>{t.emoji}</span>
                <span style={{ fontSize:8, fontWeight:900, color:t.color }}>{t.label}</span>
                <span style={{ fontSize:8, color:t.color, opacity:0.7 }}>{t.periode}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:13 }}>{t.nom}</div>
                <div style={{ fontSize:11, color:'#999' }}>{res ? new Date(res.date).toLocaleDateString('fr') : 'Pa gen rezilta'}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {[res?.lot1, res?.lot2, res?.lot3].map((lot, j) => (
                  <div key={j} style={{
                    width:42, height:42, borderRadius:'50%',
                    background: lot ? (j===0?'#16a34a':j===1?'#f59e0b':'#1a73e8') : '#eee',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: lot ? 'white' : '#bbb', fontWeight:900, fontSize:15,
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
    );

    if (activeTab === 'stats') return (
      <div>
        <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>📊 Estatistik Jeneral</div>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>⏳ Ap chaje...</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { label:'Total Ajan Aktif',  val: stats.totalAgents||0,         icon:'👥', color:'#1a73e8', bg:'#dbeafe' },
              { label:'Total Fichè',       val: stats.totalFiches||0,         icon:'🎫', color:'#16a34a', bg:'#dcfce7' },
              { label:'Vant Total (G)',     val: stats.venteTotal||'0.00',     icon:'💰', color:'#f59e0b', bg:'#fef9c3' },
              { label:'POS Konekte',       val: stats.posConnectes||0,        icon:'🟢', color:'#7c3aed', bg:'#f3e8ff' },
              { label:'Komisyon (G)',       val: stats.commission||'0.00',     icon:'💼', color:'#0891b2', bg:'#cffafe' },
              { label:'Fichè Jodi a',      val: stats.fichesAujourdhui||0,   icon:'📅', color:'#dc2626', bg:'#fee2e2' },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'18px 16px', display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ fontSize:32 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight:900, fontSize:22, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:12, color:'#555', fontWeight:600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );

    if (activeTab === 'acces') return (
      <div>
        <div style={{ fontWeight:800, fontSize:15, marginBottom:14 }}>⚡ Aksè Rapid</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          {[
            { label:'🏆 Lots Gagnant',  path:'/surveillance/lots-gagnant',  color:'#16a34a', bg:'#dcfce7' },
            { label:'📊 Statistiques',  path:'/surveillance/statistiques',  color:'#f59e0b', bg:'#fef9c3' },
            { label:'🟢 POS Connectés', path:'/surveillance/pos-connectes', color:'#7c3aed', bg:'#f3e8ff' },
            { label:'👥 Agents / POS',  path:'/agents',                      color:'#1a73e8', bg:'#dbeafe' },
            { label:'💰 Paiement',       path:'/paiement',                   color:'#dc2626', bg:'#fee2e2' },
            { label:'🎫 Fiches Vendu',  path:'/rapport/fiches-vendu',        color:'#0891b2', bg:'#cffafe' },
            { label:'⚙️ Configurations',path:'/configurations/tirages',      color:'#374151', bg:'#f3f4f6' },
            { label:'📈 Journalier',    path:'/rapport/journalier',          color:'#065f46', bg:'#d1fae5' },
            { label:'🔒 Blocage Boule', path:'/surveillance/blocage-boule',  color:'#92400e', bg:'#fef3c7' },
          ].map(btn => (
            <button key={btn.path} onClick={() => go(btn.path)}
              style={{ background:btn.bg, border:`2px solid ${btn.color}55`, borderRadius:10, padding:'18px 10px', cursor:'pointer', fontWeight:800, fontSize:13, color:btn.color, width:'100%', textAlign:'center' }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f1f5f9', fontFamily:'system-ui,sans-serif' }}>

      {/* ══ SIDEBAR ══ */}
      <div style={{ width:215, background:'#1e293b', display:'flex', flexDirection:'column', height:'100vh', flexShrink:0, overflowY:'auto' }}>
        <div style={{ background:'#f59e0b', padding:'12px 10px', textAlign:'center' }}>
          <div style={{ fontWeight:900, fontSize:12, color:'#000' }}>🎰 LA-PROBITE-BORLETTE</div>
          {user && <div style={{ fontSize:10, color:'#333', marginTop:2 }}>{user.prenom} {user.nom} — {user.role}</div>}
        </div>

        {MENU_ITEMS.map(m => (
          <div key={m.href} onClick={() => go(m.href)}
            style={{ padding:'9px 14px', cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', gap:8, alignItems:'center',
              color: router.pathname===m.href?'#f59e0b':'#cbd5e1',
              background: router.pathname===m.href?'rgba(245,158,11,0.15)':'transparent' }}>
            {m.icon} {m.label}
          </div>
        ))}

        {SOUS_MENUS.map((sm, idx) => {
          const actif = sm.items.some(x => router.pathname===x.href);
          const ouvert = openSub===idx;
          return (
            <div key={idx}>
              <div onClick={() => setOpenSub(ouvert?null:idx)}
                style={{ padding:'9px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', background: actif?'rgba(245,158,11,0.1)':'transparent' }}>
                <span style={{ fontSize:12, fontWeight:700, color: actif?'#f59e0b':'#cbd5e1' }}>{sm.icon} {sm.label}</span>
                <span style={{ fontSize:9, color:'#64748b' }}>{ouvert?'▲':'▼'}</span>
              </div>
              {ouvert && sm.items.map(s => (
                <div key={s.href} onClick={() => go(s.href)}
                  style={{ padding:'7px 14px 7px 28px', cursor:'pointer', fontSize:11, background:'rgba(0,0,0,0.2)',
                    color: router.pathname===s.href?'#f59e0b':'#94a3b8', fontWeight: router.pathname===s.href?700:400 }}>
                  {s.label}
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ flex:1 }} />
        <div style={{ padding:10, borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => { clearAuth(); router.push('/'); }}
            style={{ width:'100%', padding:9, background:'#dc2626', color:'white', border:'none', borderRadius:6, fontWeight:700, fontSize:12, cursor:'pointer' }}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* ══ CONTENU ══ */}
      <div style={{ flex:1, overflowY:'auto', padding:18 }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>

          {/* BANNIERE */}
          <div style={{ background:'#f59e0b', borderRadius:8, padding:'10px 18px', marginBottom:18, textAlign:'center', fontWeight:900, fontSize:15, color:'#000' }}>
            LA-PROBITE-BORLETTE — Tableau de bord
          </div>

          {/* ══ 3 GROS BOUTON YO (paj prensipal) ══ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom: activeTab ? 16 : 0 }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => openSection(s.id)}
                style={{
                  background: activeTab===s.id ? s.color : s.bg,
                  border: `3px solid ${s.color}`,
                  borderRadius: 14,
                  padding: '28px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                  boxShadow: activeTab===s.id ? `0 4px 16px ${s.color}55` : '0 2px 6px rgba(0,0,0,0.07)',
                }}>
                <div style={{ fontSize:42, marginBottom:10 }}>{s.icon}</div>
                <div style={{ fontWeight:900, fontSize:16, color: activeTab===s.id?'white':s.color }}>{s.label}</div>
                <div style={{ fontSize:12, color: activeTab===s.id?'rgba(255,255,255,0.85)':'#666', marginTop:5 }}>{s.desc}</div>
              </button>
            ))}
          </div>

          {/* KONTNI SEKSYON */}
          {activeTab && (
            <div style={{ background:'white', borderRadius:10, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
              {/* bouton retou */}
              <button onClick={() => setActiveTab(null)}
                style={{ background:'#f1f5f9', border:'1px solid #ddd', borderRadius:6, padding:'6px 14px', fontSize:12, cursor:'pointer', fontWeight:700, marginBottom:16, color:'#374151' }}>
                ← Retounen
              </button>
              {renderContent()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
