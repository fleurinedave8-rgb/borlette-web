import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUser, clearAuth } from '../utils/auth';

const navItems = [
  { href: '/dashboard',  icon: '🏠', label: 'Tableau de bord' },
  { href: '/mon-compte', icon: '🏛', label: 'Mon compte' },
  { href: '/paiement',   icon: '💳', label: 'Paiement online' },
  { href: '/succursal',  icon: '🏛', label: 'Succursal' },
  { href: '/agents',     icon: '👤', label: 'Agents / POS 🖩' },
  { label:'Configurations', icon:'⚙️', sub:[
    { href:'/configurations/mariage-gratuit', label:'Mariage gratuit' },
    { href:'/configurations/tirages',         label:'Tirages' },
    { href:'/configurations/primes',          label:'Primes' },
    { href:'/configurations/tete-fiche',      label:'Tête Fiche' },
    { href:'/configurations/utilisateurs',    label:'Utilisateurs' },
  ]},
  { label:'Surveillance', icon:'🖥', sub:[
    { href:'/surveillance/statistiques',        label:'Statistiques' },
    { href:'/surveillance/blocage-boule',       label:'Blocage boule' },
    { href:'/surveillance/limites',             label:'Limites' },
    { href:'/surveillance/controle-agent',      label:'Controle agent' },
    { href:'/surveillance/fiches-agent',        label:'Fiches par agent' },
    { href:'/surveillance/lots-gagnant',        label:'Lots gagnant' },
    { href:'/surveillance/pos-connectes',       label:'POS Connectés 🟢' },
    { href:'/surveillance/scraper-status',      label:'🤖 Scraper Tiraj' },
    { href:'/surveillance/tracabilite',         label:'Traçabilité' },
    { href:'/surveillance/demmande-elimination',label:'Demmande élimination' },
  ]},
  { label:'Rapport', icon:'📋', sub:[
    { href:'/rapport/jeux-virtuel',       label:'Jeux virtuel' },
    { href:'/rapport/journalier',         label:'Journalier' },
    { href:'/rapport/ventes-fin-tirage',  label:'Ventes (Fin tirage)' },
    { href:'/rapport/ventes-matin-soir',  label:'Ventes (Matin / Soir)' },
    { href:'/rapport/fiches-vendu',       label:'Fiches vendu' },
    { href:'/rapport/fiches-gagnant',     label:'Fiches gagnant' },
    { href:'/rapport/fiches-elimine',     label:'Fiches éliminé' },
  ]},
  { href:'/doleances', icon:'ℹ️', label:'DOLEANCES' },
  { href:'/tutoriel',  icon:'ℹ️', label:'TUTORIEL' },
];

const SIDEBAR_W = 260;

export default function Layout({ children }) {
  const router = useRouter();
  const [mounted,     setMounted]     = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openMenus,   setOpenMenus]   = useState({
    Configurations: false, Surveillance: false, Rapport: false
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    setMounted(true);
    setUser(getUser());

    // Ouvri sous-menu actif
    navItems.forEach(item => {
      if (item.sub) {
        const active = item.sub.some(s => router.pathname.startsWith(s.href));
        if (active) setOpenMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => { clearAuth(); router.push('/'); };

  const closeMobile = () => { if (isMobile) setSidebarOpen(false); };

  // Lajan pou main content — toujou bon
  const mainMargin = !isMobile && sidebarOpen ? SIDEBAR_W : 0;

  if (!mounted) return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      <div style={{ height:52, background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.12)' }} />
      <div style={{ padding:16 }}>{children}</div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5', fontSize:14 }}>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && isMobile && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999 }} />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <div style={{
        width: SIDEBAR_W,
        background: '#1e1e1e',
        height: '100vh',
        position: 'fixed',
        left: 0, top: 0,
        zIndex: 1000,
        overflowY: 'auto',
        overflowX: 'hidden',
        transform: sidebarOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
        transition: 'transform 0.28s ease',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* LOGO */}
        <div style={{ padding:'18px 16px 14px', textAlign:'center', borderBottom:'1px solid #333', flexShrink:0 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'white', margin:'0 auto 8px',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, border:'2px solid #f59e0b' }}>
            🔑
          </div>
          <div style={{ color:'white', fontWeight:800, fontSize:11, letterSpacing:0.5 }}>LA-PROBITE-BORLETTE</div>
          {user && <div style={{ color:'#f59e0b', fontSize:11, marginTop:3 }}>{user.prenom} {user.nom}</div>}
        </div>

        {/* NAV */}
        <nav style={{ flex:1, paddingBottom:16 }}>
          {navItems.map((item, idx) => {
            if (item.sub) {
              const isOpen   = openMenus[item.label];
              const isActive = item.sub.some(s => router.pathname === s.href);
              return (
                <div key={idx}>
                  <div onClick={() => setOpenMenus(p => ({ ...p, [item.label]: !p[item.label] }))}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'10px 16px', cursor:'pointer',
                      color: isActive ? 'white' : '#ccc',
                      background: isActive ? '#2a2a2a' : 'transparent',
                      userSelect: 'none',
                    }}>
                    <span style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
                      <span style={{ color:'#f59e0b', fontSize:15, width:18, textAlign:'center' }}>{item.icon}</span>
                      {item.label}
                    </span>
                    <span style={{ color:'#f59e0b', fontSize:9, marginLeft:4 }}>{isOpen ? '▼' : '▶'}</span>
                  </div>
                  {isOpen && (
                    <div style={{ background:'#252525' }}>
                      {item.sub.map((sub, si) => {
                        const active = router.pathname === sub.href;
                        return (
                          <Link key={si} href={sub.href} onClick={closeMobile}
                            style={{ display:'flex', alignItems:'center', gap:8,
                              padding:'9px 16px 9px 42px', fontSize:12,
                              color: active ? 'white' : '#aaa',
                              background: active ? '#383838' : 'transparent',
                              textDecoration: 'none',
                              borderLeft: active ? '3px solid #f59e0b' : '3px solid transparent',
                            }}>
                            <span style={{ color:'#f59e0b', fontSize:8 }}>▶</span>
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = router.pathname === item.href;
            return (
              <Link key={idx} href={item.href} onClick={closeMobile}
                style={{ display:'flex', alignItems:'center', gap:10,
                  padding:'10px 16px', fontSize:13,
                  color: active ? 'white' : '#ccc',
                  background: active ? '#383838' : 'transparent',
                  textDecoration: 'none',
                  borderLeft: active ? '3px solid #f59e0b' : '3px solid transparent',
                }}>
                <span style={{ color:'#f59e0b', fontSize:15, width:18, textAlign:'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {/* LOGOUT */}
          <div onClick={handleLogout}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:13,
              color:'#ef4444', cursor:'pointer', borderTop:'1px solid #2a2a2a', marginTop:8,
              borderLeft:'3px solid transparent',
            }}>
            <span style={{ width:18, textAlign:'center' }}>⏻</span>
            Dekonekte
          </div>
        </nav>
      </div>

      {/* ═══ HEADER ═══ */}
      <div style={{
        height: 52,
        background: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        position: 'fixed',
        top: 0, right: 0,
        left: !isMobile && sidebarOpen ? SIDEBAR_W : 0,
        zIndex: 998,
        transition: 'left 0.28s ease',
      }}>
        <button onClick={() => setSidebarOpen(s => !s)}
          style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#f59e0b', padding:'4px 8px', lineHeight:1 }}>
          ☰
        </button>
        <div style={{ fontWeight:800, fontSize:14, color:'#1a73e8', letterSpacing:0.5 }}>
          LA-PROBITE-BORLETTE
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {user && <span style={{ fontSize:12, color:'#555', display: isMobile ? 'none' : 'block' }}>{user.prenom} {user.nom}</span>}
          <button onClick={handleLogout}
            style={{ background:'none', border:'2px solid #dc2626', borderRadius:'50%',
              width:30, height:30, cursor:'pointer', fontSize:13, color:'#dc2626',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            ⏻
          </button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main style={{
        marginTop: 52,
        marginLeft: mainMargin,
        padding: 16,
        minHeight: 'calc(100vh - 52px)',
        transition: 'margin-left 0.28s ease',
        boxSizing: 'border-box',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}>
        {children}
      </main>

    </div>
  );
}
