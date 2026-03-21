import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d => {
  if(!d) return '—';
  const dt=new Date(d), p=n=>String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()}`;
};

const MATIN = ['matin','midi','morning'];
const SOIR  = ['soir','evening','swa'];
const getSession = nom => {
  const n = (nom||'').toLowerCase();
  if (MATIN.some(k=>n.includes(k))) return 'Matin';
  if (SOIR.some(k=>n.includes(k)))  return 'Soir';
  return 'Autre';
};

export default function VentesMatinSoir() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,   setDebut]   = useState(today);
  const [fin,     setFin]     = useState(today);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/rapport/tirage', { params:{ debut, fin } });
      setResult(r.data || {});
    } catch { setResult({}); }
    setLoading(false);
  };

  // Groupman pa Matin / Soir
  const agents = result?.agents || [];
  const bySession = { Matin:[], Soir:[], Autre:[] };
  agents.forEach(a => {
    const sess = getSession(a.tirage || '');
    bySession[sess].push(a);
  });

  // Totals
  const totals = { Matin:{v:0,g:0}, Soir:{v:0,g:0} };
  ['Matin','Soir'].forEach(sess => {
    bySession[sess].forEach(a => {
      totals[sess].v += Number(a.vente||0);
      totals[sess].g += Number(a.gain||0);
    });
  });

  const tVente = Number(result?.vente||0);
  const tGain  = Number(result?.ganyan||result?.gain||0);

  const SessionTable = ({ sess, data }) => {
    if (!data || data.length === 0) return null;
    const tv = data.reduce((s,a)=>s+Number(a.vente||0),0);
    const tg = data.reduce((s,a)=>s+Number(a.gain||0),0);
    const tn = tv - tg;
    return (
      <div style={{ marginBottom:16 }}>
        <div style={{ background: sess==='Matin'?'#f59e0b':'#1e293b',
          borderRadius:'10px 10px 0 0', padding:'10px 16px',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:14,
            color: sess==='Matin'?'#111':'white' }}>
            {sess==='Matin'?'🌅':'🌙'} Sesyon {sess}
          </span>
          <span style={{ fontSize:12, fontWeight:700,
            color: sess==='Matin'?'#78350f':'#94a3b8' }}>
            {data.length} ajan
          </span>
        </div>
        <div style={{ background:'white', borderRadius:'0 0 10px 10px',
          boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                {['Ajan','Fiches','Vente','Ganyan','Net'].map(h => (
                  <th key={h} style={{ padding:'9px 12px', fontWeight:700,
                    fontSize:11, color:'#555', textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((a, i) => {
                const n = Number(a.vente||0)-Number(a.gain||0);
                return (
                  <tr key={i} style={{ borderBottom:'1px solid #f0f0f0',
                    background: i%2===0?'white':'#fafafa' }}>
                    <td style={{ padding:'9px 12px', fontWeight:700 }}>
                      {a.prenom||''} {a.nom||a.username||'—'}
                    </td>
                    <td style={{ padding:'9px 12px' }}>{a.ficheCount||0}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700, color:'#16a34a' }}>
                      {fmt(a.vente||0)} G
                    </td>
                    <td style={{ padding:'9px 12px', color:'#dc2626', fontWeight:700 }}>
                      {fmt(a.gain||0)} G
                    </td>
                    <td style={{ padding:'9px 12px', fontWeight:900,
                      color: n>=0?'#16a34a':'#dc2626' }}>
                      {fmt(n)} G
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:'#f0f9ff', borderTop:'2px solid #e5e7eb' }}>
                <td colSpan={2} style={{ padding:'9px 12px', fontWeight:800, fontSize:13 }}>
                  TOTAL {sess.toUpperCase()}
                </td>
                <td style={{ padding:'9px 12px', fontWeight:900, color:'#16a34a' }}>
                  {fmt(tv)} G
                </td>
                <td style={{ padding:'9px 12px', fontWeight:900, color:'#dc2626' }}>
                  {fmt(tg)} G
                </td>
                <td style={{ padding:'9px 12px', fontWeight:900,
                  color: tn>=0?'#16a34a':'#dc2626' }}>
                  {fmt(tn)} G
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 8px 40px' }}>

        <div style={{ background:'linear-gradient(135deg,#f59e0b,#1e293b)',
          borderRadius:10, padding:'11px 20px', marginBottom:14,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:16, color:'white' }}>
            🌅🌙 Ventes Matin / Soir
          </span>
          <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        {/* FILTÈ */}
        <div style={{ background:'white', borderRadius:12, padding:16,
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:14 }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
            {[['Debut',debut,setDebut],['Fin',fin,setFin]].map(([l,v,s]) => (
              <div key={l}>
                <label style={{ display:'block', fontSize:11, fontWeight:700,
                  color:'#888', marginBottom:3 }}>{l}</label>
                <input type="date" value={v} onChange={e => s(e.target.value)}
                  style={{ padding:'8px 10px', border:'1.5px solid #ddd',
                    borderRadius:8, fontSize:12 }} />
              </div>
            ))}
            <button onClick={load} disabled={loading}
              style={{ padding:'8px 20px', background:'#1a73e8', color:'white',
                border:'none', borderRadius:8, fontWeight:700,
                cursor:'pointer', fontSize:13 }}>
              {loading ? '⏳' : '🔍 Chèche'}
            </button>
          </div>
        </div>

        {/* STATS GLOBAL */}
        {result && (
          <>
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
              {[
                ['🌅 Matin', fmt(totals.Matin.v), '#f59e0b'],
                ['🌙 Soir',  fmt(totals.Soir.v),  '#1e293b'],
                ['📊 Net',   fmt(tVente-tGain),
                  (tVente-tGain)>=0?'#16a34a':'#dc2626'],
              ].map(([l,v,c]) => (
                <div key={l} style={{ background:'white', borderRadius:10,
                  padding:'14px', textAlign:'center',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
                  borderTop:`3px solid ${c}` }}>
                  <div style={{ fontWeight:900, fontSize:18, color:c }}>{v} G</div>
                  <div style={{ fontSize:11, color:'#888', fontWeight:700 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* TABLOS PA SESYON */}
            <SessionTable sess="Matin" data={bySession.Matin} />
            <SessionTable sess="Soir"  data={bySession.Soir}  />

            {/* BILAN FINAL */}
            <div style={{ background:'#0f172a', borderRadius:12,
              padding:20, display:'flex',
              justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ color:'#94a3b8', fontSize:12, marginBottom:4 }}>
                  BILAN FINAL — {fmtD(debut)} → {fmtD(fin)}
                </div>
                <div style={{ color:'white', fontSize:13 }}>
                  Matin {fmt(totals.Matin.v)}G + Soir {fmt(totals.Soir.v)}G
                  = {fmt(tVente)}G Vente — {fmt(tGain)}G Ganyan
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontWeight:900, fontSize:28,
                  color:(tVente-tGain)>=0?'#4ade80':'#f87171' }}>
                  {fmt(Math.abs(tVente-tGain))} G
                </div>
                <div style={{ fontSize:12,
                  color:(tVente-tGain)>=0?'#4ade80':'#f87171',
                  fontWeight:700 }}>
                  {(tVente-tGain)>=0 ? '✅ BENEFIS' : '❌ DEFISI'}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
