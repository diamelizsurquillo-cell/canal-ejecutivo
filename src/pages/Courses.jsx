import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Video, Eye, ChevronDown, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

const STATUS_LABELS = { borrador: 'Borrador', publicado: 'Publicado', en_curso: 'En Curso', finalizado: 'Finalizado', cancelado: 'Cancelado' };
const DAY_SHORT = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb' };

export default function Courses() {
  const { courses, deleteCourse, updateCourse, getDocenteById, getCategoryById, getDocentes, categories } = useData();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDay, setFilterDay] = useState('');
  const [detailCourse, setDetailCourse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Filter logic
  let filtered = courses;
  if (!isAdmin) filtered = filtered.filter(c => c.docente_id === user.id || c.estado === 'publicado' || c.estado === 'en_curso');
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => {
      const docente = getDocenteById(c.docente_id);
      return c.nombre.toLowerCase().includes(q) || docente?.nombre?.toLowerCase().includes(q) || c.dirigido_a?.toLowerCase().includes(q);
    });
  }
  if (filterStatus) filtered = filtered.filter(c => c.estado === filterStatus);
  if (filterCategory) filtered = filtered.filter(c => c.categoria_id === filterCategory);
  if (filterDay) filtered = filtered.filter(c => c.dias?.includes(filterDay));

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteCourse(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await updateCourse(id, { estado: newStatus });
  };

  const canEdit = (course) => isAdmin || course.docente_id === user.id;

  return (
    <div className="courses-page">
      <div className="page-header">
        <h1>Cursos</h1>
        <button className="btn btn-primary" onClick={() => navigate('/cursos/nuevo')}>
          <Plus size={18} /> Nuevo Curso
        </button>
      </div>

      {/* Search & Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Buscar curso, docente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-group">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)}>
            <option value="">Todos los días</option>
            {Object.entries(DAY_SHORT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Course grid */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpenIcon />
          <h3>No se encontraron cursos</h3>
          <p>Intenta ajustar los filtros o crea un nuevo curso</p>
        </div>
      ) : (
        <div className="course-grid">
          {filtered.map(course => {
            const docente = getDocenteById(course.docente_id);
            const cat = getCategoryById(course.categoria_id);
            return (
              <div className="course-card" key={course.id}>
                {course.flyer_url && (
                  <div className="course-card-flyer">
                    <img src={course.flyer_url} alt={`Flyer de ${course.nombre}`} />
                  </div>
                )}
                <div className="course-card-header" style={{ borderTopColor: course.flyer_url ? 'transparent' : (cat?.color || '#6366f1') }}>
                  <div className="course-card-top">
                    <span className="course-category-tag" style={{ background: (cat?.color || '#6366f1') + '20', color: cat?.color || '#6366f1' }}>
                      {cat?.nombre || 'Sin categoría'}
                    </span>
                    <span className={`badge badge-${course.estado}`}>{STATUS_LABELS[course.estado]}</span>
                  </div>
                  <h3>{course.nombre}</h3>
                  <p className="course-docente">{docente?.nombre || 'Sin asignar'}</p>
                </div>
                <div className="course-card-body">
                  <div className="course-detail-row">
                    <span className="label">Horario</span>
                    <span>{course.hora_inicio} - {course.hora_fin}</span>
                  </div>
                  <div className="course-detail-row">
                    <span className="label">Días</span>
                    <span className="days-tags">
                      {course.dias?.map(d => <span key={d} className="day-tag">{DAY_SHORT[d]}</span>)}
                    </span>
                  </div>
                  <div className="course-detail-row">
                    <span className="label">Periodo</span>
                    <span>{course.fecha_inicio} → {course.fecha_fin}</span>
                  </div>
                  {course.dirigido_a && (
                    <div className="course-detail-row">
                      <span className="label">Dirigido a</span>
                      <span>{course.dirigido_a}</span>
                    </div>
                  )}
                </div>
                <div className="course-card-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => setDetailCourse(course)} title="Ver detalles"><Eye size={16} /></button>
                  {course.meet_link && (isAdmin || course.docente_id === user.id) && (
                    <a href={course.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost" title="Google Meet"><Video size={16} /></a>
                  )}
                  {canEdit(course) && (
                    <>
                      <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/cursos/editar/${course.id}`)} title="Editar"><Edit2 size={16} /></button>
                      <div className="status-dropdown">
                        <button className="btn btn-sm btn-ghost" title="Cambiar estado"><ChevronDown size={16} /></button>
                        <div className="status-dropdown-menu">
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <button key={k} onClick={() => handleStatusChange(course.id, k)} className={course.estado === k ? 'active' : ''}>{v}</button>
                          ))}
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger-ghost" onClick={() => setDeleteTarget(course.id)} title="Eliminar"><Trash2 size={16} /></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmar eliminación" size="sm">
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: 12 }} />
          <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.</p>
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={confirmDelete}>Sí, eliminar</button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!detailCourse} onClose={() => setDetailCourse(null)} title={detailCourse?.nombre || 'Detalle del Curso'} size="lg">
        {detailCourse && <CourseDetailContent course={detailCourse} getDocenteById={getDocenteById} getCategoryById={getCategoryById} />}
      </Modal>
    </div>
  );
}

function CourseDetailContent({ course, getDocenteById, getCategoryById }) {
  const docente = getDocenteById(course.docente_id);
  const cat = getCategoryById(course.categoria_id);
  const { isAdmin, user } = useAuth();
  return (
    <div className="course-detail-modal">
      {course.flyer_url && (
        <div className="detail-flyer">
          <img src={course.flyer_url} alt={`Flyer de ${course.nombre}`} />
        </div>
      )}
      <div className="detail-grid">
        <div><span className="label">Categoría</span><span className="course-category-tag" style={{ background: (cat?.color || '#6366f1') + '20', color: cat?.color || '#6366f1' }}>{cat?.nombre}</span></div>
        <div><span className="label">Estado</span><span className={`badge badge-${course.estado}`}>{STATUS_LABELS[course.estado]}</span></div>
        <div><span className="label">Docente</span><span>{docente?.nombre || 'Sin asignar'}</span></div>
        <div><span className="label">Horario</span><span>{course.hora_inicio} - {course.hora_fin}</span></div>
        <div><span className="label">Días</span><span>{course.dias?.join(', ')}</span></div>
        <div><span className="label">Periodo</span><span>{course.fecha_inicio} → {course.fecha_fin}</span></div>
        <div><span className="label">Dirigido a</span><span>{course.dirigido_a || '—'}</span></div>
        <div>
          <span className="label">Meet</span>
          {course.meet_link ? (
            (isAdmin || course.docente_id === user.id) ? (
              <a href={course.meet_link} target="_blank" rel="noopener noreferrer">{course.meet_link}</a>
            ) : (
              <span>Oculto (Solo docente asignado)</span>
            )
          ) : (
            <span>—</span>
          )}
        </div>
      </div>
      {course.descripcion && <div className="detail-desc"><span className="label">Descripción</span><p>{course.descripcion}</p></div>}
    </div>
  );
}

function BookOpenIcon() {
  return <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>;
}
