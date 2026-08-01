import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { FaUser, FaEnvelope, FaLock, FaUserTag, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'pharmacist', label: 'Pharmacist' },
  { value: 'cashier', label: 'Cashier' },
];

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('pharmacist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, role });
      await login(email, password, role);
      toast.success('Account created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-icon">💊</div>
        <h1>VJS SOFT SOLUTIONS</h1>
        <p className="subtitle">Create New Account</p>
        {error && <div className="toast toast-error" style={{ position: 'relative', marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><FaUser style={{ marginRight: 6 }} /> Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter your name" />
          </div>
          <div className="form-group">
            <label><FaEnvelope style={{ marginRight: 6 }} /> Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label><FaLock style={{ marginRight: 6 }} /> Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Create a password" minLength={6} />
          </div>
          <div className="form-group">
            <label><FaUserTag style={{ marginRight: 6 }} /> Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            <FaUserPlus /> {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 12, color: '#999', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;