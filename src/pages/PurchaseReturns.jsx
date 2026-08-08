import { useState, useEffect } from 'react';
import { purchaseReturnAPI, grnAPI } from '../services/api';
import { usePharmacy } from '../context/PharmacyContext';
import { toast } from 'react-toastify';
import {
  FaUndoAlt, FaSearch, FaPlusCircle, FaCheckCircle, FaArrowLeft, FaEye, FaTrashAlt
} from 'react-icons/fa';

const PurchaseReturns = () => {
  const { settings } = usePharmacy();
  const s = settings || {};
  const currency = s.currency || '₹';

  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [grnSearch, setGrnSearch] = useState('');
  const [grnResults, setGrnResults] = useState([]);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [returnQty, setReturnQty] = useState({});
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewReturn, setViewReturn] = useState(null);

  const loadReturns = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (search) params.search = search;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const { data } = await purchaseReturnAPI.getAll(params);
      setReturns(data.returns || []);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadReturns(); }, [search, dateFrom, dateTo]);

  const searchGRNs = async () => {
    try {
      const { data } = await grnAPI.getAll({ search: grnSearch, limit: 10 });
      setGrnResults(data.grns || []);
    } catch (err) { console.error(err); }
  };

  const selectGRN = (grn) => {
    setSelectedGrn(grn);
    const qty = {};
    grn.items.forEach((item, i) => { qty[i] = (item.quantity || 0) - (item.returnedQty || 0); });
    setReturnQty(qty);
  };

  const resetModal = () => {
    setShowModal(false);
    setSelectedGrn(null);
    setGrnResults([]);
    setGrnSearch('');
    setReason('');
    setReturnQty({});
  };

  const getReturnSummary = () => {
    if (!selectedGrn) return { subtotal: 0, gst: 0, total: 0 };
    let subtotal = 0, gst = 0;
    selectedGrn.items.forEach((item, i) => {
      const qty = Math.min(Math.max(Number(returnQty[i] || 0), 0), (item.quantity || 0) - (item.returnedQty || 0));
      const itemTotal = item.purchasePrice * qty;
      subtotal += itemTotal;
      gst += (itemTotal * (item.gstRate || 12)) / 100;
    });
    return { subtotal, gst, total: subtotal + gst };
  };

  const submitReturn = async () => {
    const items = [];
    selectedGrn.items.forEach((item, i) => {
      const qty = Number(returnQty[i] || 0);
      if (qty > 0) items.push({ drug: item.drug?._id, batchNumber: item.batchNumber, quantity: qty });
    });
    if (items.length === 0) return toast.error('Select at least one item to return');

    setSubmitting(true);
    try {
      const { data } = await purchaseReturnAPI.create({ grnId: selectedGrn._id, items, reason });
      toast.success(`Purchase return ${data.returnNumber} processed`);
      resetModal();
      loadReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    }
    setSubmitting(false);
  };

  const viewDetails = async (id) => {
    try { const { data } = await purchaseReturnAPI.getOne(id); setViewReturn(data); } catch (err) { console.error(err); }
  };

  const totalReturned = returns.reduce((sum, r) => sum + (r.totalReturn || 0), 0);

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">Purchase Returns</h2>
            <p className="dash-hero-sub">Return goods to suppliers and update stock</p>
          </div>
          <button className="btn btn-light-hero" onClick={() => setShowModal(true)}><FaPlusCircle /> New Purchase Return</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-card-gradient purple">
            <div className="stat-icon"><FaUndoAlt /></div>
            <div className="stat-info"><h2>{total}</h2><p>Total Purchase Returns</p></div>
          </div>
          <div className="stat-card stat-card-gradient red">
            <div className="stat-icon"><FaUndoAlt /></div>
            <div className="stat-info"><h2>{currency}{totalReturned.toLocaleString()}</h2><p>Total Returned Value</p></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Purchase Return Records</h3></div>
          <div className="card-body">
            <div className="search-bar">
              <FaSearch style={{ marginTop: 10, color: '#999' }} />
              <input placeholder="Search by return no, GRN no, supplier..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 150 }} />
              <span style={{ color: '#999' }}>to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 150 }} />
            </div>
            <table>
              <thead><tr><th>Return No</th><th>GRN</th><th>Supplier</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {returns.map((r) => (
                  <tr key={r._id}>
                    <td><strong>{r.returnNumber}</strong></td>
                    <td>{r.grnNumber}</td>
                    <td>{r.supplierName}</td>
                    <td>{r.items?.length}</td>
                    <td><strong>{currency}{r.totalReturn?.toLocaleString()}</strong></td>
                    <td><span className={`badge ${r.status === 'returned' ? 'badge-danger' : 'badge-warning'}`}>{r.status.toUpperCase()}</span></td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-sm btn-outline" onClick={() => viewDetails(r._id)}><FaEye /> View</button></td>
                  </tr>
                ))}
                {returns.length === 0 && !loading && <tr><td colSpan={8} className="empty-state"><p>No purchase returns found</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedGrn ? `Return goods - ${selectedGrn.grnNumber}` : 'Select GRN / Purchase'}</h3>
              <button className="modal-close" onClick={resetModal}>×</button>
            </div>
            <div className="modal-body">
              {!selectedGrn ? (
                <div>
                  <div className="search-bar">
                    <FaSearch style={{ marginTop: 10, color: '#999' }} />
                    <input placeholder="Search GRN number..." value={grnSearch} onChange={(e) => setGrnSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchGRNs()} />
                    <button className="btn btn-primary" onClick={searchGRNs}>Search</button>
                  </div>
                  <table>
                    <thead><tr><th>GRN</th><th>Supplier</th><th>Net Amount</th><th>Date</th><th></th></tr></thead>
                    <tbody>
                      {grnResults.map((g) => {
                        const fullyReturned = g.items?.every((it) => (it.quantity || 0) <= (it.returnedQty || 0));
                        return (
                          <tr key={g._id}>
                            <td><strong>{g.grnNumber}</strong></td>
                            <td>{g.supplier?.name || '-'}</td>
                            <td>{currency}{g.netAmount?.toLocaleString()}</td>
                            <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                            <td><button className="btn btn-sm btn-success" disabled={fullyReturned} onClick={() => selectGRN(g)}>Select</button></td>
                          </tr>
                        );
                      })}
                      {grnResults.length === 0 && <tr><td colSpan={5} className="empty-state"><p>Search for a GRN to return</p></td></tr>}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 14 }}>
                    <div><strong>Supplier:</strong> {selectedGrn.supplier?.name || '-'}</div>
                    <div><strong>GRN:</strong> {selectedGrn.grnNumber}</div>
                  </div>
                  <table>
                    <thead><tr><th>Medicine</th><th>Batch</th><th>Received</th><th>Returned</th><th>Qty to Return</th><th>Rate</th><th>Return Value</th></tr></thead>
                    <tbody>
                      {selectedGrn.items?.map((item, i) => {
                        const available = (item.quantity || 0) - (item.returnedQty || 0);
                        const qty = Math.min(Math.max(Number(returnQty[i] || 0), 0), available);
                        const returnValue = qty > 0 ? item.purchasePrice * qty : 0;
                        const gstAmt = (returnValue * (item.gstRate || 12)) / 100;
                        return (
                          <tr key={i}>
                            <td><strong>{item.drug?.name || item.drugName || 'N/A'}</strong></td>
                            <td>{item.batchNumber}</td>
                            <td>{item.quantity}</td>
                            <td>{item.returnedQty || 0}</td>
                            <td><input type="number" min="0" max={available} value={returnQty[i] || 0} onChange={(e) => setReturnQty({ ...returnQty, [i]: e.target.value })} style={{ width: 90, padding: '6px 8px', border: '1px solid var(--input-border)', borderRadius: 6, background: 'var(--input-bg)', color: 'var(--text-primary)' }} /></td>
                            <td>{currency}{item.purchasePrice}</td>
                            <td>{qty > 0 ? currency + (returnValue + gstAmt).toFixed(2) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Reason for return</label>
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged, expired stock..." style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  </div>
                  <div className="billing-summary" style={{ marginTop: 16 }}>
                    <div className="row"><span>Return Subtotal</span><span>{currency}{getReturnSummary().subtotal.toFixed(2)}</span></div>
                    <div className="row"><span>GST</span><span>{currency}{getReturnSummary().gst.toFixed(2)}</span></div>
                    <div className="row total"><span>Total Return</span><span>{currency}{getReturnSummary().total.toFixed(2)}</span></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <button className="btn btn-outline" onClick={() => setSelectedGrn(null)}><FaArrowLeft /> Change GRN</button>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-outline" onClick={resetModal}><FaTrashAlt /> Cancel</button>
                      <button className="btn btn-primary" disabled={submitting || getReturnSummary().total <= 0} onClick={submitReturn}>
                        <FaCheckCircle /> {submitting ? 'Processing...' : 'Process Return'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewReturn && (
        <div className="modal-overlay" onClick={() => setViewReturn(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Purchase Return - {viewReturn.returnNumber}</h3>
              <button className="modal-close" onClick={() => setViewReturn(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 14 }}>
                <div><strong>GRN:</strong> {viewReturn.grnNumber}</div>
                <div><strong>Supplier:</strong> {viewReturn.supplierName}</div>
                <div><strong>Date:</strong> {new Date(viewReturn.createdAt).toLocaleString()}</div>
                <div><strong>Reason:</strong> {viewReturn.reason}</div>
              </div>
              <table>
                <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Rate</th><th>GST</th><th>Return Value</th></tr></thead>
                <tbody>
                  {viewReturn.items?.map((item, i) => (
                    <tr key={i}>
                      <td><strong>{item.name || item.drug?.name || 'N/A'}</strong></td>
                      <td>{item.batchNumber}</td>
                      <td>{item.quantity}</td>
                      <td>{currency}{item.purchasePrice}</td>
                      <td>{currency}{item.gstAmount?.toFixed(2)}</td>
                      <td><strong>{currency}{item.returnAmount?.toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <p>Subtotal: {currency}{viewReturn.subtotal?.toFixed(2)}</p>
                <p>GST: {currency}{viewReturn.totalGST?.toFixed(2)}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#0d6efd' }}>Total Return: {currency}{viewReturn.totalReturn?.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReturns;
