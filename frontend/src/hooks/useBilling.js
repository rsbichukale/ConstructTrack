'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useBilling(siteId = 1) {
  const [bills, setBills] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const [billsRes, contractorsRes] = await Promise.all([
        api.get(`/billing/bills?siteId=${siteId}`),
        api.get('/contractors')
      ]);

      if (billsRes.success) setBills(billsRes.bills || []);
      if (contractorsRes.success) setContractors(contractorsRes.contractors || []);
      setError(null);
    } catch (err) {
      console.error('[useBilling] Error fetching bills:', err);
      setError(err.message || 'Failed to fetch RA bills');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  const fetchPreview = useCallback(async (contractorId) => {
    if (!contractorId) {
      setPreview(null);
      return null;
    }
    try {
      setPreviewLoading(true);
      const res = await api.get(`/billing/preview/${contractorId}`);
      if (res.success) {
        setPreview(res.preview);
        return res.preview;
      }
      return null;
    } catch (err) {
      console.error('[useBilling] Error previewing bill:', err);
      throw err;
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const generateBill = useCallback(async (payload) => {
    try {
      const res = await api.post('/billing/generate', { ...payload, siteId });
      await fetchBills();
      return res;
    } catch (err) {
      console.error('[useBilling] Error generating RA bill:', err);
      throw err;
    }
  }, [siteId, fetchBills]);

  const certifyBill = useCallback(async (billId) => {
    try {
      const res = await api.patch(`/billing/bills/${billId}/certify`);
      await fetchBills();
      return res;
    } catch (err) {
      console.error('[useBilling] Error certifying bill:', err);
      throw err;
    }
  }, [fetchBills]);

  const recordPayment = useCallback(async (billId, paymentReference) => {
    try {
      const res = await api.patch(`/billing/bills/${billId}/pay`, { paymentReference });
      await fetchBills();
      return res;
    } catch (err) {
      console.error('[useBilling] Error recording payment:', err);
      throw err;
    }
  }, [fetchBills]);

  const createDebitNote = useCallback(async (payload) => {
    try {
      const res = await api.post('/billing/debit-notes', { ...payload, siteId });
      await fetchBills();
      return res;
    } catch (err) {
      console.error('[useBilling] Error creating debit note:', err);
      throw err;
    }
  }, [siteId, fetchBills]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return {
    bills,
    contractors,
    loading,
    error,
    preview,
    previewLoading,
    fetchPreview,
    generateBill,
    certifyBill,
    recordPayment,
    createDebitNote,
    refresh: fetchBills
  };
}
