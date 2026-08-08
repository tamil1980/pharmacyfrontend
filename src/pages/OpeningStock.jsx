import { useState, useEffect } from 'react';
import { stockAPI, drugAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaBoxOpen, FaPlusCircle, FaPlus, FaTrashAlt, FaSave, FaSearch } from 'react-icons/fa';

const OpeningStock = () => {
  const [drugs, setDrugs] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [rows, setRows] = useState([{ drug: '', batchNumber: '', quantity: 1 }]);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    drugAPI.getAll({ limit: 500 }).then(({ data }) => setDrugs(data.drugs || [])).catch(console.error);
    stockAPI.getOpenings({ limit: 200 }).then(({ data }) => setOpenings(data)).catch(console.error);
  }, []);

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
      const { data } = await stockAPI.createOpening({ items, remarks });
      toast.success(`Opening stock ${data.openingNumber} posted`);
      setShowModal(false);
      setRows([{ drug: '', batchNumber: '', quantity: 1 }]);
      setRemarks('');
      stockAPI.getOpenings({ limit: 200 }).then(({ data }) => setOpenings(data)).catch(console.error);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post opening stock');
    }
    setSubmitting(false);
  };

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">Opening Stock</h2>
            <p className="dash-hero-sub">Set initial stock quantities for your inventory</p>
          </div>
          <button className="btn btn-light-hero" onClick={() => setShowModal(true)}><FaBoxOpen /> New Opening Entry</button>
        </div>

        <div className="card">
          <div className="card-header"><h3>Opening Entries ({openings.length})</h3></div>
          <div className="card-body">
            <table>
              <thead><tr><th>Opening No</th><th>Items</th><th>Total Qty</th><th>Remarks</th><th>Posted By</th><th>Date</th></tr></thead>
              <tbody>
                {openings.map((o) => (
                  <tr key={o._id}>
                    <td><strong>{o.openingNumber}</strong></td>
                    <td>{o.items?.map((it, i) => <div key={i} style={{ fontSize: 12 }}>{it.drug?.name} × {it.quantity} ({it.batchNumber})</div>)}</td>
                    <td><strong>{o.totalQuantity}</strong></td>
                    <td>{o.remarks || '—'}</td>
                    <td>{o.openedBy?.name}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {openings.length === 0 && <tr><td colSpan={6} className="empty-state"><p>No opening entries found</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Opening Stock</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Remarks</label>
                <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={submitting} onClick={submit}><FaSave /> {submitting ? 'Posting...' : 'Post Opening Stock'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpeningStock;
