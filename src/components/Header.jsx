import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaMoon, FaSun } from 'react-icons/fa';

const Header = ({ title }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="header">
      <div className="user-info">
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
        <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
      </div>
    </div>
  );
};

export default Header;
