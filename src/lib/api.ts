export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cyber-api-final.onrender.com/api';
export const BASE_URL = API_BASE_URL.replace('/api', '');

export const api = {
  getHeaders: () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: api.getHeaders(),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${res.statusText}`);
    }
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        let errorMessage = `API Error: ${res.statusText}`;
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            const textError = await res.text().catch(() => null);
            if (textError) errorMessage = textError;
        }
        throw new Error(errorMessage);
    }
    return res.json();
  },
  put: async (endpoint: string, data?: any) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: api.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${res.statusText}`);
    }
    return res.json();
  },
};
