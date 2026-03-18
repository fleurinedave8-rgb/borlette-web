import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const TIRAGES = [
  'Florida matin','Florida soir',
  'New-york matin','New-york soir',
  'Georgia-Matin','Georgia-Soir',
  'Ohio matin','Ohio soir',
  'Chicago matin','Chicago soir',
  'Maryland midi','Maryland soir',
  'Tennessee matin','Tennessee soir',
];

const pad2 = v => String(v||'').padStart(2,'0');
const pad3 = v => String(v||'').padStart(3,'0');
const pad4 = v => String(v||'').padStart(4,'0');
const fmtD = d => {
  if (!d) return '—';
  const dt = new Date(d), p = n => String(n).padStart(2,'0');
  return `${p(dt.getDate())}/${p(dt.getMonth()+1)}/${dt.getFullYear()}`;
};

const SÈKSTIL = (bg) => ({
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  width:38, height:38, borderRadius:'50%',
  background:bg, color:'white', fontWeight:900,
  fontSize:15, fontFamily:'monospace',
});
const REKTANSTIL = (bg, minW) => ({
  display:'inline-flex', alignItems:'center', justifyContent:'center',
  minWidth:minW||44, height:36, borderRadius:8, padding:'0 6px',
  background:bg, color:'white', fontWeight:900,
  fontSize:13, fontFamily:'monospace', letterSpacing:1,
});

export default function LotsGagnant() {
  const today = new Date().toISOString().split('T')[0];
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [search,  setSearch]  = useState('');
  const [page,    setPage]    = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [editRow, setEditRow]   = useState(null); // row kap edite

  const openEdit = (row) => {
    setForm({
      tirage: row.tirage || 'Florida matin',
      date:   row.date ? new Date(row.date).toISOString().split('T')[0] : today,
      loto3:  row.loto3 || '',
      loto4:  row.loto4 || '',
      lot1:   row.lot1  || '',
      lot2:   row.lot2  || '',
      lot3:   row.lot3  || '',
    });
    setEditRow(row);
    setConfirm(false);
    setShowAdd(true);
  };
  const PER = 10;

  const [form, setForm] = useState({
    tirage:'Florida matin', date:today,
    loto3:'', loto4:'', lot1:'', lot2:'', lot3:'',
  });

  const errors = {
    loto3: form.loto3 && !/^\d{3}$/.test(form.loto3),
    loto4: form.loto4 && !/^\d{4}$/.test(form.loto4),
    lot1:  !form.lot1 || !/^\d{1,2}$/.test(form.lot1),
    lot2:  form.lot2 && !/^\d{1,2}$/.test(form.lot2),
    lot3:  form.lot3 && !/^\d{1,2}$/.test(form.lot3),
  };
  const hasError = errors.lot1 || errors.loto3 || errors.loto4;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/admin/resultats');
      setData(Array.isArray(r.data) ? r.data : []);
    } catch { setData([]); }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!confirm) { setConfirm(true); return; }
    setSaving(true);
    try {
      if (editRow) {
        // Modifye rezilta egzistant
        await api.put('/api/admin/resultats/' + editRow._id, {
          tirage: form.tirage,
          loto3:  form.loto3 || '',
          loto4:  form.loto4 || '',
          lot1:   form.lot1,
          lot2:   form.lot2 || '',
          lot3:   form.lot3 || '',
          date:   form.date || today,
        });
        setMsg('✅ Rezilta modifye!');
        setShowAdd(false); setConfirm(false); setEditRow(null);
        setForm({ tirage:'Florida matin', date:today,
          loto3:'', loto4:'', lot1:'', lot2:'', lot3:'' });
        await load();
        setTimeout(() => setMsg(''), 4000);
        setSaving(false);
        return;
      }
      await api.post('/api/admin/resultats', {
        tirage: form.tirage,
        loto3:  form.loto3 || '',
        loto4:  form.loto4 || '',
        lot1:   form.lot1,
        lot2:   form.lot2 || '',
        lot3:   form.lot3 || '',
        date:   form.date || today,
      });

      const tirage = await api.get('/api/tirages').then(r =>
        (r.data||[]).find(t => t.nom === form.tirage)
      ).catch(() => null);

      if (tirage) {
        await api.post('/api/gagnant/calculer', {
          tirageId: tirage._id,
          lot1:  form.lot1,
          lot2:  form.lot2  || '',
          lot3:  form.lot3  || '',
          loto3: form.loto3 || '',
          loto4: form.loto4 || '',
        }).catch(() => {});
      }

      setMsg('✅ Rezilta anrejistre — kalkil gagnant fini!');
      setShowAdd(false);
      setConfirm(false);
      setForm({ tirage:'Florida matin', date:today,
        loto3:'', loto4:'', lot1:'', lot2:'', lot3:'' });
      await load();
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setMsg('❌ ' + (e?.response?.data?.message || 'Erè sèvè'));
      setConfirm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Efase rezilta sa?')) return;
    try { await api.delete('/api/admin/resultats/' + id); await load(); } catch {}
  };

  const filtered = data.filter(r =>
    !search || Object.values(r).some(v =>
      String(v||'').toLowerCase().includes(search.toLowerCase())
    )
  );
  const pages = Math.ceil(filtered.length / PER);
  const paged = filtered.slice(page * PER, (page + 1) * PER);

  const inp = (key, label, maxLen, color, ph) => (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:'block', fontWeight:700,
        fontSize:12, color, marginBottom:4 }}>{label}</label>
      <input
        type="text"
        maxLength={maxLen}
        value={form[key]}
        onChange={e => setForm(f => ({
          ...f, [key]: e.target.value.replace(/\D/g,'').slice(0,maxLen)
        }))}
        placeholder={ph}
        style={{
          width:'100%', padding:'12px',
          border: errors[key] ? '2px solid #dc2626' : `2px solid ${color}`,
          borderRadius:8, fontSize:20, fontWeight:900,
          textAlign:'center', fontFamily:'monospace',
          boxSizing:'border-box', color,
        }}
      />
      {errors[key] && (
        <div style={{ color:'#dc2626', fontSize:11, fontWeight:700, marginTop:3 }}>
          ✗ Format pa kòrèk
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 8px 40px' }}>

        <div style={{ background:'#f59e0b', borderRadius:10,
          padding:'11px 20px', marginBottom:14,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:900, fontSize:16, color:'#111' }}>
            LA-PROBITE-BORLETTE
          </span>
          <span style={{ fontSize:11, color:'#78350f', fontWeight:700 }}>
            Lots Gagnant
          </span>
        </div>

        {msg && (
          <div style={{
            background: msg.startsWith('✅') ? '#dcfce7' : '#fee2e2',
            border: `1.5px solid ${msg.startsWith('✅') ? '#16a34a' : '#dc2626'}`,
            color: msg.startsWith('✅') ? '#166534' : '#991b1b',
            padding:'10px 16px', borderRadius:8,
            marginBottom:12, fontWeight:700,
          }}>
            {msg}
          </div>
        )}

        <div style={{ background:'white', borderRadius:12, padding:16,
          boxShadow:'0 2px 8px rgba(0,0,0,0.08)', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:12 }}>
            <h2 style={{ margin:0, fontWeight:900, fontSize:18 }}>
              🏆 Lots Gagnant
            </h2>
            <button
              onClick={() => { setShowAdd(true); setConfirm(false); }}
              style={{ background:'#16a34a', color:'white', border:'none',
                borderRadius:8, padding:'9px 18px',
                fontWeight:700, cursor:'pointer', fontSize:13 }}>
              ➕ Ajoute Rezilta
            </button>
          </div>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="🔍 Rechèch tiraj, dat..."
            style={{ width:'100%', padding:'9px 12px',
              border:'1.5px solid #ddd', borderRadius:8,
              fontSize:13, boxSizing:'border-box' }}
          />
        </div>

        <div style={{ background:'white', borderRadius:12,
          boxShadow:'0 2px 8px rgba(0,0,0,0.08)', overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'#f8f9fa', borderBottom:'2px solid #e5e7eb' }}>
                {['Dat','Tiraj','Loto 3','1er Lot','2em Lot','3em Lot','Aksyon'].map(h => (
                  <th key={h} style={{ padding:'11px 12px', fontWeight:700,
                    fontSize:11, color:'#555', textAlign:'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding:32, textAlign:'center', color:'#888' }}>
                    ⏳ Ap chaje...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding:32, textAlign:'center',
                    color:'#aaa', fontStyle:'italic' }}>
                    Pa gen rezilta — klike ➕ Ajoute Rezilta
                  </td>
                </tr>
              ) : paged.map((row, i) => (
                <tr key={row._id || i}
                  style={{ borderBottom:'1px solid #f0f0f0',
                    background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding:'10px 12px' }}>{fmtD(row.date)}</td>
                  <td style={{ padding:'10px 12px', fontWeight:700 }}>{row.tirage}</td>
                  <td style={{ padding:'10px 12px' }}>
                    {row.loto3
                      ? <span style={REKTANSTIL('#7c3aed', 44)}>{pad3(row.loto3)}</span>
                      : <span style={{ color:'#ccc' }}>—</span>}
                  </td>

                  {[
                    { v: row.lot1, bg:'#16a34a' },
                    { v: row.lot2, bg:'#f59e0b' },
                    { v: row.lot3, bg:'#1a73e8' },
                  ].map((item, j) => (
                    <td key={j} style={{ padding:'10px 12px' }}>
                      {item.v
                        ? <span style={SÈKSTIL(item.bg)}>{pad2(item.v)}</span>
                        : <span style={{ color:'#ccc' }}>—</span>}
                    </td>
                  ))}
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:4 }}>
                      <button
                        onClick={() => openEdit(row)}
                        style={{ background:'#1a73e8', color:'white',
                          border:'none', borderRadius:6,
                          padding:'5px 8px', cursor:'pointer',
                          fontSize:11, fontWeight:700 }}>
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(row._id)}
                        style={{ background:'#dc2626', color:'white',
                          border:'none', borderRadius:6,
                          padding:'5px 8px', cursor:'pointer',
                          fontSize:11, fontWeight:700 }}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pages > 1 && (
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', padding:'10px 16px',
              borderTop:'1px solid #f0f0f0', fontSize:12, color:'#666' }}>
              <span>{page * PER + 1}–{Math.min((page+1)*PER, filtered.length)} / {filtered.length}</span>
              <div style={{ display:'flex', gap:8 }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p-1))}
                  disabled={page === 0}
                  style={{ padding:'5px 12px', border:'1px solid #ddd',
                    borderRadius:6, background:'white', cursor:'pointer',
                    color: page === 0 ? '#ccc' : '#333' }}>
                  ← Anvan
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pages-1, p+1))}
                  disabled={page >= pages - 1}
                  style={{ padding:'5px 12px', border:'1px solid #ddd',
                    borderRadius:6, background:'white', cursor:'pointer',
                    color: page >= pages-1 ? '#ccc' : '#333' }}>
                  Suivan →
                </button>
              </div>
            </div>
          )}
        </div>

        {showAdd && (
          <div
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
              zIndex:2000, display:'flex', alignItems:'center',
              justifyContent:'center', padding:20 }}
            onClick={() => { setShowAdd(false); setConfirm(false); setEditRow(null); }}>
            <div
              style={{ background:'white', borderRadius:16, padding:24,
                maxWidth:460, width:'100%', maxHeight:'90vh', overflowY:'auto' }}
              onClick={e => e.stopPropagation()}>

              <div style={{ fontWeight:900, fontSize:18, marginBottom:16, color:'#111' }}>
                {editRow ? '✏️ Modifye Rezilta' : '➕ Nouvo Rezilta Tiraj'}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:10, marginBottom:12 }}>
                <div>
                  <label style={{ display:'block', fontWeight:700,
                    fontSize:12, color:'#555', marginBottom:4 }}>
                    Tiraj *
                  </label>
                  <select
                    value={form.tirage}
                    onChange={e => setForm(f => ({...f, tirage:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px',
                      border:'1.5px solid #1a73e8', borderRadius:8,
                      fontSize:13, fontWeight:700 }}>
                    {TIRAGES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontWeight:700,
                    fontSize:12, color:'#555', marginBottom:4 }}>
                    Dat *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({...f, date:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px',
                      border:'1.5px solid #ddd', borderRadius:8,
                      fontSize:13, boxSizing:'border-box' }}
                  />
                </div>
              </div>

              {inp('loto3', 'Lotto 3 (3 chif) — opsyonèl', 3, '#7c3aed', 'ex: 347')}
              {inp('loto4', 'Lotto 4 (4 chif) — opsyonèl', 4, '#0891b2', 'ex: 4723')}

              <div style={{ display:'grid',
                gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                {[
                  ['lot1','1er Lot *','#16a34a', true],
                  ['lot2','2em Lot','#f59e0b', false],
                  ['lot3','3em Lot','#1a73e8', false],
                ].map(([key, label, color, required]) => (
                  <div key={key}>
                    <label style={{ display:'block', fontWeight:700,
                      fontSize:12, color, marginBottom:4 }}>
                      {label}
                      {errors[key] && required && (
                        <span style={{ color:'#dc2626' }}> ✗</span>
                      )}
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={form[key]}
                      onChange={e => setForm(f => ({
                        ...f, [key]: e.target.value.replace(/\D/g,'').slice(0,2)
                      }))}
                      placeholder="00"
                      style={{
                        width:'100%', padding:'12px',
                        border: errors[key] ? '2px solid #dc2626' : `2px solid ${color}`,
                        borderRadius:8, fontSize:20, fontWeight:900,
                        textAlign:'center', fontFamily:'monospace',
                        boxSizing:'border-box', color,
                      }}
                    />
                  </div>
                ))}
              </div>

              {(form.lot1 || form.lot2 || form.lot3 || form.loto3 || form.loto4) && (
                <div style={{ display:'flex', gap:8, justifyContent:'center',
                  flexWrap:'wrap', marginBottom:14 }}>
                  {form.loto3 && (
                    <div style={{ textAlign:'center' }}>
                      <div style={REKTANSTIL('#7c3aed', 58)}>{pad3(form.loto3)}</div>
                      <div style={{ fontSize:10, color:'#888', marginTop:3 }}>Loto3</div>
                    </div>
                  )}
                  {[
                    {v:form.lot1, bg:'#16a34a', l:'1er'},
                    {v:form.lot2, bg:'#f59e0b', l:'2em'},
                    {v:form.lot3, bg:'#1a73e8', l:'3em'},
                  ].map(({v, bg, l}) => (
                    <div key={l} style={{ textAlign:'center' }}>
                      <div style={{ width:52, height:52, borderRadius:'50%',
                        background: v ? bg : '#f0f0f0',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color: v ? 'white' : '#ccc',
                        fontWeight:900, fontSize:20, fontFamily:'monospace' }}>
                        {v ? pad2(v) : '—'}
                      </div>
                      <div style={{ fontSize:10, color:'#888', marginTop:3 }}>{l}</div>
                    </div>
                  ))}
                  {form.loto4 && (
                    <div style={{ textAlign:'center' }}>
                      <div style={REKTANSTIL('#0891b2', 68)}>{pad4(form.loto4)}</div>
                      <div style={{ fontSize:10, color:'#888', marginTop:3 }}>Loto4</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ background:'#fee2e2', border:'2px solid #dc2626',
                borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
                <div style={{ fontWeight:900, fontSize:13,
                  color:'#991b1b', marginBottom:6 }}>
                  ⚠️ ATANSYON — Verifye Anvan Ou Anrejistre
                </div>
                <div style={{ fontSize:12, color:'#7f1d1d', lineHeight:1.6 }}>
                  Ou pa sipoze fè erè nan antre lot gagnant yo.
                  Verifye sa w antre avan w klike sou{' '}
                  <strong>ANREGISTRER</strong>.
                  <br /><br />
                  <strong>
                    LA-PROBITE-BORLETTE pa responsab okenn erè kalkil
                    ki fèt sou balans vandè yo si w mete yon move lot gagnant.
                  </strong>
                </div>
              </div>

              {confirm && (
                <div style={{ background:'#fef9c3',
                  border:'1.5px solid #ca8a04', borderRadius:8,
                  padding:'10px 14px', marginBottom:12,
                  fontSize:13, color:'#854d0e', fontWeight:700 }}>
                  ⚠️ Ou sèten? Klike ANREGISTRER ankò pou konfime.
                  <br />
                  Tiraj: <strong>{form.tirage}</strong>
                  &nbsp;| 1er: <strong>{form.lot1}</strong>
                  &nbsp;| 2em: <strong>{form.lot2 || '—'}</strong>
                  &nbsp;| 3em: <strong>{form.lot3 || '—'}</strong>
                </div>
              )}

              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={() => { setShowAdd(false); setConfirm(false); setEditRow(null); }}
                  style={{ flex:1, padding:'12px', background:'#f3f4f6',
                    border:'none', borderRadius:10,
                    fontWeight:700, cursor:'pointer' }}>
                  Anile
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving || hasError || !form.lot1}
                  style={{
                    flex:2, padding:'12px',
                    background: saving || hasError || !form.lot1 ? '#ccc'
                      : confirm ? '#dc2626' : '#16a34a',
                    color:'white', border:'none', borderRadius:10,
                    fontWeight:900, fontSize:14, cursor:'pointer',
                  }}>
                  {saving ? '⏳ Ap sove...'
                    : confirm ? '⚠️ Wi — ANREGISTRER'
                    : '✅ Anregistrer'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
