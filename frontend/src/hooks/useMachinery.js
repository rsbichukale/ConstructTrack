'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useMachinery(siteId = 1) {
  const [assets, setAssets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMachineryData = useCallback(async () => {
    try {
      setLoading(true);
      const [assetsRes, logsRes] = await Promise.all([
        api.get(`/machinery/assets?siteId=${siteId}`),
        api.get(`/machinery/logs?siteId=${siteId}`)
      ]);

      if (assetsRes.success) setAssets(assetsRes.assets || []);
      if (logsRes.success) setLogs(logsRes.logs || []);
      setError(null);
    } catch (err) {
      console.error('[useMachinery] Error fetching machinery data:', err);
      setError(err.message || 'Failed to fetch machinery data');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  const registerAsset = useCallback(async (payload) => {
    try {
      const res = await api.post('/machinery/assets', { ...payload, siteId });
      await fetchMachineryData();
      return res;
    } catch (err) {
      console.error('[useMachinery] Error registering asset:', err);
      throw err;
    }
  }, [siteId, fetchMachineryData]);

  const updateAssetStatus = useCallback(async (id, status) => {
    try {
      const res = await api.patch(`/machinery/assets/${id}/status`, { status });
      await fetchMachineryData();
      return res;
    } catch (err) {
      console.error('[useMachinery] Error updating status:', err);
      throw err;
    }
  }, [fetchMachineryData]);

  const recordRunAndFuelLog = useCallback(async (payload) => {
    try {
      const res = await api.post('/machinery/logs', { ...payload, siteId });
      await fetchMachineryData();
      return res;
    } catch (err) {
      console.error('[useMachinery] Error recording fuel log:', err);
      throw err;
    }
  }, [siteId, fetchMachineryData]);

  useEffect(() => {
    fetchMachineryData();
  }, [fetchMachineryData]);

  return {
    assets,
    logs,
    loading,
    error,
    registerAsset,
    updateAssetStatus,
    recordRunAndFuelLog,
    refresh: fetchMachineryData
  };
}
