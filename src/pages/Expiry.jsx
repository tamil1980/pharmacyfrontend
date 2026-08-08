import { useState, useEffect } from 'react';
import { drugAPI } from '../services/api';
import { FaCalendarTimes, FaHourglassHalf, FaSearch, FaExclamationTriangle } from 'react-icons/fa';

const Expiry = () => {
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState(90);

  useEffect(() => {
    drugAPI.getAll({ limit: 500 }).then(({ data }) => setDrugs(data.drugs || [])).catch(console.error);
  }, []);

  const now = new Date();
  const expired = drugs.filter((d) => new Date(d.expiryDate) < now);
  const nearExpiry = drugs.filter((d) => {
    const exp = new Date(d.expiryDate);
    return exp >= now && exp <= new Date(now.getTime() + range * 86400000);
  });
  const searchFn = (d) => (d.name + (d.batchNumber || '')).toLowerCase().includes(search.toLowerCase());

  const Row = ({ d }) => {
    const days = Math.ceil((new Date(d.expiryDate) - now) / 86400000);
    return (
      <tr>
        <td><strong>{d.name}</strong></td>
        <td>{d.batchNumber}</td>
        <td>{d.quantity}</td>
        <td>{new Date(d.expiryDate).toLocaleDateString()}</td>
        <td>
          {days < 0
            ? <span className="badge badge-danger">EXPIRED {Math.abs(days)}d ago</span>
            : days <= 30
              ? <span className="badge badge-danger">{days}d left</span>
              : days <= 90
                ? <span className="badge badge-warning">{days}d left</span>
                : <span className="badge badge-success">{days}d left</span>}
        </td>
      </tr>
    );
  };

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">Expiry Management</h2>
            <p className="dash-hero-sub">Track expired and near-expiry medicines</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-card-gradient red">
            <div className="stat-icon"><FaCalendarTimes /></div>
            <div className="stat-info"><h2>{drugs.filter((d) => new Date(d.expiryDate) < now).length}</h2><p>Expired Medicines</p></div>
          </div>
          <div className="stat-card stat-card-gradient orange">
            <div className="stat-icon"><FaHourglassHalf /></div>
            <div className="stat-info"><h2>{nearExpiry.length}</h2><p>Near Expiry ({range} days)</p></div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3><FaCalendarTimes /> Expired Medicines ({expired.length})</h3></div>
          <div className="card-body">
            <table>
              <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Expiry</th><th>Status</th></tr></thead>
              <tbody>
                {expired.filter(searchFn).map((d) => <Row key={d._id} d={d} />)}
                {expired.length === 0 && <tr><td colSpan={5} className="empty-state"><p>No expired medicines</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3><FaHourglassHalf /> Near Expiry Report</h3></div>
          <div className="card-body">
            <div className="search-bar">
              <FaSearch style={{ marginTop: 10, color: '#999' }} />
              <input placeholder="Search medicines..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={range} onChange={(e) => setRange(Number(e.target.value))} style={{ padding: '10px 14px', border: '1px solid var(--input-border)', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                <option value={30}>Next 30 days</option>
                <option value={60}>Next 60 days</option>
                <option value={90}>Next 90 days</option>
                <option value={180}>Next 180 days</option>
              </select>
            </div>
            <table>
              <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Expiry</th><th>Status</th></tr></thead>
              <tbody>
                {nearExpiry.filter(searchFn).map((d) => <Row key={d._id} d={d} />)}
                {nearExpiry.length === 0 && <tr><td colSpan={5} className="empty-state"><p><FaExclamationTriangle /> No medicines expiring in this range</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Expiry;
