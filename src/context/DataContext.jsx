import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { store } from '../lib/store';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setCourses(store.getCourses());
    setUsers(store.getUsers());
    setCategories(store.getCategories());
    setRefreshKey(k => k + 1);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Course operations
  const addCourse = (course) => { const c = store.addCourse(course); refresh(); return c; };
  const updateCourse = (id, updates) => { const c = store.updateCourse(id, updates); refresh(); return c; };
  const deleteCourse = (id) => { store.deleteCourse(id); refresh(); };

  // User/Docente operations
  const addUser = (user) => { const u = store.addUser(user); refresh(); return u; };
  const updateUser = (id, updates) => { const u = store.updateUser(id, updates); refresh(); return u; };
  const deleteUser = (id) => { store.deleteUser(id); refresh(); };

  // Category operations
  const addCategory = (cat) => { const c = store.addCategory(cat); refresh(); return c; };

  // Helpers
  const getDocentes = () => users.filter(u => u.role === 'docente' || u.role === 'admin');
  const getDocenteById = (id) => users.find(u => u.id === id);
  const getCategoryById = (id) => categories.find(c => c.id === id);

  return (
    <DataContext.Provider value={{
      courses, users, categories, refreshKey,
      addCourse, updateCourse, deleteCourse,
      addUser, updateUser, deleteUser,
      addCategory,
      getDocentes, getDocenteById, getCategoryById,
      refresh
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
