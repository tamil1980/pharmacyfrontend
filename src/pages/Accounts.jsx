import { useState, useEffect } from 'react';
import { accountAPI, customerAPI, supplierAPI } from '../services/api';
import { usePharmacy } from '../context/PharmacyContext';
import { toast } from 'react-toastify';
import { FaHandHoldingUsd, FaCreditCard, FaReceipt, FaWallet, FaPlusCircle, FaTrashAlt, FaSearch } from 'react-icons/fa';

const MODES = ['cash', 'card', 'upi', 'bank', 'cheque', 'online'];

const Accounts = () => {
  const { settings } = usePharmacy();
  const s = settings || {};
  const currency = s.currency || '₹';
  const [tab, setTab] = useState('receipt');
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'receipt', customer: '', supplier: '', category: '', description: '', amount: '', mode: 'cash', reference: '', entryDate: '' });

  useEffect(() => {
    customerAPI.getAll({ active: 'true', limit: 500 }).then(({ data }) => setCustomers(data.items || [])).catch(console.error);
    supplierAPI.getAll({ active: 'true', limit: 500 }).then(({ data }) => setSuppliers(data || [])).catch(console.error);
  }, []);

  useEffect(() => { loadEntries(); }, [tab, search, dateFrom, dateTo]);

  const loadEntries = async () => {
    try {
      const params = { type: tab, limit: 500 };
      if (search) params.search = search;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const { data } = await accountAPI.getAll(params);
      setEntries(data.entries || []);
      setSummary(data.summary || []);
    } catch (err) { console.error(err); }
  };

  const openAdd = (type) => {
    setForm({ type, customer: '', supplier: '', category: '', description: '', amount: '', mode: 'cash', reference: '', entryDate: '' });
    setShowModal(true);
  };

  const submit = async () => {
    try {
      await accountAPI.create(form);
      toast.success('Entry saved');
      setShowModal(false);
      loadEntries();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save entry');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await accountAPI.remove(id);
      toast.success('Entry deleted');
      loadEntries();
    } catch {
      toast.error('Delete failed');
    }
  };

  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);

  const tabs = [
    { id: 'receipt', label: 'Receipts', icon: <FaHandHoldingUsd /> },
    { id: 'payment', label: 'Payments', icon: <FaCreditCard /> },
    { id: 'expense', label: 'Expenses', icon: <FaReceipt /> },
  ];

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">Accounts</h2>
            <p className="dash-hero-sub">Receipts, payments and expenses</p>
          </div>
          <button className="btn btn-light-hero" onClick={() => openAdd(tab)}><FaPlusCircle /> New {tab}</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-card-gradient green">
            <div className="stat-icon"><FaHandHoldingUsd /></div>
            <div className="stat-info"><h2>{currency}{summary.find((x) => x._id === 'receipt')?.total?.toLocaleString() || 0}</h2><p>Total Receipts</p></div>
          </div>
          <div className="stat-card stat-card-gradient red">
            <div className="stat-icon"><FaCreditCard /></div>
            <div className="stat-info"><h2>{currency}{summary.find((x) => x._id === 'payment')?.total?.toLocaleString() || 0}</h2><p>Total Payments</p></div>
          </div>
          <div className="stat-card stat-card-gradient orange">
            <div className="stat-icon"><FaReceipt /></div>
            <div className="stat-info"><h2>{currency}{summary.find((x) => x._id === 'expense')?.total?.toLocaleString() || 0}</h2><p>Total Expenses</p></div>
          </div>
          <div className="stat-card stat-card-gradient cyan">
            <div className="stat-icon"><FaWallet /></div>
            <div className="stat-info"><h2>{currency}{((summary.find((x) => x._id === 'receipt')?.total || 0) - (summary.find((x) => x._id === 'payment')?.total || 0) - (summary.find((x) => x._id === 'expense')?.total || 0)).toLocaleString()}</h2><p>Net Cash Flow</p></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 8 }}>
              {tabs.map((t) => (
                <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t.id)}>{t.icon} {t.label}</button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <div className="search-bar">
              <FaSearch style={{ marginTop: 10, color: '#999' }} />
              <input placeholder="Search voucher no, reference, description..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 150 }} />
              <span style={{ color: '#999' }}>to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 150 }} />
            </div>
            <table>
              <thead><tr><th>Voucher</th><th>Date</th><th>{tab === 'receipt' ? 'Customer' : tab === 'payment' ? 'Supplier' : 'Category'}</th><th>Description</th><th>Mode</th><th>Reference</th><th>Amount</th><th>Actions</th></tr></thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e._id}>
                    <td><strong>{e.voucherNumber}</strong></td>
                    <td>{new Date(e.entryDate || e.createdAt).toLocaleDateString()}</td>
                    <td>{e.customer?.name || e.supplier?.name || e.category || '—'}</td>
                    <td>{e.description || '—'}</td>
                    <td><span className="badge badge-info">{e.mode?.toUpperCase()}</span></td>
                    <td>{e.reference || '—'}</td>
                    <td><strong>{currency}{e.amount?.toLocaleString()}</strong></td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => remove(e._id)}><FaTrashAlt /></button></td>
                  </tr>
                ))}
                {entries.length === 0 && <tr><td colSpan={8} className="empty-state"><p>No {tab}s found</p></td></tr>}
              </tbody>
              {entries.length > 0 && (
                <tfoot>
                  <tr style={{ fontWeight: 700, background: '#f8f9fa' }}>
                    <td colSpan={6}>Total</td>
                    <td>{currency}{totalAmount.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New {form.type}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, customer: '', supplier: '' })}>
                    <option value="receipt">Receipt</option>
                    <option value="payment">Payment</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}><label>Date</label><input type="date" value={form.entryDate} onChange={(e) => setForm({ ...form, entryDate: e.target.value })} /></div>
              </div>
              {form.type === 'receipt' && (
                <div className="form-group"><label>Customer</label>
                  <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}>
                    <option value="">Walk-in / None</option>
                    {customers.map((c) => <option key={c._id} value={c._id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                  </select>
                </div>
              )}
              {form.type === 'payment' && (
                <div className="form-group"><label>Supplier</label>
                  <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
                    <option value="">Select supplier</option>
                    {suppliers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {form.type === 'expense' && (
                <div className="form-group"><label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category</option>
                    {['Rent', 'Salary', 'Electricity', 'Maintenance', 'Transport', 'Miscellaneous'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group"><label>Amount *</label><input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}><label>Mode</label>
                  <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                    {MODES.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}><label>Reference</label><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Optional" /></div>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
