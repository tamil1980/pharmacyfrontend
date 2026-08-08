import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PharmacyProvider } from './context/PharmacyContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Drugs from './pages/Drugs';
import Suppliers from './pages/Suppliers';
import GRN from './pages/GRN';
import Billing from './pages/Billing';
import Invoices from './pages/Invoices';
import SalesReturns from './pages/SalesReturns';
import PurchaseReturns from './pages/PurchaseReturns';
import Stock from './pages/Stock';
import StockLedger from './pages/StockLedger';
import StockAdjustment from './pages/StockAdjustment';
import StockTransfer from './pages/StockTransfer';
import OpeningStock from './pages/OpeningStock';
import Expiry from './pages/Expiry';
import Barcodes from './pages/Barcodes';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import Doctors from './pages/Doctors';
import Companies from './pages/Companies';
import Categories from './pages/Categories';
import Units from './pages/Units';
import Users from './pages/Users';
import Sidebar from './components/Sidebar';
import Spinner from './components/Spinner';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner text="Authenticating..." />;
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content fade-in">{children}</div>
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><p>Loading...</p></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/drugs" element={<PrivateRoute><Drugs /></PrivateRoute>} />
      <Route path="/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
      <Route path="/grn" element={<PrivateRoute><GRN /></PrivateRoute>} />
      <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
      <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
      <Route path="/returns" element={<PrivateRoute><SalesReturns /></PrivateRoute>} />
      <Route path="/purchase-returns" element={<PrivateRoute><PurchaseReturns /></PrivateRoute>} />
      <Route path="/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
      <Route path="/stock/ledger" element={<PrivateRoute><StockLedger /></PrivateRoute>} />
      <Route path="/stock/adjustment" element={<PrivateRoute><StockAdjustment /></PrivateRoute>} />
      <Route path="/stock/transfer" element={<PrivateRoute><StockTransfer /></PrivateRoute>} />
      <Route path="/stock/opening" element={<PrivateRoute><OpeningStock /></PrivateRoute>} />
      <Route path="/stock/expiry" element={<PrivateRoute><Expiry /></PrivateRoute>} />
      <Route path="/barcodes" element={<PrivateRoute><Barcodes /></PrivateRoute>} />
      <Route path="/accounts" element={<PrivateRoute><Accounts /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/doctors" element={<PrivateRoute><Doctors /></PrivateRoute>} />
      <Route path="/companies" element={<PrivateRoute><Companies /></PrivateRoute>} />
      <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
      <Route path="/units" element={<PrivateRoute><Units /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PharmacyProvider>
          <Router>
            <AppRoutes />
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover />
          </Router>
        </PharmacyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
