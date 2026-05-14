import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, CheckCircle, Clock, TrendingUp, Video } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STATUS_LABELS = { borrador: 'Borrador', publicado: 'Publicado', en_curso: 'En Curso', finalizado: 'Finalizado', cancelado: 'Cancelado' };
const STATUS_COLORS = { borrador: '#94a3b8', publicado: '#6366f1', en_curso: '#10b981', finalizado: '#06b6d4', cancelado: '#f43f5e' };

export default function Dashboard() {
  const { courses, getDocentes, getDocenteById, getCategoryById } = useData();
  const { user, isAdmin } = useAuth();

  const docentes = getDocentes();
  const activeCourses = courses.filter(c => c.estado === 'publicado' || c.estado === 'en_curso');
  const myCourses = isAdmin ? courses : courses.filter(c => c.docente_id === user.id);

  // Stats
  const stats = [
    { label: 'Total Cursos', value: courses.length, icon: BookOpen, color: '#6366f1' },
    { label: 'Cursos Activos', value: activeCourses.length, icon: CheckCircle, color: '#10b981' },
    { label: 'Docentes', value: docentes.length, icon: Users, color: '#f59e0b' },
    { label: 'Mis Cursos', value: myCourses.length, icon: TrendingUp, color: '#06b6d4' },
  ];

  // Chart: courses per status
  const statusData = Object.keys(STATUS_LABELS).map(key => ({
    name: STATUS_LABELS[key],
    value: courses.filter(c => c.estado === key).length,
    color: STATUS_COLORS[key],
  })).filter(d => d.value > 0);

  // Chart: courses per day
  const dayLabels = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb' };
  const dayData = Object.keys(dayLabels).map(day => ({
    name: dayLabels[day],
    cursos: activeCourses.filter(c => c.dias?.includes(day)).length,
  }));

  // Upcoming courses (active, sorted by date)
  const upcoming = [...activeCourses]
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))
    .slice(0, 5);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Bienvenido, {user?.nombre}</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.color + '20', color: s.color }}>
              <s.icon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Chart: Distribution by day */}
        <div className="card">
          <h3 className="card-title">Cursos por Día</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dayData}>
              <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="cursos" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart: Status distribution */}
        <div className="card">
          <h3 className="card-title">Estado de Cursos</h3>
          {statusData.length > 0 ? (
            <div className="pie-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={75} innerRadius={45}
                    dataKey="value" paddingAngle={4}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {statusData.map(d => (
                  <span key={d.name} className="legend-item">
                    <span className="legend-dot" style={{ background: d.color }} /> {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </div>
          ) : <p className="text-muted">No hay cursos registrados</p>}
        </div>

        {/* Upcoming courses */}
        <div className="card card-wide">
          <h3 className="card-title">Cursos Activos</h3>
          {upcoming.length === 0 ? (
            <p className="text-muted">No hay cursos activos</p>
          ) : (
            <div className="course-list-mini">
              {upcoming.map(c => {
                const docente = getDocenteById(c.docente_id);
                const cat = getCategoryById(c.categoria_id);
                return (
                  <div className="course-mini" key={c.id}>
                    <div className="course-mini-color" style={{ background: cat?.color || '#6366f1' }} />
                    <div className="course-mini-info">
                      <strong>{c.nombre}</strong>
                      <span>{docente?.nombre || 'Sin docente'} • {c.dias?.join(', ')} • {c.hora_inicio} - {c.hora_fin}</span>
                    </div>
                    <span className={`badge badge-${c.estado}`}>{STATUS_LABELS[c.estado]}</span>
                    {c.meet_link && (
                      <a href={c.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost" title="Ir a Meet">
                        <Video size={16} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
