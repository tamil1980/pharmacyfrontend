import { useState, useEffect } from 'react';
import { invoiceAPI, drugAPI, grnAPI, salesReturnAPI } from '../services/api';
import Header from '../components/Header';
import { FaChartBar, FaFileInvoiceDollar, FaPills, FaClipboardList, FaUndoAlt } from 'react-icons/fa';

const Reports = () => {
  const [tab, setTab] = useState('summary');
  const [invoices, setInvoices] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [grns, setGrns] = useState([]);
  const [returns, setReturns] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => { loadData(); }, [tab, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (tab === 'sales' || tab === 'summary') {
        const { data } = await invoiceAPI.getAll({ ...params, limit: 200 });
        setInvoices(data.invoices || []);
      }
      if (tab === 'returns') {
        const { data } = await salesReturnAPI.getAll({ ...params, limit: 200 });
        setReturns(data.returns || []);
      }
      if (tab === 'stock') {
        const { data } = await drugAPI.getAll({ limit: 500 });
        setDrugs(data.drugs || []);
      }
      if (tab === 'grn') {
        const { data } = await grnAPI.getAll({ ...params, limit: 200 });
        setGrns(data.grns || []);
      }
    } catch (err) { console.error(err); }
  };

  const totalSales = invoices.reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  const totalGST = invoices.reduce((sum, i) => sum + (i.totalGST || 0), 0);
  const totalDiscount = invoices.reduce((sum, i) => sum + (i.totalDiscount || 0), 0);
  const totalPurchases = grns.reduce((sum, g) => sum + (g.netAmount || 0), 0);
  const totalRefunds = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const totalReturnedItems = returns.reduce((sum, r) => sum + (r.items?.reduce((a, it) => a + it.quantity, 0) || 0), 0);

  const tabs = [
    { id: 'summary', label: 'Sales Summary', icon: <FaChartBar /> },
    { id: 'sales', label: 'Sales Report', icon: <FaFileInvoiceDollar /> },
    { id: 'returns', label: 'Sales Return Report', icon: <FaUndoAlt /> },
    { id: 'stock', label: 'Stock Report', icon: <FaPills /> },
    { id: 'grn', label: 'Purchase Report', icon: <FaClipboardList /> },
  ];

  return (
    <div className="layout">
      <Header title="Reports" />
      <div className="main-content">
        <div className="page-content">
          <div className="dash-hero">
            <div>
              <h2 className="dash-hero-title">Reports & Analytics</h2>
              <p className="dash-hero-sub">Sales, returns, stock and purchase insights</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {tabs.map((t) => (
              <button key={t.id} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}><label>From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label>To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          </div>

          {tab === 'summary' && (
            <div>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card stat-card-gradient green"><div className="stat-icon"><FaFileInvoiceDollar /></div><div className="stat-info"><h2>₹{totalSales.toLocaleString()}</h2><p>Total Sales</p></div></div>
                <div className="stat-card stat-card-gradient indigo"><div className="stat-icon"><FaClipboardList /></div><div className="stat-info"><h2>₹{totalPurchases.toLocaleString()}</h2><p>Total Purchases</p></div></div>
                <div className="stat-card stat-card-gradient orange"><div className="stat-icon"><FaChartBar /></div><div className="stat-info"><h2>₹{totalGST.toLocaleString()}</h2><p>Total GST Collected</p></div></div>
                <div className="stat-card stat-card-gradient cyan"><div className="stat-icon"><FaFileInvoiceDollar /></div><div className="stat-info"><h2>{invoices.length}</h2><p>Total Invoices</p></div></div>
              </div>
              <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="card"><div className="card-header"><h3>Profit Estimate</h3></div><div className="card-body">
                  <p style={{ fontSize: 14, marginBottom: 8 }}>Sales: ₹{totalSales.toLocaleString()}</p>
                  <p style={{ fontSize: 14, marginBottom: 8 }}>Purchases: -₹{totalPurchases.toLocaleString()}</p>
                  <p style={{ fontSize: 14, marginBottom: 8 }}>Discounts Given: -₹{totalDiscount.toLocaleString()}</p>
                  <hr/>
                  <p style={{ fontSize: 20, fontWeight: 700, color: totalSales - totalPurchases - totalDiscount >= 0 ? '#198754' : '#dc3545' }}>
                    Estimated Profit: ₹{(totalSales - totalPurchases - totalDiscount).toLocaleString()}
                  </p>
                </div></div>
                <div className="card"><div className="card-header"><h3>Tax Summary</h3></div><div className="card-body">
                  <p style={{ fontSize: 14, marginBottom: 8 }}>Total GST Collected: ₹{totalGST.toLocaleString()}</p>
                  <p style={{ fontSize: 14, marginBottom: 8 }}>Avg GST per Invoice: ₹{invoices.length ? (totalGST / invoices.length).toFixed(2) : '0.00'}</p>
                  <p style={{ fontSize: 14 }}>Avg Sale Value: ₹{invoices.length ? (totalSales / invoices.length).toFixed(2) : '0.00'}</p>
                </div></div>
              </div>
            </div>
          )}

          {tab === 'sales' && (
            <div className="card">
              <div className="card-header"><h3>Sales Report ({invoices.length} invoices)</h3></div>
              <div className="card-body">
                <table>
                  <thead><tr><th>Invoice</th><th>Customer</th><th>Items</th><th>Subtotal</th><th>Discount</th><th>GST</th><th>Total</th><th>Payment</th><th>Date</th></tr></thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv._id}>
                        <td><strong>{inv.invoiceNumber}</strong></td>
                        <td>{inv.customerName}</td>
                        <td>{inv.items?.length}</td>
                        <td>₹{inv.subtotal?.toFixed(2)}</td>
                        <td>-₹{inv.totalDiscount?.toFixed(2)}</td>
                        <td>₹{inv.totalGST?.toFixed(2)}</td>
                        <td><strong>₹{inv.grandTotal?.toFixed(2)}</strong></td>
                        <td><span className="badge badge-info">{(inv.paymentMethod || 'cash').toUpperCase()}</span></td>
                        <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700, background: '#f8f9fa' }}>
                      <td colSpan={3}>Total</td>
                      <td>₹{invoices.reduce((s, i) => s + (i.subtotal || 0), 0).toFixed(2)}</td>
                      <td>-₹{totalDiscount.toFixed(2)}</td>
                      <td>₹{totalGST.toFixed(2)}</td>
                      <td>₹{totalSales.toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {tab === 'returns' && (
            <div>
              <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card stat-card-gradient purple"><div className="stat-icon"><FaUndoAlt /></div><div className="stat-info"><h2>{returns.length}</h2><p>Total Returns</p></div></div>
                <div className="stat-card stat-card-gradient red"><div className="stat-icon"><FaUndoAlt /></div><div className="stat-info"><h2>₹{totalRefunds.toLocaleString()}</h2><p>Total Refunded</p></div></div>
                <div className="stat-card stat-card-gradient orange"><div className="stat-icon"><FaChartBar /></div><div className="stat-info"><h2>{totalReturnedItems}</h2><p>Items Returned</p></div></div>
                <div className="stat-card stat-card-gradient cyan"><div className="stat-icon"><FaFileInvoiceDollar /></div><div className="stat-info"><h2>{totalRefunds > 0 ? (totalRefunds / returns.length).toFixed(2) : '0.00'}</h2><p>Avg Refund / Return</p></div></div>
              </div>
              <div className="card">
                <div className="card-header"><h3>Sales Return Report ({returns.length} returns)</h3></div>
                <div className="card-body">
                  <table>
                    <thead><tr><th>Return No</th><th>Invoice</th><th>Customer</th><th>Items</th><th>Subtotal</th><th>Discount</th><th>GST</th><th>Refund</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {returns.map((r) => (
                        <tr key={r._id}>
                          <td><strong>{r.returnNumber}</strong></td>
                          <td>{r.invoiceNumber}</td>
                          <td>{r.customerName}</td>
                          <td>{r.items?.length}</td>
                          <td>₹{r.subtotal?.toLocaleString()}</td>
                          <td>-₹{r.totalDiscount?.toLocaleString()}</td>
                          <td>₹{r.totalGST?.toLocaleString()}</td>
                          <td><strong>₹{r.refundAmount?.toLocaleString()}</strong></td>
                          <td><span className={`badge ${r.status === 'returned' ? 'badge-danger' : 'badge-warning'}`}>{r.status.toUpperCase()}</span></td>
                          <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 700, background: '#f8f9fa' }}>
                        <td colSpan={3}>Total</td>
                        <td></td>
                        <td>₹{returns.reduce((s, r) => s + (r.subtotal || 0), 0).toLocaleString()}</td>
                        <td>-₹{returns.reduce((s, r) => s + (r.totalDiscount || 0), 0).toLocaleString()}</td>
                        <td>₹{returns.reduce((s, r) => s + (r.totalGST || 0), 0).toLocaleString()}</td>
                        <td>₹{totalRefunds.toLocaleString()}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'stock' && (
            <div className="card">
              <div className="card-header"><h3>Stock Report</h3></div>
              <div className="card-body">
                <table>
                  <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Cost</th><th>MRP</th><th>Value (Cost)</th><th>Value (MRP)</th></tr></thead>
                  <tbody>
                    {drugs.map((d) => (
                      <tr key={d._id}>
                        <td><strong>{d.name}</strong></td><td>{d.batchNumber}</td><td>{d.quantity}</td><td>₹{d.purchasePrice}</td><td>₹{d.mrp}</td>
                        <td>₹{(d.purchasePrice * d.quantity).toLocaleString()}</td><td>₹{(d.mrp * d.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700, background: '#f8f9fa' }}>
                      <td colSpan={2}>Total</td><td>{drugs.reduce((s, d) => s + d.quantity, 0)}</td><td colSpan={2}></td>
                      <td>₹{drugs.reduce((s, d) => s + d.purchasePrice * d.quantity, 0).toLocaleString()}</td>
                      <td>₹{drugs.reduce((s, d) => s + d.mrp * d.quantity, 0).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {tab === 'grn' && (
            <div className="card">
              <div className="card-header"><h3>Purchase / GRN Report ({grns.length})</h3></div>
              <div className="card-body">
                <table>
                  <thead><tr><th>GRN No</th><th>Supplier</th><th>Items</th><th>Total</th><th>GST</th><th>Net Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {grns.map((g) => (
                      <tr key={g._id}>
                        <td><strong>{g.grnNumber}</strong></td><td>{g.supplier?.name || '-'}</td><td>{g.items?.length}</td>
                        <td>₹{g.totalAmount?.toLocaleString()}</td><td>₹{g.totalGST?.toLocaleString()}</td><td><strong>₹{g.netAmount?.toLocaleString()}</strong></td>
                        <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 700, background: '#f8f9fa' }}>
                      <td colSpan={2}>Total</td><td></td>
                      <td>₹{totalPurchases.toLocaleString()}</td><td>₹{grns.reduce((s, g) => s + (g.totalGST || 0), 0).toLocaleString()}</td>
                      <td>₹{grns.reduce((s, g) => s + (g.netAmount || 0), 0).toLocaleString()}</td><td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
