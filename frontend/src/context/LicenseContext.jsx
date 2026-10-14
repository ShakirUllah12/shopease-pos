import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const LicenseContext = createContext(null);

export function LicenseProvider({ children }) {
  const [license, setLicense] = useState({
    status: 'trial_active',
    isLicensed: false,
    isExpired: false,
    machineId: '',
    daysRemaining: 3,
    hoursRemaining: 0,
    minutesRemaining: 0,
    trialStartDate: null,
    trialEndDate: null,
    tamperDetected: false,
    clientName: '',
    licenseType: 'none',
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
        if (l.isExpired || l.tamperDetected) {
          setShowActivationModal(true);
        }
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

    // Listen for 403 License Blocked events dispatched by API client interceptor
    const handleLicenseBlocked = (e) => {
      const detail = e.detail || {};
      setLicense((prev) => ({
        ...prev,
        isExpired: true,
        status: detail.licenseStatus || 'trial_expired',
        machineId: detail.machineId || prev.machineId,
      }));
      setShowActivationModal(true);
    };

    window.addEventListener('shopease:license_blocked', handleLicenseBlocked);

    return () => {
      clearInterval(interval);
      window.removeEventListener('shopease:license_blocked', handleLicenseBlocked);
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
