import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { store } from '../lib/store';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    setCourses(await store.getCourses());
    setUsers(await store.getUsers());
    setCategories(await store.getCategories());
    setRefreshKey(k => k + 1);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Course operations
  const addCourse = async (course) => { const c = await store.addCourse(course); await refresh(); return c; };
  const updateCourse = async (id, updates) => { const c = await store.updateCourse(id, updates); await refresh(); return c; };
  const deleteCourse = async (id) => { await store.deleteCourse(id); await refresh(); };

  // User/Docente operations
  const addUser = async (user) => { const u = await store.addUser(user); await refresh(); return u; };
  const updateUser = async (id, updates) => { const u = await store.updateUser(id, updates); await refresh(); return u; };
  const deleteUser = async (id) => { await store.deleteUser(id); await refresh(); };

  // Category operations
  const addCategory = async (cat) => { const c = await store.addCategory(cat); await refresh(); return c; };

  // File operations
  const uploadFlyer = async (file, courseId) => await store.uploadFlyer(file, courseId);
  const deleteFlyer = async (flyerUrl) => await store.deleteFlyer(flyerUrl);

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
      uploadFlyer, deleteFlyer,
      getDocentes, getDocenteById, getCategoryById,
      refresh
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
