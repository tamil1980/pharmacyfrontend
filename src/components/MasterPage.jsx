import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaPlusCircle, FaSearch, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';

const inputFor = (field, value, onChange, extra) => {
  const common = {
    value: value ?? '',
    onChange: (e) => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value),
  };
  if (field.type === 'textarea') {
    return <textarea {...common} rows={2} style={{ resize: 'vertical' }} />;
  }
  if (field.type === 'select') {
    return (
      <select {...common}>
        <option value="">Select {field.label}</option>
        {(field.options || []).map((o) => (
          <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>
            {typeof o === 'object' ? o.label : o}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'number') {
    return <input type="number" {...common} />;
  }
  return <input type="text" {...common} />;
};

const MasterPage = ({ title, subtitle, icon, api, fields, addLabel = 'Add' }) => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { load(); }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.getAll({ search });
      setItems(data.items || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openAdd = () => {
    const empty = {};
    fields.forEach((f) => { empty[f.key] = f.type === 'number' ? 0 : ''; });
    setForm(empty);
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    const f = {};
    fields.forEach((k) => { f[k.key] = item[k.key] ?? ''; });
    setForm(f);
    setEditId(item._id);
    setShowModal(true);
  };

  const handleChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const submit = async () => {
    const missing = fields.find((f) => f.required && !String(form[f.key] ?? '').trim());
    if (missing) return toast.error(`${missing.label} is required`);
    try {
      if (editId) {
        await api.update(editId, form);
        toast.success('Updated successfully');
      } else {
        await api.create(form);
        toast.success('Added successfully');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name || item[fields[0]?.key] || ''}"? This cannot be undone.`)) return;
    try {
      await api.remove(item._id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero">
          <div>
            <h2 className="dash-hero-title">{title}</h2>
            <p className="dash-hero-sub">{subtitle}</p>
          </div>
          <button className="btn btn-light-hero" onClick={openAdd}>{icon}{addLabel}</button>
        </div>

        <div className="card">
          <div className="card-header"><h3>All Records ({items.length})</h3></div>
          <div className="card-body">
            <div className="search-bar">
              <FaSearch style={{ marginTop: 10, color: '#999' }} />
              <input placeholder="Search records..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <table>
              <thead>
                <tr>
                  {fields.map((f) => <th key={f.key}>{f.label}</th>)}
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    {fields.map((f) => <td key={f.key}><strong>{f.key === 'isActive' ? '' : item[f.key] || '—'}</strong></td>)}
                    <td>
                      <span className={`badge ${item.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                        {item.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(item)} style={{ marginRight: 4 }}><FaPencilAlt /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(item)}><FaTrashAlt /></button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && !loading && <tr><td colSpan={fields.length + 2} className="empty-state"><p>No records found</p></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? `Edit ${title}` : `Add ${title}`}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {fields.filter((f) => f.key !== 'isActive').map((f) => (
                  <div key={f.key} className="form-group" style={{ marginBottom: 0, gridColumn: f.type === 'textarea' ? '1 / -1' : undefined }}>
                    <label>{f.label} {f.required && <span style={{ color: '#dc3545' }}>*</span>}</label>
                    {inputFor(f, form[f.key], handleChange)}
                  </div>
                ))}
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

export default MasterPage;
