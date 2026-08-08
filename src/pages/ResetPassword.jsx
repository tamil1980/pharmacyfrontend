import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaKey, FaLock, FaCheckCircle } from 'react-icons/fa';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword });
      toast.success('Password reset successful');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-icon">💊</div>
        <h1>Reset Password</h1>
        <p className="subtitle">Enter the reset token and a new password</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><FaKey style={{ marginRight: 6 }} /> Reset Token</label>
            <input value={token} onChange={(e) => setToken(e.target.value)} required placeholder="Paste the reset token" />
          </div>
          <div className="form-group">
            <label><FaLock style={{ marginRight: 6 }} /> New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Enter new password" minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            <FaCheckCircle /> {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p style={{ marginTop: 20, fontSize: 12, color: '#999', textAlign: 'center' }}>
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
