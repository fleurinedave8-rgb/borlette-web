import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const PRIMES = ['50|20|10','60|20|10','70|25|15','50|15|5'];
const fmt = n => Number(n||0).toLocaleString('fr-HT');

const DEF = {
  posId:'', nom:'', adresse:'', telephone:'',
  agentUsername:'', succursale:'', credit:'Illimité',
  prime:'50|20|10', logo:'',
  tete_ligne1:'', tete_ligne2:'', tete_ligne3:'',
  messageAdmin:'', newPassword:'', confirmPassword:'',
};

export default function PosPage() {
  const [pos,     setPos]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editPos, setEditPos] = useState(null);
  const [form,    setForm]    = useState(DEF);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ t:'', ok:true });
  const [delConf, setDelConf] = useState(null);
  const fileRef = useRef();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/pos');
      setPos(Array.isArray(r.data) ? r.data : []);
    } catch { setPos([]); }
    setLoading(false);
  };

  const notify = (t, ok=true) => {
    setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3500);
  };

  const openAdd = () => { setForm(DEF); setEditPos(null); setShowAdd(true); };

  const openEdit = p => {
    setForm({
      posId:        p.posId||'',
      nom:          p.nom||'',
      adresse:      p.adresse||'',
      telephone:    p.telephone||'',
      agentUsername:p.agentUsername||'',
      succursale:   p.succursale||'',
      credit:       p.credit||'Illimité',
      prime:        p.prime||'50|20|10',
      logo:         p.logo||'',
      tete_ligne1:  p.tete?.ligne1||p.nom||'',
      tete_ligne2:  p.tete?.ligne2||p.adresse||'',
      tete_ligne3:  p.tete?.ligne3||p.telephone||'',
      messageAdmin: p.messageAdmin||'',
      newPassword:  '', confirmPassword:'',
    });
    setEditPos(p); setShowAdd(true);
  };

  // Upload imaj depi galerie (fichye lokal)
  const handleLogoUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { notify('⚠️ Imaj twò gwo (max 500KB)', false); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f=>({...f, logo: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.posId.trim() || !form.nom.trim()) {
      notify('⚠️ POS ID ak Non obligatwa!', false); return;
    }
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      notify('⚠️ Modpas yo pa menm!', false); return;
    }
    if (form.newPassword && form.newPassword.length < 4) {
      notify('⚠️ Modpas min 4 karaktè!', false); return;
    }
    setSaving(true);
    try {
      const { newPassword, confirmPassword, ...formData } = form;
      const payload = {
        ...formData,
        prime: form.prime || '50|20|10',
        actif: true,
        tete: {
          ligne1: form.tete_ligne1 || form.nom,
          ligne2: form.tete_ligne2 || form.adresse,
          ligne3: form.tete_ligne3 || form.telephone,
          ligne4: 'Fich sa valid pou 90 jou',
        },
      };

      if (editPos) {
        await api.put(`/api/admin/pos/${editPos._id}`, payload);
        // Chanje modpas ajan si nesesè
        if (form.newPassword && form.agentUsername) {
          try {
            const agRes = await api.get('/api/admin/agents');
            const agent = (agRes.data||[]).find(a=>a.username===form.agentUsername);
            if (agent) {
              await api.put(`/api/admin/agents/${agent.id||agent._id}`,
                { password: form.newPassword });
            }
          } catch {}
        }
        notify('✅ POS modifye!');
      } else {
        await api.post('/api/admin/pos', payload);
        notify('✅ POS kreye!');
      }
      setShowAdd(false); await load();
    } catch(e) {
      notify(`❌ ${e?.response?.data?.message||'Erè sèvè'}`, false);
    }
    setSaving(false);
  };

  const handleToggle = async p => {
    try { await api.put(`/api/admin/pos/${p._id}/toggle`); await load(); }
    catch { notify('❌ Erè', false); }
  };

  const handleDelete = async p => {
    try { await api.delete(`/api/admin/pos/${p._id}`); setDelConf(null); await load(); notify('🗑️ POS efase'); }
    catch { notify('❌ Erè', false); }
  };

  const fiveMin = Date.now()-5*60*1000;
  const filtered = pos
    .filter(p=>!search||[p.nom,p.posId,p.agentUsername,p.succursale]
      .some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));

  const nbActif = pos.filter(p=>p.actif!==false).length;
  const nbConn  = pos.filter(p=>p.lastSeen&&new Date(p.lastSeen).getTime()>fiveMin).length;

  const inp = (key,label,type='text',ph='') => (
    <div style={{marginBottom:12}}>
      <label style={{display:'block',fontWeight:700,fontSize:12,marginBottom:4,color:'#555'}}>{label}</label>
      <input type={type} value={form[key]||''} placeholder={ph}
        onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
        style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',
          borderRadius:8,fontSize:14,boxSizing:'border-box'}} />
    </div>
  );

  return (
    <Layout>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 8px 40px'}}>

        {/* BANNIÈRE */}
        <div style={{background:'linear-gradient(135deg,#1e293b,#0f172a)',
          borderRadius:12,padding:'14px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#f59e0b',fontWeight:900,fontSize:18}}>🖥️ JESYON POS</div>
            <div style={{color:'rgba(255,255,255,0.5)',fontSize:12}}>LA-PROBITE-BORLETTE</div>
          </div>
          <button onClick={openAdd}
            style={{background:'#f59e0b',color:'#111',border:'none',
              borderRadius:10,padding:'10px 18px',fontWeight:900,fontSize:13,cursor:'pointer'}}>
            ➕ Ajoute POS
          </button>
        </div>

        {msg.t && (
          <div style={{background:msg.ok?'#dcfce7':'#fee2e2',
            border:`1.5px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color:msg.ok?'#166534':'#991b1b',
            padding:'10px 16px',borderRadius:10,marginBottom:12,fontWeight:700}}>
            {msg.t}
          </div>
        )}

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          {[
            {v:pos.length,  l:'Total POS', c:'#1a73e8'},
            {v:nbActif,     l:'✅ Aktif',   c:'#16a34a'},
            {v:pos.length-nbActif,l:'❌ Inaktif',c:'#dc2626'},
            {v:nbConn,      l:'🟢 Konekte', c:'#7c3aed'},
          ].map(st=>(
            <div key={st.l} style={{background:'white',borderRadius:10,
              padding:'12px 10px',textAlign:'center',
              boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
              borderTop:`3px solid ${st.c}`}}>
              <div style={{fontWeight:900,fontSize:22,color:st.c}}>{st.v}</div>
              <div style={{fontSize:10,color:'#888',fontWeight:700}}>{st.l}</div>
            </div>
          ))}
        </div>

        {/* RECHÈCH */}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Rechèch pa non, ID, ajan..."
          style={{width:'100%',padding:'10px 14px',border:'1.5px solid #ddd',
            borderRadius:10,fontSize:13,marginBottom:12,boxSizing:'border-box'}} />

        {/* LIS POS */}
        {loading ? (
          <div style={{textAlign:'center',padding:48,color:'#888'}}>⏳ Ap chaje...</div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:'center',padding:48,background:'white',
            borderRadius:12,color:'#aaa'}}>Pa gen POS</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
            {filtered.map(p=>{
              const conn = p.lastSeen&&new Date(p.lastSeen).getTime()>fiveMin;
              const prParts = String(p.prime||'50|20|10').split('|');
              return (
                <div key={p._id} style={{background:'white',borderRadius:12,padding:16,
                  boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft:`5px solid ${conn?'#16a34a':p.actif!==false?'#1a73e8':'#dc2626'}`}}>

                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                    {/* Logo */}
                    <div style={{width:48,height:48,borderRadius:10,overflow:'hidden',
                      flexShrink:0,background:'#f1f5f9',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      border:'2px solid #e5e7eb'}}>
                      {p.logo
                        ? <img src={p.logo} alt="logo"
                            style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        : <span style={{fontWeight:900,fontSize:18,color:'#94a3b8'}}>
                            {(p.nom||'?')[0].toUpperCase()}
                          </span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:900,fontSize:15,color:'#111',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {p.nom}
                      </div>
                      <div style={{fontFamily:'monospace',fontSize:11,color:'#1a73e8',fontWeight:700}}>
                        {p.posId}
                      </div>
                    </div>
                    <span style={{background:p.actif!==false?'#dcfce7':'#fee2e2',
                      color:p.actif!==false?'#16a34a':'#dc2626',
                      borderRadius:20,padding:'2px 8px',fontSize:10,fontWeight:800}}>
                      {p.actif!==false?'✅':'❌'}
                    </span>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,
                    fontSize:11,marginBottom:12}}>
                    {[
                      ['👤 Ajan',  p.agentUsername||'—'],
                      ['📍 Adrès', p.adresse||'—'],
                      ['📞 Tél',   p.telephone||'—'],
                      ['🏢 Sucursal',p.succursale||'—'],
                    ].map(([l,v])=>(
                      <div key={l} style={{background:'#f8f9fa',borderRadius:6,padding:'5px 8px'}}>
                        <div style={{color:'#888',marginBottom:1,fontSize:10}}>{l}</div>
                        <div style={{fontWeight:700,color:'#374151',
                          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Prime badge */}
                  <div style={{background:'#fff7ed',borderRadius:8,padding:'6px 10px',
                    marginBottom:10,display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:10,color:'#ea580c',fontWeight:700}}>🎯 Prime:</span>
                    {['1e','2e','3e'].map((pos,i)=>(
                      prParts[i] ? (
                        <span key={pos} style={{background:'#ea580c',color:'white',
                          borderRadius:6,padding:'2px 6px',fontSize:11,fontWeight:900}}>
                          {pos} ×{prParts[i]}
                        </span>
                      ) : null
                    ))}
                  </div>

                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>openEdit(p)}
                      style={{flex:1,background:'#1a73e8',color:'white',border:'none',
                        borderRadius:8,padding:'9px',fontWeight:700,cursor:'pointer',fontSize:12}}>
                      ✏️ Modifye
                    </button>
                    <button onClick={()=>handleToggle(p)}
                      style={{flex:1,background:p.actif!==false?'#fef9c3':'#dcfce7',
                        color:p.actif!==false?'#854d0e':'#166534',border:'none',
                        borderRadius:8,padding:'9px',fontWeight:700,cursor:'pointer',fontSize:12}}>
                      {p.actif!==false?'🔒':'🔓'}
                    </button>
                    <button onClick={()=>setDelConf(p)}
                      style={{background:'#fee2e2',color:'#dc2626',border:'none',
                        borderRadius:8,padding:'9px 12px',fontWeight:700,cursor:'pointer',fontSize:14}}>
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ MODAL KREYE/MODIFYE ═══ */}
        {showAdd && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',
            zIndex:2000,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
            onClick={()=>setShowAdd(false)}>
            <div style={{background:'white',borderRadius:'20px 20px 0 0',
              width:'100%',maxWidth:600,maxHeight:'92vh',overflowY:'auto',padding:'0 0 50px'}}
              onClick={e=>e.stopPropagation()}>

              <div style={{position:'sticky',top:0,background:'white',
                padding:'14px 20px',borderBottom:'1px solid #f0f0f0',
                display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:10}}>
                <div style={{fontWeight:900,fontSize:17}}>
                  {editPos?`✏️ Modifye: ${editPos.nom}`:'➕ Nouvo POS'}
                </div>
                <button onClick={()=>setShowAdd(false)}
                  style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#888'}}>
                  ✕
                </button>
              </div>

              <div style={{padding:'16px 20px'}}>

                {/* LOGO — Galerie */}
                <div style={{marginBottom:16}}>
                  <label style={{display:'block',fontWeight:700,fontSize:12,marginBottom:6,color:'#555'}}>
                    🖼️ Logo POS (opsyonèl)
                  </label>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:64,height:64,borderRadius:10,background:'#f1f5f9',
                      border:'2px dashed #ddd',display:'flex',alignItems:'center',
                      justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                      {form.logo
                        ? <img src={form.logo} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        : <span style={{fontSize:28,color:'#ccc'}}>🖥️</span>}
                    </div>
                    <div>
                      {/* Bouton pou ouvri galerie */}
                      <input type="file" ref={fileRef} style={{display:'none'}}
                        accept="image/*" onChange={handleLogoUpload} />
                      <button onClick={()=>fileRef.current?.click()}
                        style={{background:'#1a73e8',color:'white',border:'none',
                          borderRadius:8,padding:'8px 16px',fontWeight:700,
                          cursor:'pointer',fontSize:12,marginBottom:4,display:'block'}}>
                        📁 Chwazi nan Galerie
                      </button>
                      {form.logo && (
                        <button onClick={()=>setForm(f=>({...f,logo:''}))}
                          style={{background:'#fee2e2',color:'#dc2626',border:'none',
                            borderRadius:8,padding:'6px 12px',fontWeight:700,
                            cursor:'pointer',fontSize:11}}>
                          ✕ Retire Logo
                        </button>
                      )}
                      <div style={{fontSize:10,color:'#888',marginTop:4}}>
                        PNG, JPG — Max 500KB
                      </div>
                    </div>
                  </div>
                </div>

                {/* INFO DEBAZ */}
                <div style={{fontWeight:800,fontSize:13,color:'#1a73e8',
                  marginBottom:10,paddingBottom:6,borderBottom:'2px solid #eff6ff'}}>
                  📋 Enfòmasyon Debaz
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {inp('posId','POS ID *','text','ex: POS-001')}
                  {inp('nom','Non POS *','text','ex: POS Delmas')}
                </div>
                {inp('adresse','Adrès','text','ex: Rue Delmas 31')}
                {inp('telephone','Téléfòn','tel','ex: 509-3700-0000')}
                {inp('succursale','Succursale','text','ex: Central')}
                {inp('agentUsername','Username Ajan','text','ex: dave')}
                {inp('credit','Kredi','text','Illimité')}

                {/* PRIME */}
                <div style={{fontWeight:800,fontSize:13,color:'#ea580c',
                  margin:'14px 0 10px',paddingBottom:6,borderBottom:'2px solid #fff7ed'}}>
                  🎯 Prime (1e / 2e / 3e pozisyon)
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:8}}>
                    {PRIMES.map(p=>(
                      <button key={p} onClick={()=>setForm(f=>({...f,prime:p}))}
                        style={{padding:'8px 4px',border:'none',borderRadius:8,
                          background:form.prime===p?'#ea580c':'#f3f4f6',
                          color:form.prime===p?'white':'#333',
                          fontWeight:700,cursor:'pointer',fontSize:12}}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <input value={form.prime||''} placeholder="ex: 50|20|10"
                    onChange={e=>setForm(f=>({...f,prime:e.target.value}))}
                    style={{width:'100%',padding:'10px 12px',
                      border:'1.5px solid #ea580c',borderRadius:8,
                      fontSize:14,fontFamily:'monospace',fontWeight:700,
                      boxSizing:'border-box',color:'#ea580c'}} />
                  {form.prime && (
                    <div style={{background:'#fff7ed',borderRadius:6,
                      padding:'6px 10px',marginTop:6,fontSize:12,color:'#9a3412'}}>
                      Preview 10G: {String(form.prime).split('|').map((v,i)=>(
                        <span key={i} style={{marginRight:10,fontWeight:700}}>
                          {['1e','2e','3e'][i]}: {10*Number(v)||0}G
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* TÈT FICH */}
                <div style={{fontWeight:800,fontSize:13,color:'#7c3aed',
                  margin:'14px 0 10px',paddingBottom:6,borderBottom:'2px solid #f5f3ff'}}>
                  🖨️ Tèt Fich (Enpresyon)
                </div>
                {inp('tete_ligne1','Liy 1 — Non','text',form.nom||'Non POS')}
                {inp('tete_ligne2','Liy 2 — Adrès','text',form.adresse||'Adrès')}
                {inp('tete_ligne3','Liy 3 — Téléfòn','text',form.telephone||'Téléfòn')}

                {/* MESAJ */}
                <div style={{fontWeight:800,fontSize:13,color:'#f59e0b',
                  margin:'14px 0 10px',paddingBottom:6,borderBottom:'2px solid #fefce8'}}>
                  📢 Mesaj Admin
                </div>
                <div style={{marginBottom:14}}>
                  <textarea value={form.messageAdmin||''}
                    onChange={e=>setForm(f=>({...f,messageAdmin:e.target.value}))}
                    placeholder="Mesaj pou ajan an..."
                    rows={2}
                    style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',
                      borderRadius:8,fontSize:14,boxSizing:'border-box',
                      resize:'vertical',fontFamily:'inherit'}} />
                </div>

                {/* MODPAS */}
                <div style={{fontWeight:800,fontSize:13,color:'#dc2626',
                  margin:'14px 0 10px',paddingBottom:6,borderBottom:'2px solid #fef2f2'}}>
                  🔐 Modpas Ajan {editPos?'(opsyonèl)':''}
                </div>
                {!editPos && (
                  <div style={{background:'#fef9c3',border:'1px solid #fde68a',
                    borderRadius:8,padding:'10px 14px',marginBottom:12,
                    fontSize:12,color:'#854d0e',fontWeight:700}}>
                    ℹ️ Apre kreye POS la, itilize bouton ✏️ Modifye pou mete modpas ajan an.
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:6}}>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:12,marginBottom:4,color:'#555'}}>
                      Nouvo Modpas
                    </label>
                    <input type="password" value={form.newPassword||''}
                      onChange={e=>setForm(f=>({...f,newPassword:e.target.value}))}
                      placeholder="Min 4 karaktè"
                      style={{width:'100%',padding:'10px 12px',border:'1.5px solid #ddd',
                        borderRadius:8,fontSize:14,boxSizing:'border-box'}} />
                  </div>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:12,marginBottom:4,color:'#555'}}>
                      Konfime Modpas
                    </label>
                    <input type="password" value={form.confirmPassword||''}
                      onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))}
                      placeholder="Repete modpas"
                      style={{width:'100%',padding:'10px 12px',
                        border: form.confirmPassword&&form.confirmPassword!==form.newPassword
                          ?'1.5px solid #dc2626'
                          :form.confirmPassword&&form.confirmPassword===form.newPassword
                          ?'1.5px solid #16a34a':'1.5px solid #ddd',
                        borderRadius:8,fontSize:14,boxSizing:'border-box'}} />
                  </div>
                </div>
                {form.confirmPassword&&form.confirmPassword!==form.newPassword&&(
                  <div style={{color:'#dc2626',fontSize:12,fontWeight:700,marginBottom:8}}>
                    ❌ Modpas yo pa menm!
                  </div>
                )}

                <button onClick={handleSave} disabled={saving}
                  style={{width:'100%',padding:'14px',
                    background:saving?'#ccc':editPos?'#1a73e8':'#16a34a',
                    color:'white',border:'none',borderRadius:12,
                    fontWeight:900,fontSize:15,cursor:saving?'default':'pointer',marginTop:8}}>
                  {saving?'⏳ Ap sove...':editPos?'✅ Sove Modifikasyon':'✅ Kreye POS'}
                </button>

              </div>
            </div>
          </div>
        )}

        {/* KONFIRMASYON EFASE */}
        {delConf && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',
            zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
            onClick={()=>setDelConf(null)}>
            <div style={{background:'white',borderRadius:16,padding:28,
              maxWidth:360,width:'100%',textAlign:'center'}}
              onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:44,marginBottom:12}}>🗑️</div>
              <div style={{fontWeight:900,fontSize:17,marginBottom:8}}>Efase POS sa?</div>
              <div style={{color:'#555',fontSize:13,marginBottom:6}}>
                <strong>{delConf.nom}</strong> — {delConf.posId}
              </div>
              <div style={{color:'#dc2626',fontSize:12,marginBottom:20,fontWeight:700}}>
                ⚠️ Aksyon sa pa ka defèt!
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setDelConf(null)}
                  style={{flex:1,padding:'11px',background:'#f3f4f6',border:'none',
                    borderRadius:10,fontWeight:700,cursor:'pointer'}}>
                  Anile
                </button>
                <button onClick={()=>handleDelete(delConf)}
                  style={{flex:1,padding:'11px',background:'#dc2626',color:'white',
                    border:'none',borderRadius:10,fontWeight:900,cursor:'pointer'}}>
                  Efase
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
