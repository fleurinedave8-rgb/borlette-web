import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUser, clearAuth } from '../utils/auth';

const SW = 256;

const NAV = [
  { href:'/dashboard',  icon:'🏠', label:'Tableau de bord' },
  { href:'/mon-compte', icon:'🏛', label:'Mon compte' },
  { href:'/paiement',   icon:'💳', label:'Paiement online' },
  { href:'/succursal',  icon:'🏛', label:'Succursal' },
  { href:'/agents',     icon:'👤', label:'Agents / POS' },
  { label:'Configurations', icon:'⚙️', sub:[
    { href:'/configurations/mariage-gratuit', label:'Mariage gratuit' },
    { href:'/configurations/tirages',         label:'Tirages' },
    { href:'/configurations/primes',          label:'Primes' },
    { href:'/configurations/tete-fiche',      label:'Tête Fiche' },
    { href:'/configurations/utilisateurs',    label:'Utilisateurs' },
  ]},
  { label:'Surveillance', icon:'🖥', sub:[
    { href:'/surveillance/statistiques',         label:'Statistiques' },
    { href:'/surveillance/blocage-boule',        label:'Blocage boule' },
    { href:'/surveillance/limites',              label:'Limites' },
    { href:'/surveillance/controle-agent',       label:'Controle agent' },
    { href:'/surveillance/fiches-agent',         label:'Fiches par agent' },
    { href:'/surveillance/lots-gagnant',         label:'Lots gagnant' },
    { href:'/surveillance/pos-connectes',        label:'POS Connectés' },
    { href:'/surveillance/scraper-status',       label:'Scraper Tiraj' },
    { href:'/surveillance/tracabilite',          label:'Traçabilité' },
    { href:'/surveillance/demmande-elimination', label:'Demande élimination' },
  ]},
  { label:'Rapport', icon:'📋', sub:[
    { href:'/rapport/journalier',        label:'Journalier' },
    { href:'/rapport/ventes-fin-tirage', label:'Ventes fin tirage' },
    { href:'/rapport/ventes-matin-soir', label:'Ventes matin/soir' },
    { href:'/rapport/fiches-vendu',      label:'Fiches vendu' },
    { href:'/rapport/fiches-gagnant',    label:'Fiches gagnant' },
    { href:'/rapport/fiches-elimine',    label:'Fiches éliminé' },
  ]},
  { href:'/doleances', icon:'🗣️', label:'Doléances' },
  { href:'/tutoriel',  icon:'ℹ️', label:'Tutoriel' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [ready,     setReady]     = useState(false);
  const [mobile,    setMobile]    = useState(false);
  const [sideOpen,  setSideOpen]  = useState(true);
  const [openMenus, setOpenMenus] = useState({});
  const [user,      setUser]      = useState(null);

  useEffect(() => {
    const isMob = window.innerWidth < 768;
    setMobile(isMob);
    setSideOpen(!isMob);
    setUser(getUser());

    // Ouvri sous-menu paj aktif la
    const m = {};
    NAV.forEach(item => {
      if (item.sub?.some(s => router.pathname.startsWith(s.href)))
        m[item.label] = true;
    });
    setOpenMenus(m);
    setReady(true);

    const onResize = () => {
      const now = window.innerWidth < 768;
      setMobile(now);
      if (now) setSideOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const logout      = () => { clearAuth(); router.push('/'); };
  const toggle      = (label) => setOpenMenus(p => ({ ...p, [label]: !p[label] }));
  const closeMobile = () => { if (mobile) setSideOpen(false); };

  if (!ready) return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      <div style={{ height:52, background:'white', boxShadow:'0 1px 4px rgba(0,0,0,.1)' }} />
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );

  const sideVisible = sideOpen;

  return (
    // Grid root — tout la paj nan yon sèl grid
    <div style={{
      display: 'grid',
      gridTemplateColumns: !mobile && sideVisible ? `${SW}px 1fr` : '1fr',
      gridTemplateRows: '52px 1fr',
      minHeight: '100vh',
      background: '#f0f2f5',
    }}>

      {/* ── Overlay mobile ── */}
      {mobile && sideVisible && (
        <div onClick={() => setSideOpen(false)} style={{
          position:'fixed', inset:0,
          background:'rgba(0,0,0,.55)',
          zIndex:1100,
        }} />
      )}

      {/* ════ SIDEBAR ════ */}
      <nav style={{
        gridRow: '1 / 3',
        gridColumn: '1',
        background: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        // Mobile: position fixed + slide
        ...(mobile ? {
          position: 'fixed',
          top: 0, left: 0,
          width: SW,
          height: '100vh',
          zIndex: 1200,
          transform: sideVisible ? 'translateX(0)' : `translateX(-${SW}px)`,
          transition: 'transform .25s ease',
        } : {
          // Desktop: dans le grid, disparait si fermé
          display: sideVisible ? 'flex' : 'none',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }),
      }}>

        {/* Logo */}
        <div style={{ padding:'16px 14px 12px', textAlign:'center', borderBottom:'1px solid #2a2a2a', flexShrink:0 }}>
          <div style={{
            width:50, height:50, borderRadius:'50%',
            background:'white', margin:'0 auto 8px',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, border:'2px solid #f59e0b',
          }}>🔑</div>
          <div style={{ color:'white', fontWeight:800, fontSize:11, letterSpacing:.5 }}>
            LA-PROBITE-BORLETTE
          </div>
          {user && (
            <div style={{ color:'#f59e0b', fontSize:11, marginTop:2 }}>
              {user.prenom} {user.nom}
            </div>
          )}
        </div>

        {/* Items nav */}
        <div style={{ flex:1, paddingBottom:12 }}>
          {NAV.map((item, i) => {

            if (item.sub) {
              const isOpen   = !!openMenus[item.label];
              const isActive = item.sub.some(s => router.pathname === s.href);
              return (
                <div key={i}>
                  <div onClick={() => toggle(item.label)} style={{
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px', cursor:'pointer',
                    color: isActive ? '#fff' : '#ccc',
                    background: isActive ? '#2a2a2a' : 'transparent',
                    userSelect:'none',
                  }}>
                    <span style={{ display:'flex', alignItems:'center', gap:9 }}>
                      <span style={{ color:'#f59e0b', width:18, textAlign:'center', fontSize:15 }}>{item.icon}</span>
                      <span style={{ fontSize:13 }}>{item.label}</span>
                    </span>
                    <span style={{ color:'#f59e0b', fontSize:11 }}>{isOpen ? '▾' : '▸'}</span>
                  </div>

                  {isOpen && item.sub.map((sub, j) => {
                    const act = router.pathname === sub.href;
                    return (
                      <Link key={j} href={sub.href} onClick={closeMobile} style={{
                        display:'flex', alignItems:'center', gap:8,
                        padding:'9px 14px 9px 40px',
                        color: act ? '#fff' : '#bbb',
                        background: act ? '#2e2e2e' : '#181818',
                        textDecoration:'none',
                        borderLeft: act ? '3px solid #f59e0b' : '3px solid transparent',
                        fontSize:13,
                      }}>
                        <span style={{ color:'#f59e0b', fontSize:9 }}>▶</span>
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const act = router.pathname === item.href;
            return (
              <Link key={i} href={item.href} onClick={closeMobile} style={{
                display:'flex', alignItems:'center', gap:9,
                padding:'10px 14px',
                color: act ? '#fff' : '#ccc',
                background: act ? '#2e2e2e' : 'transparent',
                textDecoration:'none',
                borderLeft: act ? '3px solid #f59e0b' : '3px solid transparent',
                fontSize:13,
              }}>
                <span style={{ color:'#f59e0b', width:18, textAlign:'center', fontSize:15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Dekonekte */}
          <div onClick={logout} style={{
            display:'flex', alignItems:'center', gap:9,
            padding:'10px 14px', cursor:'pointer',
            color:'#ef4444', borderTop:'1px solid #2a2a2a',
            marginTop:8, fontSize:13,
            borderLeft:'3px solid transparent',
          }}>
            <span style={{ width:18, textAlign:'center' }}>⏻</span>
            <span>Dekonekte</span>
          </div>

          {/* NEXTSTEPDIGITAL */}
          <div style={{ padding:'12px 14px', borderTop:'1px solid #1a1a1a', marginTop:4, textAlign:'center' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'linear-gradient(135deg, #1a1a2e, #16213e)',
              border:'1px solid #0f3460', borderRadius:8, padding:'6px 12px',
            }}>
              <span style={{ fontSize:10 }}>⚡</span>
              <div>
                <div style={{
                  fontSize:9, fontWeight:900, letterSpacing:1,
                  background:'linear-gradient(90deg, #f59e0b, #3b82f6)',
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                }}>NEXTSTEPDIGITAL</div>
                <div style={{ fontSize:8, color:'#555' }}>+509 41 76 24 10</div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ════ HEADER ════ */}
      <header style={{
        gridRow: '1',
        gridColumn: !mobile && sideVisible ? '2' : '1',
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 52,
        // Mobile: full width fixed
        ...(mobile ? {
          position: 'fixed',
          top: 0, left: 0, right: 0,
        } : {}),
      }}>
        <button onClick={() => setSideOpen(o => !o)}
          style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#f59e0b', padding:'2px 8px', lineHeight:1 }}>
          ☰
        </button>

        <span style={{ fontWeight:800, fontSize:14, color:'#1a73e8', letterSpacing:.4 }}>
          LA-PROBITE-BORLETTE
        </span>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {user && !mobile && (
            <span style={{ fontSize:12, color:'#555' }}>{user.prenom} {user.nom}</span>
          )}
          <button onClick={logout} style={{
            background:'none', border:'2px solid #dc2626', borderRadius:'50%',
            width:30, height:30, cursor:'pointer', fontSize:13, color:'#dc2626',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>⏻</button>
        </div>
      </header>

      {/* ════ CONTENU ════ */}
      <main style={{
        gridRow: '2',
        gridColumn: !mobile && sideVisible ? '2' : '1',
        padding: 16,
        // Mobile: ajoute marge pou header fixed
        ...(mobile ? { marginTop: 52 } : {}),
        minHeight: 'calc(100vh - 52px)',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}>
        {children}
      </main>

    </div>
  );
}
