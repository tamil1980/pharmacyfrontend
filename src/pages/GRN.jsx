import { useState, useEffect } from 'react';
import { grnAPI, supplierAPI, drugAPI } from '../services/api';
import Header from '../components/Header';
import { FaPlus, FaSearch, FaEye, FaTimes, FaFileExcel, FaUpload, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

const emptyItem = { drug: '', batchNumber: '', expiryDate: '', quantity: 1, purchasePrice: 0, mrp: 0, gstRate: 12, totalAmount: 0 };

const GRN = () => {
  const [grns, setGrns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewGRN, setViewGRN] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ supplier: '', invoiceNumber: '', invoiceDate: '', remarks: '', discount: 0, items: [emptyItem] });
  const [showExcel, setShowExcel] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [excelErrors, setExcelErrors] = useState([]);
  const [excelForm, setExcelForm] = useState({ supplier: '', invoiceNumber: '', invoiceDate: '', remarks: '', items: [] });

  useEffect(() => { loadGRNs(); loadSuppliers(); loadDrugs(); }, [search]);

  const loadGRNs = async () => {
    try { const { data } = await grnAPI.getAll({ search }); setGrns(data.grns || []); } catch (err) { console.error(err); }
  };
  const loadSuppliers = async () => {
    try { const { data } = await supplierAPI.getAll({}); setSuppliers(data); } catch (err) { console.error(err); }
  };
  const loadDrugs = async () => {
    try { const { data } = await drugAPI.getAll({ limit: 500 }); setDrugs(data.drugs || []); } catch (err) { console.error(err); }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, emptyItem] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    if (field === 'drug') {
      const d = drugs.find(d => d._id === value);
      if (d) { items[i].purchasePrice = d.purchasePrice; items[i].mrp = d.mrp; items[i].batchNumber = d.batchNumber; items[i].gstRate = d.gstRate; }
    }
    items[i].totalAmount = items[i].quantity * items[i].purchasePrice;
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await grnAPI.create(form);
      setShowModal(false);
      setForm({ supplier: '', invoiceNumber: '', invoiceDate: '', remarks: '', discount: 0, items: [emptyItem] });
      loadGRNs();
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating GRN'); loadGRNs(); }
  };

  const loadGRNDetails = async (id) => {
    try { const { data } = await grnAPI.getOne(id); setViewGRN(data); } catch (err) { console.error(err); }
  };

  const openExcelModal = () => {
    setExcelForm({ supplier: '', invoiceNumber: '', invoiceDate: '', remarks: '', items: [] });
    setUploadFile(null);
    setExcelErrors([]);
    setShowExcel(true);
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const { data } = await grnAPI.parseExcel(formData);
      setExcelErrors(data.errors || []);
      if (data.items && data.items.length > 0) {
        setExcelForm((prev) => ({ ...prev, items: data.items }));
        toast.success(`${data.items.length} item(s) loaded from Excel`);
      } else {
        setExcelForm((prev) => ({ ...prev, items: [] }));
        toast.error('No valid items found in the Excel file');
      }
      if (data.errors && data.errors.length > 0) {
        toast.warning(`${data.errors.length} row(s) skipped - check console for details`);
        console.warn('GRN Excel errors:', data.errors);
      }
      setUploadFile(null);
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    setUploading(false);
  };

  const handleExcelSave = async () => {
    if (!excelForm.supplier) { toast.error('Please select a supplier'); return; }
    if (!excelForm.items.length) { toast.error('No items loaded - upload an Excel file first'); return; }
    setSaving(true);
    try {
      await grnAPI.create({ ...excelForm, discount: 0, items: excelForm.items });
      toast.success('GRN saved successfully');
      setShowExcel(false);
      loadGRNs();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving GRN'); }
    setSaving(false);
  };

  return (
    <div className="layout">
      <Header title="GRN - Goods Received Note" />
      <div className="main-content">
        <div className="page-content">
          <div className="card">
            <div className="card-header">
              <h3>GRN Entries</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" onClick={openExcelModal}><FaFileExcel /> Upload Excel</button>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}><FaPlus /> New GRN</button>
              </div>
            </div>
            <div className="card-body">
              <div className="search-bar">
                <FaSearch style={{ marginTop: 10, color: '#999' }} />
                <input placeholder="Search GRN number..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <table>
                <thead><tr><th>GRN No</th><th>Supplier</th><th>Invoice No</th><th>Items</th><th>Net Amount</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {grns.map((g) => (
                    <tr key={g._id}>
                      <td><strong>{g.grnNumber}</strong></td>
                      <td>{g.supplier?.name || '-'}</td>
                      <td>{g.invoiceNumber || '-'}</td>
                      <td>{g.items?.length || 0}</td>
                      <td>₹{g.netAmount?.toLocaleString()}</td>
                      <td>{new Date(g.createdAt).toLocaleDateString()}</td>
                      <td><button className="btn btn-sm btn-outline" onClick={() => loadGRNDetails(g._id)}><FaEye /> View</button></td>
                    </tr>
                  ))}
                  {grns.length === 0 && <tr><td colSpan={7} className="empty-state"><p>No GRN entries found</p></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New GRN Entry</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row-3">
                  <div className="form-group"><label>Supplier *</label><select required value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Select Supplier</option>{suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
                  <div className="form-group"><label>Invoice Number</label><input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /></div>
                  <div className="form-group"><label>Invoice Date</label><input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Remarks</label><input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>

                <h4 style={{ margin: '16px 0 12px' }}>Items</h4>
                {form.items.map((item, i) => (
                  <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <div className="form-row-3">
                      <div className="form-group"><label>Medicine *</label><select required value={item.drug} onChange={(e) => updateItem(i, 'drug', e.target.value)}><option value="">Select</option>{drugs.map(d => <option key={d._id} value={d._id}>{d.name} ({d.batchNumber})</option>)}</select></div>
                      <div className="form-group"><label>Batch No *</label><input required value={item.batchNumber} onChange={(e) => updateItem(i, 'batchNumber', e.target.value)} /></div>
                      <div className="form-group"><label>Expiry *</label><input type="date" required value={item.expiryDate} onChange={(e) => updateItem(i, 'expiryDate', e.target.value)} /></div>
                    </div>
                    <div className="form-row-3">
                      <div className="form-group"><label>Qty *</label><input type="number" required min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} /></div>
                      <div className="form-group"><label>Purchase Price *</label><input type="number" step="0.01" required value={item.purchasePrice} onChange={(e) => updateItem(i, 'purchasePrice', Number(e.target.value))} /></div>
                      <div className="form-group"><label>MRP</label><input type="number" step="0.01" value={item.mrp} onChange={(e) => updateItem(i, 'mrp', Number(e.target.value))} /></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Total: ₹{item.totalAmount.toLocaleString()}</span>
                      {form.items.length > 1 && <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(i)}>Remove</button>}
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline" onClick={addItem}><FaPlus /> Add Item</button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save GRN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExcel && (
        <div className="modal-overlay" onClick={() => setShowExcel(false)}>
          <div className="modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload GRN from Excel</h3>
              <button className="modal-close" onClick={() => setShowExcel(false)}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <div className="form-row-3">
                <div className="form-group"><label>Supplier *</label><select value={excelForm.supplier} onChange={(e) => setExcelForm({ ...excelForm, supplier: e.target.value })}><option value="">Select Supplier</option>{suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
                <div className="form-group"><label>Invoice Number</label><input value={excelForm.invoiceNumber} onChange={(e) => setExcelForm({ ...excelForm, invoiceNumber: e.target.value })} /></div>
                <div className="form-group"><label>Invoice Date</label><input type="date" value={excelForm.invoiceDate} onChange={(e) => setExcelForm({ ...excelForm, invoiceDate: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Remarks</label><input value={excelForm.remarks} onChange={(e) => setExcelForm({ ...excelForm, remarks: e.target.value })} /></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 4px' }}>
                <h4 style={{ margin: 0 }}>Excel Sheet Items</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    style={{ maxWidth: 220, fontSize: 12 }}
                    onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  />
                  <button type="button" className="btn btn-sm btn-primary" disabled={!uploadFile || uploading} onClick={handleUploadExcel}>
                    <FaUpload /> {uploading ? 'Loading...' : 'Upload'}
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#999', margin: '4px 0 12px' }}>
                Excel columns: Medicine Name, Batch Number, Expiry Date, Quantity, Purchase Price, MRP. Medicines are matched by name.
              </p>

              {excelErrors.length > 0 && (
                <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: '#664d03' }}>
                  <strong>{excelErrors.length} row(s) skipped:</strong>
                  {excelErrors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}

              {excelForm.items.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Medicine</th><th>Batch</th><th>Expiry</th><th>Qty</th><th>Rate</th><th>MRP</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      {excelForm.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.drugName || '-'}</td>
                          <td>{item.batchNumber}</td>
                          <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '-'}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.purchasePrice}</td>
                          <td>₹{item.mrp}</td>
                          <td>₹{item.totalAmount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {excelForm.items.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>No items loaded yet. Upload an Excel file above.</p>}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setShowExcel(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={saving} onClick={handleExcelSave}>
                <FaSave /> {saving ? 'Saving...' : 'Save GRN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewGRN && (
        <div className="modal-overlay" onClick={() => setViewGRN(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>GRN Details - {viewGRN.grnNumber}</h3><button className="modal-close" onClick={() => setViewGRN(null)}><FaTimes /></button></div>
            <div className="modal-body">
              <p><strong>Supplier:</strong> {viewGRN.supplier?.name}</p>
              <p><strong>Invoice No:</strong> {viewGRN.invoiceNumber || 'N/A'}</p>
              <p><strong>Date:</strong> {new Date(viewGRN.createdAt).toLocaleString()}</p>
              <table style={{ marginTop: 16 }}>
                <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
                <tbody>
                  {viewGRN.items?.map((item, i) => (
                    <tr key={i}><td>{item.drug?.name || 'N/A'}</td><td>{item.batchNumber}</td><td>{item.quantity}</td><td>₹{item.purchasePrice}</td><td>₹{item.totalAmount}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: 16, fontSize: 18, fontWeight: 700 }}>Net: ₹{viewGRN.netAmount?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GRN;
