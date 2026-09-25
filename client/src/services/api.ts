let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const API_SERVER = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000';

const getFullUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  return `${API_SERVER}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const url = getFullUrl(endpoint);

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Sends HttpOnly cookie across ports
  });

  // Handle 401: attempt automatic token refresh
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/register')) {
    try {
      const refreshRes = await fetch(getFullUrl('/api/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setAccessToken(refreshData.data.accessToken);

        // Retry original request with new token
        headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
        const retryRes = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          throw new Error(retryData.error?.message || 'Request failed');
        }
        return retryData.data;
      }
    } catch {
      setAccessToken(null);
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data.data;
}
