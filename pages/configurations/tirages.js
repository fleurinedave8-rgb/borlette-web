import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES_DEFOLT = [
  { nom:'Florida matin',   ouverture:'10:00', fermeture:'10:30' },
  { nom:'Florida soir',    ouverture:'21:00', fermeture:'21:30' },
  { nom:'New-york matin',  ouverture:'12:29', fermeture:'12:30' },
  { nom:'New-york soir',   ouverture:'22:30', fermeture:'23:00' },
  { nom:'Georgia-Matin',   ouverture:'12:29', fermeture:'12:30' },
  { nom:'Georgia-Soir',    ouverture:'18:00', fermeture:'18:30' },
  { nom:'Ohio matin',      ouverture:'10:30', fermeture:'11:00' },
  { nom:'Ohio soir',       ouverture:'22:00', fermeture:'22:30' },
  { nom:'Maryland midi',   ouverture:'13:00', fermeture:'13:30' },
  { nom:'Maryland soir',   ouverture:'19:00', fermeture:'19:30' },
  { nom:'Tennessee matin', ouverture:'11:00', fermeture:'11:30' },
  { nom:'Tennessee soir',  ouverture:'21:30', fermeture:'22:00' },
];

const DEF_FORM = { nom:'', ouverture:'', fermeture:'', actif:true };

export default function TiragesPage() {
  const [tirages,  setTirages]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editT,    setEditT]    = useState(null);
  const [form,     setForm]     = useState(DEF_FORM);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState({ t:'', ok:true });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/tirages');
      const list = Array.isArray(r.data) ? r.data : [];
      // Kreye defòlt si vid
      if (list.length === 0) {
        for (const t of TIRAGES_DEFOLT) {
          await api.post('/api/tirages', { ...t, actif: true }).catch(()=>{});
        }
        const r2 = await api.get('/api/admin/tirages');
        setTirages(Array.isArray(r2.data) ? r2.data : []);
      } else {
        setTirages(list);
      }
    } catch { setTirages([]); }
    setLoading(false);
  };

  const notify = (t, ok=true) => {
    setMsg({t,ok}); setTimeout(()=>setMsg({t:'',ok:true}),3000);
  };

  const openAdd = () => {
    setForm(DEF_FORM); setEditT(null); setShowForm(true);
  };

  const openEdit = (t) => {
    setForm({
      nom:       t.nom || '',
      ouverture: t.ouverture || '',
      fermeture: t.fermeture || '',
      actif:     t.actif !== false,
    });
    setEditT(t); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) { notify('⚠️ Non tiraj obligatwa', false); return; }
    setSaving(true);
    try {
      if (editT) {
        await api.put(`/api/tirages/${editT._id}`, {
          nom: form.nom, ouverture: form.ouverture,
          fermeture: form.fermeture, actif: form.actif,
        });
        notify('✅ Tiraj modifye!');
      } else {
        await api.post('/api/tirages', {
          nom: form.nom, ouverture: form.ouverture,
          fermeture: form.fermeture, actif: true,
        });
        notify('✅ Tiraj ajoute!');
      }
      setShowForm(false); await load();
    } catch(e) {
      notify(`❌ ${e?.response?.data?.message||'Erè'}`, false);
    }
    setSaving(false);
  };

  const handleToggle = async (t) => {
    try {
      const route = t.actif !== false ? 'femen' : 'ouvri';
      await api.put(`/api/tirages/${t._id}/${route}`);
      notify(`✅ Tiraj ${t.actif!==false?'fèmen':'ouvri'}!`);
      await load();
    } catch { notify('❌ Erè', false); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Efase "${t.nom}"?`)) return;
    try {
      await api.delete(`/api/tirages/${t._id}`);
      notify('🗑️ Tiraj efase');
      await load();
    } catch { notify('❌ Erè', false); }
  };

  const actif  = tirages.filter(t => t.actif !== false);
  const inactif = tirages.filter(t => t.actif === false);

  return (
    <Layout>
      <div style={{maxWidth:900,margin:'0 auto',padding:'0 8px 40px'}}>

        {/* BANNIÈRE */}
        <div style={{background:'linear-gradient(135deg,#0891b2,#0e7490)',
          borderRadius:10,padding:'11px 20px',marginBottom:14,
          display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:900,fontSize:16,color:'white'}}>
            ⏰ Jesyon Tiraj
          </span>
          <button onClick={openAdd}
            style={{background:'white',color:'#0891b2',border:'none',
              borderRadius:8,padding:'8px 16px',fontWeight:900,
              fontSize:13,cursor:'pointer'}}>
            ➕ Ajoute Tiraj
          </button>
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

        {/* STATS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',
          gap:8,marginBottom:14}}>
          {[
            ['Total',  tirages.length, '#0891b2'],
            ['✅ Aktif', actif.length,  '#16a34a'],
            ['❌ Fèmen', inactif.length,'#dc2626'],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:'white',borderRadius:10,
              padding:'12px',textAlign:'center',
              boxShadow:'0 1px 4px rgba(0,0,0,0.08)',
              borderTop:`3px solid ${c}`}}>
              <div style={{fontWeight:900,fontSize:22,color:c}}>{v}</div>
              <div style={{fontSize:11,color:'#888',fontWeight:700}}>{l}</div>
            </div>
          ))}
        </div>

        {/* LIS TIRAJ */}
        {loading ? (
          <div style={{textAlign:'center',padding:40,color:'#888'}}>
            ⏳ Ap chaje...
          </div>
        ) : (
          <div style={{background:'white',borderRadius:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.08)',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#f8f9fa',borderBottom:'2px solid #e5e7eb'}}>
                  {['Non Tiraj','Ouverture','Fèmti','Statut','Aksyon'].map(h=>(
                    <th key={h} style={{padding:'11px 14px',fontWeight:700,
                      fontSize:11,color:'#555',textAlign:'left'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tirages.length===0 ? (
                  <tr><td colSpan={5} style={{padding:32,
                    textAlign:'center',color:'#aaa'}}>
                    Pa gen tiraj — klike ➕ pou ajoute
                  </td></tr>
                ) : tirages.map((t,i)=>{
                  const isActif = t.actif !== false;
                  return (
                    <tr key={t._id||i}
                      style={{borderBottom:'1px solid #f0f0f0',
                        background:i%2===0?'white':'#fafafa'}}>
                      <td style={{padding:'11px 14px',fontWeight:800,
                        fontSize:14}}>
                        {t.nom}
                      </td>
                      <td style={{padding:'11px 14px',
                        fontFamily:'monospace',color:'#0891b2',
                        fontWeight:700}}>
                        {t.ouverture||'—'}
                      </td>
                      <td style={{padding:'11px 14px',
                        fontFamily:'monospace',color:'#7c3aed',
                        fontWeight:700}}>
                        {t.fermeture||'—'}
                      </td>
                      <td style={{padding:'11px 14px'}}>
                        <span style={{
                          background:isActif?'#dcfce7':'#fee2e2',
                          color:isActif?'#166534':'#991b1b',
                          borderRadius:20,padding:'3px 10px',
                          fontSize:11,fontWeight:800}}>
                          {isActif?'✅ Aktif':'❌ Fèmen'}
                        </span>
                      </td>
                      <td style={{padding:'11px 14px'}}>
                        <div style={{display:'flex',gap:6}}>
                          {/* Modifye */}
                          <button onClick={()=>openEdit(t)}
                            style={{background:'#1a73e8',color:'white',
                              border:'none',borderRadius:6,
                              padding:'6px 10px',cursor:'pointer',
                              fontSize:12,fontWeight:700}}>
                            ✏️
                          </button>
                          {/* Ouvri/Fèmen */}
                          <button onClick={()=>handleToggle(t)}
                            style={{background:isActif?'#fee2e2':'#dcfce7',
                              color:isActif?'#dc2626':'#16a34a',
                              border:'none',borderRadius:6,
                              padding:'6px 10px',cursor:'pointer',
                              fontSize:12,fontWeight:700}}>
                            {isActif?'🔒 Fèmen':'🔓 Ouvri'}
                          </button>
                          {/* Efase */}
                          <button onClick={()=>handleDelete(t)}
                            style={{background:'#f3f4f6',color:'#dc2626',
                              border:'none',borderRadius:6,
                              padding:'6px 10px',cursor:'pointer',
                              fontSize:12,fontWeight:700}}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODAL KREYE/MODIFYE */}
        {showForm && (
          <div style={{position:'fixed',inset:0,
            background:'rgba(0,0,0,0.6)',zIndex:2000,
            display:'flex',alignItems:'center',justifyContent:'center',
            padding:20}}
            onClick={()=>setShowForm(false)}>
            <div style={{background:'white',borderRadius:16,padding:28,
              maxWidth:420,width:'100%'}}
              onClick={e=>e.stopPropagation()}>

              <div style={{fontWeight:900,fontSize:17,marginBottom:20}}>
                {editT?'✏️ Modifye Tiraj':'➕ Nouvo Tiraj'}
              </div>

              {[
                ['nom',       'Non Tiraj *',  'text', 'ex: Florida matin'],
                ['ouverture', 'Ouverture',    'time', ''],
                ['fermeture', 'Fèmti',        'time', ''],
              ].map(([k,l,t,p])=>(
                <div key={k} style={{marginBottom:14}}>
                  <label style={{display:'block',fontWeight:700,
                    fontSize:12,color:'#555',marginBottom:4}}>{l}</label>
                  <input type={t} value={form[k]||''}
                    onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                    placeholder={p}
                    style={{width:'100%',padding:'11px 12px',
                      border:'1.5px solid #ddd',borderRadius:8,
                      fontSize:14,boxSizing:'border-box'}} />
                </div>
              ))}

              {/* Toggle aktif si edit */}
              {editT && (
                <div style={{marginBottom:16,display:'flex',
                  alignItems:'center',gap:10}}>
                  <label style={{fontWeight:700,fontSize:12,color:'#555'}}>
                    Statut:
                  </label>
                  <button
                    onClick={()=>setForm(f=>({...f,actif:!f.actif}))}
                    style={{padding:'7px 16px',border:'none',borderRadius:8,
                      background:form.actif?'#dcfce7':'#fee2e2',
                      color:form.actif?'#166534':'#991b1b',
                      fontWeight:700,cursor:'pointer',fontSize:13}}>
                    {form.actif?'✅ Aktif':'❌ Fèmen'}
                  </button>
                </div>
              )}

              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button onClick={()=>setShowForm(false)}
                  style={{flex:1,padding:'12px',background:'#f3f4f6',
                    border:'none',borderRadius:10,
                    fontWeight:700,cursor:'pointer'}}>
                  Anile
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{flex:2,padding:'12px',
                    background:saving?'#ccc':editT?'#1a73e8':'#16a34a',
                    color:'white',border:'none',borderRadius:10,
                    fontWeight:900,fontSize:14,cursor:'pointer'}}>
                  {saving?'⏳ Ap sove...':editT?'✅ Sove':'✅ Ajoute'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
