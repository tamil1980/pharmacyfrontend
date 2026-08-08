import { useState, useEffect } from 'react';
import { stockAPI, drugAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaExchangeAlt, FaSave } from 'react-icons/fa';

const StockTransfer = () => {
  const [drugs, setDrugs] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fromDrug: '', toDrug: '', quantity: 1, reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    drugAPI.getAll({ limit: 500 }).then(({ data }) => setDrugs(data.drugs || [])).catch(console.error);
    stockAPI.getTransfers({ limit: 200 }).then(({ data }) => setTransfers(data)).catch(console.error);
  }, []);

  const selectedFrom = drugs.find((d) => d._id === form.fromDrug);

  const submit = async () => {
    if (!form.fromDrug || !form.toDrug || form.quantity <= 0) return toast.error('Select source, destination and quantity');
    setSubmitting(true);
    try {
      const { data } = await stockAPI.createTransfer({
        fromDrug: form.fromDrug,
        fromBatch: selectedFrom?.batchNumber,
        toDrug: form.toDrug,
        toBatch: drugs.find((d) => d._id === form.toDrug)?.batchNumber,
        quantity: Number(form.quantity),
        reason: form.reason,
      });
      toast.success(`Transfer ${data.transferNumber} completed`);
      setShowModal(false);
      setForm({ fromDrug: '', toDrug: '', quantity: 1, reason: '' });
      stockAPI.getTransfers({ limit: 200 }).then(({ data }) => setTransfers(data)).catch(console.error);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    }
    setSubmitting(false);
  };

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">Stock Transfer</h2>
            <p className="dash-hero-sub">Move stock between medicine batches</p>
          </div>
          <button className="btn btn-light-hero" onClick={() => setShowModal(true)}><FaExchangeAlt /> New Transfer</button>
        </div>

        <div className="card">
          <div className="card-header"><h3>Transfer History ({transfers.length})</h3></div>
          <div className="card-body">
            <table>
              <thead><tr><th>Transfer No</th><th>From</th><th>To</th><th>Qty</th><th>Reason</th><th>Date</th></tr></thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t._id}>
                    <td><strong>{t.transferNumber}</strong></td>
                    <td>{t.fromName} <span className="badge badge-info">{t.fromBatch}</span></td>
                    <td>{t.toName} <span className="badge badge-info">{t.toBatch}</span></td>
                    <td><strong>{t.quantity}</strong></td>
                    <td>{t.reason}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {transfers.length === 0 && <tr><td colSpan={6} className="empty-state"><p>No transfers found</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Stock Transfer</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Source Medicine (Batch)</label>
                <select value={form.fromDrug} onChange={(e) => setForm({ ...form, fromDrug: e.target.value })}>
                  <option value="">Select source...</option>
                  {drugs.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.batchNumber}) - {d.quantity} in stock</option>)}
                </select>
              </div>
              <div className="form-group"><label>Destination Medicine (Batch)</label>
                <select value={form.toDrug} onChange={(e) => setForm({ ...form, toDrug: e.target.value })}>
                  <option value="">Select destination...</option>
                  {drugs.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.batchNumber})</option>)}
                </select>
              </div>
              <div className="form-group"><label>Quantity</label>
                <input type="number" min="1" max={selectedFrom?.quantity} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
              <div className="form-group"><label>Reason</label>
                <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Batch consolidation" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={submitting} onClick={submit}><FaSave /> {submitting ? 'Transferring...' : 'Transfer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransfer;
