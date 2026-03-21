import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useRouter } from 'next/router';

const fmt = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d => {
  if(!d) return '—';
  const dt=new Date(d), p=n=>String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()}`;
};

export default function Statistiques() {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];
  const [tab,     setTab]     = useState('general');
  const [debut,   setDebut]   = useState(today);
  const [fin,     setFin]     = useState(today);
  const [data,    setData]    = useState(null);
  const [agents,  setAgents]  = useState([]);
  const [succs,   setSuccs]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadAll(); }, [debut, fin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsR, agentsR, succsR] = await Promise.all([
        api.get('/api/rapport/journalier', { params:{ debut, fin } }).catch(()=>({data:{}})),
        api.get('/api/admin/agents').catch(()=>({data:[]})),
        api.get('/api/admin/succursales').catch(()=>({data:[]})),
      ]);
      setData(statsR.data || {});
      setAgents(Array.isArray(agentsR.data) ? agentsR.data : []);
      setSuccs(Array.isArray(succsR.data) ? succsR.data : []);
    } catch { setData({}); }
    setLoading(false);
  };

  const agentList = data?.agents || agents.filter(a=>a.role==='agent').map(a => ({
    ...a,
    vente: 0, gain: 0, net: 0, ficheCount: 0,
  }));

  const succList = succs.map(s => ({
    ...s,
    vente: (agentList.filter(a=>a.succursale===s.nom)
      .reduce((sum,a)=>sum+Number(a.vente||0),0)),
    gain: (agentList.filter(a=>a.succursale===s.nom)
      .reduce((sum,a)=>sum+Number(a.gain||0),0)),
    agentCount: agentList.filter(a=>a.succursale===s.nom).length,
  }));

  const tVente = Number(data?.vente||0);
  const tGain  = Number(data?.gain||0);
  const tNet   = tVente - tGain;
  const tFiches = Number(data?.fiches||0);

  const TABS = [
    { k:'general',    l:'📊 Général',      c:'#1a73e8' },
    { k:'agents',     l:'👤 Pa Ajan',      c:'#16a34a' },
    { k:'succursal',  l:'🏢 Pa Succursal', c:'#7c3aed' },
  ];

  const StatCard = ({ icon, label, value, sub, color, onClick }) => (
    <div onClick={onClick}
      style={{ background:'white', borderRadius:12, padding:16,
        boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
        borderTop:`4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        transition:'transform 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform='translateY(-2px)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.transform='translateY(0)')}>
      <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
      <div style={{ fontWeight:900, fontSize:20, color }}>{value}</div>
      <div style={{ fontSize:12, color:'#888', fontWeight:700, marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{sub}</div>}
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 8px 40px' }}>

        {/* TABS */}
        <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
          {TABS.map(({ k, l, c }) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding:'9px 20px', border:'none', borderRadius:10,
                background: tab===k ? c : '#f3f4f6',
                color: tab===k ? 'white' : '#555',
                fontWeight:700, cursor:'pointer', fontSize:13 }}>
              {l}
            </button>
          ))}

          {/* Filtè dat */}
          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([l,v,s]) => (
              <div key={l}>
                <input type="date" value={v} onChange={e => s(e.target.value)}
                  style={{ padding:'7px 10px', border:'1.5px solid #ddd',
                    borderRadius:8, fontSize:12 }} />
              </div>
            ))}
            <button onClick={loadAll} disabled={loading}
              style={{ padding:'7px 14px', background:'#1a73e8', color:'white',
                border:'none', borderRadius:8, fontWeight:700, cursor:'pointer' }}>
              {loading ? '⏳' : '🔍'}
            </button>
          </div>
        </div>

        {/* ── GÉNÉRAL ── */}
        {tab === 'general' && (
          <div>
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',
              gap:12, marginBottom:20 }}>
              <StatCard icon="💰" label="Ventes totales" value={`${fmt(tVente)} G`}
                color="#16a34a" sub={`${tFiches} fiches`} />
              <StatCard icon="🏆" label="Total Gagnants" value={`${fmt(tGain)} G`}
                color="#dc2626" />
              <StatCard icon="📊" label="Net" value={`${fmt(tNet)} G`}
                color={tNet>=0?'#16a34a':'#dc2626'}
                sub={tNet>=0?'Bénéfice':'Déficit'} />
              <StatCard icon="🎫" label="Fiches Vendues" value={tFiches}
                color="#1a73e8"
                onClick={() => router.push('/rapport/fiches-vendu')} />
              <StatCard icon="👤" label="Ajan Actif" value={agents.filter(a=>a.actif&&a.role==='agent').length}
                color="#7c3aed"
                onClick={() => router.push('/configurations/pos')} />
              <StatCard icon="🖥️" label="Total POS" value={data?.pos||0}
                color="#0891b2"
                onClick={() => router.push('/configurations/pos')} />
            </div>

            {/* Grafik senp */}
            {agentList.length > 0 && (
              <div style={{ background:'white', borderRadius:12, padding:20,
                boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:16 }}>
                <h3 style={{ margin:'0 0 16px', fontWeight:800, fontSize:15 }}>
                  📈 Vente pa Ajan
                </h3>
                {agentList.slice(0,10).map((a, i) => {
                  const max = Math.max(...agentList.map(x=>Number(x.vente||0)), 1);
                  const pct = (Number(a.vente||0) / max) * 100;
                  return (
                    <div key={a._id||i} style={{ marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between',
                        marginBottom:4, fontSize:12 }}>
                        <span style={{ fontWeight:700 }}>
                          {a.prenom||''} {a.nom||a.username}
                        </span>
                        <span style={{ color:'#16a34a', fontWeight:700 }}>
                          {fmt(a.vente||0)} G
                        </span>
                      </div>
                      <div style={{ background:'#f0f0f0', borderRadius:4, height:8 }}>
                        <div style={{ background:'#16a34a', borderRadius:4,
                          height:8, width:`${pct}%`,
                          transition:'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PA AJAN ── */}
        {tab === 'agents' && (
          <div style={{ background:'white', borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#1e293b' }}>
                  {['Ajan','Username','Succursale','Fiches','Vente','Ganyan','Net','Statut'].map(h => (
                    <th key={h} style={{ padding:'11px 12px', color:'white',
                      fontWeight:700, fontSize:11, textAlign:'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#888' }}>
                    ⏳ Chargement...
                  </td></tr>
                ) : agentList.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#aaa' }}>
                    Aucun done pou peryòd sa
                  </td></tr>
                ) : agentList.map((a, i) => {
                  const net = Number(a.vente||0) - Number(a.gain||0);
                  return (
                    <tr key={a._id||i}
                      style={{ borderBottom:'1px solid #f0f0f0',
                        background: i%2===0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding:'10px 12px', fontWeight:700 }}>
                        {a.prenom||''} {a.nom||'—'}
                      </td>
                      <td style={{ padding:'10px 12px', fontFamily:'monospace',
                        color:'#1a73e8', fontSize:12 }}>
                        @{a.username}
                      </td>
                      <td style={{ padding:'10px 12px', fontSize:12, color:'#666' }}>
                        {a.succursale||'—'}
                      </td>
                      <td style={{ padding:'10px 12px', fontWeight:700 }}>
                        {a.ficheCount||0}
                      </td>
                      <td style={{ padding:'10px 12px', fontWeight:700, color:'#16a34a' }}>
                        {fmt(a.vente||0)} G
                      </td>
                      <td style={{ padding:'10px 12px', color:'#dc2626', fontWeight:700 }}>
                        {fmt(a.gain||0)} G
                      </td>
                      <td style={{ padding:'10px 12px', fontWeight:900,
                        color: net>=0 ? '#16a34a' : '#dc2626' }}>
                        {fmt(net)} G
                        <span style={{ fontSize:9, marginLeft:4,
                          background: net>=0?'#dcfce7':'#fee2e2',
                          color: net>=0?'#166534':'#991b1b',
                          borderRadius:10, padding:'1px 5px', fontWeight:700 }}>
                          {net>=0?'BEN':'DEF'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 12px' }}>
                        <span style={{
                          background: a.actif ? '#dcfce7' : '#fee2e2',
                          color: a.actif ? '#166534' : '#991b1b',
                          borderRadius:20, padding:'2px 8px',
                          fontSize:10, fontWeight:700 }}>
                          {a.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PA SUCCURSAL ── */}
        {tab === 'succursal' && (
          <div>
            {succList.length === 0 ? (
              <div style={{ textAlign:'center', padding:40,
                background:'white', borderRadius:12, color:'#aaa' }}>
                Aucun succursale — kreye yo nan Succursal
              </div>
            ) : (
              <div style={{ display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
                {succList.map((s, i) => {
                  const net = s.vente - s.gain;
                  return (
                    <div key={s._id||i} style={{ background:'white', borderRadius:12,
                      padding:16, boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                      borderLeft:`4px solid #7c3aed` }}>
                      <div style={{ fontWeight:900, fontSize:15, marginBottom:12 }}>
                        🏢 {s.nom}
                      </div>
                      {[
                        ['👤 Ajan', s.agentCount],
                        ['💰 Vente', `${fmt(s.vente)} G`],
                        ['🏆 Ganyan', `${fmt(s.gain)} G`],
                        ['📊 Net', `${fmt(net)} G`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ display:'flex',
                          justifyContent:'space-between',
                          padding:'6px 0', borderBottom:'1px solid #f0f0f0',
                          fontSize:13 }}>
                          <span style={{ color:'#888' }}>{l}:</span>
                          <span style={{ fontWeight:700 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
      </div>
    </Layout>
  );
}
