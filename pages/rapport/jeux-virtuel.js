import Layout from '../../components/Layout';
import { useState } from 'react';

export default function JeuxVirtuel() {
  const [game, setGame] = useState('kous-chen');
  const [date1, setDate1] = useState(new Date().toISOString().split('T')[0]);
  const [date2, setDate2] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState(null);

  const games = [
    { id: 'kous-chen', label: 'Kous chen', color: '#1a73e8' },
    { id: 'kous-cheval', label: 'Kous cheval', color: '#16a34a' },
    { id: 'lucky6', label: 'Lucky6', color: '#f59e0b' },
    { id: 'keno', label: 'Keno', color: '#1a73e8' },
    { id: 'tout', label: 'Tout', color: '#fff', border: '1px solid #ccc', textColor: '#333' },
  ];

  return (
    <Layout>
    <div className="card">
      <h2 className="card-title">Rapport jeux virtuel</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {games.map(g => (
          <button key={g.id} onClick={() => setGame(g.id)} style={{
            background: game === g.id ? g.color : (g.border ? '#fff' : g.color + '22'),
            color: game === g.id ? (g.textColor || 'white') : (g.textColor || g.color),
            border: g.border || 'none',
            borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 14
          }}>{g.label}</button>
        ))}
      </div>

      <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 15, fontWeight: 700 }}>Rapport</h3>
        <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>Date 1</label>
            <div className="input-with-check">
              <input type="date" value={date1} onChange={e => setDate1(e.target.value)}
                style={{ border: '1px solid #16a34a', borderRadius: 4, padding: '8px 35px 8px 12px' }} />
              <span className="check">✓</span>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 5 }}>Date 1</label>
            <div className="input-with-check">
              <input type="date" value={date2} onChange={e => setDate2(e.target.value)}
                style={{ border: '1px solid #16a34a', borderRadius: 4, padding: '8px 35px 8px 12px' }} />
              <span className="check">✓</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setResult({ mise: 0, perte: 0, profit: 0 })}>valider</button>
        </div>
      </div>

      {result && (
        <div style={{ textAlign: 'center', background: '#f9f9f9', borderRadius: 8, padding: 25 }}>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 5 }}>Rapport</h3>
          <p style={{ color: '#666', marginBottom: 20 }}>De : {date1} A : {date2}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {[['Mise', result.mise], ['Perte', result.perte], ['Profit', result.profit.toFixed(2)]].map(([label, val]) => (
              <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 20px', fontWeight: 700, textAlign: 'left' }}>{label}</td>
                <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: 600 }}>{val}</td>
              </tr>
            ))}
          </table>
        </div>
      )}
    </div>
  );
}