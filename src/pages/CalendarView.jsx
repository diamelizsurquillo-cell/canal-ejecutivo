import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import Modal from '../components/Modal';
import { Video } from 'lucide-react';

const DAY_MAP = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };
const STATUS_LABELS = { borrador: 'Borrador', publicado: 'Publicado', en_curso: 'En Curso', finalizado: 'Finalizado', cancelado: 'Cancelado' };

export default function CalendarView() {
  const { courses, getDocenteById, getCategoryById } = useData();
  const { isAdmin, user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Convert courses to FullCalendar events (recurring)
  const events = useMemo(() => {
    return courses
      .filter(c => c.estado !== 'cancelado')
      .map(c => {
        const cat = getCategoryById(c.categoria_id);
        const docente = getDocenteById(c.docente_id);
        return {
          id: c.id,
          title: c.nombre,
          daysOfWeek: c.dias?.map(d => DAY_MAP[d]) || [],
          startTime: c.hora_inicio,
          endTime: c.hora_fin,
          startRecur: c.fecha_inicio,
          endRecur: c.fecha_fin ? `${c.fecha_fin}T23:59:59` : undefined,
          backgroundColor: cat?.color || '#6366f1',
          borderColor: cat?.color || '#6366f1',
          extendedProps: { course: c, docente, category: cat },
        };
      });
  }, [courses]);

  const handleEventClick = (info) => {
    setSelectedEvent(info.event.extendedProps);
  };

  const renderEventContent = (eventInfo) => {
    const docente = eventInfo.event.extendedProps.docente;
    return (
      <div className="cal-event">
        <strong>{eventInfo.event.title}</strong>
        <span>{docente?.nombre || ''}</span>
        <span>{eventInfo.timeText}</span>
      </div>
    );
  };

  const sel = selectedEvent;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1>Calendario</h1>
      </div>

      <div className="calendar-wrapper card">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
          headerToolbar={isMobile ? {
            left: 'prev,next',
            center: 'title',
            right: 'today'
          } : {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          footerToolbar={isMobile ? {
            center: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          } : false}
          locale="es"
          events={events}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          height="auto"
          expandRows={true}
          stickyHeaderDates={true}
          nowIndicator={true}
          buttonText={{
            today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', list: 'Lista'
          }}
          dayHeaderFormat={isMobile ? { weekday: 'short', day: 'numeric' } : undefined}
          views={{
            timeGridWeek: {
              dayHeaderFormat: isMobile ? { weekday: 'narrow', day: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'numeric' }
            }
          }}
        />
      </div>

      <Modal isOpen={!!sel} onClose={() => setSelectedEvent(null)} title={sel?.course?.nombre || 'Detalle'} size="md">
        {sel && (
          <div className="course-detail-modal">
            <div className="detail-grid">
              <div><span className="label">Docente</span><span>{sel.docente?.nombre || '—'}</span></div>
              <div><span className="label">Categoría</span><span className="course-category-tag" style={{ background: (sel.category?.color || '#6366f1') + '20', color: sel.category?.color }}>{sel.category?.nombre}</span></div>
              <div><span className="label">Horario</span><span>{sel.course.hora_inicio} - {sel.course.hora_fin}</span></div>
              <div><span className="label">Días</span><span>{sel.course.dias?.join(', ')}</span></div>
              <div><span className="label">Periodo</span><span>{sel.course.fecha_inicio} → {sel.course.fecha_fin}</span></div>
              <div><span className="label">Estado</span><span className={`badge badge-${sel.course.estado}`}>{STATUS_LABELS[sel.course.estado]}</span></div>
              <div><span className="label">Dirigido a</span><span>{sel.course.dirigido_a || '—'}</span></div>
            </div>
            {sel.course.meet_link && (isAdmin || sel.course.docente_id === user.id) ? (
              <a href={sel.course.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: 16 }}>
                <Video size={18} /> Ir a Google Meet
              </a>
            ) : sel.course.meet_link ? (
              <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Enlace de Meet oculto (Solo docente asignado)
              </div>
            ) : null}
            {sel.course.descripcion && <div className="detail-desc"><span className="label">Descripción</span><p>{sel.course.descripcion}</p></div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
