import { useState, useEffect } from 'react';
import { invoiceAPI } from '../services/api';
import { usePharmacy } from '../context/PharmacyContext';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  FaWallet, FaFileInvoiceDollar, FaRotateLeft, FaPills, FaTriangleExclamation,
  FaTruck, FaArrowTrendUp, FaArrowTrendDown, FaChartLine, FaMedal, FaFire
} from 'react-icons/fa6';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const formatter = (v) => Number(v || 0).toLocaleString('en-IN');

const Dashboard = () => {
  const { settings } = usePharmacy();
  const { user } = useAuth();
  const s = settings || {};
  const currency = s.currency || '₹';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await invoiceAPI.getDashboard();
      setStats(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const month = new Date().toLocaleString('default', { month: 'long' });

  if (loading) return <div className="layout"><Header title="Dashboard" /><div className="main-content"><div className="page-content"><p>Loading...</p></div></div></div>;

  const trendLabels = (stats?.salesTrend || []).map((d) => new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  const trendValues = (stats?.salesTrend || []).map((d) => d.total);

  const monthLabels = (stats?.monthlySales || []).map((m) => {
    const [y, mo] = m._id.split('-');
    return new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
  });
  const monthValues = (stats?.monthlySales || []).map((m) => m.total);

  const paymentLabels = (stats?.salesByPayment || []).map((p) => (p._id || 'Other').toUpperCase());
  const paymentValues = (stats?.salesByPayment || []).map((p) => p.total);
  const paymentColors = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#8b5cf6', '#14b8a6'];

  const lineData = {
    labels: trendLabels,
    datasets: [{
      label: 'Sales',
      data: trendValues,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 3,
      borderWidth: 3,
    }],
  };

  const barData = {
    labels: monthLabels,
    datasets: [{
      label: 'Revenue',
      data: monthValues,
      backgroundColor: '#10b981',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const pieData = {
    labels: paymentLabels,
    datasets: [{ data: paymentValues, backgroundColor: paymentColors, borderWidth: 2, borderColor: '#fff' }],
  };

  const categoryData = {
    labels: (stats?.stockByCategory || []).map((c) => c._id || 'Other'),
    datasets: [{ data: (stats?.stockByCategory || []).map((c) => c.quantity), backgroundColor: paymentColors, borderWidth: 2, borderColor: '#fff' }],
  };

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => `${currency}${formatter(c.parsed.y)}` } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => currency + formatter(v), maxTicksLimit: 6 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => `${currency}${formatter(c.parsed.y)}` } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => currency + formatter(v), maxTicksLimit: 5 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  };

  const pieOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } } },
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const lowStockList = (stats?.expiringDrugs || []).slice(0, 5);
  const recentInvoices = stats?.recentInvoices || [];
  const topMedicines = stats?.topMedicines || [];
  const expiringList = (stats?.expiringDrugs || []);

  const statCards = [
    { label: "Net Revenue Today", value: `${currency}${formatter(stats?.netTodaySales)}`, sub: `Sales ${currency}${formatter(stats?.todaySales)} - Returns ${currency}${formatter(stats?.todayReturns)}`, icon: <FaWallet />, cls: 'indigo', trend: null },
    { label: "Today's Invoices", value: stats?.todayInvoices || 0, sub: `Returned: ${stats?.returnedInvoices || 0}`, icon: <FaFileInvoiceDollar />, cls: 'blue', trend: null },
    { label: 'Sales This Month', value: `${currency}${formatter(stats?.monthSales)}`, sub: `${month} · returns ${currency}${formatter(stats?.monthReturns)}`, icon: <FaChartLine />, cls: 'green', trend: stats?.monthSales ? <span className="trend-up"><FaArrowTrendUp /> Revenue</span> : null },
    { label: 'Total Medicines', value: stats?.totalDrugs || 0, sub: `${stats?.totalSuppliers || 0} suppliers`, icon: <FaPills />, cls: 'orange', trend: null },
    { label: 'Low Stock Items', value: stats?.lowStockDrugs || 0, sub: 'Need reorder', icon: <FaTriangleExclamation />, cls: 'red', trend: stats?.lowStockDrugs > 0 ? <span className="trend-down"><FaArrowTrendDown /> Action needed</span> : null },
    { label: 'Total Returns', value: stats?.totalReturns || 0, sub: `${currency}${formatter(stats?.monthReturns)} this month`, icon: <FaRotateLeft />, cls: 'purple', trend: null },
    { label: 'Total Suppliers', value: stats?.totalSuppliers || 0, sub: 'Active vendors', icon: <FaTruck />, cls: 'cyan', trend: null },
  ];

  return (
    <div className="layout">
      <Header title="Dashboard" />
      <div className="main-content">
        <div className="page-content" style={{ paddingLeft: 0 }}>
          <div className="dash-hero">
            <div>
              <h2 className="dash-hero-title">{greeting}, {user?.name || 'there'} 👋</h2>
              <p className="dash-hero-sub">{s.pharmacyName || 'VJS SOFT SOLUTIONS'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="dash-hero-badge"><FaChartLine /> Revenue Dashboard</div>
          </div>

          <div className="stats-grid">
            {statCards.map((c, i) => (
              <div key={i} className={`stat-card stat-card-gradient ${c.cls}`}>
                <div className="stat-icon">{c.icon}</div>
                <div className="stat-info">
                  <h2>{c.value}</h2>
                  <p>{c.label}</p>
                  <div className="stat-sub">
                    {c.trend || c.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card dash-card">
              <div className="card-header">
                <h3><FaChartLine /> Revenue Trend <span className="badge badge-info">Last 14 days</span></h3>
                <strong style={{ color: '#6366f1', fontSize: 16 }}>{currency}{formatter(trendValues.reduce((a, b) => a + b, 0))}</strong>
              </div>
              <div className="card-body" style={{ height: 280 }}>
                <Line data={lineData} options={lineOpts} />
              </div>
            </div>
            <div className="card dash-card">
              <div className="card-header"><h3><FaWallet /> Sales by Payment Method</h3></div>
              <div className="card-body" style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {paymentValues.length > 0 ? (
                  <div style={{ width: 260, height: 240 }}>
                    <Pie data={pieData} options={pieOpts} />
                  </div>
                ) : <p style={{ color: '#999', fontSize: 13 }}>No sales data yet</p>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card dash-card">
              <div className="card-header"><h3><FaChartLine /> Monthly Revenue <span className="badge badge-success">12 months</span></h3></div>
              <div className="card-body" style={{ height: 260 }}>
                <Bar data={barData} options={barOpts} />
              </div>
            </div>
            <div className="card dash-card">
              <div className="card-header"><h3><FaMedal /> Top Medicines</h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {topMedicines.map((m, i) => {
                  const max = topMedicines[0]?.quantity || 1;
                  return (
                    <div key={i} className="top-med-row">
                      <span className="top-med-rank">{i + 1}</span>
                      <div className="top-med-info">
                        <strong>{m.name}</strong>
                        <div className="top-med-bar"><div style={{ width: `${(m.quantity / max) * 100}%` }} /></div>
                        <span>{m.quantity} units · {currency}{formatter(m.revenue)}</span>
                      </div>
                    </div>
                  );
                })}
                {topMedicines.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>No sales yet</p>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
            <div className="card dash-card">
              <div className="card-header"><h3><FaFileInvoiceDollar /> Recent Invoices</h3></div>
              <div className="card-body">
                <table>
                  <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {recentInvoices.map((inv) => (
                      <tr key={inv._id}>
                        <td><strong>{inv.invoiceNumber}</strong></td>
                        <td>{inv.customerName}</td>
                        <td>{currency}{formatter(inv.grandTotal)}</td>
                        <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {recentInvoices.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No recent invoices</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card dash-card">
              <div className="card-header"><h3><FaFire /> Expiring Soon <span className="badge badge-warning">90 days</span></h3></div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                {expiringList.map((drug) => (
                  <div key={drug._id} className="alert-row">
                    <div>
                      <strong style={{ fontSize: 13 }}>{drug.name}</strong>
                      <p style={{ fontSize: 12, color: '#999' }}>Exp: {new Date(drug.expiryDate).toLocaleDateString()} · Qty: {drug.quantity}</p>
                    </div>
                    <span className={`badge ${new Date(drug.expiryDate) < new Date(Date.now() + 30 * 86400000) ? 'badge-danger' : 'badge-warning'}`}>
                      {Math.max(0, Math.ceil((new Date(drug.expiryDate) - new Date()) / 86400000))}d left
                    </span>
                  </div>
                ))}
                {expiringList.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>No drugs expiring soon</p>}
              </div>
            </div>
          </div>

          {lowStockList.length > 0 && (
            <div className="card dash-card" style={{ marginTop: 20 }}>
              <div className="card-header"><h3><FaTriangleExclamation /> Low Stock Alerts</h3></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                  {(stats?.expiringDrugs || []).filter((d) => d.quantity <= d.minimumStock).map((d) => (
                    <div key={d._id} className="alert-tile">
                      <div>
                        <strong>{d.name}</strong>
                        <p style={{ fontSize: 12, color: '#999' }}>Batch {d.batchNumber}</p>
                      </div>
                      <span className={`badge ${d.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>{d.quantity} left</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card dash-card">
              <div className="card-header"><h3><FaPills /> Stock by Category</h3></div>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                {(stats?.stockByCategory && stats.stockByCategory.length > 0) ? (
                  <div style={{ width: 280, height: 260 }}>
                    <Doughnut data={categoryData} options={pieOpts} />
                  </div>
                ) : <p style={{ color: '#999', fontSize: 13 }}>No medicines added yet</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

