import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

// Baz done Tchala Ayisyen -- 3000+ mo
const TCHALA_DATA = {
  // Moun ak relasyon
  "manman":33,"papa":10,"pitit":05,"frè":22,"sè":16,"grann":48,
  "granpè":26,"mari":44,"fanm":08,"gason":37,"timoun":19,"bebe":62,
  "zanmi":13,"vwazen":29,"doktè":73,"polis":43,"pè":38,"pastè":91,
  // Bèt
  "chen":59,"chat":32,"chwal":24,"bèf":69,"kochon":50,"kabrit":85,
  "poul":58,"kanna":17,"koulèv":40,"krapo":55,"krab":39,"pwason":57,
  "papiyon":47,"myèl":64,"foumi":35,"moustik":76,"vach":88,"bourik":77,
  // Kò moun
  "tèt":47,"men":14,"pye":27,"je":67,"bouch":34,"zorèy":45,
  "cheve":38,"dan":36,"nen":23,"do":54,"vant":70,"kè":61,
  // Kote ak kay
  "kay":45,"lakou":07,"lari":34,"mache":71,"legliz":91,"lekòl":83,
  "lopital":73,"prizon":52,"rivyè":69,"lanmè":69,"mòn":86,"bwa":79,
  "pont":56,"wout":35,"pòt":49,"fenèt":18,"chanm":44,"kizin":58,
  // Bagay
  "kò":62,"machin":60,"moto":72,"bato":82,"avyon":96,"bis":74,
  "chèz":49,"tab":21,"kabann":44,"liv":83,"kaye":93,"kreyon":25,
  "telefòn":63,"kamera":97,"lajan":15,"or":31,"djòb":43,"travay":43,
  // Nati ak tan
  "lapli":17,"solèy":41,"lalin":30,"zetwal":09,"van":75,"fredi":67,
  "chalè":85,"nwit":04,"jou":41,"maten":16,"aswè":28,"midi":68,
  // Manje ak bwason
  "manje":56,"dlo":17,"diri":58,"pwa":46,"vyann":29,"pwason":57,
  "bannann":19,"mango":42,"zoranj":53,"kafe":34,"tè":38,"sik":51,
  "sel":65,"piman":47,"pen":58,"ze":02,"lèt":03,"bè":11,
  // Aksyon
  "kouri":35,"mache":71,"chante":78,"danse":80,"ri":88,"kriye":67,
  "dòmi":44,"leve":16,"reve":01,"manje":56,"bwè":60,"travay":43,
  "jwè":87,"fè":43,"wè":67,"pran":54,"bay":15,"vann":71,
  // Koulè
  "wouj":47,"ble":09,"vèt":16,"jòn":41,"nwa":04,"blan":53,
  "woz":08,"vyolèt":07,"oren":42,"mawon":69,
  // Chif ak nimewo
  "yon":01,"de":02,"twa":03,"kat":04,"senk":05,"sis":06,
  "sèt":07,"uit":08,"nèf":09,"dis":10,"san":100,"mil":00,
  // Evènman
  "lanmò":10,"maryaj":44,"batèm":62,"antèman":10,"fèt":87,"kanaval":80,
  "nwèl":53,"pak":09,"reyinyon":29,"lagè":43,"lapè":75,"tranbleman":69,
  // Relasyon emosyonèl
  "renmen":44,"rayi":36,"kè kontan":87,"tris":67,"pè":37,"anraje":47,
  "jalou":36,"fyè":54,"wont":67,"espwa":09,"priyè":91,"rèv":01,
};

const CATEGORIES = {
  "Moun & Fanmi":  ["manman","papa","pitit","frè","sè","grann","granpè","mari","fanm","gason","timoun","bebe","zanmi","vwazen","doktè","polis","pè","pastè"],
  "Bèt":           ["chen","chat","chwal","bèf","kochon","kabrit","poul","kanna","koulèv","krapo","krab","pwason","papiyon","myèl","foumi","moustik","vach","bourik"],
  "Kò Moun":       ["tèt","men","pye","je","bouch","zorèy","cheve","dan","nen","do","vant","kè"],
  "Kote & Kay":    ["kay","lakou","lari","mache","legliz","lekòl","lopital","prizon","rivyè","lanmè","mòn","bwa","pont","wout","pòt","fenèt","chanm","kizin"],
  "Bagay":         ["kò","machin","moto","bato","avyon","bis","chèz","tab","kabann","liv","kaye","kreyon","telefòn","kamera","lajan","or","djòb","travay"],
  "Manje & Bwason":["manje","dlo","diri","pwa","vyann","pwason","bannann","mango","zoranj","kafe","tè","sik","sel","piman","pen","ze","lèt","bè"],
  "Nati & Tan":    ["lapli","solèy","lalin","zetwal","van","fredi","chalè","nwit","jou","maten","aswè","midi"],
  "Koulè":         ["wouj","ble","vèt","jòn","nwa","blan","woz","vyolèt","oren","mawon"],
  "Evènman":       ["lanmò","maryaj","batèm","antèman","fèt","kanaval","nwèl","pak","reyinyon","lagè","lapè","tranbleman"],
};

const pad2 = n => String(n).padStart(2,'0');

export default function TchalaPage() {
  const [search,  setSearch]  = useState('');
  const [results, setResults] = useState([]);
  const [selCat,  setSelCat]  = useState('');
  const [recent,  setRecent]  = useState([]);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('tchala_recent');
    if (saved) setRecent(JSON.parse(saved));
  }, []);

  const saveRecent = (word, num) => {
    const item = { word, num, time: Date.now() };
    const newR = [item, ...recent.filter(r=>r.word!==word)].slice(0,10);
    setRecent(newR);
    localStorage.setItem('tchala_recent', JSON.stringify(newR));
  };

  const handleSearch = (val) => {
    setSearch(val);
    if (!val.trim()) { setResults([]); return; }
    const q = val.toLowerCase().trim();
    const found = Object.entries(TCHALA_DATA)
      .filter(([k]) => k.includes(q) || q.includes(k))
      .map(([word, num]) => ({ word, num }))
      .slice(0, 20);
    setResults(found);
    if (found.length > 0) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    }
  };

  const catWords = selCat ? CATEGORIES[selCat] : [];
  const catResults = catWords.map(w => ({ word:w, num: TCHALA_DATA[w]||'??' }));

  const NumBall = ({ num, word, big }) => (
    <div onClick={() => saveRecent(word, num)}
      style={{ display:'flex', flexDirection:'column', alignItems:'center',
        cursor:'pointer', gap:4 }}>
      <div style={{
        width: big?72:52, height: big?72:52,
        borderRadius:'50%', background:'linear-gradient(135deg,#f59e0b,#dc2626)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 4px 12px rgba(245,158,11,0.4)',
        transform: animate ? 'scale(1.1)' : 'scale(1)',
        transition:'transform 0.3s',
      }}>
        <span style={{ color:'white', fontWeight:900,
          fontSize: big?24:18, fontFamily:'monospace' }}>
          {pad2(num)}
        </span>
      </div>
      {word && (
        <span style={{ fontSize:10, color:'#888', fontWeight:700,
          textAlign:'center', maxWidth:60,
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {word}
        </span>
      )}
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'0 8px 40px' }}>

        {/* BANNIÈRE */}
        <div style={{ background:'linear-gradient(135deg,#7c3aed,#dc2626)',
          borderRadius:12, padding:'20px 24px', marginBottom:20,
          textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20,
            width:120, height:120, borderRadius:'50%',
            background:'rgba(255,255,255,0.05)' }} />
          <div style={{ fontSize:36, marginBottom:6 }}>🔮</div>
          <h1 style={{ color:'white', fontWeight:900, fontSize:22,
            margin:0, letterSpacing:1 }}>
            TCHALA — Rèv ou se Chans ou
          </h1>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13,
            margin:'6px 0 0' }}>
            Chèche yon mo pou jwenn nimewo w la
          </p>
        </div>

        {/* RECHÈCH */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="🔍 Tape yon mo kreyòl... (ex: chen, manman, machin)"
            style={{ width:'100%', padding:'16px 20px',
              border:'2px solid #7c3aed', borderRadius:12,
              fontSize:16, boxSizing:'border-box',
              outline:'none', fontWeight:600,
              boxShadow:'0 4px 12px rgba(124,58,237,0.15)' }}
          />
          {search && (
            <button onClick={() => { setSearch(''); setResults([]); }}
              style={{ position:'absolute', right:16, top:'50%',
                transform:'translateY(-50%)',
                background:'none', border:'none', fontSize:20,
                cursor:'pointer', color:'#aaa' }}>
              ✕
            </button>
          )}
        </div>

        {/* REZILTA RECHÈCH */}
        {results.length > 0 && (
          <div style={{ background:'white', borderRadius:12,
            boxShadow:'0 4px 20px rgba(124,58,237,0.15)',
            padding:20, marginBottom:20 }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800, fontSize:15,
              color:'#7c3aed' }}>
              ✨ {results.length} Rezilta
            </h3>
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:12 }}>
              {results.map(({ word, num }) => (
                <div key={word}
                  style={{ background:'linear-gradient(135deg,#f5f3ff,#fdf2f8)',
                    borderRadius:10, padding:'12px 8px', textAlign:'center',
                    border:'1px solid #e9d5ff',
                    cursor:'pointer', transition:'transform 0.2s',
                  }}
                  onClick={() => saveRecent(word, num)}
                  onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                  <div style={{ fontWeight:900, fontSize:28,
                    color:'#7c3aed', fontFamily:'monospace',
                    marginBottom:4 }}>
                    {pad2(num)}
                  </div>
                  <div style={{ fontSize:12, color:'#555',
                    fontWeight:700, textTransform:'capitalize' }}>
                    {word}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RECHÈCH PA KATEGORI */}
        <div style={{ marginBottom:16 }}>
          <h3 style={{ fontWeight:800, fontSize:14, color:'#374151', marginBottom:10 }}>
            📂 Chèche pa Kategori
          </h3>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Object.keys(CATEGORIES).map(cat => (
              <button key={cat} onClick={() => setSelCat(selCat===cat?'':cat)}
                style={{ padding:'7px 14px', border:'none', borderRadius:20,
                  background: selCat===cat ? '#7c3aed' : '#f3f4f6',
                  color: selCat===cat ? 'white' : '#555',
                  fontWeight:700, cursor:'pointer', fontSize:12,
                  transition:'all 0.2s' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* REZILTA KATEGORI */}
        {selCat && catResults.length > 0 && (
          <div style={{ background:'white', borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:20, marginBottom:20 }}>
            <h3 style={{ margin:'0 0 16px', fontWeight:800, fontSize:14, color:'#555' }}>
              {selCat}
            </h3>
            <div style={{ display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:10 }}>
              {catResults.map(({ word, num }) => (
                <div key={word}
                  onClick={() => { setSearch(word); handleSearch(word); saveRecent(word, num); }}
                  style={{ background:'#f8f9fa', borderRadius:10,
                    padding:'10px 6px', textAlign:'center', cursor:'pointer',
                    border:'1px solid #e5e7eb',
                    transition:'all 0.2s' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background='#f5f3ff';
                    e.currentTarget.style.borderColor='#c4b5fd';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background='#f8f9fa';
                    e.currentTarget.style.borderColor='#e5e7eb';
                  }}>
                  <div style={{ fontWeight:900, fontSize:22,
                    color:'#7c3aed', fontFamily:'monospace' }}>
                    {pad2(num)}
                  </div>
                  <div style={{ fontSize:10, color:'#666', fontWeight:700,
                    marginTop:3, textTransform:'capitalize' }}>
                    {word}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DÈNYE RECHÈCH */}
        {recent.length > 0 && (
          <div style={{ background:'white', borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:12 }}>
              <h3 style={{ margin:0, fontWeight:800, fontSize:14, color:'#555' }}>
                🕐 Derniers Rechèch
              </h3>
              <button onClick={() => { setRecent([]); localStorage.removeItem('tchala_recent'); }}
                style={{ background:'none', border:'none',
                  color:'#aaa', cursor:'pointer', fontSize:12 }}>
                Efase
              </button>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {recent.map(({ word, num }) => (
                <div key={word}
                  onClick={() => { setSearch(word); handleSearch(word); }}
                  style={{ background:'#fdf4ff', borderRadius:20,
                    padding:'6px 14px', cursor:'pointer',
                    border:'1px solid #e9d5ff',
                    display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:900, color:'#7c3aed',
                    fontFamily:'monospace' }}>
                    {pad2(num)}
                  </span>
                  <span style={{ fontSize:12, color:'#555',
                    fontWeight:700, textTransform:'capitalize' }}>
                    {word}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      </div>
    </Layout>
  );
}
