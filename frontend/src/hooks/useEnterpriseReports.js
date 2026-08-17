import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/apiClient';

export function useEnterpriseReports(initialDate) {
  const [selectedDate, setSelectedDate] = useState(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('daily');
  const [reportData, setReportData] = useState({});

  const fetchReport = useCallback(async (tabName, params = {}) => {
    setLoading(true);
    setError(null);

    const endpoints = {
      daily: `/reports/daily-operational?date=${params.date || selectedDate}`,
      concrete_qa: `/reports/concrete-qa?wing=${params.wing || 'ALL'}&grade=${params.grade || 'ALL'}`,
      snagging: `/reports/snagging-audit?wing=${params.wing || 'ALL'}&severity=${params.severity || 'ALL'}&status=${params.status || 'ALL'}`,
      materials: `/reports/material-reconciliation?startDate=${params.startDate || '2026-08-01'}&endDate=${params.endDate || selectedDate}`,
      contractor: `/reports/contractor-performance?startDate=${params.startDate || '2026-08-01'}&endDate=${params.endDate || selectedDate}`,
      petty_cash: `/reports/petty-cash?startDate=${params.startDate || '2026-08-01'}&endDate=${params.endDate || selectedDate}`,
      commercial: `/reports/client-changes`,
      tower_matrix: `/reports/tower-matrix?wing=${params.wing || 'ALL'}`
    };

    const endpoint = endpoints[tabName] || endpoints.daily;

    try {
      const res = await api.get(endpoint);
      if (res && res.success) {
        setReportData(prev => ({ ...prev, [tabName]: res }));
        return res;
      } else {
        throw new Error(res?.error || 'Failed to fetch report data');
      }
    } catch (err) {
      console.error(`[useEnterpriseReports Error] ${tabName}:`, err.message);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  return {
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    loading,
    error,
    reportData: reportData[activeTab] || null,
    allReports: reportData,
    refresh: (params) => fetchReport(activeTab, params)
  };
}

export default useEnterpriseReports;
