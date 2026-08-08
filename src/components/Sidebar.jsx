import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaTachometerAlt, FaPills, FaTruck, FaFileInvoiceDollar, FaClipboardList,
  FaChartBar, FaWarehouse, FaSignOutAlt, FaMedkit, FaCog, FaUndoAlt,
  FaBook, FaExchangeAlt, FaCalendarTimes, FaBarcode, FaWallet,
  FaUsers, FaUserMd, FaBuilding, FaTags, FaBalanceScale, FaUserShield,
  FaBoxOpen, FaDonate
} from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const role = user?.role;

  const sections = [
    {
      label: 'MAIN',
      items: [
        { path: '/', icon: <FaTachometerAlt style={{ color: '#3b82f6' }} />, label: 'Dashboard', roles: ['admin', 'pharmacist', 'cashier'] },
      ],
    },
    {
      label: 'INVENTORY',
      items: [
        { path: '/drugs', icon: <FaPills style={{ color: '#ef4444' }} />, label: 'Medicines', roles: ['admin', 'pharmacist', 'cashier'] },
        { path: '/categories', icon: <FaTags style={{ color: '#f97316' }} />, label: 'Categories', roles: ['admin'] },
        { path: '/companies', icon: <FaBuilding style={{ color: '#8b5cf6' }} />, label: 'Companies', roles: ['admin'] },
        { path: '/units', icon: <FaBalanceScale style={{ color: '#14b8a6' }} />, label: 'Units', roles: ['admin'] },
        { path: '/suppliers', icon: <FaTruck style={{ color: '#f97316' }} />, label: 'Suppliers', roles: ['admin', 'pharmacist'] },
      ],
    },
    {
      label: 'TRANSACTIONS',
      items: [
        { path: '/billing', icon: <FaFileInvoiceDollar style={{ color: '#10b981' }} />, label: 'Billing', roles: ['admin', 'pharmacist', 'cashier'] },
        { path: '/invoices', icon: <FaWarehouse style={{ color: '#06b6d4' }} />, label: 'Invoices', roles: ['admin', 'pharmacist', 'cashier'] },
        { path: '/grn', icon: <FaClipboardList style={{ color: '#8b5cf6' }} />, label: 'GRN Entry', roles: ['admin', 'pharmacist'] },
        { path: '/returns', icon: <FaUndoAlt style={{ color: '#f43f5e' }} />, label: 'Sales Returns', roles: ['admin', 'pharmacist'] },
        { path: '/purchase-returns', icon: <FaDonate style={{ color: '#f59e0b' }} />, label: 'Purchase Returns', roles: ['admin', 'pharmacist'] },
        { path: '/accounts', icon: <FaWallet style={{ color: '#22c55e' }} />, label: 'Accounts', roles: ['admin'] },
      ],
    },
    {
      label: 'STOCK',
      items: [
        { path: '/stock', icon: <FaMedkit style={{ color: '#ec4899' }} />, label: 'Stock Report', roles: ['admin', 'pharmacist'] },
        { path: '/stock/ledger', icon: <FaBook style={{ color: '#3b82f6' }} />, label: 'Stock Ledger', roles: ['admin', 'pharmacist'] },
        { path: '/stock/adjustment', icon: <FaExchangeAlt style={{ color: '#f97316' }} />, label: 'Stock Adjustment', roles: ['admin', 'pharmacist'] },
        { path: '/stock/transfer', icon: <FaExchangeAlt style={{ color: '#14b8a6' }} />, label: 'Stock Transfer', roles: ['admin', 'pharmacist'] },
        { path: '/stock/opening', icon: <FaBoxOpen style={{ color: '#8b5cf6' }} />, label: 'Opening Stock', roles: ['admin', 'pharmacist'] },
        { path: '/stock/expiry', icon: <FaCalendarTimes style={{ color: '#ef4444' }} />, label: 'Expiry Mgmt', roles: ['admin', 'pharmacist'] },
        { path: '/barcodes', icon: <FaBarcode style={{ color: '#06b6d4' }} />, label: 'Barcodes', roles: ['admin', 'pharmacist'] },
      ],
    },
    {
      label: 'REPORTS & SYSTEM',
      items: [
        { path: '/reports', icon: <FaChartBar style={{ color: '#f59e0b' }} />, label: 'Reports', roles: ['admin'] },
        { path: '/customers', icon: <FaUsers style={{ color: '#22c55e' }} />, label: 'Customers', roles: ['admin', 'pharmacist'] },
        { path: '/doctors', icon: <FaUserMd style={{ color: '#06b6d4' }} />, label: 'Doctors', roles: ['admin', 'pharmacist'] },
        { path: '/users', icon: <FaUserShield style={{ color: '#8b5cf6' }} />, label: 'Users', roles: ['admin'] },
        { path: '/settings', icon: <FaCog style={{ color: '#14b8a6' }} />, label: 'Settings', roles: ['admin'] },
      ],
    },
  ];

  return (
    <div className="sidebar">
      <div className="brand">
        <h2>💊 VJS SOFT SOLUTIONS</h2>
        <span>Pharmacy Management System</span>
      </div>
      <nav>
        {sections.map((section) => {
          const visible = section.items.filter((item) => item.roles.includes(role));
          if (visible.length === 0) return null;
          return (
            <div key={section.label} className="nav-section">
              <span className="nav-section-label">{section.label}</span>
              {visible.map((item) => (
                <Link key={item.path} to={item.path} className={isActive(item.path)}>
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="logout-btn">
        <button onClick={logout}><FaSignOutAlt /> Logout ({user?.name})</button>
      </div>
    </div>
  );
};

export default Sidebar;
