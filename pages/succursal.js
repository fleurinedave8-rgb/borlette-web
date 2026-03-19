import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const DEF = {
  nomResponsable:'', prenomResponsable:'', pseudo:'',
  password:'', confirmPassword:'', nomSuccursal:'',
  nomBanque:'', logoBanque:'', message:'',
  sousSuperviseur:'non', mariageGratuit:'non',
  superviseurPrincipal:'N/A',
};

export default function SuccursalPage() {
  const [tab,      setTab]      = useState('ajoute');
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [form,     setForm]     = useState(DEF);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState({t:'',ok:true});
  const [editItem, setEditItem] = useState(null);
  const fileRef = useRef();

  useEffect(()=>{ if(tab!=='ajoute') load(); },[tab]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/succursales');
      setList(Array.isArray(r.data)?r.data:[]);
    } catch { setList([]); }
    setLoading(false);
  };

  const notify = (t,ok=true) => {
    setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3500);
  };

  const handleLogoUpload = e => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f=>({...f,logoBanque:ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if(!form.nomSuccursal||!form.nomResponsable){
      notify('⚠️ Non succursale ak responsable obligatwa',false); return;
    }
    if(form.password&&form.password!==form.confirmPassword){
      notify('⚠️ Modpas yo pa menm',false); return;
    }
    setSaving(true);
    try {
      const payload = {
        nom:form.nomSuccursal, nomResponsable:form.nomResponsable,
        prenomResponsable:form.prenomResponsable, pseudo:form.pseudo,
        nomBanque:form.nomBanque, logoBanque:form.logoBanque,
        message:form.message, sousSuperviseur:form.sousSuperviseur,
        mariageGratuit:form.mariageGratuit,
        superviseurPrincipal:'N/A',
        actif:true,
        ...(form.password?{password:form.password}:{}),
      };
      if(editItem){
        await api.put(`/api/admin/succursales/${editItem._id}`,payload);
        notify('✅ Succursale modifye!');
      } else {
        await api.post('/api/admin/succursales',payload);
        notify('✅ Succursale kreye!');
      }
      setForm(DEF); setEditItem(null); setTab('actif');
    } catch(e){
      notify(`❌ ${e?.response?.data?.message||'Erè'}`,false);
    }
    setSaving(false);
  };

  const handleToggle = async item => {
    try{
      await api.put(`/api/admin/succursales/${item._id}/toggle`);
      await load(); notify('✅ Statut chanje');
    } catch{ notify('❌ Erè',false); }
  };

  const openEdit = item => {
    setForm({
      nomSuccursal:item.nom||'',
      nomResponsable:item.nomResponsable||'',
      prenomResponsable:item.prenomResponsable||'',
      pseudo:item.pseudo||'',
      nomBanque:item.nomBanque||'',
      logoBanque:item.logoBanque||'',
      message:item.message||'',
      sousSuperviseur:item.sousSuperviseur||'non',
      mariageGratuit:item.mariageGratuit||'non',
      superviseurPrincipal:'N/A',
      password:'', confirmPassword:'',
    });
    setEditItem(item); setTab('ajoute');
  };

  const actif   = list.filter(s=>s.actif!==false);
  const inactif = list.filter(s=>s.actif===false);
  const display = tab==='actif'?actif:tab==='inactif'?inactif:[];

  const TABS = [
    {k:'ajoute',  l:'➕ Ajoute',      c:'#1a73e8'},
    {k:'actif',   l:'✅ Liste Aktif',  c:'#16a34a'},
    {k:'inactif', l:'⚠️ Liste Inaktif',c:'#f59e0b'},
  ];

  const inp2 = (key,label,type='text',ph='') => (
    <div style={{marginBottom:12}}>
      <label style={{display:'block',fontWeight:700,
        fontSize:11,color:'#555',marginBottom:4}}>{label}</label>
      <input type={type} value={form[key]||''} placeholder={ph}
        onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
        style={{width:'100%',padding:'10px 12px',
          border:'1.5px solid #ddd',borderRadius:8,
          fontSize:13,boxSizing:'border-box'}}/>
    </div>
  );

  return (
    <Layout>
      <div style={{maxWidth:900,margin:'0 auto',padding:'0 8px 40px'}}>

        {/* TABS */}
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {TABS.map(({k,l,c})=>(
            <button key={k} onClick={()=>{
              setTab(k);
              if(k!=='ajoute'){ setForm(DEF); setEditItem(null); }
            }}
              style={{padding:'9px 18px',border:'none',borderRadius:10,
                background:tab===k?c:'#f3f4f6',
                color:tab===k?'white':'#555',
                fontWeight:700,cursor:'pointer',fontSize:13}}>
              {l}
            </button>
          ))}
        </div>

        {msg.t && (
          <div style={{background:msg.ok?'#dcfce7':'#fee2e2',
            border:`1.5px solid ${msg.ok?'#16a34a':'#dc2626'}`,
            color:msg.ok?'#166534':'#991b1b',
            padding:'10px 16px',borderRadius:8,
            marginBottom:12,fontWeight:700}}>
            {msg.t}
          </div>
        )}

        {/* ── FÒMILÈ AJOUTE ── */}
        {tab==='ajoute' && (
          <div style={{background:'white',borderRadius:12,padding:24,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
            <h2 style={{margin:'0 0 20px',fontWeight:900,fontSize:17}}>
              {editItem?`✏️ Modifye: ${editItem.nom}`:'➕ Nouvo Succursale'}
            </h2>

            {/* Sous-superviseur */}
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontWeight:700,
                fontSize:11,color:'#555',marginBottom:6}}>
                Sous-Supervisè
              </label>
              <div style={{display:'flex',gap:8}}>
                {['oui','non'].map(v=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,sousSuperviseur:v}))}
                    style={{padding:'8px 20px',border:'none',borderRadius:8,
                      background:form.sousSuperviseur===v?'#1a73e8':'#f3f4f6',
                      color:form.sousSuperviseur===v?'white':'#333',
                      fontWeight:700,cursor:'pointer',fontSize:13}}>
                    {v==='oui'?'✅ Wi':'❌ Non'}
                  </button>
                ))}
              </div>
            </div>

            {/* Superviseur principal */}
            <div style={{marginBottom:14,background:'#f8f9fa',
              borderRadius:8,padding:'10px 14px'}}>
              <span style={{fontWeight:700,fontSize:12,color:'#555'}}>
                Supervisè Prensipal: </span>
              <span style={{fontWeight:900,color:'#374151'}}>N/A</span>
            </div>

            {/* Mariage gratuit */}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontWeight:700,
                fontSize:11,color:'#555',marginBottom:6}}>
                Mariage Gratuit
              </label>
              <div style={{display:'flex',gap:8}}>
                {['non','oui'].map(v=>(
                  <button key={v} onClick={()=>setForm(f=>({...f,mariageGratuit:v}))}
                    style={{padding:'8px 20px',border:'none',borderRadius:8,
                      background:form.mariageGratuit===v?'#16a34a':'#f3f4f6',
                      color:form.mariageGratuit===v?'white':'#333',
                      fontWeight:700,cursor:'pointer',fontSize:13}}>
                    {v==='oui'?'✅ Wi':'❌ Non'}
                  </button>
                ))}
              </div>
            </div>

            {/* Responsable */}
            <div style={{fontWeight:800,fontSize:12,color:'#1a73e8',
              marginBottom:10,paddingBottom:5,borderBottom:'2px solid #eff6ff'}}>
              👤 Responsab
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {inp2('prenomResponsable','Prenom Responsab','text','ex: Jean')}
              {inp2('nomResponsable','Non Responsab *','text','ex: Pierre')}
            </div>
            {inp2('pseudo','Pseudo (Username)','text','ex: jeanpierre')}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{display:'block',fontWeight:700,fontSize:11,
                  color:'#555',marginBottom:4}}>Modpas</label>
                <input type="password" value={form.password||''}
                  onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  placeholder="Modpas"
                  style={{width:'100%',padding:'10px 12px',
                    border:'1.5px solid #ddd',borderRadius:8,
                    fontSize:13,boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{display:'block',fontWeight:700,fontSize:11,
                  color:'#555',marginBottom:4}}>Konfime Modpas</label>
                <input type="password" value={form.confirmPassword||''}
                  onChange={e=>setForm(f=>({...f,confirmPassword:e.target.value}))}
                  placeholder="Repete"
                  style={{width:'100%',padding:'10px 12px',
                    border:form.confirmPassword&&form.confirmPassword!==form.password
                      ?'1.5px solid #dc2626':'1.5px solid #ddd',
                    borderRadius:8,fontSize:13,boxSizing:'border-box'}}/>
              </div>
            </div>

            {/* Info succursale */}
            <div style={{fontWeight:800,fontSize:12,color:'#16a34a',
              margin:'14px 0 10px',paddingBottom:5,
              borderBottom:'2px solid #f0fdf4'}}>
              🏢 Enfòmasyon Succursale
            </div>
            {inp2('nomSuccursal','Non Succursale *','text','ex: Succursale Nord')}
            {inp2('nomBanque','Non Banque','text','ex: BNC')}

            {/* Logo banque */}
            <div style={{marginBottom:14}}>
              <label style={{display:'block',fontWeight:700,fontSize:11,
                color:'#555',marginBottom:5}}>Logo Banque</label>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:56,height:56,borderRadius:8,
                  background:'#f1f5f9',border:'2px dashed #ddd',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  overflow:'hidden',flexShrink:0}}>
                  {form.logoBanque
                    ?<img src={form.logoBanque} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    :<span style={{fontSize:24,color:'#ccc'}}>🏦</span>}
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
                  {form.logoBanque&&(
                    <button onClick={()=>setForm(f=>({...f,logoBanque:''}))}
                      style={{background:'#fee2e2',color:'#dc2626',border:'none',
                        borderRadius:7,padding:'5px 10px',fontWeight:700,
                        cursor:'pointer',fontSize:11}}>✕ Retire</button>
                  )}
                </div>
              </div>
            </div>

            {/* Mesaj */}
            <div style={{marginBottom:16}}>
              <label style={{display:'block',fontWeight:700,fontSize:11,
                color:'#555',marginBottom:4}}>Mesaj</label>
              <textarea value={form.message||''}
                onChange={e=>setForm(f=>({...f,message:e.target.value}))}
                placeholder="Mesaj pou succursale a..."
                rows={2}
                style={{width:'100%',padding:'10px 12px',
                  border:'1.5px solid #ddd',borderRadius:8,
                  fontSize:13,boxSizing:'border-box',resize:'vertical',
                  fontFamily:'inherit'}}/>
            </div>

            <div style={{display:'flex',gap:10}}>
              {editItem&&(
                <button onClick={()=>{setForm(DEF);setEditItem(null);}}
                  style={{flex:1,padding:'12px',background:'#f3f4f6',
                    border:'none',borderRadius:10,fontWeight:700,cursor:'pointer'}}>
                  Anile
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                style={{flex:2,padding:'12px',
                  background:saving?'#ccc':'#1a73e8',
                  color:'white',border:'none',borderRadius:10,
                  fontWeight:900,fontSize:15,cursor:saving?'default':'pointer'}}>
                {saving?'⏳ Ap sove...'
                  :editItem?'✅ Sove Modifikasyon'
                  :'✅ Anrejistre'}
              </button>
            </div>
          </div>
        )}

        {/* ── LIS AKTIF / INAKTIF ── */}
        {(tab==='actif'||tab==='inactif') && (
          <div>
            {/* Bouton aksyon */}
            <div style={{display:'flex',gap:8,marginBottom:12}}>
              {['Kopye','Excel','PDF','Enprime'].map(l=>(
                <button key={l}
                  onClick={()=>l==='Enprime'&&window.print()}
                  style={{padding:'7px 14px',border:'1px solid #ddd',
                    borderRadius:8,background:'white',
                    fontWeight:700,cursor:'pointer',fontSize:12,color:'#374151'}}>
                  {l==='Kopye'?'📋':l==='Excel'?'📊':l==='PDF'?'📄':'🖨️'} {l}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{textAlign:'center',padding:32,color:'#888'}}>⏳</div>
            ) : display.length===0 ? (
              <div style={{textAlign:'center',padding:32,
                background:'white',borderRadius:12,color:'#aaa'}}>
                Pa gen succursale {tab==='actif'?'aktif':'inaktif'}
              </div>
            ) : (
              <div style={{display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10}}>
                {display.map((s,i)=>(
                  <div key={s._id||i} style={{background:'white',
                    borderRadius:12,padding:16,
                    boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
                    borderLeft:`4px solid ${s.actif!==false?'#16a34a':'#f59e0b'}`}}>
                    <div style={{display:'flex',gap:10,marginBottom:10}}>
                      {s.logoBanque&&(
                        <img src={s.logoBanque}
                          style={{width:40,height:40,borderRadius:8,objectFit:'cover'}}/>
                      )}
                      <div style={{flex:1}}>
                        <div style={{fontWeight:900,fontSize:14}}>{s.nom}</div>
                        <div style={{fontSize:11,color:'#888'}}>
                          {s.prenomResponsable} {s.nomResponsable}
                        </div>
                      </div>
                      <span style={{
                        background:s.actif!==false?'#dcfce7':'#fef9c3',
                        color:s.actif!==false?'#166534':'#854d0e',
                        borderRadius:20,padding:'2px 8px',
                        fontSize:10,fontWeight:700,alignSelf:'flex-start'}}>
                        {s.actif!==false?'Aktif':'Inaktif'}
                      </span>
                    </div>
                    {[
                      ['🏦 Banque',s.nomBanque||'—'],
                      ['👤 Pseudo', s.pseudo||'—'],
                      ['💒 Mariage Grat.', s.mariageGratuit||'non'],
                      ['👥 Sous-Sup.', s.sousSuperviseur||'non'],
                    ].map(([l,v])=>(
                      <div key={l} style={{display:'flex',justifyContent:'space-between',
                        padding:'4px 0',borderBottom:'1px solid #f0f0f0',
                        fontSize:12}}>
                        <span style={{color:'#888'}}>{l}:</span>
                        <span style={{fontWeight:700}}>{v}</span>
                      </div>
                    ))}
                    <div style={{display:'flex',gap:6,marginTop:10}}>
                      <button onClick={()=>openEdit(s)}
                        style={{flex:1,background:'#1a73e8',color:'white',
                          border:'none',borderRadius:7,padding:'7px',
                          fontWeight:700,cursor:'pointer',fontSize:12}}>
                        ✏️ Modifye
                      </button>
                      <button onClick={()=>handleToggle(s)}
                        style={{flex:1,
                          background:s.actif!==false?'#fef9c3':'#dcfce7',
                          color:s.actif!==false?'#854d0e':'#166534',
                          border:'none',borderRadius:7,padding:'7px',
                          fontWeight:700,cursor:'pointer',fontSize:12}}>
                        {s.actif!==false?'🔒 Dezaktive':'🔓 Aktive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}
