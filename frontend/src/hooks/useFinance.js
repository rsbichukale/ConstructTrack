import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useFinance() {
  const [pettyCash, setPettyCash] = useState({ summary: {}, entries: [] });
  const [clientChanges, setClientChanges] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pcRes, ccRes] = await Promise.all([
        api.get('/finance/petty-cash'),
        api.get('/finance/client-changes')
      ]);
      if (pcRes?.success) setPettyCash({ summary: pcRes.summary || {}, entries: pcRes.entries || [] });
      if (ccRes?.success) setClientChanges(ccRes.changes || []);
    } catch (err) {
      console.error('[useFinance] Error fetching finance data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPettyCashEntry = async (payload) => {
    const res = await api.post('/finance/petty-cash', payload);
    if (res?.success) fetchData();
    return res;
  };

  const approveClientChange = async (id, status, approvalType) => {
    const res = await api.patch(`/finance/client-changes/${id}/approve`, { status, approvalType });
    if (res?.success) fetchData();
    return res;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    pettyCash,
    clientChanges,
    loading,
    createPettyCashEntry,
    approveClientChange,
    refresh: fetchData
  };
}

export default useFinance;
