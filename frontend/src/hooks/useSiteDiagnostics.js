import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useSiteDiagnostics() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/health/site-diagnostics');
      if (res?.success) {
        setDiagnostics(res);
      }
    } catch (err) {
      console.warn('[useSiteDiagnostics] Error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 15000); // 15s heartbeat
    return () => clearInterval(interval);
  }, [fetchDiagnostics]);

  return {
    diagnostics,
    loading,
    refresh: fetchDiagnostics
  };
}

export default useSiteDiagnostics;
