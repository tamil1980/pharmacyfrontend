import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaUsers, FaPlusCircle, FaSearch, FaPencilAlt, FaTrashAlt, FaLock } from 'react-icons/fa';

const Users = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier', isActive: true });
  const [resetForm, setResetForm] = useState({ email: '', password: '' });

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.getUsers();
      setUsers(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openAdd = () => {
    setForm({ name: '', email: '', password: '', role: 'cashier', isActive: true });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setForm({ name: u.name, email: u.email, password: '', role: u.role, isActive: u.isActive });
    setEditId(u._id);
    setShowModal(true);
  };

  const submit = async () => {
    try {
      if (editId) {
        await authAPI.updateUser(editId, form);
        toast.success('User updated');
      } else {
        await authAPI.createUser(form);
        toast.success('User created');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const remove = async (u) => {
    if (u._id === me?.id) return toast.error('You cannot delete your own account');
    if (!window.confirm(`Delete user "${u.name}"?`)) return;
    try {
      await authAPI.deleteUser(u._id);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const resetPassword = async (u) => {
    const password = window.prompt(`Enter a new password for ${u.name}:`);
    if (!password) return;
    try {
      await authAPI.updateUser(u._id, { password });
      toast.success('Password updated');
    } catch (err) {
      toast.error('Failed to reset password');
    }
  };

  const filtered = users.filter((u) => (u.name + u.email).toLowerCase().includes(search.toLowerCase()));

  const roleBadge = (role) => (
    <span className={`badge ${role === 'admin' ? 'badge-danger' : role === 'pharmacist' ? 'badge-info' : 'badge-warning'}`}>{role.toUpperCase()}</span>
  );

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">User Management</h2>
            <p className="dash-hero-sub">Admin, Pharmacist and Cashier accounts</p>
          </div>
          <button className="btn btn-light-hero" onClick={openAdd}><FaPlusCircle /> Add User</button>
        </div>

        <div className="card">
          <div className="card-header"><h3>All Users ({filtered.length})</h3></div>
          <div className="card-body">
            <div className="search-bar">
              <FaSearch style={{ marginTop: 10, color: '#999' }} />
              <input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong> {u._id === me?.id && <span className="badge badge-info">You</span>}</td>
                    <td>{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(u)} style={{ marginRight: 4 }}><FaPencilAlt /></button>
                      <button className="btn btn-sm btn-warning" onClick={() => resetPassword(u)} style={{ marginRight: 4 }}><FaLock /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(u)}><FaTrashAlt /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && <tr><td colSpan={5} className="empty-state"><p>No users found</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Edit User' : 'Add User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="form-group">
                <label>{editId ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group"><label>Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="cashier">Cashier</option>
                  </select>
                </div>
                <div className="form-group"><label>Status</label>
                  <select value={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
