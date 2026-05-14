import { createContext, useContext, useState, useEffect } from 'react';
import { store, initializeStore } from '../lib/store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeStore();
    const saved = sessionStorage.getItem('ah_session');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const found = store.authenticate(email, password);
    if (found) {
      const session = { id: found.id, nombre: found.nombre, email: found.email, role: found.role };
      setUser(session);
      sessionStorage.setItem('ah_session', JSON.stringify(session));
      return { success: true };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('ah_session');
  };

  const updateSession = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    sessionStorage.setItem('ah_session', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, loading, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
