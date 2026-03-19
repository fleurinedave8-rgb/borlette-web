import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const PRIMES_DEFOLT = ['50|20|10','60|20|10','70|25|15','50|15|5'];

const DEF = {
  posId:'', nom:'', adresse:'', telephone:'',
  nomAgent:'', prenomAgent:'', agentUsername:'',
  succursale:'', credit:'Illimité', balanceGain:'Illimité',
  prime:'50|20|10', logo:'', agentPct:0, supPct:0,
  tete_ligne1:'', tete_ligne2:'', tete_ligne3:'',
  messageAdmin:'', newPassword:'', confirmPassword:'',
};

const inp = (form, setForm, key, label, type='text', ph='') => (
  <div style={{marginBottom:11}}>
    <label style={{display:'block',fontWeight:700,fontSize:11,
      color:'#555',marginBottom:3}}>{label}</label>
    <input type={type} value={form[key]||''} placeholder={ph}
      onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
      style={{width:'100%',padding:'9px 12px',
        border:'1.5px solid #ddd',borderRadius:8,
        fontSize:13,boxSizing:'border-box'}} />
  </div>
);

export default function PosPage() {
  const [pos,     setPos]     = useState([]);
  const [agents,  setAgents]  = useState([]);
  const [succs,   setSuccs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [tab,     setTab]     = useState('actif');
  const [showAdd, setShowAdd] = useState(false);
  const [editPos, setEditPos] = useState(null);
  const [form,    setForm]    = useState(DEF);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({t:'',ok:true});
  const [delConf, setDelConf] = useState(null);
  const fileRef = useRef();

  useEffect(()=>{ loadAll(); },[]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pR,aR,sR] = await Promise.all([
        api.get('/api/admin/pos'),
        api.get('/api/admin/agents'),
        api.get('/api/admin/succursales').catch(()=>({data:[]})),
      ]);
      setPos(Array.isArray(pR.data)?pR.data:[]);
      setAgents(Array.isArray(aR.data)?aR.data:[]);
      setSuccs(Array.isArray(sR.data)?sR.data:[]);
    } catch { setPos([]); }
    setLoading(false);
  };

  const notify = (t,ok=true) => {
    setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3500);
  };

  const openAdd = () => { setForm(DEF); setEditPos(null); setShowAdd(true); };

  const openEdit = p => {
    setForm({
      posId:        p.posId||'',
      nom:          p.nom||'',
      adresse:      p.adresse||'',
      telephone:    p.telephone||'',
      nomAgent:     p.nomAgent||'',
      prenomAgent:  p.prenomAgent||'',
      agentUsername:p.agentUsername||'',
      succursale:   p.succursale||'',
      credit:       p.credit||'Illimité',
      balanceGain:  p.balanceGain||'Illimité',
      prime:        p.prime||'50|20|10',
      logo:         p.logo||'',
      agentPct:     p.agentPct||0,
      supPct:       p.supPct||0,
      tete_ligne1:  p.tete?.ligne1||p.nom||'',
      tete_ligne2:  p.tete?.ligne2||p.adresse||'',
      tete_ligne3:  p.tete?.ligne3||p.telephone||'',
      messageAdmin: p.messageAdmin||'',
      newPassword:'', confirmPassword:'',
    });
    setEditPos(p); setShowAdd(true);
  };

  const handleLogoUpload = e => {
    const file = e.target.files?.[0];
    if(!file) return;
    if(file.size>600000){notify('⚠️ Imaj twò gwo (max 600KB)',false);return;}
    const reader = new FileReader();
    reader.onload = ev => setForm(f=>({...f,logo:ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if(!form.posId.trim()||!form.nom.trim()){
      notify('⚠️ POS ID ak Non obligatwa!',false); return;
    }
    if(form.newPassword&&form.newPassword!==form.confirmPassword){
      notify('⚠️ Modpas yo pa menm!',false); return;
    }
    setSaving(true);
    try {
      const payload = {
        posId:form.posId, nom:form.nom,
        adresse:form.adresse, telephone:form.telephone,
        nomAgent:form.nomAgent, prenomAgent:form.prenomAgent,
        agentUsername:form.agentUsername,
        succursale:form.succursale,
        credit:form.credit||'Illimité',
        balanceGain:form.balanceGain||'Illimité',
        prime:form.prime||'50|20|10',
        logo:form.logo,
        agentPct:Number(form.agentPct)||0,
        supPct:Number(form.supPct)||0,
        tete:{
          ligne1:form.tete_ligne1||form.nom,
          ligne2:form.tete_ligne2||form.adresse,
          ligne3:form.tete_ligne3||form.telephone,
          ligne4:'Fich sa valid pou 90 jou',
        },
        messageAdmin:form.messageAdmin,
        actif:true,
        ...(form.newPassword?{newPassword:form.newPassword}:{}),
      };
      if(editPos){
        await api.put(`/api/admin/pos/${editPos._id}`,payload);
        notify('✅ POS modifye!');
      } else {
        await api.post('/api/admin/pos',payload);
        notify('✅ POS kreye! Ajan kreye otomatik.');
      }
      setShowAdd(false); setEditPos(null); await loadAll();
    } catch(e){
      notify(`❌ ${e?.response?.data?.message||'Erè sèvè'}`,false);
    }
    setSaving(false);
  };

  const handleToggle = async p => {
    try{
      await api.put(`/api/admin/pos/${p._id}/toggle`);
      await loadAll();
    } catch{ notify('❌ Erè',false); }
  };

  const handleDelete = async p => {
    try{
      await api.delete(`/api/admin/pos/${p._id}`);
      setDelConf(null); await loadAll(); notify('🗑️ POS efase');
    } catch{ notify('❌ Erè',false); }
  };

  const fiveMin = Date.now()-5*60*1000;
  const filtered = pos
    .filter(p=>tab==='actif'?p.actif!==false:p.actif===false)
    .filter(p=>!search||
      [p.nom,p.posId,p.agentUsername,p.nomAgent,p.prenomAgent,p.succursale]
        .some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));

  return (
    <Layout>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 8px 40px'}}>

        {/* TABS */}
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {[['actif','POS Aktif','#16a34a'],['inactif','POS Inaktif','#dc2626']].map(([k,l,c])=>(
            <button key={k} onClick={()=>setTab(k)}
              style={{padding:'9px 20px',border:'none',borderRadius:10,
                background:tab===k?c:'#f3f4f6',
                color:tab===k?'white':'#555',
                fontWeight:700,cursor:'pointer',fontSize:13}}>
              {l} ({pos.filter(p=>k==='actif'?p.actif!==false:p.actif===false).length})
            </button>
          ))}
          <button onClick={openAdd}
            style={{marginLeft:'auto',padding:'9px 20px',border:'none',
              borderRadius:10,background:'#1a73e8',color:'white',
              fontWeight:700,cursor:'pointer',fontSize:13}}>
            ➕ Ajoute POS
          </button>
        </div>

        {msg.t && (
          <div style={{background:msg.ok?'#dcfce7':'#fee2e2',
            border:`1.5px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color:msg.ok?'#166534':'#991b1b',
            padding:'10px 16px',borderRadius:8,marginBottom:12,fontWeight:700}}>
            {msg.t}
          </div>
        )}

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',
          gap:8,marginBottom:12}}>
          {[
            {v:pos.length,         l:'Total',    c:'#1a73e8'},
            {v:pos.filter(p=>p.actif!==false).length, l:'Aktif', c:'#16a34a'},
            {v:pos.filter(p=>p.actif===false).length, l:'Inaktif',c:'#dc2626'},
            {v:pos.filter(p=>p.lastSeen&&new Date(p.lastSeen).getTime()>fiveMin).length,
              l:'Konekte',c:'#7c3aed'},
          ].map(s=>(
            <div key={s.l} style={{background:'white',borderRadius:10,
              padding:'11px',textAlign:'center',
              boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
              borderTop:`3px solid ${s.c}`}}>
              <div style={{fontWeight:900,fontSize:20,color:s.c}}>{s.v}</div>
              <div style={{fontSize:10,color:'#888',fontWeight:700}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* RECHÈCH */}
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Rechèch pa non, ID, ajan, succursale..."
          style={{width:'100%',padding:'10px 14px',border:'1.5px solid #ddd',
            borderRadius:10,fontSize:13,marginBottom:12,boxSizing:'border-box'}}/>

        {/* LIS POS */}
        {loading ? (
          <div style={{textAlign:'center',padding:40,color:'#888'}}>⏳</div>
        ) : filtered.length===0 ? (
          <div style={{textAlign:'center',padding:40,background:'white',
            borderRadius:12,color:'#aaa'}}>Pa gen POS</div>
        ) : (
          <div style={{display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))',gap:10}}>
            {filtered.map(p=>{
              const conn=p.lastSeen&&new Date(p.lastSeen).getTime()>fiveMin;
              const prParts=String(p.prime||'50|20|10').split('|');
              return (
                <div key={p._id} style={{background:'white',borderRadius:12,
                  padding:14,boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft:`5px solid ${conn?'#16a34a':p.actif!==false?'#1a73e8':'#dc2626'}`}}>

                  <div style={{display:'flex',gap:10,marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:8,overflow:'hidden',
                      flexShrink:0,background:'#f1f5f9',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      border:'2px solid #e5e7eb'}}>
                      {p.logo
                        ?<img src={p.logo} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        :<span style={{fontWeight:900,fontSize:16,color:'#94a3b8'}}>
                          {(p.nom||'?')[0].toUpperCase()}
                        </span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:900,fontSize:14,color:'#111',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {p.nom}
                      </div>
                      <div style={{fontFamily:'monospace',fontSize:11,
                        color:'#1a73e8',fontWeight:700}}>{p.posId}</div>
                      <div style={{fontSize:11,color:'#888'}}>
                        {p.prenomAgent||''} {p.nomAgent||p.agentUsername||'—'}
                      </div>
                    </div>
                    <span style={{background:p.actif!==false?'#dcfce7':'#fee2e2',
                      color:p.actif!==false?'#16a34a':'#dc2626',
                      borderRadius:20,padding:'2px 8px',
                      fontSize:10,fontWeight:800,alignSelf:'flex-start'}}>
                      {p.actif!==false?'✅':'❌'}
                    </span>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',
                    gap:5,fontSize:11,marginBottom:10}}>
                    {[
                      ['📍',p.adresse||'—'],
                      ['🏢',p.succursale||'—'],
                      ['📞',p.telephone||'—'],
                      ['💳',p.credit||'Illimité'],
                      ['%A',`${p.agentPct||0}%`],
                      ['%S',`${p.supPct||0}%`],
                    ].map(([l,v])=>(
                      <div key={l} style={{background:'#f8f9fa',borderRadius:6,
                        padding:'4px 7px',display:'flex',gap:5}}>
                        <span style={{color:'#888',fontSize:10}}>{l}</span>
                        <span style={{fontWeight:700,color:'#374151',
                          overflow:'hidden',textOverflow:'ellipsis',
                          whiteSpace:'nowrap'}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Prime */}
                  <div style={{background:'#fff7ed',borderRadius:6,
                    padding:'5px 8px',marginBottom:8,
                    display:'flex',gap:6,alignItems:'center'}}>
                    <span style={{fontSize:10,color:'#ea580c',fontWeight:700}}>
                      🎯 Prime:
                    </span>
                    {['1e','2e','3e'].map((pos,i)=>(
                      prParts[i]?(
                        <span key={pos} style={{background:'#ea580c',color:'white',
                          borderRadius:6,padding:'1px 6px',
                          fontSize:11,fontWeight:900}}>
                          {pos}×{prParts[i]}
                        </span>
                      ):null
                    ))}
                  </div>

                  <div style={{display:'flex',gap:5}}>
                    <button onClick={()=>openEdit(p)}
                      style={{flex:1,background:'#1a73e8',color:'white',
                        border:'none',borderRadius:7,padding:'8px',
                        fontWeight:700,cursor:'pointer',fontSize:12}}>
                      ✏️ Modifye
                    </button>
                    <button onClick={()=>handleToggle(p)}
                      style={{flex:1,
                        background:p.actif!==false?'#fef9c3':'#dcfce7',
                        color:p.actif!==false?'#854d0e':'#166534',
                        border:'none',borderRadius:7,padding:'8px',
                        fontWeight:700,cursor:'pointer',fontSize:12}}>
                      {p.actif!==false?'🔒 Bloke':'🔓 Aktive'}
                    </button>
                    <button onClick={()=>setDelConf(p)}
                      style={{background:'#fee2e2',color:'#dc2626',
                        border:'none',borderRadius:7,
                        padding:'8px 10px',fontWeight:700,
                        cursor:'pointer',fontSize:14}}>
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
          <div style={{position:'fixed',inset:0,
            background:'rgba(0,0,0,0.65)',zIndex:2000,
            display:'flex',alignItems:'flex-end',justifyContent:'center'}}
            onClick={()=>setShowAdd(false)}>
            <div style={{background:'white',borderRadius:'20px 20px 0 0',
              width:'100%',maxWidth:600,maxHeight:'94vh',
              overflowY:'auto',padding:'0 0 60px'}}
              onClick={e=>e.stopPropagation()}>

              <div style={{position:'sticky',top:0,background:'white',
                padding:'14px 20px',borderBottom:'1px solid #f0f0f0',
                display:'flex',justifyContent:'space-between',
                alignItems:'center',zIndex:10}}>
                <div style={{fontWeight:900,fontSize:17}}>
                  {editPos?`✏️ ${editPos.nom}`:'➕ Nouvo POS'}
                </div>
                <button onClick={()=>{setShowAdd(false);setEditPos(null);}}
                  style={{background:'none',border:'none',
                    fontSize:22,cursor:'pointer',color:'#888'}}>✕</button>
              </div>

              <div style={{padding:'16px 20px'}}>

                {/* LOGO */}
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontWeight:700,fontSize:11,
                    marginBottom:6,color:'#555'}}>🖼️ Logo POS / Ajan</label>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:60,height:60,borderRadius:10,
                      background:'#f1f5f9',border:'2px dashed #ddd',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      overflow:'hidden',flexShrink:0}}>
                      {form.logo
                        ?<img src={form.logo} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        :<span style={{fontSize:24,color:'#ccc'}}>🖥️</span>}
                    </div>
                    <div>
                      <input type="file" ref={fileRef} style={{display:'none'}}
                        accept="image/*" onChange={handleLogoUpload}/>
                      <button onClick={()=>fileRef.current?.click()}
                        style={{background:'#1a73e8',color:'white',
                          border:'none',borderRadius:7,padding:'7px 14px',
                          fontWeight:700,cursor:'pointer',fontSize:12,
                          marginBottom:4,display:'block'}}>
                        📁 Chwazi nan Galerie
                      </button>
                      {form.logo&&(
                        <button onClick={()=>setForm(f=>({...f,logo:''}))}
                          style={{background:'#fee2e2',color:'#dc2626',
                            border:'none',borderRadius:7,padding:'5px 10px',
                            fontWeight:700,cursor:'pointer',fontSize:11}}>
                          ✕ Retire
                        </button>
                      )}
                      <div style={{fontSize:10,color:'#888',marginTop:4}}>
                        PNG, JPG — Max 600KB
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEKSON 1: INFO POS */}
                <div style={{fontWeight:800,fontSize:12,color:'#1a73e8',
                  margin:'10px 0 8px',paddingBottom:5,
                  borderBottom:'2px solid #eff6ff'}}>
                  📋 Enfòmasyon POS
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {inp(form,setForm,'posId','POS ID *','text','ex: POS-001')}
                  {inp(form,setForm,'nom','Non POS *','text','ex: POS Delmas')}
                </div>
                {inp(form,setForm,'adresse','Zòn / Adrès','text','ex: Delmas 31')}
                {inp(form,setForm,'telephone','Téléfòn','tel','ex: 509-3700-0000')}

                {/* Succursale dropdown */}
                <div style={{marginBottom:11}}>
                  <label style={{display:'block',fontWeight:700,fontSize:11,
                    color:'#555',marginBottom:3}}>Succursale (Gwoup)</label>
                  <select value={form.succursale}
                    onChange={e=>setForm(f=>({...f,succursale:e.target.value}))}
                    style={{width:'100%',padding:'9px 12px',
                      border:'1.5px solid #ddd',borderRadius:8,
                      fontSize:13,background:'white'}}>
                    <option value="">— Chwazi Succursale —</option>
                    {succs.map(s=>(
                      <option key={s._id} value={s.nom}>{s.nom}</option>
                    ))}
                    <option value="Central">Central</option>
                    <option value="Nord">Nord</option>
                    <option value="Sud">Sud</option>
                  </select>
                </div>

                {/* SEKSON 2: AJAN */}
                <div style={{fontWeight:800,fontSize:12,color:'#16a34a',
                  margin:'14px 0 8px',paddingBottom:5,
                  borderBottom:'2px solid #f0fdf4'}}>
                  👤 Enfòmasyon Ajan
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {inp(form,setForm,'prenomAgent','Prenom Ajan','text','ex: Jean')}
                  {inp(form,setForm,'nomAgent','Non Ajan','text','ex: Pierre')}
                </div>
                {inp(form,setForm,'agentUsername','Idantifyan (Username) *','text','ex: jeanpierre')}

                {/* Modpas */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,
                      color:'#555',marginBottom:3}}>
                      Modpas {editPos?'(opsyonèl)':'*'}
                    </label>
                    <input type="password" value={form.newPassword||''}
                      onChange={e=>setForm(f=>({...f,newPassword:e.target.value}))}
                      placeholder="Min 4 karaktè"
                      style={{width:'100%',padding:'9px 12px',
                        border:'1.5px solid #ddd',borderRadius:8,
                        fontSize:13,boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,
                      color:'#555',marginBottom:3}}>Konfime Modpas</label>
                    <input type="password" value={form.confirmPassword||''}
                      onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))}
                      placeholder="Repete modpas"
                      style={{width:'100%',padding:'9px 12px',
                        border:form.confirmPassword&&form.confirmPassword!==form.newPassword
                          ?'1.5px solid #dc2626'
                          :form.confirmPassword===form.newPassword&&form.confirmPassword
                          ?'1.5px solid #16a34a':'1.5px solid #ddd',
                        borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
                  </div>
                </div>
                {!editPos&&(
                  <div style={{background:'#fef9c3',border:'1px solid #fde68a',
                    borderRadius:7,padding:'8px 12px',marginBottom:10,
                    fontSize:11,color:'#854d0e',fontWeight:700}}>
                    ℹ️ Si ou pa mete modpas — modpas defòlt: posId + "123"
                    (ex: POS-001123)
                  </div>
                )}

                {/* SEKSON 3: PRIME + % */}
                <div style={{fontWeight:800,fontSize:12,color:'#ea580c',
                  margin:'14px 0 8px',paddingBottom:5,
                  borderBottom:'2px solid #fff7ed'}}>
                  🎯 Prime ak Pousantaj
                </div>
                <div style={{marginBottom:10}}>
                  <label style={{display:'block',fontWeight:700,fontSize:11,
                    color:'#555',marginBottom:5}}>
                    Prime (1e / 2e / 3e pozisyon)
                  </label>
                  <div style={{display:'grid',
                    gridTemplateColumns:'repeat(4,1fr)',gap:5,marginBottom:6}}>
                    {PRIMES_DEFOLT.map(p=>(
                      <button key={p} onClick={()=>setForm(f=>({...f,prime:p}))}
                        style={{padding:'7px 4px',border:'none',borderRadius:7,
                          background:(form.prime||'50|20|10').trim()===p
                            ?'#ea580c':'#f3f4f6',
                          color:(form.prime||'50|20|10').trim()===p
                            ?'white':'#333',
                          fontWeight:700,cursor:'pointer',fontSize:12}}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <input value={form.prime||''} placeholder="ex: 50|20|10"
                    onChange={e=>setForm(f=>({...f,prime:e.target.value}))}
                    style={{width:'100%',padding:'9px 12px',
                      border:'1.5px solid #ea580c',borderRadius:7,
                      fontSize:14,fontFamily:'monospace',fontWeight:700,
                      boxSizing:'border-box',color:'#ea580c'}}/>
                  {form.prime&&(
                    <div style={{background:'#fff7ed',borderRadius:6,
                      padding:'5px 10px',marginTop:5,
                      fontSize:11,color:'#9a3412'}}>
                      Preview 10G: {String(form.prime).split('|').map((v,i)=>(
                        <span key={i} style={{marginRight:10,fontWeight:700}}>
                          {['1e','2e','3e'][i]}: {10*Number(v)||0}G
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,
                      color:'#555',marginBottom:3}}>% Ajan</label>
                    <input type="number" min="0" max="100"
                      value={form.agentPct||0}
                      onChange={e=>setForm(f=>({...f,agentPct:e.target.value}))}
                      style={{width:'100%',padding:'9px 12px',
                        border:'1.5px solid #ddd',borderRadius:8,
                        fontSize:13,boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,
                      color:'#555',marginBottom:3}}>% Supervisè</label>
                    <input type="number" min="0" max="100"
                      value={form.supPct||0}
                      onChange={e=>setForm(f=>({...f,supPct:e.target.value}))}
                      style={{width:'100%',padding:'9px 12px',
                        border:'1.5px solid #ddd',borderRadius:8,
                        fontSize:13,boxSizing:'border-box'}}/>
                  </div>
                </div>

                {/* SEKSON 4: KREDI + LIMIT */}
                <div style={{fontWeight:800,fontSize:12,color:'#7c3aed',
                  margin:'14px 0 8px',paddingBottom:5,
                  borderBottom:'2px solid #f5f3ff'}}>
                  💳 Kredi ak Limit
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,
                      color:'#555',marginBottom:3}}>Limit Kredi</label>
                    <select value={form.credit||'Illimité'}
                      onChange={e=>setForm(f=>({...f,credit:e.target.value}))}
                      style={{width:'100%',padding:'9px 12px',
                        border:'1.5px solid #ddd',borderRadius:8,
                        fontSize:13,background:'white'}}>
                      <option value="Illimité">Illimité</option>
                      <option value="Limité">Limité</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block',fontWeight:700,fontSize:11,
                      color:'#555',marginBottom:3}}>Limit Balance Gain</label>
                    <select value={form.balanceGain||'Illimité'}
                      onChange={e=>setForm(f=>({...f,balanceGain:e.target.value}))}
                      style={{width:'100%',padding:'9px 12px',
                        border:'1.5px solid #ddd',borderRadius:8,
                        fontSize:13,background:'white'}}>
                      <option value="Illimité">Illimité</option>
                      <option value="Limité">Limité</option>
                    </select>
                  </div>
                </div>

                {/* SEKSON 5: TÈT FICH */}
                <div style={{fontWeight:800,fontSize:12,color:'#0891b2',
                  margin:'14px 0 8px',paddingBottom:5,
                  borderBottom:'2px solid #f0f9ff'}}>
                  🖨️ Tèt Fich Enpresyon
                </div>
                {inp(form,setForm,'tete_ligne1','Liy 1','text',form.nom||'Non POS')}
                {inp(form,setForm,'tete_ligne2','Liy 2','text',form.adresse||'Adrès')}
                {inp(form,setForm,'tete_ligne3','Liy 3','text',form.telephone||'Téléfòn')}

                {/* SEKSON 6: MESAJ */}
                <div style={{fontWeight:800,fontSize:12,color:'#f59e0b',
                  margin:'14px 0 8px',paddingBottom:5,
                  borderBottom:'2px solid #fefce8'}}>
                  📢 Mesaj Admin
                </div>
                <textarea value={form.messageAdmin||''}
                  onChange={e=>setForm(f=>({...f,messageAdmin:e.target.value}))}
                  placeholder="Mesaj pou ajan an..."
                  rows={2}
                  style={{width:'100%',padding:'9px 12px',
                    border:'1.5px solid #ddd',borderRadius:8,
                    fontSize:13,boxSizing:'border-box',
                    resize:'vertical',fontFamily:'inherit',
                    marginBottom:16}}/>

                <button onClick={handleSave} disabled={saving}
                  style={{width:'100%',padding:'13px',
                    background:saving?'#ccc':editPos?'#1a73e8':'#16a34a',
                    color:'white',border:'none',borderRadius:12,
                    fontWeight:900,fontSize:15,cursor:saving?'default':'pointer'}}>
                  {saving?'⏳ Ap sove...'
                    :editPos?'✅ Sove Modifikasyon'
                    :'✅ Kreye POS'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* KONFIRMASYON EFASE */}
        {delConf&&(
          <div style={{position:'fixed',inset:0,
            background:'rgba(0,0,0,0.6)',zIndex:2000,
            display:'flex',alignItems:'center',justifyContent:'center',padding:20}}
            onClick={()=>setDelConf(null)}>
            <div style={{background:'white',borderRadius:16,padding:28,
              maxWidth:340,width:'100%',textAlign:'center'}}
              onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:44,marginBottom:12}}>🗑️</div>
              <div style={{fontWeight:900,fontSize:17,marginBottom:8}}>Efase POS sa?</div>
              <div style={{color:'#555',fontSize:13,marginBottom:20}}>
                <strong>{delConf.nom}</strong> — {delConf.posId}
              </div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setDelConf(null)}
                  style={{flex:1,padding:'11px',background:'#f3f4f6',
                    border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}>
                  Anile
                </button>
                <button onClick={()=>handleDelete(delConf)}
                  style={{flex:1,padding:'11px',background:'#dc2626',
                    color:'white',border:'none',borderRadius:10,
                    fontWeight:900,cursor:'pointer'}}>
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
