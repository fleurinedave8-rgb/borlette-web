import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import api from '../utils/api';

const pad2 = v => String(v||0).padStart(2,'0');
const fmt  = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d => {
  if(!d) return '—';
  const dt=new Date(d);
  return `${pad2(dt.getDate())}/${pad2(dt.getMonth()+1)}/${dt.getFullYear()}`;
};
const fmtH = d => {
  if(!d) return '—';
  const dt=new Date(d);
  return `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
};

// Detèmine si tiraj se matin oswa soir
const MATIN_KLIYAN = ['matin','midi','morning','am'];
const SOIR_KLIYAN  = ['soir','evening','pm','swa','nuit'];
const getLabel = (nom='') => {
  const n = nom.toLowerCase();
  if (MATIN_KLIYAN.some(k=>n.includes(k))) return 'Jodi a (Matin)';
  if (SOIR_KLIYAN.some(k=>n.includes(k)))  return 'Jodi a (Soir)';
  return 'Jodi a';
};

// Koulè pa tiraj
const TIRAGE_COLORS = {
  florida:   { bg:'#16a34a', text:'white' },
  'new-york':{ bg:'#1a73e8', text:'white' },
  georgia:   { bg:'#7c3aed', text:'white' },
  ohio:      { bg:'#f59e0b', text:'#111'  },
  maryland:  { bg:'#dc2626', text:'white' },
  tennessee: { bg:'#0891b2', text:'white' },
  chicago:   { bg:'#374151', text:'white' },
};
const getTirageColor = (nom='') => {
  const n = nom.toLowerCase();
  for (const [k,v] of Object.entries(TIRAGE_COLORS)) {
    if (n.includes(k)) return v;
  }
  return { bg:'#1e293b', text:'white' };
};

export default function Dashboard() {
  const router = useRouter();
  const [resultats, setResultats] = useState([]);
  const [stats,     setStats]     = useState({ pos:0, posInactif:0, fiches:0 });
  const [lots,      setLots]      = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Dènye rezilta
      const rRes = await api.get('/api/admin/resultats').catch(()=>({data:[]}));
      const resData = Array.isArray(rRes.data) ? rRes.data : [];
      setResultats(resData.slice(0, 12));

      // Stats POS + fiches
      const [posR, fichR] = await Promise.all([
        api.get('/api/admin/pos').catch(()=>({data:[]})),
        api.get('/api/admin/fiches').catch(()=>({data:[]})),
      ]);
      const posList  = Array.isArray(posR.data)  ? posR.data  : [];
      const fichList = Array.isArray(fichR.data) ? fichR.data :
                       Array.isArray(fichR.data?.fiches) ? fichR.data.fiches : [];
      const now = Date.now() - 5*60*1000;
      setStats({
        pos:       posList.length,
        posInactif:posList.filter(p=>p.actif===false).length,
        posOnline: posList.filter(p=>p.lastSeen&&new Date(p.lastSeen).getTime()>now).length,
        fiches:    fichList.length,
      });

      // Lots gagnant
      const lRes = await api.get('/api/admin/resultats').catch(()=>({data:[]}));
      setLots(Array.isArray(lRes.data) ? lRes.data.slice(0,20) : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const pad2b = v => v ? String(v).padStart(2,'0') : '—';

  return (
    <Layout>
      <div style={{maxWidth:1000,margin:'0 auto',padding:'0 8px 40px'}}>

        {/* ── DÈNYE REZILTA ── */}
        <div style={{marginBottom:6,fontWeight:800,fontSize:13,
          color:'#374151',textTransform:'uppercase',letterSpacing:0.5}}>
          🏆 Dènye Rezilta
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:32,color:'#888'}}>
            ⏳ Ap chaje...
          </div>
        ) : resultats.length === 0 ? (
          <div style={{background:'white',borderRadius:12,padding:24,
            textAlign:'center',color:'#aaa',marginBottom:16,
            boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
            Pa gen rezilta encore — Ale nan Lots Gagnant pou ajoute
          </div>
        ) : (
          <div style={{display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',
            gap:10,marginBottom:18}}>
            {resultats.map((r,i) => {
              const col = getTirageColor(r.tirage||'');
              const label = getLabel(r.tirage||'');
              const lotCol = ['#16a34a','#f59e0b','#1a73e8'];
              return (
                <div key={r._id||i} style={{background:'white',
                  borderRadius:12,overflow:'hidden',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                  {/* Header tiraj */}
                  <div style={{background:col.bg,padding:'8px 14px',
                    display:'flex',justifyContent:'space-between',
                    alignItems:'center'}}>
                    <span style={{color:col.text,fontWeight:900,fontSize:13}}>
                      {r.tirage||'—'}
                    </span>
                    <span style={{color:col.text,fontSize:10,
                      opacity:0.85,fontWeight:700}}>
                      {label}
                    </span>
                  </div>
                  {/* Boul yo */}
                  <div style={{padding:'12px 14px',
                    display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    {/* Loto3 si disponib */}
                    {r.loto3 && (
                      <div style={{textAlign:'center'}}>
                        <div style={{width:42,height:42,borderRadius:8,
                          background:'#7c3aed',color:'white',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontWeight:900,fontSize:12,fontFamily:'monospace'}}>
                          {String(r.loto3).padStart(3,'0')}
                        </div>
                        <div style={{fontSize:8,color:'#888',marginTop:2}}>L3</div>
                      </div>
                    )}
                    {/* Lot1 Lot2 Lot3 */}
                    {[
                      {v:r.lot1,l:'1er',c:lotCol[0]},
                      {v:r.lot2,l:'2em',c:lotCol[1]},
                      {v:r.lot3,l:'3em',c:lotCol[2]},
                    ].filter(x=>x.v).map(({v,l,c})=>(
                      <div key={l} style={{textAlign:'center'}}>
                        <div style={{width:42,height:42,borderRadius:'50%',
                          background:c,color:'white',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontWeight:900,fontSize:16,fontFamily:'monospace'}}>
                          {String(v).padStart(2,'0')}
                        </div>
                        <div style={{fontSize:8,color:'#888',marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Dat */}
                  <div style={{padding:'4px 14px 10px',fontSize:10,color:'#888'}}>
                    📅 {fmtD(r.date||r.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── STATS RAPID ── */}
        <div style={{display:'grid',
          gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:18}}>
          {[
            {v:stats.pos,      l:'POS Total',   bg:'#f59e0b',
              icon:'🖥️', onClick:()=>router.push('/configurations/pos')},
            {v:stats.posInactif,l:'POS Inaktif', bg:'#dc2626',
              icon:'❌', onClick:()=>router.push('/configurations/pos')},
            {v:stats.fiches,   l:'Fiches Vendu',bg:'#16a34a',
              icon:'🎫', onClick:()=>router.push('/rapport/fiches-vendu')},
          ].map(({v,l,bg,icon,onClick})=>(
            <div key={l} onClick={onClick}
              style={{background:bg,borderRadius:12,padding:'16px 12px',
                textAlign:'center',cursor:'pointer',
                boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
              <div style={{fontSize:26,marginBottom:4}}>{icon}</div>
              <div style={{fontWeight:900,fontSize:24,color:'white'}}>{v}</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.85)',
                fontWeight:700,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>

        {/* ── LOTS GAGNANT ── */}
        <div style={{marginBottom:8,fontWeight:800,fontSize:13,
          color:'#374151',textTransform:'uppercase',letterSpacing:0.5}}>
          🏆 Lots Gagnant
        </div>

        <div style={{background:'white',borderRadius:12,
          boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',
            fontSize:12,minWidth:600}}>
            <thead>
              <tr style={{background:'#1e293b'}}>
                {['Dat','Hè','Tiraj','1er Lot','2em Lot','3em Lot',
                  'Traite pou Rapò'].map(h=>(
                  <th key={h} style={{padding:'10px 12px',color:'white',
                    fontWeight:700,fontSize:11,textAlign:'left'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lots.length===0 ? (
                <tr><td colSpan={7} style={{padding:24,
                  textAlign:'center',color:'#aaa'}}>
                  Pa gen lots gagnant encore
                </td></tr>
              ) : lots.map((r,i)=>(
                <tr key={r._id||i}
                  style={{borderBottom:'1px solid #f0f0f0',
                    background:i%2===0?'white':'#fafafa'}}>
                  <td style={{padding:'9px 12px',color:'#666',fontSize:11}}>
                    {fmtD(r.date||r.createdAt)}
                  </td>
                  <td style={{padding:'9px 12px',color:'#666',fontSize:11,
                    fontFamily:'monospace'}}>
                    {fmtH(r.createdAt)}
                  </td>
                  <td style={{padding:'9px 12px',fontWeight:700,fontSize:12}}>
                    {r.tirage||'—'}
                  </td>
                  {[
                    {v:r.lot1,c:'#16a34a'},
                    {v:r.lot2,c:'#f59e0b'},
                    {v:r.lot3,c:'#1a73e8'},
                  ].map(({v,c},j)=>(
                    <td key={j} style={{padding:'9px 12px'}}>
                      {v ? (
                        <span style={{display:'inline-flex',
                          alignItems:'center',justifyContent:'center',
                          width:32,height:32,borderRadius:'50%',
                          background:c,color:'white',
                          fontWeight:900,fontSize:13,
                          fontFamily:'monospace'}}>
                          {pad2b(v)}
                        </span>
                      ) : <span style={{color:'#ccc'}}>—</span>}
                    </td>
                  ))}
                  <td style={{padding:'9px 12px'}}>
                    <span style={{background:'#dcfce7',color:'#166534',
                      borderRadius:20,padding:'3px 10px',
                      fontSize:10,fontWeight:700}}>
                      ✅ Wi
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  );
}
