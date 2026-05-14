import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, UserCheck, UserX, Mail, BookOpen, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

export default function Teachers() {
  const { users, courses, addUser, updateUser, deleteUser, getDocentes } = useData();
  const { isAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', especialidad: '', role: 'docente' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  const docentes = getDocentes();

  const resetForm = () => {
    setForm({ nombre: '', email: '', password: '', especialidad: '', role: 'docente' });
    setEditId(null);
    setShowForm(false);
  };

  const handleEdit = (d) => {
    setForm({ nombre: d.nombre, email: d.email, password: '', especialidad: d.especialidad || '', role: 'docente' });
    setEditId(d.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) return;
    if (editId) {
      const updates = { nombre: form.nombre, email: form.email, especialidad: form.especialidad };
      if (form.password) updates.password = form.password;
      await updateUser(editId, updates);
    } else {
      await addUser(form);
    }
    resetForm();
  };

  const handleDeleteClick = (id) => {
    const hasCourses = courses.some(c => c.docente_id === id);
    if (hasCourses) {
      setDeleteError('No se puede eliminar: el docente tiene cursos asignados. Elimina o reasigna sus cursos primero.');
      setDeleteTarget(null);
      return;
    }
    setDeleteError('');
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteUser(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (d) => {
    await updateUser(d.id, { activo: !d.activo });
  };

  const getCourseCount = (id) => courses.filter(c => c.docente_id === id).length;

  return (
    <div className="teachers-page">
      <div className="page-header">
        <h1>Docentes</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus size={18} /> Nuevo Docente
          </button>
        )}
      </div>

      {/* Error message */}
      {deleteError && (
        <div className="alert alert-error" style={{ cursor: 'pointer' }} onClick={() => setDeleteError('')}>
          <AlertTriangle size={18} /> {deleteError}
        </div>
      )}

      {docentes.length === 0 ? (
        <div className="empty-state">
          <Users2Icon />
          <h3>No hay docentes registrados</h3>
          <p>Agrega docentes para asignarles cursos</p>
        </div>
      ) : (
        <div className="teacher-grid">
          {docentes.map(d => (
            <div className={`teacher-card ${!d.activo ? 'inactive' : ''}`} key={d.id}>
              <div className="teacher-avatar">{d.nombre.charAt(0)}</div>
              <div className="teacher-info">
                <h3>{d.nombre}</h3>
                {d.especialidad && <p className="teacher-specialty">{d.especialidad}</p>}
                <p className="teacher-email"><Mail size={14} /> {d.email}</p>
                <div className="teacher-stats">
                  <span><BookOpen size={14} /> {getCourseCount(d.id)} cursos</span>
                  <span className={`badge ${d.activo ? 'badge-publicado' : 'badge-cancelado'}`}>
                    {d.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <div className="teacher-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(d)} title={d.activo ? 'Desactivar' : 'Activar'}>
                    {d.activo ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(d)} title="Editar"><Edit2 size={16} /></button>
                  <button className="btn btn-sm btn-danger-ghost" onClick={() => handleDeleteClick(d.id)} title="Eliminar"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación" size="sm">
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: 12 }} />
          <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>¿Estás seguro de que deseas eliminar este docente? Esta acción no se puede deshacer.</p>
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={confirmDelete}>Sí, eliminar</button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={showForm} onClose={resetForm} title={editId ? 'Editar Docente' : 'Nuevo Docente'}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="teacher-name">Nombre completo *</label>
            <input id="teacher-name" type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="form-group">
            <label htmlFor="teacher-email">Correo electrónico *</label>
            <input id="teacher-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label htmlFor="teacher-specialty">Especialidad</label>
            <input id="teacher-specialty" type="text" value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} placeholder="Ej: Ingeniería de Software" />
          </div>
          <div className="form-group">
            <label htmlFor="teacher-pass">{editId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <input id="teacher-pass" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editId} />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Actualizar' : 'Crear Docente'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Users2Icon() {
  return <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>;
}
