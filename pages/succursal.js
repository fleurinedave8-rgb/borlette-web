import { useState } from 'react';
import DataTable from '../components/DataTable';

const mockData = [
  { id: 1, succursal: 'Central', bank: 'BNC', limite: '5,000', prime: '60/20/10', mGratuit: 'Oui', message: 'Actif', statut: 'actif' },
  { id: 2, succursal: 'Nord', bank: 'BUH', limite: '3,000', prime: '60/20/10', mGratuit: 'Non', message: '', statut: 'actif' },
];

export default function Succursal() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nom: '', limite: '', prime: '', message: '' });

  const columns = [
    { key: 'succursal', label: 'Succursal', sortable: true },
    { key: 'bank', label: 'Bank' },
    { key: 'limite', label: 'Limite' },
    { key: 'prime', label: 'Prime' },
    { key: 'mGratuit', label: 'MGratuit' },
    { key: 'message', label: 'Message' },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button className="btn btn-warning" style={{ fontSize: 11, padding: '4px 8px' }}>Modifier</button>
          <button className="btn btn-danger" style={{ fontSize: 11, padding: '4px 8px' }}>Désactivé</button>
          <button className="btn btn-success" style={{ fontSize: 11, padding: '4px 8px' }}>Mod. Limite</button>
          <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 8px' }}>Mod. Prime</button>
          <button className="btn btn-primary" style={{ fontSize: 11, padding: '4px 8px' }}>Voir Accès</button>
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>🔵 Ajouter</button>
          <button className="btn btn-success">🟢 Liste Actif</button>
          <button className="btn btn-warning">🟡 Liste Inactif</button>
          <span style={{ marginLeft: 'auto', fontSize: 13 }}>
            <span style={{ color: '#16a34a' }}>🟩 Actif</span>
            <span style={{ color: '#dc2626', marginLeft: 10 }}>🟥 Inactif</span>
          </span>
        </div>
        <DataTable columns={columns} data={mockData} />
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Ajouter une Succursal</div>
            {['Nom', 'Limite', 'Prime', 'Message'].map(f => (
              <div className="form-group" key={f}>
                <label>{f}</label>
                <input className="form-control" placeholder={f} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}>Ajouter</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
