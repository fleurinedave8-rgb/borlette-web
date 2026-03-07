import { useState } from 'react';
import { useRouter } from 'next/router';
import { clearAuth, getUser } from '../utils/auth';

const MENU = [
  { href: '/dashboard',  icon: '🏠', label: 'Tableau de bord' },
  { href: '/mon-compte', icon: '👤', label: 'Mon compte' },
  { href: '/paiement',   icon: '💳', label: 'Paiement' },
  { href: '/agents',     icon: '🖥️', label: 'Agents / POS' },
  { href: '/succursal',  icon: '🏢', label: 'Succursal' },
  {
    icon: '⚙️', label: 'Configurations', sub: [
      { href:'/configurations/tirages',         label:'Tirages' },
      { href:'/configurations/primes',          label:'Primes' },
      { href:'/configurations/tete-fiche',      label:'Tête Fiche' },
      { href:'/configurations/mariage-gratuit', label:'Mariage gratuit' },
      { href:'/configurations/utilisateurs',    label:'Utilisateurs' },
    ]
  },
  {
    icon: '👁️', label: 'Surveillance', sub: [
      { href:'/surveillance/lots-gagnant',         label:'Lots Gagnant' },
      { href:'/surveillance/statistiques',         label:'Statistiques' },
      { href:'/surveillance/pos-connectes',        label:'POS Connectés 🟢' },
      { href:'/surveillance/blocage-boule',        label:'Blocage Boule' },
      { href:'/surveillance/controle-agent',       label:'Contrôle Agent' },
      { href:'/surveillance/fiches-agent',         label:'Fiches par Agent' },
      { href:'/surveillance/tracabilite',          label:'Traçabilité' },
      { href:'/surveillance/demmande-elimination', label:'Demande Élimination' },
    ]
  },
  {
    icon: '📊', label: 'Rapport', sub: [
      { href:'/rapport/journalier',        label:'Journalier' },
      { href:'/rapport/fiches-vendu',      label:'Fiches Vendu' },
      { href:'/rapport/fiches-gagnant',    label:'Fiches Gagnant' },
      { href:'/rapport/fiches-elimine',    label:'Fiches Éliminé' },
      { href:'/rapport/ventes-fin-tirage', label:'Ventes Fin Tirage' },
      { href:'/rapport/ventes-matin-soir', label:'Ventes Matin/Soir' },
      { href:'/rapport/jeux-virtuel',      label:'Jeux Virtuel' },
    ]
  },
  { href: '/doleances', icon: '📩', label: 'Doléances' },
  { href: '/tutoriel',  icon: 'ℹ️', label: 'Tutoriel' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const user   = getUser();
  const [openMenu, setOpenMenu] = useState(null);

  const logout = () => { clearAuth(); router.push('/'); };

  const toggleMenu = (i) => setOpenMenu(prev => prev === i ? null : i);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f1f5f9' }}>

      {/* SIDEBAR */}
      <div style={{ width:220, background:'#1e293b', color:'white', flexShrink:0, display:'flex', flexDirection:'column', minHeight:'100vh', position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>

        {/* LOGO */}
        <div style={{ padding:'14px', background:'#f59e0b', textAlign:'center' }}>
          <div style={{ fontWeight:900, fontSize:12, color:'#000', letterSpacing:0.5 }}>🎰 LA-PROBITE-BORLETTE</div>
          {user && <div style={{ fontSize:10, color:'#333', marginTop:3 }}>{user.prenom} {user.nom} — {user.role}</div>}
        </div>

        {/* MENU */}
        <nav style={{ flex:1, padding:'6px 0' }}>
          {MENU.map((item, i) => {
            if (item.sub) {
              const isActive = item.sub.some(s => router.pathname === s.href);
              const isOpen   = openMenu === i;
              return (
                <div key={i}>
                  <div onClick={() => toggleMenu(i)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', cursor:'pointer', background: isActive ? 'rgba(245,158,11,0.15)' : 'transparent' }}>
                    <span style={{ fontSize:12, fontWeight:700, color: isActive ? '#f59e0b' : '#cbd5e1' }}>
                      {item.icon} {item.label}
                    </span>
                    <span style={{ fontSize:9, color:'#64748b' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  {isOpen && (
                    <div style={{ background:'rgba(0,0,0,0.25)' }}>
                      {item.sub.map((s, j) => (
                        <div key={j} onClick={() => router.push(s.href)}
                          style={{ padding:'7px 14px 7px 26px', cursor:'pointer', fontSize:11, fontWeight: router.pathname===s.href ? '700' : '400', color: router.pathname===s.href ? '#f59e0b' : '#94a3b8', background: router.pathname===s.href ? 'rgba(245,158,11,0.1)' : 'transparent' }}>
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div key={i} onClick={() => router.push(item.href)}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', cursor:'pointer', fontSize:12, fontWeight:700, color: router.pathname===item.href ? '#f59e0b' : '#cbd5e1', background: router.pathname===item.href ? 'rgba(245,158,11,0.15)' : 'transparent' }}>
                {item.icon} {item.label}
              </div>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div style={{ padding:10, borderTop:'1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={logout}
            style={{ width:'100%', padding:'9px', background:'#dc2626', color:'white', border:'none', borderRadius:6, fontWeight:700, cursor:'pointer', fontSize:12 }}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div style={{ flex:1, padding:20, overflowY:'auto', minHeight:'100vh' }}>
        {children}
      </div>

    </div>
  );
}
