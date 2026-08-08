import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaEnvelope, FaKey } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email });
      setToken(data.resetToken);
      toast.success('Reset token generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate reset token');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-icon">💊</div>
        <h1>Forgot Password</h1>
        <p className="subtitle">Enter your account email to reset your password</p>
        {!token ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><FaEnvelope style={{ marginRight: 6 }} /> Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Enter your email" />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              <FaKey /> {loading ? 'Generating...' : 'Generate Reset Token'}
            </button>
          </form>
        ) : (
          <div>
            <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Copy this one-time token (valid 1 hour) and use it on the Reset Password page:
              </p>
              <code style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--primary)', fontWeight: 700 }}>{token}</code>
            </div>
            <Link to="/reset-password" className="btn btn-primary btn-block">Continue to Reset Password</Link>
          </div>
        )}
        <p style={{ marginTop: 20, fontSize: 12, color: '#999', textAlign: 'center' }}>
          Remembered it? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
