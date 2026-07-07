import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor: añadir token JWT a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('turix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: capturar X-Served-By header
let lastServerId = null;
const serverListeners = new Set();

api.interceptors.response.use(
  (response) => {
    const servedBy = response.headers['x-served-by'];
    if (servedBy && servedBy !== lastServerId) {
      lastServerId = servedBy;
      serverListeners.forEach(fn => fn(servedBy));
    }
    return response;
  },
  (error) => {
    // Si 401/403 y no estamos en login, limpiar token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isAuthRoute = error.config.url.includes('/auth/');
      if (!isAuthRoute) {
        localStorage.removeItem('turix_token');
        localStorage.removeItem('turix_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function onServerChange(callback) {
  serverListeners.add(callback);
  if (lastServerId) callback(lastServerId);
  return () => serverListeners.delete(callback);
}

export function getLastServerId() {
  return lastServerId;
}

export default api;
