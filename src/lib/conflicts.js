// Conflict detection utility for academic scheduling
// Detects overlapping courses for the same docente on the same days/times

const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function timeRangesOverlap(a, b) {
  const aStart = timeToMinutes(a.hora_inicio);
  const aEnd = timeToMinutes(a.hora_fin);
  const bStart = timeToMinutes(b.hora_inicio);
  const bEnd = timeToMinutes(b.hora_fin);
  return aStart < bEnd && bStart < aEnd;
}

function dateRangesOverlap(a, b) {
  return a.fecha_inicio <= b.fecha_fin && b.fecha_inicio <= a.fecha_fin;
}

function sharedDays(a, b) {
  return a.dias.filter(d => b.dias.includes(d));
}

export function detectConflicts(newCourse, allCourses) {
  const conflicts = [];
  for (const existing of allCourses) {
    if (existing.id === newCourse.id) continue;
    if (existing.estado === 'cancelado' || existing.estado === 'finalizado') continue;
    if (!dateRangesOverlap(newCourse, existing)) continue;
    const common = sharedDays(newCourse, existing);
    if (common.length === 0) continue;
    if (!timeRangesOverlap(newCourse, existing)) continue;

    if (newCourse.docente_id && newCourse.docente_id === existing.docente_id) {
      conflicts.push({
        type: 'docente',
        course: existing,
        days: common,
        message: `El docente ya tiene "${existing.nombre}" en ${common.join(', ')} de ${existing.hora_inicio} a ${existing.hora_fin}`
      });
    }
  }
  return conflicts;
}

export { DAY_ORDER };
