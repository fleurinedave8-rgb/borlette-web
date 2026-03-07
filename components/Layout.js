import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getUser, clearAuth } from '../utils/auth';

const navItems = [
  { href: '/dashboard',   icon: '🏠', label: 'Tableau de bord' },
  { href: '/mon-compte',  icon: '🏛', label: 'Mon compte' },
  { href: '/paiement',    icon: '💳', label: 'Paiement online' },
  { href: '/succursal',   icon: '🏛', label: 'Succursal' },
  { href: '/agents',      icon: '👤', label: 'Agents / POS 🖩' },
  { label:'Configurations', icon:'⚙️', sub:[
    { href:'/configurations/mariage-gratuit', label:'Mariage gratuit' },
    { href:'/configurations/tirages', label:'Tirages' },
    { href:'/configurations/primes', label:'Primes' },
    { href:'/configurations/tete-fiche', label:'Tête Fiche' },
    { href:'/configurations/utilisateurs', label:'Utilisateurs' },
  ]},
  { label:'Surveillance', icon:'🖥', sub:[
    { href:'/surveillance/statistiques', label:'Statistiques' },
    { href:'/surveillance/blocage-boule', label:'Blocage boule' },
    { href:'/surveillance/limites', label:'Limites' },
    { href:'/surveillance/controle-agent', label:'Controle agent' },
    { href:'/surveillance/fiches-agent', label:'Fiches par agent' },
    { href:'/surveillance/lots-gagnant', label:'Lots gagnant' },
    { href:'/surveillance/pos-connectes', label:'POS Connectés 🟢' },
    { href:'/surveillance/tracabilite', label:'Traçabilité' },
    { href:'/surveillance/demmande-elimination', label:'Demmande élimination' },
  ]},
  { label:'Rapport', icon:'📋', sub:[
    { href:'/rapport/jeux-virtuel', label:'Jeux virtuel' },
    { href:'/rapport/journalier', label:'Journalier' },
    { href:'/rapport/ventes-fin-tirage', label:'Ventes (Fin tirage)' },
    { href:'/rapport/ventes-matin-soir', label:'Ventes (Matin / Soir)' },
    { href:'/rapport/fiches-vendu', label:'Fiches vendu' },
    { href:'/rapport/fiches-gagnant', label:'Fiches gagnant' },
    { href:'/rapport/fiches-elimine', label:'Fiches éliminé' },
  ]},
  { href:'/doleances', icon:'ℹ️', label:'DOLEANCES' },
  { href:'/tutoriel',  icon:'ℹ️', label:'TUTORIEL' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ Configurations:false, Surveillance:false, Rapport:false });
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth >= 768) setSidebarOpen(true);
    setUser(getUser());
    navItems.forEach(item => {
      if (item.sub) {
        const active = item.sub.some(s => router.pathname.startsWith('/' + s.href.split('/')[1]));
        if (active) setOpenMenus(prev => ({ ...prev, [item.label]: true }));
      }
    });
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  if (!mounted) return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      <div style={{ height:52, background:'white', boxShadow:'0 1px 4px rgba(0,0,0,0.12)' }} />
      <div style={{ padding:12 }}>{children}</div>
    </div>
  );

  const isMobile = window.innerWidth < 768;
  const closeMobile = () => { if (isMobile) setSidebarOpen(false); };

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5' }}>
      {sidebarOpen && isMobile && (
        <div onClick={() => setSidebarOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999 }} />
      )}

      {/* SIDEBAR */}
      <div style={{ width:260, background:'#1e1e1e', height:'100vh', position:'fixed', left:0, top:0, zIndex:1000, overflowY:'auto', transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition:'transform 0.3s ease' }}>
        <div style={{ padding:'18px 16px', textAlign:'center', borderBottom:'1px solid #333' }}>
          <div style={{ width:62, height:62, borderRadius:'50%', background:'white', margin:'0 auto 8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, border:'2px solid #f59e0b' }}>🔑</div>
          <div style={{ color:'white', fontWeight:800, fontSize:12 }}>LA-PROBITE-BORLETTE</div>
          {user && <div style={{ color:'#f59e0b', fontSize:11, marginTop:4 }}>{user.prenom} {user.nom}</div>}
        </div>

        <nav>
          {navItems.map((item, idx) => {
            if (item.sub) {
              const isOpen = openMenus[item.label];
              const isActive = item.sub.some(s => router.pathname === s.href);
              return (
                <div key={idx}>
                  <div onClick={() => setOpenMenus(p => ({ ...p, [item.label]: !p[item.label] }))}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', cursor:'pointer', fontSize:14, color: isActive ? 'white' : '#bbb', background: isActive ? '#2a2a2a' : 'transparent' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ color:'#f59e0b', width:18 }}>{item.icon}</span>{item.label}
                    </span>
                    <span style={{ color:'#f59e0b', fontSize:10 }}>{isOpen ? '▼' : '▶'}</span>
                  </div>
                  {isOpen && (
                    <div style={{ background:'#252525' }}>
                      {item.sub.map((sub, si) => {
                        const active = router.pathname === sub.href;
                        return (
                          <Link key={si} href={sub.href} onClick={closeMobile} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px 9px 44px', fontSize:13, color: active ? 'white' : '#999', background: active ? '#333' : 'transparent', textDecoration:'none' }}>
                            <span style={{ color:'#f59e0b', fontSize:8 }}>▶</span>{sub.label}
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
              <Link key={idx} href={item.href} onClick={closeMobile} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:14, color: active ? 'white' : '#bbb', background: active ? '#333' : 'transparent', textDecoration:'none' }}>
                <span style={{ color:'#f59e0b', width:18 }}>{item.icon}</span>{item.label}
              </Link>
            );
          })}

          {/* LOGOUT */}
          <div onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', fontSize:14, color:'#dc2626', cursor:'pointer', borderTop:'1px solid #2a2a2a', marginTop:10 }}>
            <span style={{ width:18 }}>⏻</span>Dekonekte
          </div>
        </nav>
      </div>

      {/* HEADER */}
      <div style={{ height:52, background:'white', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.1)', position:'fixed', top:0, right:0, left:0, zIndex:998 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'#f59e0b', padding:4 }}>☰</button>
        <div style={{ fontWeight:700, fontSize:15, color:'#1a73e8' }}>LA-PROBITE-BORLETTE</div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {user && <span style={{ fontSize:13, color:'#555' }}>{user.prenom} {user.nom}</span>}
          <button onClick={handleLogout} style={{ background:'none', border:'2px solid #dc2626', borderRadius:'50%', width:30, height:30, cursor:'pointer', fontSize:13, color:'#dc2626' }}>⏻</button>
        </div>
      </div>

      <main style={{ marginTop:52, marginLeft: !isMobile && sidebarOpen ? 260 : 0, padding:12, minHeight:'calc(100vh - 52px)', transition:'margin-left 0.3s ease' }}>
        {children}
      </main>
    </div>
  );
}
