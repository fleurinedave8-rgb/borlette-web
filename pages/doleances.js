import { useState } from 'react';

export default function Doleances() {
  const [form, setForm] = useState({ sujet: '', email: '', description: '' });

  return (
    <div className="card" style={{ maxWidth: 600 }}>
      <h2 className="card-title">Doléances</h2>

      <div style={{ background: '#f5f5f5', borderRadius: 6, padding: 15, marginBottom: 20, fontSize: 14, color: '#555', lineHeight: 1.6 }}>
        Ou gon problem ak systèm nan ?<br />
        Ou anvi gon fonksyonalite ke nou poko genyen ?<br />
        Ou anvi fe nou yon propozition ?<br />
        pa ezite ekri nou.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
        <div className="form-group">
          <label>Sujet</label>
          <input className="form-control" value={form.sujet} onChange={e => setForm({ ...form, sujet: e.target.value })}
            style={{ borderColor: form.sujet ? '#16a34a' : '#dc2626' }} />
        </div>
        <div className="form-group">
          <label>Nom</label>
          <input className="form-control" value="Lavi Pap diw" readOnly style={{ background: '#f5f5f5' }} />
        </div>
        <div className="form-group">
          <label>Téléphone</label>
          <input className="form-control" value="3560-0921/4639-118" readOnly style={{ background: '#f5f5f5' }} />
        </div>
        <div className="form-group">
          <label>Email (facultatif)</label>
          <div className="input-with-check">
            <input className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ border: '1px solid #16a34a' }} />
            <span className="check">✓</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <div className="input-with-check">
          <textarea className="form-control" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ border: '1px solid #16a34a', resize: 'vertical' }} />
          <span className="check" style={{ top: 10 }}>✓</span>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={() => alert('Message envoyé!')}>Voye ale</button>
    </div>
  );
}
