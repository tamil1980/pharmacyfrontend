import { useState, useEffect } from 'react';
import { supplierAPI } from '../services/api';
import Header from '../components/Header';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSave, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const emptySupplier = { name: '', contactPerson: '', phone: '', email: '', address: '', city: '', state: '', gstNumber: '', drugLicenseNumber: '', panNumber: '' };

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [form, setForm] = useState(emptySupplier);

  useEffect(() => { loadSuppliers(); }, [search]);

  const loadSuppliers = async () => {
    try {
      const { data } = await supplierAPI.getAll({ search });
      setSuppliers(data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSupplier) { await supplierAPI.update(editSupplier._id, form); }
      else { await supplierAPI.create(form); }
      setShowModal(false); setForm(emptySupplier); setEditSupplier(null); loadSuppliers();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving supplier'); }
  };

  const handleEdit = (s) => {
    setEditSupplier(s);
    setForm({ name: s.name, contactPerson: s.contactPerson || '', phone: s.phone, email: s.email || '', address: s.address || '', city: s.city || '', state: s.state || '', gstNumber: s.gstNumber || '', drugLicenseNumber: s.drugLicenseNumber || '', panNumber: s.panNumber || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try { await supplierAPI.delete(id); loadSuppliers(); toast.success('Supplier deleted'); } catch (err) { toast.error('Error deleting supplier'); }
  };

  const updateField = (f, v) => setForm({ ...form, [f]: v });

  return (
    <div className="layout">
      <Header title="Suppliers" />
      <div className="main-content">
        <div className="page-content">
          <div className="card">
            <div className="card-header">
              <h3>All Suppliers ({suppliers.length})</h3>
              <button className="btn btn-primary" onClick={() => { setForm(emptySupplier); setEditSupplier(null); setShowModal(true); }}><FaPlus /> Add Supplier</button>
            </div>
            <div className="card-body">
              <div className="search-bar">
                <FaSearch style={{ marginTop: 10, color: '#999' }} />
                <input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <table>
                <thead>
                  <tr><th>Name</th><th>Contact</th><th>Phone</th><th>City</th><th>GST No</th><th>DL No</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s._id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.contactPerson || '-'}</td>
                      <td>{s.phone}</td>
                      <td>{s.city || '-'}</td>
                      <td>{s.gstNumber || '-'}</td>
                      <td>{s.drugLicenseNumber || '-'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => handleEdit(s)} style={{marginRight:4}}><FaEdit /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                  {suppliers.length === 0 && <tr><td colSpan={7} className="empty-state"><p>No suppliers found</p></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Supplier Name *</label><input required value={form.name} onChange={(e) => updateField('name', e.target.value)} /></div>
                  <div className="form-group"><label>Contact Person</label><input value={form.contactPerson} onChange={(e) => updateField('contactPerson', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Phone *</label><input required value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></div>
                </div>
                <div className="form-group"><label>Address</label><textarea rows={2} value={form.address} onChange={(e) => updateField('address', e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>City</label><input value={form.city} onChange={(e) => updateField('city', e.target.value)} /></div>
                  <div className="form-group"><label>State</label><input value={form.state} onChange={(e) => updateField('state', e.target.value)} /></div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>GST Number</label><input value={form.gstNumber} onChange={(e) => updateField('gstNumber', e.target.value)} /></div>
                  <div className="form-group"><label>Drug License No</label><input value={form.drugLicenseNumber} onChange={(e) => updateField('drugLicenseNumber', e.target.value)} /></div>
                  <div className="form-group"><label>PAN Number</label><input value={form.panNumber} onChange={(e) => updateField('panNumber', e.target.value)} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}><FaTimes /> Cancel</button>
                <button type="submit" className="btn btn-primary"><FaSave /> {editSupplier ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
