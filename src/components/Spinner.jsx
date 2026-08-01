const Spinner = ({ size = 40, text = 'Loading...' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 }}>
      <div className="spinner" style={{ width: size, height: size }}></div>
      {text && <p style={{ color: 'var(--text-secondary)' }}>{text}</p>}
    </div>
  );
};

export default Spinner;
