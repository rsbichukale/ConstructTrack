import { useState, useEffect, useCallback } from 'react';
import { getSessionUser, loginUser, logoutUser } from '../lib/auth';

export function useAuthSession() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const u = await getSessionUser();
      setUser(u);
    } catch (_) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (identifier, password) => {
    const res = await loginUser(identifier, password);
    if (res.success) {
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    role: user?.role || 'site_engineer',
    permissions: user?.workspacePermissions || [],
    login,
    logout,
    refreshSession
  };
}

export default useAuthSession;
