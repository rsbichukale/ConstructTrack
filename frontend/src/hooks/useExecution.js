import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useExecution(siteId = 1) {
  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [flatDetails, setFlatDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchFlats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/execution/flats?siteId=${siteId}`);
      if (res && res.success) {
        setFlats(res.flats || []);
      }
    } catch (err) {
      console.error('[useExecution] Error fetching flats:', err.message);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  const fetchFlatDetails = useCallback(async (flatId) => {
    if (!flatId) return;
    setDetailsLoading(true);
    try {
      const res = await api.get(`/execution/flats/${flatId}`);
      if (res && res.success) {
        setFlatDetails(res.flat);
      }
    } catch (err) {
      console.error('[useExecution] Error fetching flat details:', err.message);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const updateTaskProgress = async (taskId, status, completionPct, remarks) => {
    try {
      const res = await api.patch(`/execution/tasks/${taskId}`, {
        status,
        completionPct,
        remarks
      });
      if (res && res.success) {
        if (selectedFlat) {
          fetchFlatDetails(selectedFlat.id);
        }
        fetchFlats();
      }
      return res;
    } catch (err) {
      console.error('[useExecution] Error updating task:', err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchFlats();
  }, [fetchFlats]);

  useEffect(() => {
    if (selectedFlat?.id) {
      fetchFlatDetails(selectedFlat.id);
    } else {
      setFlatDetails(null);
    }
  }, [selectedFlat, fetchFlatDetails]);

  return {
    flats,
    loading,
    selectedFlat,
    setSelectedFlat,
    flatDetails,
    detailsLoading,
    updateTaskProgress,
    refreshFlats: fetchFlats,
    refreshFlatDetails: () => selectedFlat && fetchFlatDetails(selectedFlat.id)
  };
}

export default useExecution;
