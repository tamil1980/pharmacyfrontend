import { useState, useEffect } from 'react';
import { invoiceAPI, drugAPI } from '../services/api';
import Header from '../components/Header';
import { FaTachometerAlt, FaFileInvoiceDollar, FaPills, FaExclamationTriangle, FaTruck, FaChartLine } from 'react-icons/fa';
import { Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data } = await invoiceAPI.getDashboard();
      setStats(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (loading) return <div className="layout"><Header title="Dashboard" /><div className="main-content"><div className="page-content"><p>Loading...</p></div></div></div>;

  return (
    <div className="layout">
      <Header title="Dashboard" />
      <div className="main-content">
        <div className="page-content" style={{ paddingLeft: 0 }}>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><FaFileInvoiceDollar /></div>
              <div className="stat-info">
                <h2>{stats?.todayInvoices || 0}</h2>
                <p>Today's Invoices</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><FaTachometerAlt /></div>
              <div className="stat-info">
                <h2>₹{(stats?.todaySales || 0).toLocaleString()}</h2>
                <p>Today's Sales</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><FaPills /></div>
              <div className="stat-info">
                <h2>{stats?.totalDrugs || 0}</h2>
                <p>Total Medicines</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><FaExclamationTriangle /></div>
              <div className="stat-info">
                <h2>{stats?.lowStockDrugs || 0}</h2>
                <p>Low Stock Items</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div className="card">
              <div className="card-header"><h3>📊 Sales by Payment Method</h3></div>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                {(stats?.salesByPayment && stats.salesByPayment.length > 0) ? (
                  <div style={{ width: 280, height: 280 }}>
                    <Pie
                      data={{
                        labels: (stats.salesByPayment || []).map((p) => p._id || 'Other'),
                        datasets: [{ data: (stats.salesByPayment || []).map((p) => p.total), backgroundColor: ['#0d6efd', '#198754', '#fd7e14', '#0dcaf0', '#dc3545', '#6f42c1'], borderColor: '#fff', borderWidth: 2 }],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } } } }}
                    />
                  </div>
                ) : <p style={{ color: '#999', fontSize: 13 }}>No sales data yet</p>}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>💊 Stock by Category</h3></div>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                {(stats?.stockByCategory && stats.stockByCategory.length > 0) ? (
                  <div style={{ width: 280, height: 280 }}>
                    <Doughnut
                      data={{
                        labels: (stats.stockByCategory || []).map((c) => c._id || 'Other'),
                        datasets: [{ data: (stats.stockByCategory || []).map((c) => c.quantity), backgroundColor: ['#0d6efd', '#198754', '#fd7e14', '#dc3545', '#0dcaf0', '#6f42c1', '#20c997', '#ffc107', '#e83e8c', '#28a745', '#17a2b8', '#6c757d'], borderColor: '#fff', borderWidth: 2 }],
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 12 } } } } }}
                    />
                  </div>
                ) : <p style={{ color: '#999', fontSize: 13 }}>No medicines added yet</p>}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3>📊 Monthly Sales: ₹{(stats?.monthSales || 0).toLocaleString()}</h3></div>
              <div className="card-body">
                <h4 style={{ marginBottom: 16 }}>Recent Invoices</h4>
                <table>
                  <thead>
                    <tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {stats?.recentInvoices?.map((inv) => (
                      <tr key={inv._id}>
                        <td><strong>{inv.invoiceNumber}</strong></td>
                        <td>{inv.customerName}</td>
                        <td>₹{inv.grandTotal.toLocaleString()}</td>
                        <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No recent invoices</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>⚠️ Expiring Soon</h3></div>
              <div className="card-body">
                {stats?.expiringDrugs?.map((drug) => (
                  <div key={drug._id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                    <strong style={{ fontSize: 13 }}>{drug.name}</strong>
                    <p style={{ fontSize: 12, color: '#999' }}>Exp: {new Date(drug.expiryDate).toLocaleDateString()} | Qty: {drug.quantity}</p>
                  </div>
                ))}
                {(!stats?.expiringDrugs || stats.expiringDrugs.length === 0) && <p style={{ color: '#999', fontSize: 13 }}>No drugs expiring soon</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
