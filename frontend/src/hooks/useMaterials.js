import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useMaterials() {
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({ totalItems: 0, totalValuation: 0, lowStockCount: 0 });
  const [loading, setLoading] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/materials/inventory');
      if (res?.success) {
        setInventory(res.items || []);
        setSummary({
          totalItems: res.totalItems || 0,
          totalValuation: res.totalValuation || 0,
          lowStockCount: res.lowStockCount || 0
        });
      }
    } catch (err) {
      console.error('[useMaterials] Error fetching inventory:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const recordInward = async (payload) => {
    const res = await api.post('/materials/inward', payload);
    if (res?.success) fetchInventory();
    return res;
  };

  const recordOutward = async (payload) => {
    const res = await api.post('/materials/outward', payload);
    if (res?.success) fetchInventory();
    return res;
  };

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    inventory,
    summary,
    loading,
    recordInward,
    recordOutward,
    refresh: fetchInventory
  };
}

export default useMaterials;
