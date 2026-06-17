import { supabase } from './supabase';

export const store = {
  // Hash passwords using SHA-256
  hashPassword: async (password) => {
    if (!password) return '';
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (e) {
      console.error('Crypto error during password hashing:', e);
      return password; // Fallback to plain text in case of legacy environments
    }
  },

  // Offline queue syncing
  queueSync: (table, operation, data) => {
    try {
      const queue = JSON.parse(localStorage.getItem('ah_pending_sync') || '[]');
      queue.push({ 
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36), 
        table, 
        operation, 
        data 
      });
      localStorage.setItem('ah_pending_sync', JSON.stringify(queue));
    } catch (e) {
      console.error('Error queueing offline operation:', e);
    }
  },

  syncPending: async () => {
    if (!navigator.onLine) return;
    try {
      const queue = JSON.parse(localStorage.getItem('ah_pending_sync') || '[]');
      if (queue.length === 0) return;
      
      console.log(`Sincronizando ${queue.length} operaciones pendientes...`);
      const failed = [];
      
      for (const op of queue) {
        try {
          if (op.operation === 'insert') {
            const { error } = await supabase.from(op.table).insert([op.data]);
            if (error) throw error;
          } else if (op.operation === 'update') {
            const { error } = await supabase.from(op.table).update(op.data).eq('id', op.data.id);
            if (error) throw error;
          } else if (op.operation === 'delete') {
            const { error } = await supabase.from(op.table).delete().eq('id', op.data.id);
            if (error) throw error;
          }
        } catch (err) {
          console.error(`Error syncing operation:`, op, err);
          failed.push(op);
        }
      }
      
      localStorage.setItem('ah_pending_sync', JSON.stringify(failed));
    } catch (e) {
      console.error('Error during pending sync:', e);
    }
  },

  // Users / Docentes
  getUsers: async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').order('nombre');
      if (error) throw error;
      localStorage.setItem('ah_users', JSON.stringify(data || []));
      return data || [];
    } catch (err) {
      console.warn('Error getting users, falling back to local:', err);
      const local = localStorage.getItem('ah_users');
      return local ? JSON.parse(local) : [
        { id: 'mock-admin', nombre: 'Administrador', email: 'admin@academichub.com', role: 'admin', especialidad: 'Gestión Académica', activo: true },
        { id: 'mock-jefferson', nombre: 'Jefferson', email: 'jefferson_15_6@hotmail.com', role: 'admin', activo: true },
        { id: 'mock-maria', nombre: 'María', email: 'maria@academichub.com', role: 'docente', especialidad: 'Ciencias de la Computación', activo: true }
      ];
    }
  },
  getDocentes: async () => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'docente').order('nombre');
      if (error) throw error;
      return data || [];
    } catch (err) {
      const users = await store.getUsers();
      return users.filter(u => u.role === 'docente' || u.role === 'admin');
    }
  },
  getUserById: async (id) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (err) {
      const users = await store.getUsers();
      return users.find(u => u.id === id) || null;
    }
  },
  authenticate: async (email, password) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('activo', true)
        .maybeSingle();

      if (data && !error) {
        const hashedInput = await store.hashPassword(password);
        if (data.password === hashedInput || data.password === password) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Error authenticating with Supabase, trying fallback:', err);
    }

    // Fallback: Default mock users if database is offline or user not found
    const mockUsers = [
      { id: 'mock-admin', nombre: 'Administrador', email: 'admin@academichub.com', password: 'admin123', role: 'admin', especialidad: 'Gestión Académica', activo: true },
      { id: 'mock-jefferson', nombre: 'Jefferson', email: 'jefferson_15_6@hotmail.com', password: 'admin123', role: 'admin', activo: true },
      { id: 'mock-maria', nombre: 'María', email: 'maria@academichub.com', password: 'docente123', role: 'docente', especialidad: 'Ciencias de la Computación', activo: true }
    ];

    const hashedInput = await store.hashPassword(password);
    const found = mockUsers.find(u => u.email === email && (u.password === password || u.password === hashedInput) && u.activo);
    return found || null;
  },
  addUser: async (user) => {
    const newUser = {
      id: user.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
      created_at: new Date().toISOString(),
      ...user
    };
    if (newUser.password) {
      newUser.password = await store.hashPassword(newUser.password);
    }
    try {
      const { data, error } = await supabase.from('users').insert([newUser]).select();
      if (error) throw error;
      const saved = data && data.length > 0 ? data[0] : newUser;
      
      const local = localStorage.getItem('ah_users');
      const list = local ? JSON.parse(local) : [];
      list.push(saved);
      localStorage.setItem('ah_users', JSON.stringify(list));
      return saved;
    } catch (err) {
      console.warn('Error adding user to Supabase, saving locally:', err);
      const local = localStorage.getItem('ah_users');
      const list = local ? JSON.parse(local) : [];
      list.push(newUser);
      localStorage.setItem('ah_users', JSON.stringify(list));
      
      store.queueSync('users', 'insert', newUser);
      return newUser;
    }
  },
  updateUser: async (id, updates) => {
    const updatesToApply = { ...updates };
    if (updatesToApply.password) {
      updatesToApply.password = await store.hashPassword(updatesToApply.password);
    }
    try {
      const { data, error } = await supabase.from('users').update(updatesToApply).eq('id', id).select();
      if (error) throw error;
      const updated = data && data.length > 0 ? data[0] : null;
      
      const local = localStorage.getItem('ah_users');
      let list = local ? JSON.parse(local) : [];
      list = list.map(item => item.id === id ? { ...item, ...updatesToApply, ...updated } : item);
      localStorage.setItem('ah_users', JSON.stringify(list));
      return updated || { id, ...updatesToApply };
    } catch (err) {
      console.warn('Error updating user in Supabase, saving locally:', err);
      const local = localStorage.getItem('ah_users');
      let list = local ? JSON.parse(local) : [];
      list = list.map(item => item.id === id ? { ...item, ...updatesToApply } : item);
      localStorage.setItem('ah_users', JSON.stringify(list));
      
      store.queueSync('users', 'update', { id, ...updatesToApply });
      return { id, ...updatesToApply };
    }
  },
  deleteUser: async (id) => {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error deleting user in Supabase, queueing operation:', err);
      store.queueSync('users', 'delete', { id });
    }
    const local = localStorage.getItem('ah_users');
    if (local) {
      let list = JSON.parse(local);
      list = list.filter(item => item.id !== id);
      localStorage.setItem('ah_users', JSON.stringify(list));
    }
  },

  getCourses: async () => {
    try {
      const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      localStorage.setItem('ah_courses', JSON.stringify(data || []));
      return data || [];
    } catch (err) {
      console.warn('Error getting courses, falling back to local:', err);
      const local = localStorage.getItem('ah_courses');
      return local ? JSON.parse(local) : [];
    }
  },
  getCourseById: async (id) => {
    try {
      const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (err) {
      const courses = await store.getCourses();
      return courses.find(c => c.id === id) || null;
    }
  },
  addCourse: async (course) => {
    const newCourse = {
      id: course.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
      created_at: new Date().toISOString(),
      ...course
    };
    try {
      const { data, error } = await supabase.from('courses').insert([newCourse]).select();
      if (error) throw error;
      const saved = data && data.length > 0 ? data[0] : newCourse;
      
      const local = localStorage.getItem('ah_courses');
      const list = local ? JSON.parse(local) : [];
      list.unshift(saved);
      localStorage.setItem('ah_courses', JSON.stringify(list));
      return saved;
    } catch (err) {
      console.warn('Error adding course to Supabase, saving locally:', err);
      const local = localStorage.getItem('ah_courses');
      const list = local ? JSON.parse(local) : [];
      list.unshift(newCourse);
      localStorage.setItem('ah_courses', JSON.stringify(list));
      
      store.queueSync('courses', 'insert', newCourse);
      return newCourse;
    }
  },
  updateCourse: async (id, updates) => {
    try {
      const { data, error } = await supabase.from('courses').update(updates).eq('id', id).select();
      if (error) throw error;
      const updated = data && data.length > 0 ? data[0] : null;
      
      const local = localStorage.getItem('ah_courses');
      let list = local ? JSON.parse(local) : [];
      list = list.map(item => item.id === id ? { ...item, ...updates, ...updated } : item);
      localStorage.setItem('ah_courses', JSON.stringify(list));
      return updated || { id, ...updates };
    } catch (err) {
      console.warn('Error updating course in Supabase, saving locally:', err);
      const local = localStorage.getItem('ah_courses');
      let list = local ? JSON.parse(local) : [];
      list = list.map(item => item.id === id ? { ...item, ...updates } : item);
      localStorage.setItem('ah_courses', JSON.stringify(list));
      
      store.queueSync('courses', 'update', { id, ...updates });
      return { id, ...updates };
    }
  },
  deleteCourse: async (id) => {
    try {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error deleting course in Supabase, queueing operation:', err);
      store.queueSync('courses', 'delete', { id });
    }
    const local = localStorage.getItem('ah_courses');
    if (local) {
      let list = JSON.parse(local);
      list = list.filter(item => item.id !== id);
      localStorage.setItem('ah_courses', JSON.stringify(list));
    }
  },

  // Categories
  getCategories: async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('nombre');
      if (error) throw error;
      localStorage.setItem('ah_categories', JSON.stringify(data || []));
      return data || [];
    } catch (err) {
      console.warn('Error getting categories, falling back to local:', err);
      const local = localStorage.getItem('ah_categories');
      return local ? JSON.parse(local) : [
        { id: 'cat-1', nombre: 'Tecnología', color: '#0066FF' },
        { id: 'cat-2', nombre: 'Ciencias', color: '#10b981' },
        { id: 'cat-3', nombre: 'Humanidades', color: '#f59e0b' },
        { id: 'cat-4', nombre: 'Idiomas', color: '#ec4899' },
        { id: 'cat-5', nombre: 'Negocios', color: '#06b6d4' },
        { id: 'cat-6', nombre: 'Arte y Diseño', color: '#f43f5e' }
      ];
    }
  },
  addCategory: async (cat) => {
    const newCat = {
      id: cat.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
      ...cat
    };
    try {
      const { data, error } = await supabase.from('categories').insert([newCat]).select();
      if (error) throw error;
      const saved = data && data.length > 0 ? data[0] : newCat;
      
      const local = localStorage.getItem('ah_categories');
      const list = local ? JSON.parse(local) : [];
      list.push(saved);
      localStorage.setItem('ah_categories', JSON.stringify(list));
      return saved;
    } catch (err) {
      console.warn('Error adding category, saving locally:', err);
      const local = localStorage.getItem('ah_categories');
      const list = local ? JSON.parse(local) : [];
      list.push(newCat);
      localStorage.setItem('ah_categories', JSON.stringify(list));
      
      store.queueSync('categories', 'insert', newCat);
      return newCat;
    }
  },

  // File uploads (Flyers)
  uploadFlyer: async (file, courseId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${courseId}-${Date.now()}.${fileExt}`;
    const filePath = `flyers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('Error uploading flyer:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('course-files')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  deleteFlyer: async (flyerUrl) => {
    if (!flyerUrl) return;
    try {
      const path = flyerUrl.split('/course-files/')[1];
      if (path) {
        await supabase.storage.from('course-files').remove([path]);
      }
    } catch (err) {
      console.error('Error deleting flyer:', err);
    }
  },

  // Enrollments
  getEnrollments: async () => {
    try {
      const { data, error } = await supabase.from('enrollments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const local = JSON.parse(localStorage.getItem('ah_enrollments') || '[]');
      const supIds = new Set(data.map(d => d.id));
      const merged = data.map(sup => {
        const localEnr = local.find(l => l.id === sup.id);
        return localEnr ? { ...sup, ...localEnr } : sup;
      });
      const localOnly = local.filter(l => !supIds.has(l.id));
      const result = [...localOnly, ...merged];
      localStorage.setItem('ah_enrollments', JSON.stringify(result));
      return result;
    } catch (err) {
      console.warn('Falla en obtener matrículas de Supabase, usando LocalStorage:', err);
      const local = localStorage.getItem('ah_enrollments');
      return local ? JSON.parse(local) : [];
    }
  },
  addEnrollment: async (enrollment) => {
    const newEnrollment = {
      id: enrollment.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
      created_at: new Date().toISOString(),
      ...enrollment
    };
    try {
      const { data, error } = await supabase.from('enrollments').insert([newEnrollment]).select();
      if (error) throw error;
      const saved = data && data.length > 0 ? data[0] : newEnrollment;
      const local = localStorage.getItem('ah_enrollments');
      const list = local ? JSON.parse(local) : [];
      list.unshift(saved);
      localStorage.setItem('ah_enrollments', JSON.stringify(list));
      return saved;
    } catch (err) {
      console.warn('Falla al guardar matrícula en Supabase, guardando en LocalStorage:', err);
      const local = localStorage.getItem('ah_enrollments');
      const list = local ? JSON.parse(local) : [];
      list.unshift(newEnrollment);
      localStorage.setItem('ah_enrollments', JSON.stringify(list));
      
      store.queueSync('enrollments', 'insert', newEnrollment);
      return newEnrollment;
    }
  },
  updateEnrollment: async (id, updates) => {
    try {
      const { data, error } = await supabase.from('enrollments').update(updates).eq('id', id).select();
      if (error) throw error;
      const updated = data && data.length > 0 ? data[0] : null;
      const local = localStorage.getItem('ah_enrollments');
      let list = local ? JSON.parse(local) : [];
      list = list.map(item => item.id === id ? { ...item, ...updates, ...updated } : item);
      localStorage.setItem('ah_enrollments', JSON.stringify(list));
      return updated || { id, ...updates };
    } catch (err) {
      console.warn('Falla al actualizar matrícula en Supabase, actualizando en LocalStorage:', err);
      const local = localStorage.getItem('ah_enrollments');
      let list = local ? JSON.parse(local) : [];
      list = list.map(item => item.id === id ? { ...item, ...updates } : item);
      localStorage.setItem('ah_enrollments', JSON.stringify(list));
      
      store.queueSync('enrollments', 'update', { id, ...updates });
      return { id, ...updates };
    }
  },
  deleteEnrollment: async (id) => {
    try {
      const { error } = await supabase.from('enrollments').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Falla al eliminar matrícula en Supabase, eliminando de LocalStorage:', err);
      store.queueSync('enrollments', 'delete', { id });
    }
    const local = localStorage.getItem('ah_enrollments');
    if (local) {
      let list = JSON.parse(local);
      list = list.filter(item => item.id !== id);
      localStorage.setItem('ah_enrollments', JSON.stringify(list));
    }
  },

  // Expenses (Egresos)
  getExpenses: async () => {
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('fecha', { ascending: false });
      if (error) throw error;
      localStorage.setItem('ah_expenses', JSON.stringify(data || []));
      return data || [];
    } catch (err) {
      console.warn('Error getting expenses from Supabase, falling back to local:', err);
      const local = localStorage.getItem('ah_expenses');
      return local ? JSON.parse(local) : [];
    }
  },
  addExpense: async (expense) => {
    const newExpense = {
      id: expense.id || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36)),
      created_at: new Date().toISOString(),
      ...expense
    };
    try {
      const { data, error } = await supabase.from('expenses').insert([newExpense]).select();
      if (error) throw error;
      const saved = data && data.length > 0 ? data[0] : newExpense;
      const local = localStorage.getItem('ah_expenses');
      const list = local ? JSON.parse(local) : [];
      list.unshift(saved);
      localStorage.setItem('ah_expenses', JSON.stringify(list));
      return saved;
    } catch (err) {
      console.warn('Error adding expense to Supabase, falling back to local:', err);
      const local = localStorage.getItem('ah_expenses');
      const list = local ? JSON.parse(local) : [];
      list.unshift(newExpense);
      localStorage.setItem('ah_expenses', JSON.stringify(list));
      
      store.queueSync('expenses', 'insert', newExpense);
      return newExpense;
    }
  },
  updateExpense: async (id, updates) => {
    try {
      const { data, error } = await supabase.from('expenses').update(updates).eq('id', id).select();
      if (error) throw error;
      const updated = data && data.length > 0 ? data[0] : null;
      const local = localStorage.getItem('ah_expenses');
      let list = local ? JSON.parse(local) : [];
      list = list.map(item => item.id === id ? { ...item, ...updates, ...updated } : item);
      localStorage.setItem('ah_expenses', JSON.stringify(list));
      return updated || { id, ...updates };
    } catch (err) {
      console.warn('Error updating expense in Supabase, falling back to local:', err);
      const local = localStorage.getItem('ah_expenses');
      let list = local ? JSON.parse(local) : [];
      list = list.map(item => item.id === id ? { ...item, ...updates } : item);
      localStorage.setItem('ah_expenses', JSON.stringify(list));
      
      store.queueSync('expenses', 'update', { id, ...updates });
      return { id, ...updates };
    }
  },
  deleteExpense: async (id) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Error deleting expense in Supabase, falling back to local:', err);
      store.queueSync('expenses', 'delete', { id });
    }
    const local = localStorage.getItem('ah_expenses');
    if (local) {
      let list = JSON.parse(local);
      list = list.filter(item => item.id !== id);
      localStorage.setItem('ah_expenses', JSON.stringify(list));
    }
  },
};

export async function initializeStore() {
  try {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (count === 0) {
      const adminPass = await store.hashPassword('admin123');
      await supabase.from('users').insert([
        { nombre: 'Administrador', email: 'admin@academichub.com', password: adminPass, role: 'admin', especialidad: 'Gestión Académica', activo: true },
        { nombre: 'Jefferson', email: 'jefferson_15_6@hotmail.com', password: adminPass, role: 'admin', activo: true },
      ]);
    }

    const { count: catCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    if (catCount === 0) {
      await supabase.from('categories').insert([
        { nombre: 'Tecnología', color: '#0066FF' },
        { nombre: 'Ciencias', color: '#10b981' },
        { nombre: 'Humanidades', color: '#f59e0b' },
        { nombre: 'Idiomas', color: '#ec4899' },
        { nombre: 'Negocios', color: '#06b6d4' },
        { nombre: 'Arte y Diseño', color: '#f43f5e' },
      ]);
    }
  } catch (error) {
    console.error('Error initializing store:', error);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    store.syncPending();
  });
  // Auto-run sync on load after a brief delay
  setTimeout(() => {
    store.syncPending();
  }, 1000);
}
