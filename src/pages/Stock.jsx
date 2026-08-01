import { useState, useEffect } from 'react';
import { drugAPI } from '../services/api';
import Header from '../components/Header';
import { FaSearch, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const Stock = () => {
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadDrugs(); }, [search, filter]);

  const loadDrugs = async () => {
    try {
      const { data } = await drugAPI.getAll({ search, limit: 500 });
      let list = data.drugs || [];
      if (filter === 'low') list = list.filter(d => d.quantity <= d.minimumStock);
      if (filter === 'out') list = list.filter(d => d.quantity === 0);
      if (filter === 'expiring') list = list.filter(d => new Date(d.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
      setDrugs(list);
    } catch (err) { console.error(err); }
  };

  const totalStockValue = drugs.reduce((sum, d) => sum + d.purchasePrice * d.quantity, 0);
  const totalMRP = drugs.reduce((sum, d) => sum + d.mrp * d.quantity, 0);

  return (
    <div className="layout">
      <Header title="Stock / Inventory" />
      <div className="main-content">
        <div className="page-content">
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card"><div className="stat-icon blue"><FaSearch /></div><div className="stat-info"><h2>{drugs.length}</h2><p>Total Items</p></div></div>
            <div className="stat-card"><div className="stat-icon green"><FaCheckCircle /></div><div className="stat-info"><h2>₹{totalStockValue.toLocaleString()}</h2><p>Stock Value (Cost)</p></div></div>
            <div className="stat-card"><div className="stat-icon orange"><FaExclamationTriangle /></div><div className="stat-info"><h2>₹{totalMRP.toLocaleString()}</h2><p>Stock Value (MRP)</p></div></div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Stock Report</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="search-bar" style={{ flex: 1 }}><FaSearch style={{ marginTop: 10, color: '#999' }} /><input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8 }}>
                  <option value="all">All Items</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                  <option value="expiring">Expiring Soon</option>
                </select>
              </div>
              <table>
                <thead><tr><th>Medicine</th><th>Batch</th><th>Category</th><th>Qty</th><th>Min Stock</th><th>Cost Price</th><th>MRP</th><th>Stock Value</th><th>Status</th><th>Expiry</th></tr></thead>
                <tbody>
                  {drugs.map((d) => (
                    <tr key={d._id}>
                      <td><strong>{d.name}</strong><br/><span style={{fontSize:11,color:'#999'}}>{d.dosageForm} {d.strength}</span></td>
                      <td>{d.batchNumber}</td>
                      <td><span className="badge badge-info">{d.category}</span></td>
                      <td style={{ fontWeight: 700, color: d.quantity <= d.minimumStock ? '#dc3545' : '#198754' }}>{d.quantity}</td>
                      <td>{d.minimumStock}</td>
                      <td>₹{d.purchasePrice}</td>
                      <td>₹{d.mrp}</td>
                      <td>₹{(d.purchasePrice * d.quantity).toLocaleString()}</td>
                      <td>{d.quantity === 0 ? <span className="badge badge-danger">Out of Stock</span> : d.quantity <= d.minimumStock ? <span className="badge badge-warning">Low Stock</span> : <span className="badge badge-success">In Stock</span>}</td>
                      <td style={{ color: new Date(d.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? '#dc3545' : '#333' }}>{new Date(d.expiryDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;
