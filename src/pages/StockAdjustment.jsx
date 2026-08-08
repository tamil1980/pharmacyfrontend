import { useState, useEffect } from 'react';
import { stockAPI, drugAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaPlusCircle, FaSearch, FaBalanceScale, FaPlus, FaTrashAlt, FaSave, FaArrowDown, FaArrowUp } from 'react-icons/fa';

const StockAdjustment = () => {
  const [drugs, setDrugs] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('increase');
  const [rows, setRows] = useState([{ drug: '', batchNumber: '', quantity: 1 }]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    drugAPI.getAll({ limit: 500 }).then(({ data }) => setDrugs(data.drugs || [])).catch(console.error);
    loadAdjustments();
  }, [search]);

  const loadAdjustments = async () => {
    setLoading(true);
    try {
      const { data } = await stockAPI.getAdjustments({ limit: 200 });
      setAdjustments(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const selectDrug = (i, drugId) => {
    const drug = drugs.find((d) => d._id === drugId);
    setRows((prev) => {
      const next = [...prev];
      next[i] = { drug: drugId, batchNumber: drug?.batchNumber || '', quantity: 1 };
      return next;
    });
  };

  const addRow = () => setRows([...rows, { drug: '', batchNumber: '', quantity: 1 }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  const submit = async () => {
    const items = rows.filter((r) => r.drug && r.quantity > 0).map((r) => ({ drug: r.drug, batchNumber: r.batchNumber, quantity: Number(r.quantity) }));
    if (items.length === 0) return toast.error('Add at least one item');
    setSubmitting(true);
    try {
      const { data } = await stockAPI.createAdjustment({ type, items, reason });
      toast.success(`Adjustment ${data.adjustmentNumber} processed`);
      setShowModal(false);
      setRows([{ drug: '', batchNumber: '', quantity: 1 }]);
      setReason('');
      loadAdjustments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed');
    }
    setSubmitting(false);
  };

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">Stock Adjustment</h2>
            <p className="dash-hero-sub">Increase or decrease medicine stock with a reason</p>
          </div>
          <button className="btn btn-light-hero" onClick={() => setShowModal(true)}><FaBalanceScale /> New Adjustment</button>
        </div>

        <div className="card">
          <div className="card-header"><h3>Adjustment History ({adjustments.length})</h3></div>
          <div className="card-body">
            <div className="search-bar">
              <FaSearch style={{ marginTop: 10, color: '#999' }} />
              <input placeholder="Search adjustments..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <table>
              <thead><tr><th>Adj No</th><th>Type</th><th>Items</th><th>Reason</th><th>Adjusted By</th><th>Date</th></tr></thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a._id}>
                    <td><strong>{a.adjustmentNumber}</strong></td>
                    <td>
                      {a.type === 'increase'
                        ? <span className="badge badge-success"><FaArrowUp /> INCREASE</span>
                        : <span className="badge badge-danger"><FaArrowDown /> DECREASE</span>}
                    </td>
                    <td>
                      {a.items?.map((it, i) => <div key={i} style={{ fontSize: 12 }}>{it.name || it.drug?.name} × {it.quantity} ({it.batchNumber})</div>)}
                    </td>
                    <td>{a.reason}</td>
                    <td>{a.adjustedBy?.name}</td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {adjustments.length === 0 && !loading && <tr><td colSpan={6} className="empty-state"><p>No adjustments found</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Stock Adjustment</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button className={`btn ${type === 'increase' ? 'btn-success' : 'btn-outline'}`} onClick={() => setType('increase')}><FaArrowUp /> Increase Stock</button>
                <button className={`btn ${type === 'decrease' ? 'btn-danger' : 'btn-outline'}`} onClick={() => setType('decrease')}><FaArrowDown /> Decrease Stock</button>
              </div>
              {rows.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 40px', gap: 8, marginBottom: 8 }}>
                  <select value={row.drug} onChange={(e) => selectDrug(i, e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--input-border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                    <option value="">Select medicine...</option>
                    {drugs.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.batchNumber})</option>)}
                  </select>
                  <input value={row.batchNumber} onChange={(e) => setRows((p) => { const n = [...p]; n[i] = { ...n[i], batchNumber: e.target.value }; return n; })} placeholder="Batch" style={{ padding: '10px 14px', border: '1px solid var(--input-border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                  <input type="number" min="1" value={row.quantity} onChange={(e) => setRows((p) => { const n = [...p]; n[i] = { ...n[i], quantity: e.target.value }; return n; })} style={{ padding: '10px 14px', border: '1px solid var(--input-border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                  <button className="btn btn-sm btn-danger" onClick={() => removeRow(i)}><FaTrashAlt /></button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" onClick={addRow}><FaPlus /> Add Item</button>
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Reason</label>
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged stock, counting correction..." style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={submitting} onClick={submit}><FaSave /> {submitting ? 'Processing...' : 'Process Adjustment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAdjustment;
