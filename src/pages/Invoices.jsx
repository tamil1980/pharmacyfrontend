import { useState, useEffect } from 'react';
import { invoiceAPI } from '../services/api';
import { usePharmacy } from '../context/PharmacyContext';
import Header from '../components/Header';
import { FaSearch, FaEye, FaPrint, FaFilePdf } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Invoices = () => {
  const { settings } = usePharmacy();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const s = settings || {};
  const currency = s.currency || '₹';

  useEffect(() => { loadInvoices(); }, [search]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data } = await invoiceAPI.getAll({ search, limit: 100 });
      setInvoices(data.invoices || []);
      setTotal(data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const loadInvoiceDetails = async (id) => {
    try { const { data } = await invoiceAPI.getOne(id); setViewInvoice(data); } catch (err) { console.error(err); }
  };

  const printInvoice = (inv) => {
    const printWindow = window.open('', '_blank');
    const items = inv.items.map((item, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.drug?.name || 'N/A'}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.batchNumber}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${currency}${item.unitPrice.toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${item.discount}%</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${currency}${item.gstAmount?.toFixed(2) || '0.00'}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">${currency}${item.totalAmount.toFixed(2)}</td>
      </tr>`).join('');

    printWindow.document.write(`
      <html><head><title>Invoice ${inv.invoiceNumber}</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;margin:20px;color:#333}
        .header-section{display:flex;justify-content:space-between;border-bottom:3px solid #0d6efd;padding-bottom:15px;margin-bottom:20px}
        .pharmacy-name{font-size:24px;font-weight:700;color:#0d6efd}
        .pharmacy-info{font-size:12px;color:#666}
        table{width:100%;border-collapse:collapse}
        th{background:#0d6efd;color:white;padding:10px;text-align:center;font-size:12px;font-weight:600}
        .totals{margin-top:20px;text-align:right}
        .totals .row{display:flex;justify-content:flex-end;gap:40px;padding:4px 0}
        .totals .grand{font-size:18px;font-weight:700;border-top:2px solid #0d6efd;padding-top:8px;color:#0d6efd}
        .footer{margin-top:30px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:10px}
      </style></head><body>
      <div class="header-section">
        <div>
          <div class="pharmacy-name">${s.pharmacyName || 'VJS SOFT SOLUTIONS'}</div>
          <div class="pharmacy-info">${s.address ? s.address + '<br>' : ''}Tel: ${s.phone || ''}${s.gstNumber ? ' | GSTIN: ' + s.gstNumber : ''}</div>
        </div>
        <div style="text-align:right">
          <div><strong>Invoice:</strong> ${inv.invoiceNumber}</div>
          <div><strong>Date:</strong> ${new Date(inv.createdAt).toLocaleDateString()}</div>
          <div style="margin-top:8px;padding:4px 12px;background:#198754;color:white;border-radius:4px;display:inline-block;font-size:11px;font-weight:600">${(inv.status || 'completed').toUpperCase()}</div>
        </div>
      </div>
      <div style="background:#f8f9fa;padding:12px;border-radius:8px;margin-bottom:16px;font-size:13px;display:flex;justify-content:space-between">
        <div>
          <div><strong>Customer:</strong> ${inv.customerName}</div>
          <div><strong>Phone:</strong> ${inv.customerPhone || 'N/A'}</div>
        </div>
        <div style="text-align:right">
          <div><strong>Doctor:</strong> ${inv.doctorName || 'N/A'}</div>
          <div><strong>Payment:</strong> ${(inv.paymentMethod || 'cash').toUpperCase()}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>S.No</th><th>Medicine</th><th>Batch</th><th>Qty</th><th>Rate</th><th>Disc%</th><th>GST</th><th>Total</th></tr></thead>
        <tbody>${items}</tbody>
      </table>
      <div class="totals">
        <div class="row"><span>Subtotal:</span><span>${currency}${inv.subtotal?.toFixed(2)}</span></div>
        <div class="row"><span>Discount:</span><span>-${currency}${inv.totalDiscount?.toFixed(2)}</span></div>
        <div class="row"><span>GST:</span><span>${currency}${inv.totalGST?.toFixed(2)}</span></div>
        <div class="row grand"><span>Grand Total:</span><span>${currency}${inv.grandTotal?.toFixed(2)}</span></div>
        <div class="row"><span>Amount Paid:</span><span>${currency}${inv.amountPaid?.toFixed(2)}</span></div>
        ${inv.change > 0 ? `<div class="row"><span>Change:</span><span>${currency}${inv.change.toFixed(2)}</span></div>` : ''}
      </div>
      <div class="footer"><p>${s.receiptFooter || 'Thank you for your purchase!'}</p></div>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadPDF = (inv) => {
    const doc = new jsPDF();
    const curr = currency;
    doc.setFontSize(20); doc.setTextColor(13, 110, 253); doc.text(s.pharmacyName || 'VJS SOFT SOLUTIONS', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    const addrLine = `${s.address || ''}${s.city ? ', ' + s.city : ''}${s.state ? ', ' + s.state : ''}`;
    doc.text(addrLine + (s.gstNumber ? ` | GSTIN: ${s.gstNumber}` : ''), 14, 27);
    doc.setDrawColor(13, 110, 253); doc.line(14, 32, 196, 32);
    doc.setTextColor(33); doc.setFontSize(12);
    doc.text(`Invoice: ${inv.invoiceNumber}`, 14, 40);
    doc.text(`Date: ${new Date(inv.createdAt).toLocaleDateString()}`, 14, 46);
    doc.text(`Customer: ${inv.customerName}`, 140, 40);
    doc.text(`Doctor: ${inv.doctorName || 'N/A'}`, 140, 46);
    doc.text(`Payment: ${(inv.paymentMethod || 'cash').toUpperCase()} | Paid: ${curr}${Number(inv.amountPaid || 0).toFixed(2)}`, 140, 52);
    const tableData = inv.items.map((item, i) => [i + 1, item.drug?.name || 'N/A', item.batchNumber, item.quantity, `${curr}${item.unitPrice.toFixed(2)}`, `${item.discount}%`, `${curr}${item.gstAmount?.toFixed(2) || '0.00'}`, `${curr}${item.totalAmount.toFixed(2)}`]);
    autoTable(doc, { startY: 60, head: [['S.No', 'Medicine', 'Batch', 'Qty', 'Rate', 'Disc', 'GST', 'Total']], body: tableData, theme: 'grid', headStyles: { fillColor: [13, 110, 253], halign: 'center', fontStyle: 'bold' }, styles: { fontSize: 9, cellPadding: 2 } });
    const fY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Subtotal: ${curr}${inv.subtotal?.toFixed(2)}`, 140, fY);
    doc.text(`Discount: -${curr}${inv.totalDiscount?.toFixed(2)}`, 140, fY + 7);
    doc.text(`GST: ${curr}${inv.totalGST?.toFixed(2)}`, 140, fY + 14);
    doc.setFontSize(13); doc.setTextColor(13, 110, 253);
    doc.text(`Grand Total: ${curr}${inv.grandTotal?.toFixed(2)}`, 140, fY + 24);
    doc.setFontSize(11); doc.setTextColor(33);
    doc.text(`Paid: ${curr}${inv.amountPaid?.toFixed(2)}`, 140, fY + 31);
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text(s.receiptFooter || 'Thank you!', 105, fY + 45, { align: 'center' });
    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  return (
    <div className="layout">
      <Header title="Invoices" />
      <div className="main-content">
        <div className="page-content">
          <div className="card">
            <div className="card-header"><h3>All Invoices ({total})</h3></div>
            <div className="card-body">
              <div className="search-bar">
                <FaSearch style={{ marginTop: 10, color: '#999' }} />
                <input placeholder="Search by invoice number, customer name..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <table>
                <thead><tr><th>Invoice No</th><th>Customer</th><th>Items</th><th>Grand Total</th><th>Paid</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td><strong>{inv.invoiceNumber}</strong></td>
                      <td>{inv.customerName}</td>
                      <td>{inv.items?.length || 0}</td>
                      <td><strong>{currency}{inv.grandTotal?.toLocaleString()}</strong></td>
                      <td>{currency}{inv.amountPaid?.toLocaleString()}</td>
                      <td><span className="badge badge-info">{(inv.paymentMethod || 'cash').toUpperCase()}</span></td>
                      <td><span className={`badge badge-${inv.status === 'completed' ? 'success' : inv.status === 'cancelled' ? 'danger' : 'warning'}`}>{inv.status}</span></td>
                      <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => loadInvoiceDetails(inv._id)} style={{ marginRight: 4 }}><FaEye /></button>
                        <button className="btn btn-sm btn-success" onClick={() => printInvoice(inv)} style={{ marginRight: 4 }}><FaPrint /></button>
                        <button className="btn btn-sm btn-danger" onClick={() => downloadPDF(inv)}><FaFilePdf /></button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && <tr><td colSpan={9} className="empty-state"><p>No invoices found</p></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {viewInvoice && (
        <div className="modal-overlay" onClick={() => setViewInvoice(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invoice - {viewInvoice.invoiceNumber}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-success" onClick={() => printInvoice(viewInvoice)}><FaPrint /> Print</button>
                <button className="btn btn-sm btn-danger" onClick={() => downloadPDF(viewInvoice)}><FaFilePdf /> PDF</button>
                <button className="modal-close" onClick={() => setViewInvoice(null)}>×</button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 14 }}>
                <div><strong>Customer:</strong> {viewInvoice.customerName}</div>
                <div><strong>Phone:</strong> {viewInvoice.customerPhone || 'N/A'}</div>
                <div><strong>Doctor:</strong> {viewInvoice.doctorName || 'N/A'}</div>
                <div><strong>Payment:</strong> {(viewInvoice.paymentMethod || 'cash').toUpperCase()}</div>
                <div><strong>Date:</strong> {new Date(viewInvoice.createdAt).toLocaleString()}</div>
                <div><strong>Status:</strong> <span className={`badge badge-${viewInvoice.status === 'completed' ? 'success' : 'warning'}`}>{viewInvoice.status}</span></div>
              </div>
              <table>
                <thead><tr><th>S.No</th><th>Medicine</th><th>Batch</th><th>Qty</th><th>Rate</th><th>Disc</th><th>GST</th><th>Total</th></tr></thead>
                <tbody>
                  {viewInvoice.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.drug?.name || 'N/A'}</td>
                      <td>{item.batchNumber}</td>
                      <td>{item.quantity}</td>
                      <td>{currency}{item.unitPrice}</td>
                      <td>{item.discount}%</td>
                      <td>{currency}{item.gstAmount?.toFixed(2)}</td>
                      <td><strong>{currency}{item.totalAmount?.toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <p>Subtotal: {currency}{viewInvoice.subtotal?.toFixed(2)}</p>
                <p>Discount: -{currency}{viewInvoice.totalDiscount?.toFixed(2)}</p>
                <p>GST: {currency}{viewInvoice.totalGST?.toFixed(2)}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#0d6efd' }}>Grand Total: {currency}{viewInvoice.grandTotal?.toFixed(2)}</p>
                <p>Amount Paid: {currency}{viewInvoice.amountPaid?.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
