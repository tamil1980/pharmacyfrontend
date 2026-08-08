import { useState, useEffect } from 'react';
import { stockAPI, drugAPI } from '../services/api';
import { FaBook } from 'react-icons/fa';

const TYPE_STYLE = {
  opening: 'badge-info',
  purchase: 'badge-success',
  sale: 'badge-danger',
  sale_return: 'badge-warning',
  purchase_return: 'badge-warning',
  adjustment: 'badge-info',
  transfer_in: 'badge-success',
  transfer_out: 'badge-danger',
};

const StockLedger = () => {
  const [drugs, setDrugs] = useState([]);
  const [entries, setEntries] = useState([]);
  const [drug, setDrug] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    drugAPI.getAll({ limit: 500 }).then(({ data }) => setDrugs(data.drugs || [])).catch(console.error);
  }, []);

  useEffect(() => { loadLedger(); }, [drug, from, to]);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const params = {};
      if (drug) params.drug = drug;
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await stockAPI.getLedger(params);
      setEntries(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">Stock Ledger</h2>
            <p className="dash-hero-sub">Every stock movement: purchases, sales, returns, adjustments and transfers</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3><FaBook /> Ledger Entries ({entries.length})</h3></div>
          <div className="card-body">
            <div className="search-bar">
              <select value={drug} onChange={(e) => setDrug(e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--input-border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text-primary)', maxWidth: 320 }}>
                <option value="">All Medicines</option>
                {drugs.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.batchNumber})</option>)}
              </select>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 150 }} />
              <span style={{ color: '#999' }}>to</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 150 }} />
            </div>
            <table>
              <thead><tr><th>Date</th><th>Medicine</th><th>Type</th><th>Reference</th><th>Qty Change</th><th>Stock After</th><th>By</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e._id}>
                    <td>{new Date(e.createdAt).toLocaleString()}</td>
                    <td><strong>{e.drug?.name || e.name}</strong>{e.batchNumber && <span className="badge badge-info" style={{ marginLeft: 6 }}>{e.batchNumber}</span>}</td>
                    <td><span className={`badge ${TYPE_STYLE[e.type] || 'badge-info'}`}>{e.type.toUpperCase().replace('_', ' ')}</span></td>
                    <td>{e.reference || '—'}</td>
                    <td style={{ fontWeight: 700, color: e.quantityChange < 0 ? '#dc3545' : '#198754' }}>
                      {e.quantityChange > 0 ? '+' : ''}{e.quantityChange}
                    </td>
                    <td>{e.stockAfter ?? '—'}</td>
                    <td>{e.createdBy?.name || '—'}</td>
                  </tr>
                ))}
                {entries.length === 0 && !loading && <tr><td colSpan={7} className="empty-state"><p>No ledger entries found</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockLedger;
