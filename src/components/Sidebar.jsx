import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaTachometerAlt, FaPills, FaTruck, FaFileInvoiceDollar, FaClipboardList,
  FaChartBar, FaWarehouse, FaSignOutAlt, FaMedkit, FaCog
} from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  const menuItems = [
    { path: '/', icon: <FaTachometerAlt style={{ color: '#3b82f6' }} />, label: 'Dashboard', roles: ['admin', 'pharmacist', 'cashier'] },
    { path: '/drugs', icon: <FaPills style={{ color: '#ef4444' }} />, label: 'Medicines', roles: ['admin', 'pharmacist', 'cashier'] },
    { path: '/suppliers', icon: <FaTruck style={{ color: '#f97316' }} />, label: 'Suppliers', roles: ['admin', 'pharmacist'] },
    { path: '/grn', icon: <FaClipboardList style={{ color: '#8b5cf6' }} />, label: 'GRN Entry', roles: ['admin', 'pharmacist'] },
    { path: '/billing', icon: <FaFileInvoiceDollar style={{ color: '#10b981' }} />, label: 'Billing', roles: ['admin', 'pharmacist', 'cashier'] },
    { path: '/invoices', icon: <FaWarehouse style={{ color: '#06b6d4' }} />, label: 'Invoices', roles: ['admin', 'pharmacist', 'cashier'] },
    { path: '/stock', icon: <FaMedkit style={{ color: '#ec4899' }} />, label: 'Stock Report', roles: ['admin', 'pharmacist'] },
    { path: '/reports', icon: <FaChartBar style={{ color: '#f59e0b' }} />, label: 'Reports', roles: ['admin'] },
    { path: '/settings', icon: <FaCog style={{ color: '#14b8a6' }} />, label: 'Settings', roles: ['admin'] },
  ];

  return (
    <div className="sidebar">
      <div className="brand">
        <h2>💊 VJS SOFT SOLUTIONS</h2>
        <span>Pharmacy Management System</span>
      </div>
      <nav>
        {menuItems.filter(item => item.roles.includes(user?.role)).map((item) => (
          <Link key={item.path} to={item.path} className={isActive(item.path)}>
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>
      <div className="logout-btn">
        <button onClick={logout}><FaSignOutAlt /> Logout ({user?.name})</button>
      </div>
    </div>
  );
};

export default Sidebar;
