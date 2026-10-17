import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const LicenseContext = createContext(null);

export function LicenseProvider({ children }) {
  const [license, setLicense] = useState({
    status: 'licensed',
    isLicensed: true,
    isExpired: false,
    machineId: '',
    daysRemaining: 9999,
    hoursRemaining: 9999,
    minutesRemaining: 9999,
    trialStartDate: null,
    trialEndDate: null,
    tamperDetected: false,
    clientName: 'ShopEase POS Lifetime Edition',
    licenseType: 'lifetime',
  });
  const [loading, setLoading] = useState(true);
  const [showActivationModal, setShowActivationModal] = useState(false);

  // Fetch current license status from backend
  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/license/status');
      if (res.data?.success && res.data.license) {
        const l = res.data.license;
        setLicense(l);
      }
    } catch (err) {
      console.warn('License status check failed (operating in offline fallback):', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Check status periodically (every 60 seconds)
    const interval = setInterval(fetchStatus, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchStatus]);

  // Activate license using offline key
  const activateLicense = async (licenseKey, clientName = '') => {
    const res = await api.post('/license/activate', { licenseKey, clientName });
    if (res.data?.success && res.data.license) {
      setLicense(res.data.license);
      setShowActivationModal(false);
      return res.data;
    }
    throw new Error(res.data?.message || 'Activation failed');
  };

  const openActivationModal = () => setShowActivationModal(true);
  const closeActivationModal = () => {
    if (!license.isExpired && !license.tamperDetected) {
      setShowActivationModal(false);
    }
  };

  return (
    <LicenseContext.Provider
      value={{
        license,
        loading,
        showActivationModal,
        openActivationModal,
        closeActivationModal,
        activateLicense,
        refreshStatus: fetchStatus,
        isTrial: license.status === 'trial_active',
        isExpired: license.isExpired,
        isLicensed: license.isLicensed,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
}
