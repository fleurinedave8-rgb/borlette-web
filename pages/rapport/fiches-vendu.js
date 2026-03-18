import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const fmt  = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtD = d => {
  if(!d)return'—';
  const dt=new Date(d),p=n=>String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
};

const TYPE_L = {P0:'BORLETTE',P1:'LOTO3-P1',P2:'LOTO3-P2',P3:'LOTO3-P3',
  MAR:'MARIAGE',L4:'LOTO4',MG:'MAR.GRAT',TF:'TÈT FICH'};
const TYPE_C = {P0:'#16a34a',P1:'#1a73e8',P2:'#7c3aed',P3:'#f59e0b',
  MAR:'#dc2626',L4:'#0891b2',MG:'#ec4899',TF:'#374151'};

const TIRAGES = ['Tout','Florida matin','Florida soir','New-york matin',
  'New-york soir','Georgia-Matin','Georgia-Soir','Ohio matin','Ohio soir'];
const STATUTS = ['Tout','actif','gagnant','elimine'];

export default function FichesVendu() {
  const today = new Date().toISOString().split('T')[0];
  const [debut,   setDebut]   = useState(today);
  const [fin,     setFin]     = useState(today);
  const [tirage,  setTirage]  = useState('Tout');
  const [statut,  setStatut]  = useState('Tout');
  const [search,  setSearch]  = useState('');
  const [fiches,  setFiches]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [selFich, setSelFich] = useState(null);
  const [page,    setPage]    = useState(0);
  const PER = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = { debut, fin };
      if (tirage!=='Tout') params.tirage = tirage;
      if (statut!=='Tout') params.statut = statut;
      if (search) params.ticket = search;
      const r = await api.get('/api/admin/fiches', { params });
      setFiches(Array.isArray(r.data) ? r.data : (r.data?.fiches||[]));
      setPage(0);
    } catch { setFiches([]); }
    setLoading(false);
  };

  const tVente  = fiches.reduce((s,f)=>s+(f.total||0),0);
  const tGanyan = fiches.filter(f=>f.statut==='gagnant').reduce((s,f)=>s+(f.gainTotal||f.montantGagne||0),0);
  const tElim   = fiches.filter(f=>f.statut==='elimine').length;

  const filtered = fiches.filter(f=>
    !search || String(f.ticket||'').includes(search) ||
    String(f.tirage||'').toLowerCase().includes(search.toLowerCase())
  );
  const pages = Math.ceil(filtered.length/PER);
  const paged = filtered.slice(page*PER,(page+1)*PER);

  const ST_STYLE = {
    gagnant:{bg:'#dcfce7',color:'#166534'},
    elimine:{bg:'#fee2e2',color:'#991b1b'},
    actif:  {bg:'#eff6ff',color:'#1d4ed8'},
  };

  return (
    <Layout>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 8px 40px'}}>

        <div style={{background:'#1a73e8',borderRadius:10,
          padding:'11px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:900,fontSize:16,color:'white'}}>🎫 Fiches Vendu</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.7)',fontWeight:700}}>
            LA-PROBITE-BORLETTE
          </span>
        </div>

        {/* FILTÈ */}
        <div style={{background:'white',borderRadius:12,padding:16,
          boxShadow:'0 1px 4px rgba(0,0,0,0.08)',marginBottom:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',
            gap:10,alignItems:'flex-end',flexWrap:'wrap'}}>
            {[['Debut',debut,setDebut,'date'],['Fin',fin,setFin,'date']].map(([l,v,s,t])=>(
              <div key={l}>
                <label style={{display:'block',fontSize:11,fontWeight:700,color:'#888',marginBottom:3}}>{l}</label>
                <input type={t} value={v} onChange={e=>s(e.target.value)}
                  style={{width:'100%',padding:'8px 10px',border:'1.5px solid #ddd',
                    borderRadius:8,fontSize:12,boxSizing:'border-box'}} />
              </div>
            ))}
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'#888',marginBottom:3}}>Tiraj</label>
              <select value={tirage} onChange={e=>setTirage(e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid #ddd',borderRadius:8,fontSize:12}}>
                {TIRAGES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:'block',fontSize:11,fontWeight:700,color:'#888',marginBottom:3}}>Statut</label>
              <select value={statut} onChange={e=>setStatut(e.target.value)}
                style={{width:'100%',padding:'8px 10px',border:'1.5px solid #ddd',borderRadius:8,fontSize:12}}>
                {STATUTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={load} disabled={loading}
              style={{padding:'8px 20px',background:'#1a73e8',color:'white',
                border:'none',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:13}}>
              {loading?'⏳':'🔍'}
            </button>
          </div>

          <div style={{marginTop:10}}>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="🔍 Chèche pa nimewo ticket..."
              style={{width:'100%',padding:'8px 12px',border:'1.5px solid #ddd',
                borderRadius:8,fontSize:13,boxSizing:'border-box'}} />
          </div>
        </div>

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
          {[
            ['Total Fiches', filtered.length, '#1a73e8'],
            ['Vente Total', `${fmt(tVente)}G`, '#16a34a'],
            ['Ganyan Total', `${fmt(tGanyan)}G`, '#dc2626'],
            ['Elimine', tElim, '#f59e0b'],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:'white',borderRadius:10,padding:'12px 10px',
              textAlign:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
              borderTop:`3px solid ${c}`}}>
              <div style={{fontWeight:900,fontSize:16,color:c}}>{v}</div>
              <div style={{fontSize:10,color:'#888',fontWeight:700}}>{l}</div>
            </div>
          ))}
        </div>

        {/* TABLO + DETAY */}
        <div style={{display:'grid',
          gridTemplateColumns: selFich ? '1fr 380px' : '1fr',
          gap:12,alignItems:'start'}}>

          {/* Tablo fiches */}
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#f8f9fa',borderBottom:'2px solid #e5e7eb'}}>
                  {['Ticket','Tiraj','Ajan','Total','Dat','Statut'].map(h=>(
                    <th key={h} style={{padding:'10px 12px',fontWeight:700,
                      fontSize:11,color:'#555',textAlign:'left'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{padding:32,textAlign:'center',color:'#888'}}>⏳ Ap chaje...</td></tr>
                ) : paged.length===0 ? (
                  <tr><td colSpan={6} style={{padding:32,textAlign:'center',color:'#aaa'}}>
                    Pa gen fich — klike 🔍 pou chèche
                  </td></tr>
                ) : paged.map((f,i)=>{
                  const st = f.statut||'actif';
                  const stS = ST_STYLE[st]||ST_STYLE.actif;
                  const isSel = selFich?._id===f._id;
                  return (
                    <tr key={f._id||i} onClick={()=>setSelFich(isSel?null:f)}
                      style={{borderBottom:'1px solid #f0f0f0',cursor:'pointer',
                        background:isSel?'#eff6ff':i%2===0?'white':'#fafafa'}}>
                      <td style={{padding:'9px 12px',fontFamily:'monospace',
                        color:'#f59e0b',fontWeight:700}}>{f.ticket}</td>
                      <td style={{padding:'9px 12px',fontSize:12}}>{f.tirage||'—'}</td>
                      <td style={{padding:'9px 12px',fontSize:12,color:'#666'}}>
                        {f.agent||f.agentUsername||'—'}
                      </td>
                      <td style={{padding:'9px 12px',fontWeight:700,color:'#16a34a'}}>
                        {fmt(f.total||0)}G
                      </td>
                      <td style={{padding:'9px 12px',fontSize:11,color:'#888'}}>
                        {fmtD(f.dateVente||f.createdAt)}
                      </td>
                      <td style={{padding:'9px 12px'}}>
                        <span style={{background:stS.bg,color:stS.color,
                          borderRadius:20,padding:'2px 8px',
                          fontSize:10,fontWeight:700}}>
                          {st}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pages>1 && (
              <div style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'10px 16px',
                borderTop:'1px solid #f0f0f0',fontSize:12,color:'#666'}}>
                <span>{page*PER+1}–{Math.min((page+1)*PER,filtered.length)} / {filtered.length}</span>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                    style={{padding:'4px 12px',border:'1px solid #ddd',borderRadius:6,
                      background:'white',cursor:'pointer',color:page===0?'#ccc':'#333'}}>←</button>
                  <button onClick={()=>setPage(p=>Math.min(pages-1,p+1))} disabled={page>=pages-1}
                    style={{padding:'4px 12px',border:'1px solid #ddd',borderRadius:6,
                      background:'white',cursor:'pointer',color:page>=pages-1?'#ccc':'#333'}}>→</button>
                </div>
              </div>
            )}
          </div>

          {/* DETAY FICH */}
          {selFich && (
            <div style={{background:'white',borderRadius:12,
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
              position:'sticky',top:16}}>

              <div style={{background:'#1a73e8',borderRadius:'12px 12px 0 0',
                padding:'12px 16px',display:'flex',
                justifyContent:'space-between',alignItems:'center'}}>
                <span style={{color:'white',fontWeight:900,fontSize:14}}>
                  🎫 #{selFich.ticket}
                </span>
                <button onClick={()=>setSelFich(null)}
                  style={{background:'none',border:'none',color:'white',
                    fontSize:18,cursor:'pointer'}}>✕</button>
              </div>

              <div style={{padding:16}}>
                {/* Info jeneral */}
                {[
                  ['Tiraj',  selFich.tirage||'—'],
                  ['Ajan',   selFich.agent||selFich.agentUsername||'—'],
                  ['Dat',    fmtD(selFich.dateVente||selFich.createdAt)],
                  ['Statut', selFich.statut||'actif'],
                ].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',
                    padding:'6px 0',borderBottom:'1px solid #f0f0f0',fontSize:13}}>
                    <span style={{color:'#888',fontWeight:700}}>{l}:</span>
                    <span style={{fontWeight:700}}>{v}</span>
                  </div>
                ))}

                {/* BOUL YO — menm jan ak ticket */}
                <div style={{margin:'14px 0 10px',fontWeight:800,fontSize:12,
                  color:'#333',textTransform:'uppercase',letterSpacing:0.5}}>
                  Boul Jwe
                </div>

                <div style={{background:'#f8f9fa',borderRadius:8,overflow:'hidden'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{background:'#1e293b'}}>
                        {['Kalite','Boul','Mise','Gain'].map(h=>(
                          <th key={h} style={{padding:'7px 10px',color:'white',
                            fontWeight:700,fontSize:11,textAlign:'left'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selFich.rows||selFich.boul||[]).map((r,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #e5e7eb',
                          background:i%2===0?'white':'#f9fafb'}}>
                          <td style={{padding:'7px 10px',
                            color:TYPE_C[r.type]||'#333',fontWeight:800,fontSize:11}}>
                            {TYPE_L[r.type]||r.type||'—'}
                          </td>
                          <td style={{padding:'7px 10px',fontFamily:'monospace',
                            fontWeight:900,fontSize:15}}>
                            {r.boule||r.numero||'—'}
                          </td>
                          <td style={{padding:'7px 10px',fontWeight:700,
                            color:r.gratuit?'#dc2626':'#16a34a'}}>
                            {r.gratuit?'GRATUI':`${fmt(r.mise||0)}G`}
                          </td>
                          <td style={{padding:'7px 10px',fontWeight:700,
                            color:r.gain>0?'#dc2626':'#ccc'}}>
                            {r.gain>0?`${fmt(r.gain)}G`:'—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div style={{background:'#1e293b',borderRadius:8,
                  padding:'10px 14px',marginTop:10,
                  display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{color:'white',fontWeight:800,fontSize:13}}>
                    TOTAL MISE:
                  </span>
                  <span style={{color:'#f59e0b',fontWeight:900,fontSize:18}}>
                    {fmt(selFich.total||0)}G
                  </span>
                </div>

                {/* Si ganyan */}
                {selFich.statut==='gagnant' && (
                  <div style={{background:'#dcfce7',borderRadius:8,
                    padding:'10px 14px',marginTop:8,
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    border:'2px solid #16a34a'}}>
                    <span style={{color:'#166534',fontWeight:800,fontSize:13}}>
                      🏆 GANYAN:
                    </span>
                    <span style={{color:'#16a34a',fontWeight:900,fontSize:18}}>
                      {fmt(selFich.gainTotal||selFich.montantGagne||0)}G
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
