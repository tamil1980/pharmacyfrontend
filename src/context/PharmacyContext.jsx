import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const PharmacyContext = createContext(null);

export const PharmacyProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load pharmacy settings:', err);
    }
    setLoading(false);
  };

  return (
    <PharmacyContext.Provider value={{ settings, loading, refreshSettings: loadSettings }}>
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => useContext(PharmacyContext);
