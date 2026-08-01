import { useState, useEffect } from 'react';
import { drugAPI } from '../services/api';
import Header from '../components/Header';
import Spinner from '../components/Spinner';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSave, FaTimes, FaFileExcel, FaDownload, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const emptyDrug = { name: '', genericName: '', category: '', manufacturer: '', dosageForm: 'Tablet', strength: '', batchNumber: '', expiryDate: '', purchasePrice: '', sellingPrice: '', mrp: '', quantity: '', minimumStock: 10, hsnCode: '', gstRate: 12, scheduleType: 'OTC' };
const categories = ['Antibiotic', 'Analgesic', 'Antipyretic', 'Antacid', 'Antihistamine', 'Cardiovascular', 'Diabetes', 'Dermatology', 'Eye/Ear', 'Respiratory', 'Vitamin/Supplement', 'Other'];
const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Powder', 'Gel', 'Spray', 'Other'];

const Drugs = () => {
  const [drugs, setDrugs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDrug, setEditDrug] = useState(null);
  const [form, setForm] = useState(emptyDrug);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadDrugs(); }, [search]);

  const loadDrugs = async () => {
    setLoading(true);
    try {
      const { data } = await drugAPI.getAll({ search, limit: 100 });
      setDrugs(data.drugs);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, purchasePrice: Number(form.purchasePrice), sellingPrice: Number(form.sellingPrice), mrp: Number(form.mrp), quantity: Number(form.quantity), minimumStock: Number(form.minimumStock), gstRate: Number(form.gstRate) };
      if (editDrug) {
        await drugAPI.update(editDrug._id, payload);
      } else {
        await drugAPI.create(payload);
      }
      setShowModal(false);
      setForm(emptyDrug);
      setEditDrug(null);
      loadDrugs();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving drug'); }
  };

  const handleEdit = (drug) => {
    setEditDrug(drug);
    setForm({
      name: drug.name, genericName: drug.genericName || '', category: drug.category, manufacturer: drug.manufacturer || '',
      dosageForm: drug.dosageForm, strength: drug.strength || '', batchNumber: drug.batchNumber,
      expiryDate: drug.expiryDate ? drug.expiryDate.split('T')[0] : '',
      purchasePrice: drug.purchasePrice, sellingPrice: drug.sellingPrice, mrp: drug.mrp,
      quantity: drug.quantity, minimumStock: drug.minimumStock, hsnCode: drug.hsnCode || '',
      gstRate: drug.gstRate, scheduleType: drug.scheduleType
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    try { await drugAPI.delete(id); loadDrugs(); toast.success('Medicine deleted'); } catch (err) { toast.error('Error deleting'); }
  };

  const updateField = (field, value) => setForm({ ...form, [field]: value });

  const handleDownloadTemplate = async () => {
    try {
      const res = await drugAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'medicine_template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) { toast.error('Could not download template'); }
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const { data } = await drugAPI.upload(formData);
      if (data.inserted > 0) toast.success(`${data.inserted} medicine(s) imported`);
      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} row(s) skipped - check console for details`);
        console.warn('Excel import errors:', data.errors);
      }
      setShowUpload(false);
      setUploadFile(null);
      loadDrugs();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    setUploading(false);
  };

  return (
    <div className="layout">
      <Header title="Medicines Master" />
      <div className="main-content">
        <div className="page-content">
          <div className="card">
            <div className="card-header">
              <h3>All Medicines ({total})</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" onClick={() => { setUploadFile(null); setShowUpload(true); }}>
                  <FaFileExcel /> Upload Excel
                </button>
                <button className="btn btn-primary" onClick={() => { setForm(emptyDrug); setEditDrug(null); setShowModal(true); }}>
                  <FaPlus /> Add Medicine
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="search-bar">
                <FaSearch style={{ marginTop: 10, color: '#999' }} />
                <input placeholder="Search by name, generic name, batch number..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Generic</th><th>Batch</th><th>Category</th><th>Qty</th><th>MRP</th><th>Expiry</th><th>Stock Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {drugs.map((drug) => (
                      <tr key={drug._id}>
                        <td><strong>{drug.name}</strong><br/><span style={{fontSize:11,color:'#999'}}>{drug.dosageForm} {drug.strength}</span></td>
                        <td>{drug.genericName || '-'}</td>
                        <td>{drug.batchNumber}</td>
                        <td><span className="badge badge-info">{drug.category}</span></td>
                        <td>{drug.quantity}</td>
                        <td>₹{drug.mrp}</td>
                        <td>{(() => { const exp = new Date(drug.expiryDate); const daysLeft = Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24)); return daysLeft <= 20 ? <span style={{ color: '#dc3545', fontWeight: 'bold' }}>{exp.toLocaleDateString()}</span> : exp.toLocaleDateString(); })()}</td>
                        <td>{drug.quantity <= drug.minimumStock ? <span className="badge badge-danger">Low</span> : <span className="badge badge-success">OK</span>}</td>
                        <td>
                          <button className="btn btn-sm btn-outline" onClick={() => handleEdit(drug)} style={{marginRight:4}}><FaEdit /></button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(drug._id)}><FaTrash /></button>
                        </td>
                      </tr>
                    ))}
                    {drugs.length === 0 && <tr><td colSpan={9} className="empty-state"><p>No medicines found</p></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editDrug ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label>Medicine Name *</label><input required value={form.name} onChange={(e) => updateField('name', e.target.value)} /></div>
                  <div className="form-group"><label>Generic Name</label><input value={form.genericName} onChange={(e) => updateField('genericName', e.target.value)} /></div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>Category *</label><select required value={form.category} onChange={(e) => updateField('category', e.target.value)}><option value="">Select</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="form-group"><label>Dosage Form</label><select value={form.dosageForm} onChange={(e) => updateField('dosageForm', e.target.value)}>{dosageForms.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  <div className="form-group"><label>Strength</label><input placeholder="e.g. 500mg" value={form.strength} onChange={(e) => updateField('strength', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Manufacturer</label><input value={form.manufacturer} onChange={(e) => updateField('manufacturer', e.target.value)} /></div>
                  <div className="form-group"><label>Batch Number *</label><input required value={form.batchNumber} onChange={(e) => updateField('batchNumber', e.target.value)} /></div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>Purchase Price *</label><input type="number" step="0.01" required value={form.purchasePrice} onChange={(e) => updateField('purchasePrice', e.target.value)} /></div>
                  <div className="form-group"><label>Selling Price *</label><input type="number" step="0.01" required value={form.sellingPrice} onChange={(e) => updateField('sellingPrice', e.target.value)} /></div>
                  <div className="form-group"><label>MRP *</label><input type="number" step="0.01" required value={form.mrp} onChange={(e) => updateField('mrp', e.target.value)} /></div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>Quantity *</label><input type="number" required value={form.quantity} onChange={(e) => updateField('quantity', e.target.value)} /></div>
                  <div className="form-group"><label>Expiry Date *</label><input type="date" required value={form.expiryDate} onChange={(e) => updateField('expiryDate', e.target.value)} /></div>
                  <div className="form-group"><label>Min Stock</label><input type="number" value={form.minimumStock} onChange={(e) => updateField('minimumStock', e.target.value)} /></div>
                </div>
                <div className="form-row-3">
                  <div className="form-group"><label>HSN Code</label><input value={form.hsnCode} onChange={(e) => updateField('hsnCode', e.target.value)} /></div>
                  <div className="form-group"><label>GST Rate %</label><input type="number" value={form.gstRate} onChange={(e) => updateField('gstRate', e.target.value)} /></div>
                  <div className="form-group"><label>Schedule</label><select value={form.scheduleType} onChange={(e) => updateField('scheduleType', e.target.value)}><option value="OTC">OTC</option><option value="H">H</option><option value="H1">H1</option><option value="X">X</option><option value="Other">Other</option></select></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}><FaTimes /> Cancel</button>
                <button type="submit" className="btn btn-primary"><FaSave /> {editDrug ? 'Update' : 'Save'} Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Medicines from Excel</h3>
              <button className="modal-close" onClick={() => setShowUpload(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                Download the template, fill in your medicine details, then upload the file (.xlsx, .xls or .csv).
                Required columns: Name, Category, Batch Number, Expiry Date, Purchase Price, Selling Price, MRP, Quantity.
              </p>
              <button type="button" className="btn btn-outline" onClick={handleDownloadTemplate}>
                <FaDownload /> Download Template
              </button>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Choose Excel file</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowUpload(false)}><FaTimes /> Cancel</button>
              <button type="button" className="btn btn-primary" disabled={!uploadFile || uploading} onClick={handleUploadExcel}>
                <FaUpload /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drugs;
