import { useState, useEffect, useRef } from 'react';
import { drugAPI } from '../services/api';
import { usePharmacy } from '../context/PharmacyContext';
import { FaBarcode, FaSearch, FaPlus, FaPrint } from 'react-icons/fa';
import JsBarcode from 'jsbarcode';

const Barcodes = () => {
  const { settings } = usePharmacy();
  const s = settings || {};
  const currency = s.currency || '₹';
  const [drugs, setDrugs] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const labelRef = useRef({});

  useEffect(() => {
    drugAPI.getAll({ limit: 500 }).then(({ data }) => setDrugs(data.drugs || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setResults(drugs.filter((d) => (d.name + (d.batchNumber || '')).toLowerCase().includes(search.toLowerCase())).slice(0, 20));
  }, [search, drugs]);

  const addLabel = (drug) => {
    if (selected.some((x) => x._id === drug._id)) return;
    setSelected([...selected, drug]);
    setSearch('');
  };

  const codeFor = (d) => d.barcode || d.batchNumber || d._id;

  useEffect(() => {
    selected.forEach((d) => {
      const el = labelRef.current[d._id];
      if (el) {
        try {
          JsBarcode(el, codeFor(d), { format: 'CODE128', clean: true, width: 2, height: 50, displayValue: true, fontSize: 12, margin: 4 });
        } catch { /* ignore invalid code */ }
      }
    });
  }, [selected]);

  const printLabels = () => {
    window.print();
  };

  return (
    <div className="layout">
      <div className="page-content" style={{ paddingLeft: 0 }}>
        <div className="dash-hero no-print">
          <div>
            <h2 className="dash-hero-title">Barcode Generation & Printing</h2>
            <p className="dash-hero-sub">Select medicines and print barcode labels</p>
          </div>
          <button className="btn btn-light-hero" onClick={printLabels} disabled={selected.length === 0}><FaPrint /> Print Labels ({selected.length})</button>
        </div>

        <div className="card no-print" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3><FaBarcode /> Add Barcode Labels</h3></div>
          <div className="card-body">
            <div className="search-bar">
              <FaSearch style={{ marginTop: 10, color: '#999' }} />
              <input placeholder="Search medicine name or batch..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {search && (
              <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 8, marginBottom: 12 }}>
                {results.map((d) => (
                  <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => addLabel(d)}>
                    <div>
                      <strong style={{ fontSize: 14 }}>{d.name}</strong>
                      <p style={{ fontSize: 12, color: '#999' }}>{d.batchNumber} · {currency}{d.mrp} · <strong>Barcode: {codeFor(d)}</strong></p>
                    </div>
                    <button className="btn btn-sm btn-success"><FaPlus /></button>
                  </div>
                ))}
                {results.length === 0 && <p style={{ padding: 20, textAlign: 'center', color: '#999' }}>No medicines found</p>}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selected.map((d) => (
                <span key={d._id} className="badge badge-info" style={{ fontSize: 12, padding: '6px 10px' }}>
                  {d.name} <button onClick={() => setSelected(selected.filter((x) => x._id !== d._id))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: 4 }}>×</button>
                </span>
              ))}
              {selected.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>No labels selected</p>}
            </div>
          </div>
        </div>

        <div className="barcode-print-area">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {selected.map((d) => (
              <div key={d._id} className="barcode-label">
                <strong>{s.pharmacyName || ''}</strong>
                <span style={{ fontSize: 11 }}>{d.name}</span>
                <svg ref={(el) => (labelRef.current[d._id] = el)} />
                <span style={{ fontSize: 10, color: '#555' }}>{currency}{d.mrp} · {d.batchNumber}</span>              </div>
            ))}
          </div>
          {selected.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>Select medicines to generate labels</p>}
        </div>
      </div>
    </div>
  );
};

export default Barcodes;
