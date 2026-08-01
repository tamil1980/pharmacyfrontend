import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-icon">💊</div>
        <h1>VJS SOFT SOLUTIONS</h1>
        <p className="subtitle">Pharmacy Billing Management System</p>
        {error && <div className="toast toast-error" style={{ position: 'relative', marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><FaEnvelope style={{ marginRight: 6 }} /> Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
          </div>
          <div className="form-group">
            <label><FaLock style={{ marginRight: 6 }} /> Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter password" />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            <FaSignInAlt /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 12, color: '#999', textAlign: 'center' }}>
          Don't have an account? <a href="/signup" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
