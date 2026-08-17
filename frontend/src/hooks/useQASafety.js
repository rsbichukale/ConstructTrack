import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useQASafety() {
  const [cubes, setCubes] = useState([]);
  const [snags, setSnags] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([
        api.get('/qa-safety/cubes'),
        api.get('/qa-safety/snags')
      ]);
      if (cRes?.success) setCubes(cRes.tests || []);
      if (sRes?.success) setSnags(sRes.snags || []);
    } catch (err) {
      console.error('[useQASafety] Error fetching QA/Safety data:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const recordCubeTest = async (payload) => {
    const res = await api.post('/qa-safety/cubes', payload);
    if (res?.success) fetchData();
    return res;
  };

  const recordSnag = async (payload) => {
    const res = await api.post('/qa-safety/snags', payload);
    if (res?.success) fetchData();
    return res;
  };

  const resolveSnag = async (id, photoAfter, notes) => {
    const res = await api.patch(`/qa-safety/snags/${id}/resolve`, { photoAfter, notes });
    if (res?.success) fetchData();
    return res;
  };

  const recordSafetyBriefing = async (payload) => {
    const res = await api.post('/qa-safety/safety-briefing', payload);
    if (res?.success) fetchData();
    return res;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    cubes,
    snags,
    loading,
    recordCubeTest,
    recordSnag,
    resolveSnag,
    recordSafetyBriefing,
    refresh: fetchData
  };
}

export default useQASafety;
