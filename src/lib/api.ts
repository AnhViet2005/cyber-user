export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cyber-api-final.onrender.com/api';
export const BASE_URL = API_BASE_URL.replace('/api', '');

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${res.statusText}`);
    }
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
        let errorMessage = `API Error: ${res.statusText}`;
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // If not JSON, try reading as text
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
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${res.statusText}`);
    }
    return res.json();
  },
};
