import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { isLoggedIn, getUser, clearAuth } from '../utils/auth';

// ── TIRAGES ──────────────────────────────────────────────────
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

// ── 3 ONGLETS ─────────────────────────────────────────────────
const TABS = [
  { id:'resultats', label:'Rezilta', icon:'🎱' },
  { id:'compte',    label:'Kont mwen', icon:'👤' },
  { id:'acces',     label:'Raccourci', icon:'⚡' },
];

// ── MENU SIDEBAR ──────────────────────────────────────────────
const MENU = [
  { href:'/dashboard',  icon:'🏠', label:'Tableau de bord' },
  { href:'/mon-compte', icon:'👤', label:'Mon compte' },
  { href:'/paiement',   icon:'💳', label:'Paiement' },
  { href:'/agents',     icon:'🖥️', label:'Agents / POS' },
  { href:'/succursal',  icon:'🏢', label:'Succursal' },
  { href:'/doleances',  icon:'ℹ️', label:'DOLEANCES' },
  { href:'/tutoriel',   icon:'ℹ️', label:'TUTORIEL' },
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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSub,     setOpenSub]     = useState(null);
  const [activeTab,   setActiveTab]   = useState('resultats');
  const [resultats,   setResultats]   = useState({});
  const [stats,       setStats]       = useState({});
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(false);
  const [lastUpdate,  setLastUpdate]  = useState(null);

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

  const go = (path) => { setSidebarOpen(false); router.push(path); };

  // ── CONTENU ONGLET RÉSULTATS ──────────────────────────────
  const renderResultats = () => (
    <div>
      {/* Boutons Chercher / Manuel */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <button onClick={handleFetchOnline} disabled={fetching}
          style={{ flex:1, background:fetching?'#ccc':'#16a34a', color:'white', border:'none', borderRadius:8, padding:'10px 12px', fontWeight:700, fontSize:13, cursor:fetching?'not-allowed':'pointer' }}>
          {fetching ? '🔄 Ap chache...' : '🌐 Chèche Sou Entènèt'}
        </button>
        <button onClick={() => go('/surveillance/lots-gagnant')}
          style={{ flex:1, background:'#1a73e8', color:'white', border:'none', borderRadius:8, padding:'10px 12px', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          ✏️ Antre Manyèl
        </button>
      </div>

      {lastUpdate && (
        <div style={{ fontSize:11, color:'#888', marginBottom:12, textAlign:'right' }}>
          Mizajou: {lastUpdate.toLocaleTimeString('fr')}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'#aaa' }}>⏳ Ap chaje...</div>
      ) : TIRAGES.map((t, i) => {
        const res = resultats[t.nom] || null;
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom: i < TIRAGES.length-1 ? '1px solid #f0f0f0' : 'none' }}>
            {/* Logo */}
            <div style={{ width:60, height:52, borderRadius:8, background:t.bg, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${t.color}22` }}>
              <span style={{ fontSize:18 }}>{t.emoji}</span>
              <span style={{ fontSize:7, fontWeight:900, color:t.color }}>{t.label}</span>
              <span style={{ fontSize:7, color:t.color, opacity:0.7 }}>{t.periode}</span>
            </div>
            {/* Nom */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:13 }}>{t.nom}</div>
              <div style={{ fontSize:10, color:'#999' }}>{res ? new Date(res.date).toLocaleDateString('fr') : 'Pa gen rezilta'}</div>
            </div>
            {/* Boules */}
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              {[res?.lot1, res?.lot2, res?.lot3].map((lot, j) => (
                <div key={j} style={{
                  width:40, height:40, borderRadius:'50%',
                  background: lot ? (j===0?'#16a34a':j===1?'#f59e0b':'#1a73e8') : '#eee',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: lot?'white':'#bbb', fontWeight:900, fontSize:14,
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

  // ── CONTENU ONGLET MON COMPTE ─────────────────────────────
  const renderCompte = () => (
    <div>
      {/* Carte solde */}
      <div style={{ background:'linear-gradient(135deg,#1a73e8,#7c3aed)', borderRadius:12, padding:'20px 18px', marginBottom:16, color:'white' }}>
        <div style={{ fontSize:12, opacity:0.8, marginBottom:4 }}>Solde disponible</div>
        <div style={{ fontWeight:900, fontSize:28 }}>HTG {stats.commission || '0.00'}</div>
      </div>

      {/* Infos utilisateur */}
      <div style={{ background:'white', borderRadius:10, padding:'14px 16px', marginBottom:14, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontWeight:800, fontSize:14 }}>Informations</span>
          <span style={{ color:'#1a73e8', fontSize:12, fontWeight:700, cursor:'pointer' }} onClick={() => go('/mon-compte')}>Profil →</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:12 }}>
          {[
            { label:'Proprietaire', val:`${user?.prenom||''} ${user?.nom||''}`.trim() || 'Admin' },
            { label:'Nom',          val: user?.username || 'admin' },
            { label:'Rôle',         val: user?.role || 'admin' },
            { label:'Téléphone',    val: user?.telephone || '—' },
          ].map(f => (
            <div key={f.label}>
              <div style={{ color:'#999', fontSize:10 }}>{f.label}</div>
              <div style={{ fontWeight:700, color:'#222' }}>{f.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 boutons */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {[
          { label:'Paramètres',            path:'/configurations/tirages',      color:'#1a73e8', bg:'#dbeafe' },
          { label:'Factures disponible',   path:'/rapport/journalier',          color:'#16a34a', bg:'#dcfce7' },
          { label:'Historique transactions', path:'/rapport/fiches-vendu',      color:'#f59e0b', bg:'#fef9c3' },
          { label:'Log jeux virtuel',      path:'/rapport/jeux-virtuel',        color:'#dc2626', bg:'#fee2e2' },
        ].map(b => (
          <button key={b.path} onClick={() => go(b.path)}
            style={{ background:b.bg, border:`2px solid ${b.color}44`, borderRadius:10, padding:'14px 10px', cursor:'pointer', fontWeight:800, fontSize:12, color:b.color, textAlign:'center' }}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ── CONTENU ONGLET RACCOURCI ──────────────────────────────
  const renderAcces = () => (
    <div>
      <div style={{ fontWeight:800, fontSize:14, marginBottom:14, color:'#374151' }}>⚡ Raccourci — Aksè Rapid</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          { label:'🏆 Lots Gagnant',   path:'/surveillance/lots-gagnant',  color:'#16a34a', bg:'#dcfce7' },
          { label:'📊 Statistiques',   path:'/surveillance/statistiques',  color:'#f59e0b', bg:'#fef9c3' },
          { label:'🟢 POS Connectés',  path:'/surveillance/pos-connectes', color:'#7c3aed', bg:'#f3e8ff' },
          { label:'👥 Agents / POS',   path:'/agents',                     color:'#1a73e8', bg:'#dbeafe' },
          { label:'💰 Paiement',        path:'/paiement',                  color:'#dc2626', bg:'#fee2e2' },
          { label:'🎫 Fiches Vendu',   path:'/rapport/fiches-vendu',       color:'#0891b2', bg:'#cffafe' },
          { label:'⚙️ Config Tiraj',   path:'/configurations/tirages',     color:'#374151', bg:'#f3f4f6' },
          { label:'📈 Journalier',     path:'/rapport/journalier',         color:'#065f46', bg:'#d1fae5' },
          { label:'🔒 Blocaj Boule',   path:'/surveillance/blocage-boule', color:'#92400e', bg:'#fef3c7' },
        ].map(b => (
          <button key={b.path} onClick={() => go(b.path)}
            style={{ background:b.bg, border:`2px solid ${b.color}44`, borderRadius:10, padding:'16px 8px', cursor:'pointer', fontWeight:800, fontSize:11, color:b.color, textAlign:'center', lineHeight:1.3 }}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', fontFamily:'system-ui,sans-serif' }}>

      {/* ══ OVERLAY SIDEBAR ══ */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100 }} />
      )}

      {/* ══ SIDEBAR ══ */}
      <div style={{
        position:'fixed', top:0, left: sidebarOpen ? 0 : -260, width:240,
        height:'100vh', background:'#1e293b', zIndex:200,
        transition:'left 0.25s ease', display:'flex', flexDirection:'column', overflowY:'auto'
      }}>
        {/* Logo */}
        <div style={{ background:'#f59e0b', padding:'14px 12px', textAlign:'center' }}>
          <div style={{ fontWeight:900, fontSize:13, color:'#000' }}>🎰 LA-PROBITE-BORLETTE</div>
          {user && <div style={{ fontSize:10, color:'#333', marginTop:2 }}>{user.prenom} {user.nom} — {user.role}</div>}
        </div>

        {MENU.map(m => (
          <div key={m.href} onClick={() => go(m.href)}
            style={{ padding:'10px 14px', cursor:'pointer', fontSize:13, fontWeight:700,
              display:'flex', gap:8, alignItems:'center',
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
                style={{ padding:'10px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between',
                  background: actif?'rgba(245,158,11,0.1)':'transparent' }}>
                <span style={{ fontSize:13, fontWeight:700, color:actif?'#f59e0b':'#cbd5e1' }}>{sm.icon} {sm.label}</span>
                <span style={{ fontSize:10, color:'#64748b' }}>{ouvert?'▲':'▼'}</span>
              </div>
              {ouvert && sm.items.map(s => (
                <div key={s.href} onClick={() => go(s.href)}
                  style={{ padding:'8px 14px 8px 28px', cursor:'pointer', fontSize:12,
                    background:'rgba(0,0,0,0.2)',
                    color: router.pathname===s.href?'#f59e0b':'#94a3b8',
                    fontWeight: router.pathname===s.href?700:400 }}>
                  {s.label}
                </div>
              ))}
            </div>
          );
        })}

        <div style={{ flex:1 }} />
        <div style={{ padding:12, borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => { clearAuth(); router.push('/'); }}
            style={{ width:'100%', padding:10, background:'#dc2626', color:'white', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer' }}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* ══ TOPBAR ══ */}
      <div style={{ position:'sticky', top:0, zIndex:50, background:'white', borderBottom:'1px solid #e2e8f0',
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:52 }}>
        {/* Hamburger */}
        <button onClick={() => setSidebarOpen(true)}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#ef4444', padding:4 }}>
          ☰
        </button>
        {/* KREDI */}
        <span style={{ color:'#1a73e8', fontWeight:900, fontSize:14 }}>
          KREDI : {stats.balance || '0.00'}
        </span>
        {/* Raccourci + Power */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => setActiveTab('acces')}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#1a73e8', fontWeight:700, fontSize:13 }}>
            Raccourci
          </button>
          <button onClick={() => { clearAuth(); router.push('/'); }}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#374151' }}>
            ⏻
          </button>
        </div>
      </div>

      {/* ══ CONTENU PRINCIPAL ══ */}
      <div style={{ padding:'12px 14px', maxWidth:700, margin:'0 auto' }}>

        {/* Bannière jaune */}
        <div style={{ background:'#f59e0b', borderRadius:8, padding:'12px 16px', marginBottom:14, textAlign:'center', fontWeight:900, fontSize:14, color:'#000' }}>
          LA-PROBITE-BORLETTE — Tableau de bord
        </div>

        {/* ══ 3 ONGLETS ══ */}
        <div style={{ display:'flex', gap:6, marginBottom:16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                flex:1, padding:'11px 6px', border:'none', borderRadius:10, cursor:'pointer',
                background: activeTab===t.id ? '#f59e0b' : 'white',
                color: activeTab===t.id ? '#000' : '#555',
                fontWeight:900, fontSize:12,
                boxShadow: activeTab===t.id ? '0 2px 8px rgba(245,158,11,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
                transition:'all 0.15s',
              }}>
              <div style={{ fontSize:20, marginBottom:3 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ CONTENU ONGLET ACTIF ══ */}
        <div style={{ background:'white', borderRadius:12, padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          {activeTab === 'resultats' && renderResultats()}
          {activeTab === 'compte'    && renderCompte()}
          {activeTab === 'acces'     && renderAcces()}
        </div>

      </div>
    </div>
  );
}
