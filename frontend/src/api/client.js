import axios from 'axios';

const BASE_URL = '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request: token + tenantId ekle, FormData ise Content-Type'ı sil (browser boundary'yi kendisi ekler)
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const tenantId = localStorage.getItem('activeTenantId');
  if (tenantId) config.headers['x-tenant-id'] = tenantId;

  return config;
});

// Singleton refresh promise — paralel 401'lerin çoklu refresh tetiklemesini önler
let refreshPromise = null;

function forceLogout() {
  localStorage.clear();
  window.location.href = '/login';
}

// Response: 401 → token yenile
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        forceLogout();
        return Promise.reject(error);
      }

      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${BASE_URL}/auth/refresh`, { refreshToken })
          .then(({ data }) => {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return data.accessToken;
          })
          .catch((err) => {
            forceLogout();
            return Promise.reject(err);
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      return refreshPromise.then((accessToken) => {
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      });
    }
    return Promise.reject(error);
  }
);

export default api;
