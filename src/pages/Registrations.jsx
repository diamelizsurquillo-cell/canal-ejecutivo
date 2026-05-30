import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Mail, CreditCard, User, GraduationCap, Coins } from 'lucide-react';
import Modal from '../components/Modal';

export default function Registrations() {
  const { enrollments, courses, addEnrollment, updateEnrollment, deleteEnrollment } = useData();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    correo: '',
    monto: '',
    curso_id: ''
  });
  
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Reset form state
  const resetForm = () => {
    setForm({ nombres: '', apellidos: '', dni: '', correo: '', monto: '', curso_id: '' });
    setEditId(null);
    setErrors({});
    setShowForm(false);
  };

  // Populate form for editing
  const handleEdit = (reg) => {
    setForm({
      nombres: reg.nombres,
      apellidos: reg.apellidos,
      dni: reg.dni,
      correo: reg.correo,
      monto: reg.monto,
      curso_id: reg.curso_id || ''
    });
    setEditId(reg.id);
    setShowForm(true);
  };

  // Form validation
  const validate = () => {
    const err = {};
    if (!form.nombres.trim()) err.nombres = 'Los nombres completos son obligatorios';
    if (!form.apellidos.trim()) err.apellidos = 'Los apellidos completos son obligatorios';
    
    // DNI: usually 8 digits in Peru
    if (!form.dni.trim()) {
      err.dni = 'El DNI es obligatorio';
    } else if (!/^\d+$/.test(form.dni)) {
      err.dni = 'El DNI debe contener solo números';
    } else if (form.dni.length !== 8 && form.dni.length !== 9 && form.dni.length !== 12) {
      // 8 for DNI, 9/12 for foreign IDs (Carnet de Extranjería / Pasaporte)
      err.dni = 'El DNI debe tener 8 dígitos (u otro ID válido)';
    }

    if (!form.correo.trim()) {
      err.correo = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.correo)) {
      err.correo = 'Formato de correo no válido';
    }

    if (form.monto === '' || form.monto === undefined) {
      err.monto = 'El monto es obligatorio';
    } else if (parseFloat(form.monto) < 0) {
      err.monto = 'El monto no puede ser negativo';
    }

    if (!form.curso_id) {
      err.curso_id = 'Debes seleccionar un curso';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      dni: form.dni.trim(),
      correo: form.correo.trim().toLowerCase(),
      monto: parseFloat(form.monto),
      curso_id: form.curso_id
    };

    if (editId) {
      await updateEnrollment(editId, data);
    } else {
      await addEnrollment(data);
    }
    resetForm();
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteEnrollment(deleteTarget);
      setDeleteTarget(null);
    }
  };

  // Filtering logic
  let filtered = enrollments || [];
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r => 
      r.nombres?.toLowerCase().includes(q) ||
      r.apellidos?.toLowerCase().includes(q) ||
      r.dni?.includes(q) ||
      r.correo?.toLowerCase().includes(q)
    );
  }
  if (filterCourse) {
    filtered = filtered.filter(r => r.curso_id === filterCourse);
  }

  // Helper to find course by ID
  const getCourseName = (id) => {
    const course = courses.find(c => c.id === id);
    return course ? course.nombre : 'Curso no encontrado';
  };

  // KPIs
  const totalStudents = enrollments.length;
  const activeCoursesCount = courses.filter(c => c.estado === 'publicado' || c.estado === 'en_curso').length;
  const totalRevenue = enrollments.reduce((sum, r) => sum + (parseFloat(r.monto) || 0), 0);

  return (
    <div className="registrations-page">
      <div className="page-header">
        <div>
          <h1>Registros de Matrícula</h1>
          <p>Gestiona y visualiza a los alumnos matriculados en los cursos ejecutivos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={18} /> Matricular Alumno
        </button>
      </div>

      {/* Stats Summary cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
            <User size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalStudents}</span>
            <span className="stat-label">Total Matriculados</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
            <GraduationCap size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{activeCoursesCount}</span>
            <span className="stat-label">Cursos Activos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">S/ {totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="stat-label">Total Recaudado</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar alumno por nombre, DNI, correo..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="filter-group">
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
            <option value="">Todos los cursos</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Enrollments Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardIcon />
          <h3>No hay alumnos matriculados</h3>
          <p>Registra un nuevo alumno o ajusta los criterios de búsqueda.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>DNI</th>
                  <th>Correo</th>
                  <th>Curso</th>
                  <th>Monto Pagado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(reg => (
                  <tr key={reg.id}>
                    <td>
                      <div className="student-name-cell">
                        <strong>{reg.nombres}</strong>
                        <span className="sub">{reg.apellidos}</span>
                      </div>
                    </td>
                    <td><code>{reg.dni}</code></td>
                    <td>
                      <span className="teacher-email">
                        <Mail size={14} style={{ flexShrink: 0 }} /> {reg.correo}
                      </span>
                    </td>
                    <td>
                      <span className="course-category-tag" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                        {getCourseName(reg.curso_id)}
                      </span>
                    </td>
                    <td>
                      <span className="monto-cell">
                        S/ {parseFloat(reg.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(reg)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        {isAdmin && (
                          <button className="btn btn-sm btn-danger-ghost" onClick={() => setDeleteTarget(reg.id)} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación" size="sm">
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: 12 }} />
          <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
            ¿Estás seguro de que deseas eliminar este registro de matrícula? Esta acción no se puede deshacer.
          </p>
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={confirmDelete}>Sí, eliminar</button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Modal */}
      <Modal isOpen={showForm} onClose={resetForm} title={editId ? 'Editar Matrícula' : 'Matricular Nuevo Alumno'}>
        <form onSubmit={handleSubmit} className="modal-form">
          
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label htmlFor="reg-nombres"><User size={14} /> Nombres *</label>
              <input 
                id="reg-nombres" 
                type="text" 
                value={form.nombres} 
                onChange={e => setForm({ ...form, nombres: e.target.value })} 
                className={errors.nombres ? 'error' : ''} 
                placeholder="Ej. Juan Carlos"
                required 
              />
              {errors.nombres && <span className="form-error">{errors.nombres}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-apellidos"><User size={14} /> Apellidos *</label>
              <input 
                id="reg-apellidos" 
                type="text" 
                value={form.apellidos} 
                onChange={e => setForm({ ...form, apellidos: e.target.value })} 
                className={errors.apellidos ? 'error' : ''} 
                placeholder="Ej. Perez Gomez"
                required 
              />
              {errors.apellidos && <span className="form-error">{errors.apellidos}</span>}
            </div>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div className="form-group">
              <label htmlFor="reg-dni"><CreditCard size={14} /> DNI *</label>
              <input 
                id="reg-dni" 
                type="text" 
                value={form.dni} 
                onChange={e => setForm({ ...form, dni: e.target.value })} 
                className={errors.dni ? 'error' : ''} 
                placeholder="DNI de 8 dígitos"
                maxLength={12}
                required 
              />
              {errors.dni && <span className="form-error">{errors.dni}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-monto"><Coins size={14} /> Monto pagado (S/) *</label>
              <input 
                id="reg-monto" 
                type="number" 
                step="0.01" 
                value={form.monto} 
                onChange={e => setForm({ ...form, monto: e.target.value })} 
                className={errors.monto ? 'error' : ''} 
                placeholder="Ej. 150.00"
                required 
              />
              {errors.monto && <span className="form-error">{errors.monto}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label htmlFor="reg-correo"><Mail size={14} /> Correo electrónico *</label>
            <input 
              id="reg-correo" 
              type="email" 
              value={form.correo} 
              onChange={e => setForm({ ...form, correo: e.target.value })} 
              className={errors.correo ? 'error' : ''} 
              placeholder="juan.perez@example.com"
              required 
            />
            {errors.correo && <span className="form-error">{errors.correo}</span>}
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label htmlFor="reg-curso"><GraduationCap size={14} /> Seleccionar Curso *</label>
            <select 
              id="reg-curso" 
              value={form.curso_id} 
              onChange={e => setForm({ ...form, curso_id: e.target.value })} 
              className={errors.curso_id ? 'error' : ''}
              required
            >
              <option value="">-- Elige un curso --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.estado})</option>
              ))}
            </select>
            {errors.curso_id && <span className="form-error">{errors.curso_id}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Guardar Cambios' : 'Matricular'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
