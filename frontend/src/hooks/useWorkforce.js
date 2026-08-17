import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useWorkforce(initialDate) {
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [contractors, setContractors] = useState([]);
  const [targets, setTargets] = useState([]);
  const [muster, setMuster] = useState({ summary: {}, roster: [] });
  const [advances, setAdvances] = useState({ summary: {}, advances: [] });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes, mRes, aRes] = await Promise.all([
        api.get('/contractors'),
        api.get(`/contractors/targets?date=${date}`),
        api.get(`/contractors/muster?date=${date}`),
        api.get('/contractors/advances')
      ]);
      if (cRes?.success) setContractors(cRes.contractors || []);
      if (tRes?.success) setTargets(tRes.targets || []);
      if (mRes?.success) setMuster({ summary: mRes.summary || {}, roster: mRes.roster || [] });
      if (aRes?.success) setAdvances({ summary: aRes.summary || {}, advances: aRes.advances || [] });
    } catch (err) {
      console.error('[useWorkforce] Error fetching workforce data:', err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const createTarget = async (payload) => {
    const res = await api.post('/contractors/targets', { ...payload, date });
    if (res?.success) fetchData();
    return res;
  };

  const updateTargetStatus = async (id, status) => {
    const res = await api.patch(`/contractors/targets/${id}`, { status });
    if (res?.success) fetchData();
    return res;
  };

  const recordAttendance = async (payload) => {
    const res = await api.post('/contractors/attendance', {
      ...payload,
      date
    });
    if (res?.success) fetchData();
    return res;
  };

  const createWageAdvance = async (payload) => {
    const res = await api.post('/contractors/advances', payload);
    if (res?.success) fetchData();
    return res;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    date,
    setDate,
    contractors,
    targets,
    muster,
    advances,
    loading,
    createTarget,
    updateTargetStatus,
    recordAttendance,
    createWageAdvance,
    refresh: fetchData
  };
}
