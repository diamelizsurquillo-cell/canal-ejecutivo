import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  LayoutDashboard, BookOpen, Calendar, Users, LogOut,
  Menu, X, Sun, Moon, GraduationCap, User
} from 'lucide-react';
import Modal from './Modal';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cursos', icon: BookOpen, label: 'Cursos' },
  { to: '/calendario', icon: Calendar, label: 'Calendario' },
  { to: '/docentes', icon: Users, label: 'Docentes' },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin, updateSession } = useAuth();
  const { updateUser } = useData();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('ah_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('ah_theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <GraduationCap size={28} />
          <span>CANAL EJECUTIVO</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{user?.nombre?.charAt(0)}</div>
            <div className="user-info">
              <span className="user-name">{user?.nombre}</span>
              <span className="user-role">{isAdmin ? 'Administrador' : 'Docente'}</span>
            </div>
          </div>
          <button className="nav-link" onClick={() => setShowProfileModal(true)}>
            <User size={20} /><span>Mi Perfil</span>
          </button>
          <button className="nav-link logout-btn" onClick={handleLogout}>
            <LogOut size={20} /><span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="topbar-right">
            <button className="theme-toggle" onClick={() => setDark(!dark)} title="Cambiar tema">
              {dark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Profile Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Mi Perfil" size="sm">
        <ProfileForm user={user} updateUser={updateUser} updateSession={updateSession} onClose={() => setShowProfileModal(false)} />
      </Modal>
    </div>
  );
}

function ProfileForm({ user, updateUser, updateSession, onClose }) {
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email.trim()) {
      setError('El correo es obligatorio');
      return;
    }

    const updates = { email };
    if (password) updates.password = password;

    const result = updateUser(user.id, updates);
    if (result) {
      updateSession(updates);
      setSuccess('Perfil actualizado con éxito');
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError('Error al actualizar el perfil');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)' }}>{success}</div>}
      
      <div className="form-group">
        <label htmlFor="prof-email">Correo electrónico</label>
        <input id="prof-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      
      <div className="form-group">
        <label htmlFor="prof-pass">Nueva contraseña (dejar vacío para no cambiar)</label>
        <input id="prof-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      
      <div className="form-actions" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar Cambios</button>
      </div>
    </form>
  );
}
