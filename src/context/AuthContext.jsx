import { createContext, useContext, useState, useEffect } from 'react';
import { store, initializeStore } from '../lib/store';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initializeStore();
      const saved = localStorage.getItem('ah_session');
      if (saved) {
        try {
          const sessionData = JSON.parse(saved);
          if (sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
            setUser(sessionData.user);
          } else {
            localStorage.removeItem('ah_session');
          }
        } catch (e) {
          localStorage.removeItem('ah_session');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email, password) => {
    const found = await store.authenticate(email, password);
    if (found) {
      const sessionUser = { id: found.id, nombre: found.nombre, email: found.email, role: found.role };
      setUser(sessionUser);
      const sessionData = {
        user: sessionUser,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };
      localStorage.setItem('ah_session', JSON.stringify(sessionData));
      return { success: true };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ah_session');
  };

  const updateSession = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    const sessionData = {
      user: updatedUser,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };
    localStorage.setItem('ah_session', JSON.stringify(sessionData));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, loading, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
