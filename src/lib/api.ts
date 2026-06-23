import { getKeycloak } from '../contexts/AuthContext';

const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer ? 'http://localhost:8000/combate/api/v1' : '/combate/api/v1';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const kc = await getKeycloak();
  let token = '';

  if (kc) {
    try {
      if (kc.isTokenExpired(5)) {
        await kc.updateToken(5);
      }
      token = kc.token;
    } catch (error) {
      console.error("Failed to refresh token", error);
      kc.login();
    }
  }

  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    if (response.status === 401 && kc) {
      kc.login();
    }
    
    let errorMsg = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      errorMsg = errData.message || errData.error || errData.detail || errorMsg;
    } catch (e) {
      // Ignora erro de parsing
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}
