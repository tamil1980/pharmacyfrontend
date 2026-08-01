import { useState, useEffect } from 'react';
import { drugAPI, invoiceAPI } from '../services/api';
import { usePharmacy } from '../context/PharmacyContext';
import Header from '../components/Header';
import { FaSearch, FaPlus, FaTrash, FaPrint, FaFilePdf, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Billing = () => {
  const { settings } = usePharmacy();
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);
  const s = settings || {};
  const currency = s.currency || '₹';

  useEffect(() => { loadDrugs(); }, [search]);

  const loadDrugs = async () => {
    try {
      const { data } = await drugAPI.getAll({ search, limit: 100 });
      setDrugs(data.drugs || []);
    } catch (err) { console.error(err); }
  };

  const addToCart = (drug) => {
    if (drug.quantity <= 0) { toast.error('Out of stock!'); return; }
    const existing = cart.find((c) => c.drug === drug._id && c.batchNumber === drug.batchNumber);
    if (existing) {
      if (existing.quantity >= drug.quantity) { toast.error('Cannot exceed available stock!'); return; }
      setCart(cart.map((c) => c.drug === drug._id ? { ...c, quantity: c.quantity + 1, totalAmount: (c.quantity + 1) * c.unitPrice } : c));
    } else {
      setCart([...cart, { drug: drug._id, name: drug.name, batchNumber: drug.batchNumber, unitPrice: drug.sellingPrice, mrp: drug.mrp, quantity: 1, discount: 0, gstRate: drug.gstRate, totalAmount: drug.sellingPrice, availableQty: drug.quantity }]);
    }
  };

  const updateCartItem = (index, field, value) => {
    const updated = [...cart];
    updated[index][field] = value;
    const itemTotal = updated[index].unitPrice * updated[index].quantity;
    const discount = (itemTotal * updated[index].discount) / 100;
    updated[index].totalAmount = itemTotal - discount;
    setCart(updated);
  };

  const removeFromCart = (index) => setCart(cart.filter((_, i) => i !== index));

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity * item.discount) / 100, 0);
  const totalGST = cart.reduce((sum, item) => sum + ((item.unitPrice * item.quantity - (item.unitPrice * item.quantity * item.discount) / 100) * item.gstRate) / 100, 0);
  const grandTotal = subtotal - totalDiscount + totalGST;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty!'); return; }
    try {
      const payload = {
        customerName, customerPhone, doctorName,
        items: cart.map((c) => ({ drug: c.drug, batchNumber: c.batchNumber, quantity: c.quantity, unitPrice: c.unitPrice, mrp: c.mrp, discount: c.discount, gstRate: c.gstRate })),
        paymentMethod, amountPaid: Number(amountPaid) || grandTotal,
      };
      const { data } = await invoiceAPI.create(payload);
      setLastInvoice(data);
      setCart([]); setCustomerName('Walk-in Customer'); setCustomerPhone(''); setDoctorName(''); setAmountPaid(''); setPaymentMethod('cash');
      loadDrugs();
      printInvoice(data);
    } catch (err) { toast.error(err.response?.data?.message || 'Error creating invoice'); }
  };

  const printInvoice = (inv) => {
    const printWindow = window.open('', '_blank');
    const items = inv.items.map((item, i) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd">${i + 1}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.drug?.name || 'N/A'}</td>
        <td style="padding:8px;border:1px solid #ddd">${item.batchNumber}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">₹${item.unitPrice.toFixed(2)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${item.discount}%</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">₹${item.gstAmount?.toFixed(2) || '0.00'}</td>
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
          <div class="pharmacy-info">
            ${s.address ? s.address + '<br>' : ''}${s.city ? s.city + ', ' : ''}${s.state || ''}<br>
            Tel: ${s.phone || ''}${s.gstNumber ? ' | GSTIN: ' + s.gstNumber : ''}${s.drugLicenseNumber ? '<br>Drug License: ' + s.drugLicenseNumber : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px"><strong>Invoice:</strong> ${inv.invoiceNumber}</div>
          <div style="font-size:13px"><strong>Date:</strong> ${new Date(inv.createdAt).toLocaleDateString()}</div>
          <div style="font-size:13px"><strong>Time:</strong> ${new Date(inv.createdAt).toLocaleTimeString()}</div>
          <div style="margin-top:8px;padding:4px 12px;background:#198754;color:white;border-radius:4px;display:inline-block;font-size:11px;font-weight:600">PAID</div>
        </div>
      </div>
      <div style="background:#f8f9fa;padding:12px;border-radius:8px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <div>
            <div><strong>Customer:</strong> ${inv.customerName}</div>
            <div><strong>Phone:</strong> ${inv.customerPhone || 'N/A'}</div>
          </div>
          <div style="text-align:right">
            <div><strong>Doctor:</strong> ${inv.doctorName || 'N/A'}</div>
            <div><strong>Payment:</strong> ${(inv.paymentMethod || 'cash').toUpperCase()}</div>
          </div>
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
      <div class="footer">
        <p>${s.receiptFooter || 'Thank you for your purchase!'}</p>
        ${s.phone ? `<p>For queries call: ${s.phone}</p>` : ''}
      </div>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadPDF = (inv) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(13, 110, 253);
    doc.text(s.pharmacyName || 'VJS SOFT SOLUTIONS', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    const addrLine = `${s.address || ''}${s.city ? ', ' + s.city : ''}${s.state ? ', ' + s.state : ''}`;
    const gstLine = s.gstNumber ? ` | GSTIN: ${s.gstNumber}` : '';
    doc.text(addrLine + gstLine, 14, 27);
    const licenseLine = s.drugLicenseNumber ? `Drug License: ${s.drugLicenseNumber} | ` : '';
    doc.text(licenseLine + `Tel: ${s.phone || ''}`, 14, 33);

    doc.setDrawColor(13, 110, 253);
    doc.line(14, 37, 196, 37);

    doc.setTextColor(33);
    doc.setFontSize(12);
    doc.text(`Invoice: ${inv.invoiceNumber}`, 14, 45);
    doc.text(`Date: ${new Date(inv.createdAt).toLocaleDateString()}`, 14, 51);
    doc.text(`Customer: ${inv.customerName}`, 140, 45);
    doc.text(`Doctor: ${inv.doctorName || 'N/A'}`, 140, 51);
    doc.text(`Payment: ${(inv.paymentMethod || 'cash').toUpperCase()} | Paid: ${curr}${Number(inv.amountPaid || 0).toFixed(2)}`, 140, 57);

    const curr = currency;
    const tableData = inv.items.map((item, i) => [
      i + 1, item.drug?.name || 'N/A', item.batchNumber, item.quantity,
      `${curr}${item.unitPrice.toFixed(2)}`, `${item.discount}%`, `${curr}${item.gstAmount?.toFixed(2) || '0.00'}`, `${curr}${item.totalAmount.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['S.No', 'Medicine', 'Batch', 'Qty', 'Rate', 'Disc', 'GST', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [13, 110, 253], halign: 'center', fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Subtotal: ${curr}${inv.subtotal?.toFixed(2)}`, 140, finalY);
    doc.text(`Discount: -${curr}${inv.totalDiscount?.toFixed(2)}`, 140, finalY + 7);
    doc.text(`GST: ${curr}${inv.totalGST?.toFixed(2)}`, 140, finalY + 14);
    doc.setFontSize(13);
    doc.setTextColor(13, 110, 253);
    doc.text(`Grand Total: ${curr}${inv.grandTotal?.toFixed(2)}`, 140, finalY + 24);
    doc.setFontSize(11);
    doc.setTextColor(33);
    doc.text(`Amount Paid: ${curr}${inv.amountPaid?.toFixed(2)}`, 140, finalY + 31);

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(s.receiptFooter || 'Thank you for your purchase!', 105, finalY + 45, { align: 'center' });

    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  return (
    <div className="layout">
      <Header title="Billing / POS" />
      <div className="main-content">
        <div className="page-content">
          {lastInvoice && (
            <div style={{ background: '#d1e7dd', padding: 16, borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>✅ Invoice {lastInvoice.invoiceNumber} created successfully!</strong> Total: {currency}{lastInvoice.grandTotal?.toFixed(2)}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-success" onClick={() => printInvoice(lastInvoice)}><FaPrint /> Print</button>
                <button className="btn btn-sm btn-danger" onClick={() => downloadPDF(lastInvoice)}><FaFilePdf /> PDF</button>
                <button className="btn btn-sm btn-outline" onClick={() => setLastInvoice(null)}>Dismiss</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
            <div className="card">
              <div className="card-header"><h3>Search & Add Medicines</h3></div>
              <div className="card-body">
                <div className="search-bar">
                  <FaSearch style={{ marginTop: 10, color: '#999' }} />
                  <input placeholder="Search medicine name, batch..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {drugs.filter(d => d.quantity > 0).map((drug) => (
                    <div key={drug._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid #eee', borderRadius: 8, marginBottom: 6, cursor: 'pointer' }} onClick={() => addToCart(drug)}>
                      <div>
                        <strong style={{ fontSize: 14 }}>{drug.name}</strong>
                        <p style={{ fontSize: 12, color: '#666' }}>{drug.dosageForm} {drug.strength} | Batch: {drug.batchNumber}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#0d6efd' }}>{currency}{drug.sellingPrice}</div>
                        <div style={{ fontSize: 11, color: drug.quantity <= drug.minimumStock ? '#dc3545' : '#198754' }}>Stock: {drug.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3>🛒 Billing Cart ({cart.length})</h3></div>
              <div className="card-body">
                <div className="form-group"><label>Customer Name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
                <div className="form-group"><label>Phone</label><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
                <div className="form-group"><label>Doctor Name</label><input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} /></div>

                <div style={{ maxHeight: 200, overflowY: 'auto', margin: '12px 0' }}>
                  {cart.map((item, i) => (
                    <div key={i} className="cart-item">
                      <div className="item-details">
                        <div className="item-name">{item.name}</div>
                                                        <div className="item-meta">{currency}{item.unitPrice} × {item.quantity}</div>
                      </div>
                      <input type="number" min="1" max={item.availableQty} style={{ width: 50, padding: 4, border: '1px solid #ddd', borderRadius: 4 }} value={item.quantity} onChange={(e) => updateCartItem(i, 'quantity', Number(e.target.value))} />
                      <input type="number" min="0" max="100" style={{ width: 50, padding: 4, border: '1px solid #ddd', borderRadius: 4 }} value={item.discount} onChange={(e) => updateCartItem(i, 'discount', Number(e.target.value))} placeholder="%" />
                      <strong style={{ minWidth: 70, textAlign: 'right' }}>{currency}{item.totalAmount.toFixed(2)}</strong>
                      <button className="btn btn-sm btn-danger" onClick={() => removeFromCart(i)}><FaTrash /></button>
                    </div>
                  ))}
                  {cart.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>Click a medicine to add to cart</p>}
                </div>

                <div className="billing-summary">
                  <div className="row"><span>Subtotal</span><span>{currency}{subtotal.toFixed(2)}</span></div>
                  <div className="row"><span>Discount</span><span>-{currency}{totalDiscount.toFixed(2)}</span></div>
                  <div className="row"><span>GST</span><span>{currency}{totalGST.toFixed(2)}</span></div>
                  <div className="row total"><span>Grand Total</span><span>{currency}{grandTotal.toFixed(2)}</span></div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="form-group"><label>Payment Method</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="online">Online</option><option value="credit">Credit</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Amount Paid</label><input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder={grandTotal.toFixed(2)} /></div>
                  {amountPaid && Number(amountPaid) >= grandTotal && (
                    <p style={{ color: '#198754', fontWeight: 600 }}>Change: {currency}{(Number(amountPaid) - grandTotal).toFixed(2)}</p>
                  )}
                </div>

                <button className="btn btn-success btn-block btn-lg" onClick={handleCheckout} disabled={cart.length === 0} style={{ marginTop: 12 }}>
                  <FaCheck /> Complete Sale - {currency}{grandTotal.toFixed(2)}
                </button>

                {lastInvoice && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn btn-outline btn-block" onClick={() => printInvoice(lastInvoice)}><FaPrint /> Print Invoice</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
