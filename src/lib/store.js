// localStorage data service with seed data

const KEYS = {
  users: 'ah_users',
  courses: 'ah_courses',
  categories: 'ah_categories',
  initialized: 'ah_initialized'
};

function get(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function set(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

// ── Seed Data ──
const SEED_CATEGORIES = [
  { id: uid(), nombre: 'Tecnología', color: '#6366f1' },
  { id: uid(), nombre: 'Ciencias', color: '#10b981' },
  { id: uid(), nombre: 'Humanidades', color: '#f59e0b' },
  { id: uid(), nombre: 'Idiomas', color: '#ec4899' },
  { id: uid(), nombre: 'Negocios', color: '#06b6d4' },
  { id: uid(), nombre: 'Arte y Diseño', color: '#f43f5e' },
];

const SEED_USERS = [
  { id: uid(), nombre: 'Administrador', email: 'admin@academichub.com', password: 'admin123', role: 'admin', especialidad: 'Gestión Académica', activo: true, created_at: now() },
  { id: uid(), nombre: 'María García', email: 'maria@academichub.com', password: 'docente123', role: 'docente', especialidad: 'Ingeniería de Software', activo: true, created_at: now() },
  { id: uid(), nombre: 'Carlos López', email: 'carlos@academichub.com', password: 'docente123', role: 'docente', especialidad: 'Matemáticas', activo: true, created_at: now() },
  { id: uid(), nombre: 'Ana Martínez', email: 'ana@academichub.com', password: 'docente123', role: 'docente', especialidad: 'Diseño Gráfico', activo: true, created_at: now() },
];

export function initializeStore() {
  if (!localStorage.getItem(KEYS.initialized)) {
    set(KEYS.users, SEED_USERS);
    set(KEYS.categories, SEED_CATEGORIES);
    const cats = SEED_CATEGORIES;
    const users = SEED_USERS;
    set(KEYS.courses, [
      { id: uid(), nombre: 'Desarrollo Web Full Stack', descripcion: 'Aprende HTML, CSS, JS, React y Node.js', docente_id: users[1].id, categoria_id: cats[0].id, dias: ['lunes', 'miercoles', 'viernes'], hora_inicio: '09:00', hora_fin: '11:00', fecha_inicio: '2026-05-01', fecha_fin: '2026-07-30', dirigido_a: 'Estudiantes de Ingeniería', estado: 'publicado', meet_link: 'https://meet.google.com/abc-defg-hij', created_by: users[0].id, created_at: now(), updated_at: now() },
      { id: uid(), nombre: 'Cálculo Avanzado', descripcion: 'Integrales, series y ecuaciones diferenciales', docente_id: users[2].id, categoria_id: cats[1].id, dias: ['martes', 'jueves'], hora_inicio: '14:00', hora_fin: '16:00', fecha_inicio: '2026-05-01', fecha_fin: '2026-08-15', dirigido_a: 'Ciencias e Ingeniería', estado: 'publicado', meet_link: 'https://meet.google.com/xyz-uvwx-rst', created_by: users[0].id, created_at: now(), updated_at: now() },
      { id: uid(), nombre: 'Diseño UI/UX', descripcion: 'Principios de diseño, Figma y prototipado', docente_id: users[3].id, categoria_id: cats[5].id, dias: ['lunes', 'jueves'], hora_inicio: '16:00', hora_fin: '18:00', fecha_inicio: '2026-06-01', fecha_fin: '2026-08-30', dirigido_a: 'Diseñadores y Desarrolladores', estado: 'borrador', meet_link: '', created_by: users[0].id, created_at: now(), updated_at: now() },
    ]);
    localStorage.setItem(KEYS.initialized, 'true');
  }

  // Ensure Jefferson is admin
  const users = get(KEYS.users);
  const jeff = users.find(u => u.email === 'jefferson_15_6@hotmail.com');
  if (jeff) {
    if (jeff.role !== 'admin') {
      jeff.role = 'admin';
      set(KEYS.users, users);
    }
  } else {
    users.push({
      id: uid(),
      nombre: 'Jefferson',
      email: 'jefferson_15_6@hotmail.com',
      password: 'admin123',
      role: 'admin',
      activo: true,
      created_at: now()
    });
    set(KEYS.users, users);
  }
}

// ── CRUD Operations ──
export const store = {
  // Users / Docentes
  getUsers: () => get(KEYS.users),
  getDocentes: () => get(KEYS.users).filter(u => u.role === 'docente'),
  getUserById: (id) => get(KEYS.users).find(u => u.id === id),
  authenticate: (email, password) => {
    const users = get(KEYS.users);
    return users.find(u => u.email === email && u.password === password && u.activo) || null;
  },
  addUser: (user) => {
    const users = get(KEYS.users);
    const newUser = { id: uid(), ...user, activo: true, created_at: now() };
    users.push(newUser);
    set(KEYS.users, users);
    return newUser;
  },
  updateUser: (id, updates) => {
    const users = get(KEYS.users);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    set(KEYS.users, users);
    return users[idx];
  },
  deleteUser: (id) => {
    set(KEYS.users, get(KEYS.users).filter(u => u.id !== id));
  },

  // Courses
  getCourses: () => get(KEYS.courses),
  getCourseById: (id) => get(KEYS.courses).find(c => c.id === id),
  addCourse: (course) => {
    const courses = get(KEYS.courses);
    const newCourse = { id: uid(), ...course, created_at: now(), updated_at: now() };
    courses.push(newCourse);
    set(KEYS.courses, courses);
    return newCourse;
  },
  updateCourse: (id, updates) => {
    const courses = get(KEYS.courses);
    const idx = courses.findIndex(c => c.id === id);
    if (idx === -1) return null;
    courses[idx] = { ...courses[idx], ...updates, updated_at: now() };
    set(KEYS.courses, courses);
    return courses[idx];
  },
  deleteCourse: (id) => {
    set(KEYS.courses, get(KEYS.courses).filter(c => c.id !== id));
  },

  // Categories
  getCategories: () => get(KEYS.categories),
  addCategory: (cat) => {
    const cats = get(KEYS.categories);
    const newCat = { id: uid(), ...cat };
    cats.push(newCat);
    set(KEYS.categories, cats);
    return newCat;
  },
};
