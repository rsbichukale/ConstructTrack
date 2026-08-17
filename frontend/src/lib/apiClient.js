const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('constructtrack_token');
    if (token) return token;

    const sessionStr = localStorage.getItem('constructtrack_session');
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr);
      const tok = parsed.access_token || parsed.accessToken || parsed.token;
      if (tok) return tok;
    }

    const userStr = localStorage.getItem('constructtrack_user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      if (parsed?.id) return parsed.id;
    }
  } catch (e) {
    console.warn('[ApiClient] Failed to read stored session token:', e.message);
  }
  return null;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { text };
      }
    }

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('constructtrack_token');
        localStorage.removeItem('constructtrack_session');
      }
      const errorMsg = data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    console.warn(`[API Request Notice] ${options.method || 'GET'} ${url}:`, err.message);
    throw err;
  }
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' })
};

export const apiClient = api;
export default api;

