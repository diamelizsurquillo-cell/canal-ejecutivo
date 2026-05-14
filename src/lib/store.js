import { supabase } from './supabase';

export const store = {
  // Users / Docentes
  getUsers: async () => {
    const { data } = await supabase.from('users').select('*').order('nombre');
    return data || [];
  },
  getDocentes: async () => {
    const { data } = await supabase.from('users').select('*').eq('role', 'docente').order('nombre');
    return data || [];
  },
  getUserById: async (id) => {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    return data;
  },
  authenticate: async (email, password) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .eq('activo', true)
      .single();
    return data || null;
  },
  addUser: async (user) => {
    const { data, error } = await supabase.from('users').insert([user]).select().single();
    if (error) console.error('Error adding user:', error);
    return data;
  },
  updateUser: async (id, updates) => {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) console.error('Error updating user:', error);
    return data;
  },
  deleteUser: async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) console.error('Error deleting user:', error);
  },

  // Courses
  getCourses: async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    return data || [];
  },
  getCourseById: async (id) => {
    const { data } = await supabase.from('courses').select('*').eq('id', id).single();
    return data;
  },
  addCourse: async (course) => {
    const { data, error } = await supabase.from('courses').insert([course]).select().single();
    if (error) console.error('Error adding course:', error);
    return data;
  },
  updateCourse: async (id, updates) => {
    const { data, error } = await supabase.from('courses').update(updates).eq('id', id).select().single();
    if (error) console.error('Error updating course:', error);
    return data;
  },
  deleteCourse: async (id) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) console.error('Error deleting course:', error);
  },

  // Categories
  getCategories: async () => {
    const { data } = await supabase.from('categories').select('*').order('nombre');
    return data || [];
  },
  addCategory: async (cat) => {
    const { data, error } = await supabase.from('categories').insert([cat]).select().single();
    if (error) console.error('Error adding category:', error);
    return data;
  },
};

export async function initializeStore() {
  try {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
    if (count === 0) {
      await supabase.from('users').insert([
        { nombre: 'Administrador', email: 'admin@academichub.com', password: 'admin123', role: 'admin', especialidad: 'Gestión Académica', activo: true },
        { nombre: 'Jefferson', email: 'jefferson_15_6@hotmail.com', password: 'admin123', role: 'admin', activo: true },
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
