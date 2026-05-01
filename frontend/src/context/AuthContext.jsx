import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeTenantId, setActiveTenantId] = useState(null);
  const [activeCompany, setActiveCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchCompany(tenantId) {
    if (!tenantId) { setActiveCompany(null); return; }
    setCompanyLoading(true);
    try {
      const { data } = await api.get(`/companies/${tenantId}`);
      setActiveCompany(data);
    } catch (_e) {
      setActiveCompany(null);
    } finally {
      setCompanyLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const tenant = localStorage.getItem('activeTenantId');
    if (token) {
      api.get('/auth/me')
        .then(({ data }) => {
          setUser(data);
          setActiveTenantId(tenant);
          return fetchCompany(tenant);
        })
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);

    // İlk tenant'ı otomatik seç
    const firstTenant = data.user.companyRoles?.[0]?.tenantId;
    if (firstTenant) {
      localStorage.setItem('activeTenantId', firstTenant);
      setActiveTenantId(firstTenant);
      await fetchCompany(firstTenant);
    }
    return data.user;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
    localStorage.clear();
    setUser(null);
    setActiveTenantId(null);
  };

  const switchTenant = (tenantId) => {
    localStorage.setItem('activeTenantId', tenantId);
    setActiveTenantId(tenantId);
    fetchCompany(tenantId);
  };

  return (
    <AuthContext.Provider value={{ user, activeTenantId, activeCompany, companyLoading, loading, login, logout, switchTenant }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
