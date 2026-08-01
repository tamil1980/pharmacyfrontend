import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { FaSave, FaUpload, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaFileInvoice, FaIdCard, FaImage } from 'react-icons/fa';

const Settings = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    pharmacyName: '', address: '', city: '', state: '', phone: '', email: '',
    gstNumber: '', drugLicenseNumber: '', receiptFooter: '', currency: '₹', logo: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setForm(data);
      if (data.logo) setLogoPreview(`http://localhost:5000${data.logo}`);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    try {
      const fd = new FormData();
      fd.append('logo', logoFile);
      const { data } = await settingsAPI.uploadLogo(fd);
      setForm(data);
      setLogoFile(null);
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Logo upload failed' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await settingsAPI.update(form);
      if (logoFile) await handleLogoUpload();
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save settings' });
    }
    setSaving(false);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="layout">
        <Header title="Settings" />
        <div className="main-content">
          <div className="page-content">
            <div className="card"><div className="card-body"><p style={{ textAlign: 'center', color: '#dc3545', padding: 40 }}>Access denied. Admin only.</p></div></div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="layout">
      <Header title="Settings" />
      <div className="main-content"><div className="page-content"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div></div>
    </div>
  );

  return (
    <div className="layout">
      <Header title="Settings" />
      <div className="main-content">
        <div className="page-content">
          {message && (
            <div style={{ padding: 12, borderRadius: 6, marginBottom: 16, background: message.type === 'success' ? '#d1e7dd' : '#f8d7da', color: message.type === 'success' ? '#0f5132' : '#842029' }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3><FaBuilding /> Pharmacy Information</h3></div>
              <div className="card-body">
                <div className="form-row two-cols">
                  <div className="form-group"><label>Pharmacy Name</label><input name="pharmacyName" value={form.pharmacyName} onChange={handleChange} required /></div>
                  <div className="form-group"><label>Currency Symbol</label><input name="currency" value={form.currency} onChange={handleChange} style={{ width: 80 }} /></div>
                </div>
                <div className="form-group"><label><FaMapMarkerAlt /> Address</label><textarea name="address" value={form.address} onChange={handleChange} rows={2} /></div>
                <div className="form-row two-cols">
                  <div className="form-group"><label>City</label><input name="city" value={form.city} onChange={handleChange} /></div>
                  <div className="form-group"><label>State</label><input name="state" value={form.state} onChange={handleChange} /></div>
                </div>
                <div className="form-row two-cols">
                  <div className="form-group"><label><FaPhone /> Phone</label><input name="phone" value={form.phone} onChange={handleChange} /></div>
                  <div className="form-group"><label><FaEnvelope /> Email</label><input name="email" type="email" value={form.email} onChange={handleChange} /></div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3><FaFileInvoice /> Tax & License</h3></div>
              <div className="card-body">
                <div className="form-row two-cols">
                  <div className="form-group"><label><FaFileInvoice /> GST Number</label><input name="gstNumber" value={form.gstNumber} onChange={handleChange} /></div>
                  <div className="form-group"><label><FaIdCard /> Drug License Number</label><input name="drugLicenseNumber" value={form.drugLicenseNumber} onChange={handleChange} /></div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3><FaImage /> Logo</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  {logoPreview && <img src={logoPreview} alt="Pharmacy Logo" style={{ maxWidth: 120, maxHeight: 80, borderRadius: 8, border: '1px solid #ddd' }} />}
                  <div>
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                    {logoFile && <button type="button" className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={handleLogoUpload}><FaUpload /> Upload Logo</button>}
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3>Receipt Settings</h3></div>
              <div className="card-body">
                <div className="form-group"><label>Receipt Footer</label><textarea name="receiptFooter" value={form.receiptFooter} onChange={handleChange} rows={2} /></div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saving}>
              <FaSave /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
