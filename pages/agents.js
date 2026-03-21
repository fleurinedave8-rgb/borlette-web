import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const PRIMES_DEFOLT = ['50|20|10','60|20|10','70|25|15','50|15|5'];

const DEF_FORM = {
  posId:'', nom:'', adresse:'', telephone:'',
  nomAgent:'', prenomAgent:'', agentUsername:'',
  succursale:'', credit:'Illimité', balanceGain:'Illimité',
  prime:'50|20|10', logo:'', agentPct:0, supPct:0,
  tete_ligne1:'', tete_ligne2:'', tete_ligne3:'',
  messageAdmin:'', newPassword:'', confirmPassword:'',
  deviceId:'',
};

const fmt = n => Number(n||0).toLocaleString('fr-HT',{minimumFractionDigits:2});
const fmtD = d => {
  if(!d) return '—';
  const dt=new Date(d), p=n=>String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()}`;
};

export default function AgentsPage() {
  const [pos,     setPos]     = useState([]);
  const [agents,  setAgents]  = useState([]);
  const [succs,   setSuccs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [tab,     setTab]     = useState('actif');
  const [showAdd, setShowAdd] = useState(false);
  const [editPos, setEditPos] = useState(null);
  const [form,    setForm]    = useState(DEF_FORM);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({t:'',ok:true});
  const [selPos,  setSelPos]  = useState(null);
  const fileRef = useRef();
  const fiveMin = Date.now()-5*60*1000;

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

  const openAdd = () => { setForm(DEF_FORM); setEditPos(null); setShowAdd(true); };

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
      deviceId:     p.deviceId||'',
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
    if(file.size>600000){notify('⚠️ Image trop grande (max 600KB)',false);return;}
    const reader = new FileReader();
    reader.onload = ev => setForm(f=>({...f,logo:ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if(!form.posId.trim()||!form.nom.trim()){
      notify('⚠️ POS ID et Nom obligatoires!',false); return;
    }
    if(form.newPassword&&form.newPassword!==form.confirmPassword){
      notify('⚠️ Mots de passe différents!',false); return;
    }
    setSaving(true);
    try {
      const payload = {
        posId:form.posId, nom:form.nom, adresse:form.adresse,
        telephone:form.telephone, nomAgent:form.nomAgent,
        prenomAgent:form.prenomAgent, agentUsername:form.agentUsername,
        succursale:form.succursale, credit:form.credit||'Illimité',
        balanceGain:form.balanceGain||'Illimité',
        prime:form.prime||'50|20|10', logo:form.logo,
        agentPct:Number(form.agentPct)||0, supPct:Number(form.supPct)||0,
        deviceId:form.deviceId,
        tete:{ ligne1:form.tete_ligne1||form.nom,
          ligne2:form.tete_ligne2||form.adresse,
          ligne3:form.tete_ligne3||form.telephone,
          ligne4:'Ticket valable 90 jours' },
        messageAdmin:form.messageAdmin, actif:true,
        ...(form.newPassword?{newPassword:form.newPassword}:{}),
      };
      if(editPos){
        await api.put(`/api/admin/pos/${editPos._id}`,payload);
        notify('✅ POS modifié!');
      } else {
        await api.post('/api/admin/pos',payload);
        notify('✅ POS créé! Agent créé automatiquement.');
      }
      setShowAdd(false); setEditPos(null); await loadAll();
    } catch(e){
      notify(`❌ ${e?.response?.data?.message||'Erreur serveur'}`,false);
    }
    setSaving(false);
  };

  const handleToggle = async p => {
    try{ await api.put(`/api/admin/pos/${p._id}/toggle`); await loadAll(); }
    catch{ notify('❌ Erreur',false); }
  };

  const handleDelete = async p => {
    if(!window.confirm(`Supprimer "${p.nom}"?`)) return;
    try{ await api.delete(`/api/admin/pos/${p._id}`); await loadAll(); notify('🗑️ POS supprimé'); }
    catch{ notify('❌ Erreur',false); }
  };

  const filtered = pos
    .filter(p=>tab==='actif'?p.actif!==false:p.actif===false)
    .filter(p=>!search||
      [p.nom,p.posId,p.agentUsername,p.nomAgent,p.prenomAgent,p.succursale,p.deviceId]
        .some(v=>String(v||'').toLowerCase().includes(search.toLowerCase())));

  const getAgent = p => agents.find(a=>
    a.username===p.agentUsername || String(a._id)===String(p.agentId)
  );

  return (
    <Layout>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'0 8px 40px'}}>

        {/* TABS */}
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
          {[['actif','✅ POS Actifs','#16a34a'],['inactif','❌ Inactifs','#dc2626']].map(([k,l,c])=>(
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
            ➕ Ajouter POS
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
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
          {[
            {v:pos.length,l:'Total POS',c:'#1a73e8'},
            {v:pos.filter(p=>p.actif!==false).length,l:'Actifs',c:'#16a34a'},
            {v:pos.filter(p=>p.actif===false).length,l:'Inactifs',c:'#dc2626'},
            {v:pos.filter(p=>p.lastSeen&&new Date(p.lastSeen).getTime()>fiveMin).length,l:'En ligne',c:'#7c3aed'},
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

        {/* BOUTONS + RECHERCHE */}
        <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
          {['Copier','Excel','PDF','Imprimer'].map(l=>(
            <button key={l} onClick={()=>l==='Imprimer'&&window.print()}
              style={{padding:'6px 12px',border:'1px solid #ddd',
                borderRadius:7,background:'white',fontWeight:700,
                cursor:'pointer',fontSize:11,color:'#374151'}}>
              {l==='Copier'?'📋':l==='Excel'?'📊':l==='PDF'?'📄':'🖨️'} {l}
            </button>
          ))}
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Recherche par nom, ID, agent, succursale..."
            style={{flex:1,padding:'8px 14px',border:'1.5px solid #ddd',
              borderRadius:8,fontSize:13,outline:'none'}} />
        </div>

        {/* TABLEAU 12 COLONNES */}
        {loading ? (
          <div style={{textAlign:'center',padding:48,color:'#888'}}>⏳ Chargement...</div>
        ) : (
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:1000}}>
              <thead>
                <tr style={{background:'#1e293b'}}>
                  {['Action','Prime','D.Exp','Crédit','Zone/Adresse','Sup',
                    'Agent','Device ID','%Agent','%Sup','Statut','Message'].map(h=>(
                    <th key={h} style={{padding:'10px 10px',color:'white',
                      fontWeight:700,fontSize:10,textAlign:'left',
                      whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={12} style={{padding:32,textAlign:'center',color:'#aaa'}}>
                    Aucun POS
                  </td></tr>
                ) : filtered.map((p,i)=>{
                  const conn = p.lastSeen&&new Date(p.lastSeen).getTime()>fiveMin;
                  const agent = getAgent(p);
                  const prParts = String(p.prime||'50|20|10').split('|');
                  return (
                    <tr key={p._id||i}
                      style={{borderBottom:'1px solid #f0f0f0',
                        background:i%2===0?'white':'#fafafa',
                        cursor:'pointer'}}
                      onClick={()=>setSelPos(selPos?._id===p._id?null:p)}>

                      {/* Action */}
                      <td style={{padding:'8px 10px'}}>
                        <div style={{display:'flex',gap:4}}>
                          <button onClick={e=>{e.stopPropagation();openEdit(p);}}
                            style={{background:'#1a73e8',color:'white',border:'none',
                              borderRadius:5,padding:'4px 7px',cursor:'pointer',
                              fontSize:11,fontWeight:700}}>✏️</button>
                          <button onClick={e=>{e.stopPropagation();handleToggle(p);}}
                            style={{background:p.actif!==false?'#fef9c3':'#dcfce7',
                              color:p.actif!==false?'#854d0e':'#166534',
                              border:'none',borderRadius:5,padding:'4px 7px',
                              cursor:'pointer',fontSize:11,fontWeight:700}}>
                            {p.actif!==false?'🔒':'🔓'}</button>
                        </div>
                      </td>

                      {/* Prime */}
                      <td style={{padding:'8px 10px'}}>
                        <div style={{display:'flex',gap:3,flexWrap:'nowrap'}}>
                          {prParts.map((v,j)=>(
                            <span key={j} style={{background:'#ea580c',color:'white',
                              borderRadius:4,padding:'1px 5px',
                              fontSize:10,fontWeight:900}}>
                              {['1e','2e','3e'][j]}×{v}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* D.Exp */}
                      <td style={{padding:'8px 10px',color:'#888',fontSize:11}}>N/A</td>

                      {/* Crédit */}
                      <td style={{padding:'8px 10px'}}>
                        <span style={{background:p.credit==='Illimité'?'#dcfce7':'#fef9c3',
                          color:p.credit==='Illimité'?'#166534':'#854d0e',
                          borderRadius:10,padding:'2px 7px',
                          fontSize:10,fontWeight:700}}>
                          {p.credit||'Illimité'}
                        </span>
                      </td>

                      {/* Zone/Adresse */}
                      <td style={{padding:'8px 10px',fontSize:11,color:'#555',
                        maxWidth:120,overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {p.succursale||p.adresse||'—'}
                      </td>

                      {/* Sup */}
                      <td style={{padding:'8px 10px',color:'#888',fontSize:11}}>N/A</td>

                      {/* Agent */}
                      <td style={{padding:'8px 10px'}}>
                        <div style={{fontWeight:700,fontSize:12}}>
                          {p.prenomAgent||''} {p.nomAgent||p.agentUsername||'—'}
                        </div>
                        <div style={{fontSize:10,color:'#888',fontFamily:'monospace'}}>
                          @{p.agentUsername||'—'}
                        </div>
                      </td>

                      {/* Device ID */}
                      <td style={{padding:'8px 10px',fontFamily:'monospace',
                        fontSize:10,color:'#1a73e8'}}>
                        {p.deviceId||p.posId||'—'}
                      </td>

                      {/* %Agent */}
                      <td style={{padding:'8px 10px',fontWeight:700,
                        color:'#16a34a',fontSize:12}}>
                        {p.agentPct||0}%
                      </td>

                      {/* %Sup */}
                      <td style={{padding:'8px 10px',fontWeight:700,
                        color:'#7c3aed',fontSize:12}}>
                        {p.supPct||0}%
                      </td>

                      {/* Statut */}
                      <td style={{padding:'8px 10px'}}>
                        <span style={{
                          background:conn?'#dcfce7':p.actif!==false?'#eff6ff':'#fee2e2',
                          color:conn?'#166534':p.actif!==false?'#1d4ed8':'#991b1b',
                          borderRadius:20,padding:'2px 8px',
                          fontSize:10,fontWeight:700}}>
                          {conn?'🟢 En ligne':p.actif!==false?'⚪ Actif':'❌ Inactif'}
                        </span>
                      </td>

                      {/* Message */}
                      <td style={{padding:'8px 10px',fontSize:11,color:'#888',
                        maxWidth:100,overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {p.messageAdmin||'—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* DÉTAIL POS SÉLECTIONNÉ */}
        {selPos && (
          <div style={{marginTop:12,background:'white',borderRadius:12,
            padding:20,boxShadow:'0 4px 20px rgba(0,0,0,0.12)',
            borderLeft:`5px solid #1a73e8`}}>
            <div style={{display:'flex',justifyContent:'space-between',
              alignItems:'center',marginBottom:14}}>
              <div>
                <h3 style={{margin:0,fontWeight:900,fontSize:16}}>{selPos.nom}</h3>
                <div style={{fontFamily:'monospace',fontSize:12,color:'#1a73e8',fontWeight:700}}>
                  {selPos.posId}
                </div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>openEdit(selPos)}
                  style={{background:'#1a73e8',color:'white',border:'none',
                    borderRadius:8,padding:'8px 16px',fontWeight:700,cursor:'pointer'}}>
                  ✏️ Modifier
                </button>
                <button onClick={()=>setSelPos(null)}
                  style={{background:'#f3f4f6',border:'none',borderRadius:8,
                    padding:'8px 14px',fontWeight:700,cursor:'pointer'}}>
                  ✕
                </button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
              {[
                ['👤 Agent', `${selPos.prenomAgent||''} ${selPos.nomAgent||selPos.agentUsername||'—'}`],
                ['📍 Adresse', selPos.adresse||'—'],
                ['📞 Téléphone', selPos.telephone||'—'],
                ['🏢 Succursale', selPos.succursale||'—'],
                ['💳 Crédit', selPos.credit||'Illimité'],
                ['🎯 Prime', selPos.prime||'50|20|10'],
                ['%Agent', `${selPos.agentPct||0}%`],
                ['%Superviseur', `${selPos.supPct||0}%`],
                ['📱 Device ID', selPos.deviceId||'—'],
                ['📅 Créé le', fmtD(selPos.createdAt)],
              ].map(([l,v])=>(
                <div key={l} style={{background:'#f8f9fa',borderRadius:8,padding:'8px 12px'}}>
                  <div style={{fontSize:10,color:'#888',fontWeight:700}}>{l}</div>
                  <div style={{fontWeight:700,fontSize:13,marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MODAL CRÉER/MODIFIER ═══ */}
        {showAdd && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',
            zIndex:2000,display:'flex',alignItems:'flex-end',justifyContent:'center'}}
            onClick={()=>setShowAdd(false)}>
            <div style={{background:'white',borderRadius:'20px 20px 0 0',
              width:'100%',maxWidth:620,maxHeight:'94vh',
              overflowY:'auto',padding:'0 0 60px'}}
              onClick={e=>e.stopPropagation()}>

              <div style={{position:'sticky',top:0,background:'white',
                padding:'14px 20px',borderBottom:'1px solid #f0f0f0',
                display:'flex',justifyContent:'space-between',
                alignItems:'center',zIndex:10}}>
                <div style={{fontWeight:900,fontSize:17}}>
                  {editPos?`✏️ ${editPos.nom}`:'➕ Nouveau POS'}
                </div>
                <button onClick={()=>{setShowAdd(false);setEditPos(null);}}
                  style={{background:'none',border:'none',
                    fontSize:22,cursor:'pointer',color:'#888'}}>✕</button>
              </div>

              <div style={{padding:'16px 20px'}}>

                {/* LOGO */}
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontWeight:700,fontSize:11,
                    marginBottom:6,color:'#555'}}>🖼️ Logo POS / Agent</label>
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
                        style={{background:'#1a73e8',color:'white',border:'none',
                          borderRadius:7,padding:'7px 14px',fontWeight:700,
                          cursor:'pointer',fontSize:12,marginBottom:4,display:'block'}}>
                        📁 Choisir dans la Galerie
                      </button>
                      {form.logo&&(
                        <button onClick={()=>setForm(f=>({...f,logo:''}))}
                          style={{background:'#fee2e2',color:'#dc2626',border:'none',
                            borderRadius:7,padding:'5px 10px',fontWeight:700,
                            cursor:'pointer',fontSize:11}}>
                          ✕ Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* INFO POS */}
                {[
                  {title:'📋 Informations POS', color:'#1a73e8', bg:'#eff6ff', fields:[
                    ['posId','POS ID *','text','ex: POS-001'],
                    ['nom','Nom POS *','text','ex: POS Delmas'],
                    ['adresse','Zone / Adresse','text','ex: Delmas 31'],
                    ['telephone','Téléphone','tel','ex: 509-3700-0000'],
                    ['deviceId','Device ID','text','Identifiant appareil'],
                  ]},
                  {title:'👤 Informations Agent', color:'#16a34a', bg:'#f0fdf4', fields:[
                    ['prenomAgent','Prénom Agent','text','ex: Jean'],
                    ['nomAgent','Nom Agent','text','ex: Pierre'],
                    ['agentUsername','Identifiant (Username) *','text','ex: jeanpierre'],
                  ]},
                ].map(sec=>(
                  <div key={sec.title}>
                    <div style={{fontWeight:800,fontSize:12,color:sec.color,
                      margin:'14px 0 8px',paddingBottom:5,
                      borderBottom:`2px solid ${sec.bg}`}}>
                      {sec.title}
                    </div>
                    <div style={{display:'grid',
                      gridTemplateColumns:sec.fields.length>3?'1fr 1fr':'1fr',gap:8}}>
                      {sec.fields.map(([k,l,t,ph])=>(
                        <div key={k} style={{marginBottom:8}}>
                          <label style={{display:'block',fontWeight:700,fontSize:11,
                            color:'#555',marginBottom:3}}>{l}</label>
                          <input type={t} value={form[k]||''} placeholder={ph}
                            onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                            style={{width:'100%',padding:'9px 12px',
                              border:'1.5px solid #ddd',borderRadius:8,
                              fontSize:13,boxSizing:'border-box'}}/>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Succursale */}
                <div style={{marginBottom:8}}>
                  <label style={{display:'block',fontWeight:700,fontSize:11,
                    color:'#555',marginBottom:3}}>Succursale (Groupe)</label>
                  <select value={form.succursale}
                    onChange={e=>setForm(f=>({...f,succursale:e.target.value}))}
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid #ddd',
                      borderRadius:8,fontSize:13,background:'white'}}>
                    <option value="">— Sélectionner —</option>
                    {succs.map(s=><option key={s._id} value={s.nom}>{s.nom}</option>)}
                    <option value="Central">Central</option>
                    <option value="Nord">Nord</option>
                    <option value="Sud">Sud</option>
                  </select>
                </div>

                {/* Mot de passe */}
                <div style={{fontWeight:800,fontSize:12,color:'#dc2626',
                  margin:'14px 0 8px',paddingBottom:5,borderBottom:'2px solid #fef2f2'}}>
                  🔐 Mot de passe Agent {editPos?'(optionnel)':''}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                  {[['newPassword','Nouveau Mot de passe'],['confirmPassword','Confirmer']].map(([k,l])=>(
                    <div key={k}>
                      <label style={{display:'block',fontWeight:700,fontSize:11,
                        color:'#555',marginBottom:3}}>{l}</label>
                      <input type="password" value={form[k]||''}
                        onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                        style={{width:'100%',padding:'9px 12px',
                          border:k==='confirmPassword'&&form.confirmPassword&&form.confirmPassword!==form.newPassword
                            ?'1.5px solid #dc2626':'1.5px solid #ddd',
                          borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
                    </div>
                  ))}
                </div>
                {!editPos&&(
                  <div style={{background:'#fef9c3',border:'1px solid #fde68a',
                    borderRadius:7,padding:'8px 12px',marginBottom:10,
                    fontSize:11,color:'#854d0e',fontWeight:700}}>
                    ℹ️ Sans mot de passe — défaut: posId + "123" (ex: POS-001123)
                  </div>
                )}

                {/* PRIME */}
                <div style={{fontWeight:800,fontSize:12,color:'#ea580c',
                  margin:'14px 0 8px',paddingBottom:5,borderBottom:'2px solid #fff7ed'}}>
                  🎯 Prime (1e / 2e / 3e position)
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5,marginBottom:6}}>
                  {PRIMES_DEFOLT.map(p=>(
                    <button key={p} onClick={()=>setForm(f=>({...f,prime:p}))}
                      style={{padding:'7px 4px',border:'none',borderRadius:7,
                        background:(form.prime||'50|20|10').trim()===p?'#ea580c':'#f3f4f6',
                        color:(form.prime||'50|20|10').trim()===p?'white':'#333',
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
                    boxSizing:'border-box',color:'#ea580c',marginBottom:6}}/>
                {form.prime&&(
                  <div style={{background:'#fff7ed',borderRadius:6,
                    padding:'5px 10px',marginBottom:10,
                    fontSize:11,color:'#9a3412'}}>
                    Aperçu 10G: {String(form.prime).split('|').map((v,i)=>(
                      <span key={i} style={{marginRight:10,fontWeight:700}}>
                        {['1e','2e','3e'][i]}: {10*Number(v)||0}G
                      </span>
                    ))}
                  </div>
                )}

                {/* POURCENTAGES + CRÉDIT */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:14}}>
                  {[['agentPct','% Agent','number'],['supPct','% Superviseur','number']].map(([k,l,t])=>(
                    <div key={k}>
                      <label style={{display:'block',fontWeight:700,fontSize:11,
                        color:'#555',marginBottom:3}}>{l}</label>
                      <input type={t} min="0" max="100" value={form[k]||0}
                        onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid #ddd',
                          borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
                    </div>
                  ))}
                  {[['credit','Crédit'],['balanceGain','Balance Gain']].map(([k,l])=>(
                    <div key={k}>
                      <label style={{display:'block',fontWeight:700,fontSize:11,
                        color:'#555',marginBottom:3}}>{l}</label>
                      <select value={form[k]||'Illimité'}
                        onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                        style={{width:'100%',padding:'9px 12px',border:'1.5px solid #ddd',
                          borderRadius:8,fontSize:13,background:'white'}}>
                        <option value="Illimité">Illimité</option>
                        <option value="Limité">Limité</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* MESSAGE */}
                <div style={{marginBottom:16}}>
                  <label style={{display:'block',fontWeight:700,fontSize:11,
                    color:'#555',marginBottom:3}}>Message Admin</label>
                  <textarea value={form.messageAdmin||''}
                    onChange={e=>setForm(f=>({...f,messageAdmin:e.target.value}))}
                    placeholder="Message pour l'agent..."
                    rows={2}
                    style={{width:'100%',padding:'9px 12px',border:'1.5px solid #ddd',
                      borderRadius:8,fontSize:13,boxSizing:'border-box',
                      resize:'vertical',fontFamily:'inherit'}}/>
                </div>

                <button onClick={handleSave} disabled={saving}
                  style={{width:'100%',padding:'13px',
                    background:saving?'#ccc':editPos?'#1a73e8':'#16a34a',
                    color:'white',border:'none',borderRadius:12,
                    fontWeight:900,fontSize:15,cursor:saving?'default':'pointer'}}>
                  {saving?'⏳ Enregistrement...'
                    :editPos?'✅ Sauvegarder'
                    :'✅ Créer POS'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
