import { useState, useEffect } from 'react';
import { salesReturnAPI, invoiceAPI } from '../services/api';
import { usePharmacy } from '../context/PharmacyContext';
import Header from '../components/Header';
import { toast } from 'react-toastify';
import {
  FaUndoAlt, FaSearch, FaFileInvoiceDollar, FaTrashAlt,
  FaArrowLeft, FaPlusCircle, FaCheckCircle, FaEye
} from 'react-icons/fa';

const SalesReturns = () => {
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
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceResults, setInvoiceResults] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
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
      const { data } = await salesReturnAPI.getAll(params);
      setReturns(data.returns || []);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadReturns(); }, [search, dateFrom, dateTo]);

  const searchInvoices = async () => {
    try {
      const { data } = await invoiceAPI.getAll({ search: invoiceSearch, limit: 10 });
      setInvoiceResults(data.invoices || []);
    } catch (err) { console.error(err); }
  };

  const selectInvoice = (inv) => {
    setSelectedInvoice(inv);
    const qty = {};
    inv.items.forEach((item, i) => {
      qty[i] = (item.quantity || 0) - (item.returnedQty || 0);
    });
    setReturnQty(qty);
  };

  const resetModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
    setInvoiceResults([]);
    setInvoiceSearch('');
    setReason('');
    setReturnQty({});
  };

  const getRefundSummary = () => {
    if (!selectedInvoice) return { subtotal: 0, discount: 0, gst: 0, refund: 0 };
    let subtotal = 0, discount = 0, gst = 0;
    selectedInvoice.items.forEach((item, i) => {
      const qty = Math.min(Math.max(Number(returnQty[i] || 0), 0), (item.quantity || 0) - (item.returnedQty || 0));
      const itemTotal = item.unitPrice * qty;
      const disc = (itemTotal * (item.discount || 0)) / 100;
      const afterDisc = itemTotal - disc;
      const gstAmt = (afterDisc * (item.gstRate || 12)) / 100;
      subtotal += itemTotal;
      discount += disc;
      gst += gstAmt;
    });
    return { subtotal, discount, gst, refund: subtotal - discount + gst };
  };

  const submitReturn = async () => {
    const items = [];
    selectedInvoice.items.forEach((item, i) => {
      const qty = Number(returnQty[i] || 0);
      if (qty > 0) items.push({ drug: item.drug?._id, batchNumber: item.batchNumber, quantity: qty });
    });
    if (items.length === 0) return toast.error('Select at least one item to return');

    setSubmitting(true);
    try {
      const { data } = await salesReturnAPI.create({ invoiceId: selectedInvoice._id, items, reason });
      toast.success(`Return ${data.returnNumber} processed`);
      resetModal();
      loadReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    }
    setSubmitting(false);
  };

  const viewDetails = async (id) => {
    try { const { data } = await salesReturnAPI.getOne(id); setViewReturn(data); } catch (err) { console.error(err); }
  };

  const totalRefunded = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const todayKey = new Date().toDateString();
  const todayRefunded = returns
    .filter((r) => new Date(r.createdAt).toDateString() === todayKey)
    .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  return (
    <div className="layout">
      <Header title="Sales Returns" />
      <div className="main-content">
        <div className="page-content">
          <div className="dash-hero">
            <div>
              <h2 className="dash-hero-title">Sales Returns</h2>
              <p className="dash-hero-sub">Process item returns, restock medicines and track refunds</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><FaPlusCircle /> New Return</button>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-card-gradient purple">
              <div className="stat-icon"><FaUndoAlt /></div>
              <div className="stat-info"><h2>{total}</h2><p>Total Returns</p></div>
            </div>
            <div className="stat-card stat-card-gradient blue">
              <div className="stat-icon"><FaFileInvoiceDollar /></div>
              <div className="stat-info"><h2>{currency}{totalRefunded.toLocaleString()}</h2><p>Total Refunded</p></div>
            </div>
            <div className="stat-card stat-card-gradient orange">
              <div className="stat-icon"><FaUndoAlt /></div>
              <div className="stat-info"><h2>{currency}{todayRefunded.toLocaleString()}</h2><p>Refunded Today</p></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Return Records</h3></div>
            <div className="card-body">
              <div className="search-bar">
                <FaSearch style={{ marginTop: 10, color: '#999' }} />
                <input placeholder="Search by return no, invoice no, customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 150 }} />
                  <span style={{ color: '#999' }}>to</span>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 150 }} />
                </div>
              </div>
              <table>
                <thead><tr><th>Return No</th><th>Invoice</th><th>Customer</th><th>Items</th><th>Refund</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {returns.map((r) => (
                    <tr key={r._id}>
                      <td><strong>{r.returnNumber}</strong></td>
                      <td>{r.invoiceNumber}</td>
                      <td>{r.customerName}</td>
                      <td>{r.items?.length}</td>
                      <td><strong>{currency}{r.refundAmount?.toLocaleString()}</strong></td>
                      <td><span className={`badge ${r.status === 'returned' ? 'badge-danger' : 'badge-warning'}`}>{r.status.toUpperCase()}</span></td>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => viewDetails(r._id)}><FaEye /> View</button>
                      </td>
                    </tr>
                  ))}
                  {returns.length === 0 && !loading && <tr><td colSpan={8} className="empty-state"><p>No returns found</p></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal" style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedInvoice ? `Return items - ${selectedInvoice.invoiceNumber}` : 'Select Invoice'}</h3>
              <button className="modal-close" onClick={resetModal}>×</button>
            </div>
            <div className="modal-body">
              {!selectedInvoice ? (
                <div>
                  <div className="search-bar">
                    <FaSearch style={{ marginTop: 10, color: '#999' }} />
                    <input placeholder="Search invoice number or customer name..." value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchInvoices()} />
                    <button className="btn btn-primary" onClick={searchInvoices}>Search</button>
                  </div>
                  <table>
                    <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
                    <tbody>
                      {invoiceResults.map((inv) => {
                        const fullyReturned = inv.items?.every((it) => (it.quantity || 0) <= (it.returnedQty || 0));
                        return (
                          <tr key={inv._id}>
                            <td><strong>{inv.invoiceNumber}</strong></td>
                            <td>{inv.customerName}</td>
                            <td>{currency}{inv.grandTotal?.toLocaleString()}</td>
                            <td><span className={`badge ${fullyReturned ? 'badge-danger' : inv.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{inv.status.toUpperCase()}</span></td>
                            <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                            <td><button className="btn btn-sm btn-success" disabled={fullyReturned} onClick={() => selectInvoice(inv)}>Select</button></td>
                          </tr>
                        );
                      })}
                      {invoiceResults.length === 0 && <tr><td colSpan={6} className="empty-state"><p>Search for an invoice to return</p></td></tr>}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 14 }}>
                    <div><strong>Customer:</strong> {selectedInvoice.customerName}</div>
                    <div><strong>Phone:</strong> {selectedInvoice.customerPhone || 'N/A'}</div>
                  </div>
                  <table>
                    <thead><tr><th>Medicine</th><th>Batch</th><th>Sold</th><th>Returned</th><th>Qty to Return</th><th>Rate</th><th>Refund</th></tr></thead>
                    <tbody>
                      {selectedInvoice.items?.map((item, i) => {
                        const available = (item.quantity || 0) - (item.returnedQty || 0);
                        const qty = Math.min(Math.max(Number(returnQty[i] || 0), 0), available);
                        const refund = qty > 0 ? (item.unitPrice * qty) - ((item.unitPrice * qty * (item.discount || 0)) / 100) : 0;
                        const gstAmt = (refund * (item.gstRate || 12)) / 100;
                        return (
                          <tr key={i}>
                            <td><strong>{item.drug?.name || 'N/A'}</strong></td>
                            <td>{item.batchNumber}</td>
                            <td>{item.quantity}</td>
                            <td>{item.returnedQty || 0}</td>
                            <td><input type="number" min="0" max={available} value={returnQty[i] || 0} onChange={(e) => setReturnQty({ ...returnQty, [i]: e.target.value })} style={{ width: 90, padding: '6px 8px', border: '1px solid var(--input-border)', borderRadius: 6, background: 'var(--input-bg)', color: 'var(--text-primary)' }} /></td>
                            <td>{currency}{item.unitPrice}</td>
                            <td>{qty > 0 ? currency + (refund + gstAmt).toFixed(2) : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Reason for return</label>
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Expired, damaged, patient refused..." style={{ width: '100%', padding: '10px 14px', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                  </div>
                  <div className="billing-summary" style={{ marginTop: 16 }}>
                    <div className="row"><span>Refund Subtotal</span><span>{currency}{getRefundSummary().subtotal.toFixed(2)}</span></div>
                    <div className="row"><span>Discount</span><span>-{currency}{getRefundSummary().discount.toFixed(2)}</span></div>
                    <div className="row"><span>GST</span><span>{currency}{getRefundSummary().gst.toFixed(2)}</span></div>
                    <div className="row total"><span>Total Refund</span><span>{currency}{getRefundSummary().refund.toFixed(2)}</span></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                    <button className="btn btn-outline" onClick={() => setSelectedInvoice(null)}><FaArrowLeft /> Change Invoice</button>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-outline" onClick={resetModal}><FaTrashAlt /> Cancel</button>
                      <button className="btn btn-primary" disabled={submitting || getRefundSummary().refund <= 0} onClick={submitReturn}>
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
              <h3>Return - {viewReturn.returnNumber}</h3>
              <button className="modal-close" onClick={() => setViewReturn(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 14 }}>
                <div><strong>Invoice:</strong> {viewReturn.invoiceNumber}</div>
                <div><strong>Customer:</strong> {viewReturn.customerName}</div>
                <div><strong>Date:</strong> {new Date(viewReturn.createdAt).toLocaleString()}</div>
                <div><strong>Reason:</strong> {viewReturn.reason}</div>
              </div>
              <table>
                <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Rate</th><th>GST</th><th>Refund</th></tr></thead>
                <tbody>
                  {viewReturn.items?.map((item, i) => (
                    <tr key={i}>
                      <td><strong>{item.name || item.drug?.name || 'N/A'}</strong></td>
                      <td>{item.batchNumber}</td>
                      <td>{item.quantity}</td>
                      <td>{currency}{item.unitPrice}</td>
                      <td>{currency}{item.gstAmount?.toFixed(2)}</td>
                      <td><strong>{currency}{item.refundAmount?.toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <p>Subtotal: {currency}{viewReturn.subtotal?.toFixed(2)}</p>
                <p>Discount: -{currency}{viewReturn.totalDiscount?.toFixed(2)}</p>
                <p>GST: {currency}{viewReturn.totalGST?.toFixed(2)}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#0d6efd' }}>Total Refund: {currency}{viewReturn.refundAmount?.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReturns;
