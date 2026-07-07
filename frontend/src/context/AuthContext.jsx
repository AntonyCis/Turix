import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('turix_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('turix_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('turix_user');
      localStorage.removeItem('turix_token');
    }
  }, [user]);

  async function login(email, password) {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('turix_token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Error de conexión' };
    } finally {
      setLoading(false);
    }
  }

  async function register(email, password, full_name) {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { email, password, full_name });
      localStorage.setItem('turix_token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const errorData = err.response?.data;
      const message = errorData?.errors?.join(', ') || errorData?.error || 'Error de conexión';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
  }

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isAdmin, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
