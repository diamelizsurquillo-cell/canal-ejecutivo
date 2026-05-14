import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { detectConflicts, DAY_ORDER } from '../lib/conflicts';
import { Save, ArrowLeft, AlertTriangle, Video } from 'lucide-react';

const DAYS = [
  { key: 'lunes', label: 'Lunes' }, { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' }, { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' }, { key: 'sabado', label: 'Sábado' },
];

const EMPTY = {
  nombre: '', descripcion: '', docente_id: '', categoria_id: '', dias: [],
  hora_inicio: '09:00', hora_fin: '11:00', fecha_inicio: '', fecha_fin: '',
  dirigido_a: '', estado: 'borrador', meet_link: '',
};

export default function CourseForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { courses, addCourse, updateCourse, getDocentes, categories } = useData();
  const { user, isAdmin } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [conflicts, setConflicts] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const course = courses.find(c => c.id === id);
      if (course) setForm({ ...course });
      else navigate('/cursos');
    }
  }, [id, courses]);

  const docentes = getDocentes();

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      dias: prev.dias.includes(day) ? prev.dias.filter(d => d !== day) : [...prev.dias, day]
    }));
  };

  const validate = () => {
    const err = {};
    if (!form.nombre.trim()) err.nombre = 'El nombre es obligatorio';
    if (!form.docente_id) err.docente_id = 'Selecciona un docente';
    if (form.dias.length === 0) err.dias = 'Selecciona al menos un día';
    if (!form.hora_inicio || !form.hora_fin) err.hora_inicio = 'Define el horario';
    if (form.hora_inicio >= form.hora_fin) err.hora_fin = 'La hora fin debe ser posterior a la hora inicio';
    if (!form.fecha_inicio) err.fecha_inicio = 'Define fecha de inicio';
    if (!form.fecha_fin) err.fecha_fin = 'Define fecha de fin';
    if (form.fecha_inicio && form.fecha_fin && form.fecha_inicio > form.fecha_fin) err.fecha_fin = 'La fecha fin debe ser posterior';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const checkConflicts = () => {
    const found = detectConflicts(form, courses);
    setConflicts(found);
    return found.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!checkConflicts()) return;

    setSaving(true);
    if (isEdit) {
      await updateCourse(id, form);
    } else {
      await addCourse({ ...form, created_by: user.id });
    }
    navigate('/cursos');
  };

  const forceSubmit = async () => {
    setSaving(true);
    if (isEdit) await updateCourse(id, form);
    else await addCourse({ ...form, created_by: user.id });
    navigate('/cursos');
  };

  return (
    <div className="course-form-page">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate('/cursos')}><ArrowLeft size={18} /> Volver</button>
        <h1>{isEdit ? 'Editar Curso' : 'Nuevo Curso'}</h1>
      </div>

      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="alert alert-warning">
          <AlertTriangle size={20} />
          <div>
            <strong>Se detectaron conflictos de horario:</strong>
            <ul>{conflicts.map((c, i) => <li key={i}>{c.message}</li>)}</ul>
            <button className="btn btn-sm btn-warning" onClick={forceSubmit} style={{ marginTop: 8 }}>Guardar de todos modos</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-grid">
          {/* Nombre */}
          <div className="form-group form-col-2">
            <label htmlFor="course-name">Nombre del curso *</label>
            <input id="course-name" type="text" value={form.nombre} onChange={e => handleChange('nombre', e.target.value)}
              placeholder="Ej: Desarrollo Web Full Stack" className={errors.nombre ? 'error' : ''} />
            {errors.nombre && <span className="form-error">{errors.nombre}</span>}
          </div>

          {/* Docente */}
          <div className="form-group">
            <label htmlFor="course-docente">Docente *</label>
            <select id="course-docente" value={form.docente_id} onChange={e => handleChange('docente_id', e.target.value)} className={errors.docente_id ? 'error' : ''}>
              <option value="">Seleccionar docente</option>
              {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre} - {d.especialidad}</option>)}
            </select>
            {errors.docente_id && <span className="form-error">{errors.docente_id}</span>}
          </div>

          {/* Categoría */}
          <div className="form-group">
            <label htmlFor="course-cat">Categoría</label>
            <select id="course-cat" value={form.categoria_id} onChange={e => handleChange('categoria_id', e.target.value)}>
              <option value="">Seleccionar categoría</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {/* Días */}
          <div className="form-group form-col-2">
            <label>Días de clase * {errors.dias && <span className="form-error">{errors.dias}</span>}</label>
            <div className="day-selector">
              {DAYS.map(d => (
                <button key={d.key} type="button"
                  className={`day-btn ${form.dias.includes(d.key) ? 'active' : ''}`}
                  onClick={() => toggleDay(d.key)}>{d.label}</button>
              ))}
            </div>
          </div>

          {/* Horario */}
          <div className="form-group">
            <label htmlFor="course-start-time">Hora inicio *</label>
            <input id="course-start-time" type="time" value={form.hora_inicio} onChange={e => handleChange('hora_inicio', e.target.value)} className={errors.hora_inicio ? 'error' : ''} />
            {errors.hora_inicio && <span className="form-error">{errors.hora_inicio}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="course-end-time">Hora fin *</label>
            <input id="course-end-time" type="time" value={form.hora_fin} onChange={e => handleChange('hora_fin', e.target.value)} className={errors.hora_fin ? 'error' : ''} />
            {errors.hora_fin && <span className="form-error">{errors.hora_fin}</span>}
          </div>

          {/* Fechas */}
          <div className="form-group">
            <label htmlFor="course-start-date">Fecha inicio *</label>
            <input id="course-start-date" type="date" value={form.fecha_inicio} onChange={e => handleChange('fecha_inicio', e.target.value)} className={errors.fecha_inicio ? 'error' : ''} />
            {errors.fecha_inicio && <span className="form-error">{errors.fecha_inicio}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="course-end-date">Fecha fin *</label>
            <input id="course-end-date" type="date" value={form.fecha_fin} onChange={e => handleChange('fecha_fin', e.target.value)} className={errors.fecha_fin ? 'error' : ''} />
            {errors.fecha_fin && <span className="form-error">{errors.fecha_fin}</span>}
          </div>

          {/* Dirigido a */}
          <div className="form-group form-col-2">
            <label htmlFor="course-target">Dirigido a</label>
            <input id="course-target" type="text" value={form.dirigido_a} onChange={e => handleChange('dirigido_a', e.target.value)}
              placeholder="Ej: Estudiantes de Ingeniería, Público general" />
          </div>

          {/* Meet link */}
          <div className="form-group form-col-2">
            <label htmlFor="course-meet"><Video size={16} style={{ verticalAlign: 'middle' }} /> Enlace Google Meet</label>
            <input id="course-meet" type="url" value={form.meet_link} onChange={e => handleChange('meet_link', e.target.value)}
              placeholder={isAdmin ? "https://meet.google.com/xxx-yyyy-zzz" : "Solo el administrador puede asignar el enlace"} disabled={!isAdmin} />
          </div>

          {/* Estado */}
          <div className="form-group">
            <label htmlFor="course-status">Estado</label>
            <select id="course-status" value={form.estado} onChange={e => handleChange('estado', e.target.value)}>
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
              <option value="en_curso">En Curso</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          {/* Descripción */}
          <div className="form-group form-col-2">
            <label htmlFor="course-desc">Descripción</label>
            <textarea id="course-desc" rows={4} value={form.descripcion} onChange={e => handleChange('descripcion', e.target.value)}
              placeholder="Breve descripción del contenido del curso..." />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/cursos')}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Guardando...' : isEdit ? 'Actualizar Curso' : 'Crear Curso'}
          </button>
        </div>
      </form>
    </div>
  );
}
