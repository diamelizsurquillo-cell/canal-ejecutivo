import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, Search, AlertTriangle, 
  Coins, Calendar, Tag, FileText, ArrowUpRight, ArrowDownRight,
  TrendingUp, Download, RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const EXPENSE_TAGS = ['Servicios', 'Docentes', 'Publicidad', 'Materiales', 'Otros'];
const TAG_COLORS = {
  Servicios: '#06b6d4',
  Docentes: '#8b5cf6',
  Publicidad: '#3b82f6',
  Materiales: '#f59e0b',
  Otros: '#64748b'
};

export default function Accounting() {
  const { enrollments, courses, expenses, addExpense, updateExpense, deleteExpense } = useData();
  const { isAdmin } = useAuth();

  // Navigation Tabs: 'resumen', 'ingresos', 'egresos'
  const [activeTab, setActiveTab] = useState('resumen');

  // Filtering States
  const [datePreset, setDatePreset] = useState('todo');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseTagFilter, setExpenseTagFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Modal / Form States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    etiqueta: 'Otros'
  });
  const [errors, setErrors] = useState({});
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState(null);

  // Pagination States
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const itemsPerPage = 10;

  // Reset page numbers when search, tabs, or filters change
  useEffect(() => {
    setIncomePage(1);
    setExpensePage(1);
  }, [searchQuery, datePreset, startDate, endDate, expenseTagFilter, courseFilter, activeTab]);

  // Helper to handle date presets
  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    
    if (preset === 'este-mes') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (preset === 'mes-anterior') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (preset === 'ultimos-30') {
      const priorDate = new Date();
      priorDate.setDate(today.getDate() - 30);
      setStartDate(priorDate.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'este-anio') {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      const lastDay = new Date(today.getFullYear(), 11, 31);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else {
      // Todo / Custom
      setStartDate('');
      setEndDate('');
    }
  };

  // Date filtering helper
  const isWithinDateRange = (dateString) => {
    if (!dateString) return false;
    const itemDate = new Date(dateString.substring(0, 10)); // extract YYYY-MM-DD
    if (startDate) {
      const start = new Date(startDate);
      if (itemDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      if (itemDate > end) return false;
    }
    return true;
  };

  // Process data for presentation
  const filteredIncomes = enrollments.filter(inc => {
    // Filter by Date
    if (!isWithinDateRange(inc.created_at)) return false;
    // Filter by Course
    if (courseFilter && inc.curso_id !== courseFilter) return false;
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const course = courses.find(c => c.id === inc.curso_id);
      const courseName = course ? course.nombre.toLowerCase() : '';
      return (
        inc.nombres.toLowerCase().includes(q) ||
        inc.apellidos.toLowerCase().includes(q) ||
        inc.dni.includes(q) ||
        inc.correo.toLowerCase().includes(q) ||
        courseName.includes(q)
      );
    }
    return true;
  });

  const filteredExpenses = expenses.filter(exp => {
    // Filter by Date
    if (!isWithinDateRange(exp.fecha)) return false;
    // Filter by Tag
    if (expenseTagFilter && exp.etiqueta !== expenseTagFilter) return false;
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        exp.descripcion.toLowerCase().includes(q) ||
        exp.etiqueta.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Pagination calculations
  const totalIncomePages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const incomeStartIndex = (incomePage - 1) * itemsPerPage;
  const paginatedIncomes = filteredIncomes.slice(incomeStartIndex, incomeStartIndex + itemsPerPage);

  const totalExpensePages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const expenseStartIndex = (expensePage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(expenseStartIndex, expenseStartIndex + itemsPerPage);

  // Calculate stats based on filtered data
  const totalIncomes = filteredIncomes.reduce((sum, r) => sum + (parseFloat(r.monto) || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.monto) || 0), 0);
  const netBalance = totalIncomes - totalExpenses;

  // Chart data generators
  const getChartData = () => {
    const groups = {};
    
    filteredIncomes.forEach(inc => {
      const date = new Date(inc.created_at);
      if (isNaN(date.getTime())) return;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      if (!groups[key]) groups[key] = { key, name: '', ingresos: 0, egresos: 0 };
      groups[key].ingresos += parseFloat(inc.monto || 0);
    });

    filteredExpenses.forEach(exp => {
      const date = new Date(exp.fecha + 'T00:00:00'); // avoid timezone issues
      if (isNaN(date.getTime())) return;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      if (!groups[key]) groups[key] = { key, name: '', ingresos: 0, egresos: 0 };
      groups[key].egresos += parseFloat(exp.monto || 0);
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return Object.values(groups)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(group => {
        const [year, month] = group.key.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        return {
          name: `${monthNames[monthIndex]} ${year.slice(2)}`,
          ingresos: parseFloat(group.ingresos.toFixed(2)),
          egresos: parseFloat(group.egresos.toFixed(2))
        };
      });
  };

  const getPieData = () => {
    const groups = {};
    filteredExpenses.forEach(exp => {
      const tag = exp.etiqueta || 'Otros';
      if (!groups[tag]) groups[tag] = 0;
      groups[tag] += parseFloat(exp.monto || 0);
    });
    return Object.keys(groups).map(tag => ({
      name: tag,
      value: parseFloat(groups[tag].toFixed(2)),
      color: TAG_COLORS[tag] || '#10b981'
    }));
  };

  const barChartData = getChartData();
  const pieChartData = getPieData();

  // Helper to resolve course name
  const getCourseName = (id) => {
    const course = courses.find(c => c.id === id);
    return course ? course.nombre : 'Curso no encontrado';
  };

  // Form handling
  const resetForm = () => {
    setExpenseForm({
      descripcion: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      etiqueta: 'Otros'
    });
    setEditExpenseId(null);
    setErrors({});
    setShowExpenseModal(false);
  };

  const handleEditExpense = (exp) => {
    setExpenseForm({
      descripcion: exp.descripcion,
      monto: exp.monto,
      fecha: exp.fecha,
      etiqueta: exp.etiqueta || 'Otros'
    });
    setEditExpenseId(exp.id);
    setShowExpenseModal(true);
  };

  const validateForm = () => {
    const err = {};
    if (!expenseForm.descripcion.trim()) err.descripcion = 'La descripción es obligatoria';
    if (!expenseForm.monto) {
      err.monto = 'El monto es obligatorio';
    } else if (parseFloat(expenseForm.monto) <= 0) {
      err.monto = 'El monto debe ser mayor a 0';
    }
    if (!expenseForm.fecha) err.fecha = 'La fecha es obligatoria';
    if (!expenseForm.etiqueta) err.etiqueta = 'La etiqueta es obligatoria';

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      descripcion: expenseForm.descripcion.trim(),
      monto: parseFloat(expenseForm.monto),
      fecha: expenseForm.fecha,
      etiqueta: expenseForm.etiqueta
    };

    if (editExpenseId) {
      await updateExpense(editExpenseId, data);
    } else {
      await addExpense(data);
    }
    resetForm();
  };

  const confirmDeleteExpense = async () => {
    if (deleteExpenseTarget) {
      await deleteExpense(deleteExpenseTarget);
      setDeleteExpenseTarget(null);
    }
  };

  return (
    <div className="accounting-page">
      <div className="page-header">
        <div>
          <h1>Contabilidad y Finanzas</h1>
          <p>Supervisa los ingresos obtenidos por matrículas y administra los egresos de gastos operativos.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-ghost"
            onClick={() => {
              setSearchQuery('');
              setExpenseTagFilter('');
              setCourseFilter('');
              handlePresetChange('todo');
            }}
            title="Restaurar filtros"
          >
            <RefreshCw size={18} /> Limpiar
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowExpenseModal(true); }}>
            <Plus size={18} /> Registrar Egreso
          </button>
        </div>
      </div>

      {/* Date Filters Ribbon */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filtro de Fecha:</span>
          </div>
          
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'todo', label: 'Todo' },
              { id: 'este-mes', label: 'Este Mes' },
              { id: 'mes-anterior', label: 'Mes Anterior' },
              { id: 'ultimos-30', label: 'Últimos 30 días' },
              { id: 'este-anio', label: 'Este Año' }
            ].map(p => (
              <button 
                key={p.id}
                type="button"
                className={`day-btn ${datePreset === p.id ? 'active' : ''}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => handlePresetChange(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <label htmlFor="start-date" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Desde:</label>
              <input 
                id="start-date"
                type="date" 
                value={startDate} 
                onChange={e => { setStartDate(e.target.value); setDatePreset('custom'); }} 
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <label htmlFor="end-date" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hasta:</label>
              <input 
                id="end-date"
                type="date" 
                value={endDate} 
                onChange={e => { setEndDate(e.target.value); setDatePreset('custom'); }} 
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">S/ {totalIncomes.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="stat-label">Ingresos de Ventas</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-icon" style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--danger)' }}>
            <ArrowDownRight size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">S/ {totalExpenses.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="stat-label">Egresos de Gastos</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: `4px solid ${netBalance >= 0 ? 'var(--primary)' : 'var(--warning)'}` }}>
          <div className="stat-icon" style={{ 
            background: netBalance >= 0 ? 'var(--primary-bg)' : 'rgba(245,158,11,0.1)', 
            color: netBalance >= 0 ? 'var(--primary)' : 'var(--warning)' 
          }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value" style={{ color: netBalance >= 0 ? 'inherit' : 'var(--warning)' }}>
              S/ {netBalance.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="stat-label">Balance Neto</span>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '8px' }}>
        {[
          { id: 'resumen', label: 'Resumen General' },
          { id: 'ingresos', label: `Ingresos (${filteredIncomes.length})` },
          { id: 'egresos', label: `Egresos (${filteredExpenses.length})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="nav-link"
            style={{
              width: 'auto',
              borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: '8px 8px 0 0',
              padding: '10px 20px',
              background: activeTab === t.id ? 'rgba(255,255,255,0.02)' : 'transparent',
              color: activeTab === t.id ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & Sub-filters (Only shown on data tabs) */}
      {activeTab !== 'resumen' && (
        <div className="filters-bar" style={{ marginBottom: '16px' }}>
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'ingresos' ? "Buscar por alumno, DNI, correo, curso..." : "Buscar por descripción..."} 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>
          
          {activeTab === 'ingresos' && (
            <div className="filter-group">
              <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
                <option value="">Todos los cursos</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'egresos' && (
            <div className="filter-group">
              <select value={expenseTagFilter} onChange={e => setExpenseTagFilter(e.target.value)}>
                <option value="">Todas las etiquetas</option>
                {EXPENSE_TAGS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Tab Content Panels */}
      {activeTab === 'resumen' && (
        <div className="dashboard-grid">
          {/* Chart: Ingresos vs Egresos */}
          <div className="card">
            <h3 className="card-title">Comparativa Mensual de Flujo</h3>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos (Ventas)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="egresos" name="Egresos (Gastos)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)' }}>
                No hay transacciones en este período para graficar.
              </div>
            )}
          </div>

          {/* Chart: Expenses by Tag */}
          <div className="card">
            <h3 className="card-title">Distribución de Gastos por Categoría</h3>
            {pieChartData.length > 0 ? (
              <div className="pie-container">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie 
                      data={pieChartData} 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={75} 
                      innerRadius={45}
                      dataKey="value" 
                      paddingAngle={4}
                    >
                      {pieChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {pieChartData.map(d => (
                    <span key={d.name} className="legend-item">
                      <span className="legend-dot" style={{ background: d.color }} /> {d.name}: S/ {d.value.toLocaleString('es-PE')}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)' }}>
                No se registraron gastos en este período.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'ingresos' && (
        filteredIncomes.length === 0 ? (
          <div className="empty-state">
            <Coins size={64} style={{ opacity: 0.3 }} />
            <h3>No se encontraron registros de ingresos</h3>
            <p>Asegúrate de registrar matrículas o ajusta los criterios de búsqueda.</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Alumno</th>
                    <th>DNI</th>
                    <th>Curso</th>
                    <th>Monto Recibido</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIncomes.map(inc => {
                    const cleanName = inc.nombres.replace(/\s*\[Tel:.*\]/, '');
                    return (
                      <tr key={inc.id}>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {new Date(inc.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td>
                          <div className="student-name-cell">
                            <strong>{cleanName}</strong>
                            <span className="sub">{inc.apellidos}</span>
                          </div>
                        </td>
                        <td><code>{inc.dni}</code></td>
                        <td>
                          <span className="course-category-tag" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: '0.8rem' }}>
                            {getCourseName(inc.curso_id)}
                          </span>
                        </td>
                        <td>
                          <span className="monto-cell">
                            S/ {parseFloat(inc.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalIncomePages > 1 && (
              <div className="pagination-controls">
                <button 
                  type="button"
                  className="btn btn-sm btn-ghost" 
                  disabled={incomePage === 1}
                  onClick={() => setIncomePage(prev => Math.max(prev - 1, 1))}
                >
                  Anterior
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: totalIncomePages }, (_, i) => i + 1).map(pageNumber => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`pagination-page-btn ${incomePage === pageNumber ? 'active' : ''}`}
                      onClick={() => setIncomePage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
                <button 
                  type="button"
                  className="btn btn-sm btn-ghost" 
                  disabled={incomePage === totalIncomePages}
                  onClick={() => setIncomePage(prev => Math.min(prev + 1, totalIncomePages))}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )
      )}

      {activeTab === 'egresos' && (
        filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <FileText size={64} style={{ opacity: 0.3 }} />
            <h3>No se encontraron registros de gastos</h3>
            <p>Presiona el botón "Registrar Egreso" para agregar tu primer gasto.</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Etiqueta / Categoría</th>
                    <th>Monto</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(exp.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </td>
                      <td>
                        <strong>{exp.descripcion}</strong>
                      </td>
                      <td>
                        <span 
                          className="badge" 
                          style={{ 
                            background: `${TAG_COLORS[exp.etiqueta] || '#10b981'}15`, 
                            color: TAG_COLORS[exp.etiqueta] || '#10b981',
                            border: `1px solid ${TAG_COLORS[exp.etiqueta] || '#10b981'}30`,
                            padding: '4px 10px',
                            fontWeight: '600'
                          }}
                        >
                          <Tag size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                          {exp.etiqueta}
                        </span>
                      </td>
                      <td>
                        <span className="monto-cell" style={{ color: 'var(--danger)' }}>
                          S/ {parseFloat(exp.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="btn btn-sm btn-ghost" onClick={() => handleEditExpense(exp)} title="Editar Egreso">
                            <Edit2 size={16} />
                          </button>
                          {isAdmin && (
                            <button className="btn btn-sm btn-danger-ghost" onClick={() => setDeleteExpenseTarget(exp.id)} title="Eliminar Egreso">
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

            {totalExpensePages > 1 && (
              <div className="pagination-controls">
                <button 
                  type="button"
                  className="btn btn-sm btn-ghost" 
                  disabled={expensePage === 1}
                  onClick={() => setExpensePage(prev => Math.max(prev - 1, 1))}
                >
                  Anterior
                </button>
                <div className="pagination-pages">
                  {Array.from({ length: totalExpensePages }, (_, i) => i + 1).map(pageNumber => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`pagination-page-btn ${expensePage === pageNumber ? 'active' : ''}`}
                      onClick={() => setExpensePage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>
                <button 
                  type="button"
                  className="btn btn-sm btn-ghost" 
                  disabled={expensePage === totalExpensePages}
                  onClick={() => setExpensePage(prev => Math.min(prev + 1, totalExpensePages))}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )
      )}

      {/* Add / Edit Expense Modal */}
      <Modal isOpen={showExpenseModal} onClose={resetForm} title={editExpenseId ? 'Editar Egreso de Gasto' : 'Registrar Nuevo Egreso'}>
        <form onSubmit={handleSubmitExpense} className="modal-form">
          <div className="form-group">
            <label htmlFor="exp-descripcion">Descripción *</label>
            <input 
              id="exp-descripcion"
              type="text"
              value={expenseForm.descripcion}
              onChange={e => setExpenseForm({ ...expenseForm, descripcion: e.target.value })}
              className={errors.descripcion ? 'error' : ''}
              placeholder="Ej. Pago de publicidad en Meta, Compra de Plumones..."
              required
            />
            {errors.descripcion && <span className="form-error">{errors.descripcion}</span>}
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div className="form-group">
              <label htmlFor="exp-monto">Monto (S/) *</label>
              <input 
                id="exp-monto"
                type="number"
                step="0.01"
                value={expenseForm.monto}
                onChange={e => setExpenseForm({ ...expenseForm, monto: e.target.value })}
                className={errors.monto ? 'error' : ''}
                placeholder="Ej. 120.00"
                required
              />
              {errors.monto && <span className="form-error">{errors.monto}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="exp-fecha">Fecha del Gasto *</label>
              <input 
                id="exp-fecha"
                type="date"
                value={expenseForm.fecha}
                onChange={e => setExpenseForm({ ...expenseForm, fecha: e.target.value })}
                className={errors.fecha ? 'error' : ''}
                required
              />
              {errors.fecha && <span className="form-error">{errors.fecha}</span>}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '12px' }}>
            <label htmlFor="exp-etiqueta">Etiqueta / Categoría *</label>
            <select
              id="exp-etiqueta"
              value={expenseForm.etiqueta}
              onChange={e => setExpenseForm({ ...expenseForm, etiqueta: e.target.value })}
              className={errors.etiqueta ? 'error' : ''}
              required
            >
              {EXPENSE_TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            {errors.etiqueta && <span className="form-error">{errors.etiqueta}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              {editExpenseId ? 'Guardar Cambios' : 'Registrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Expense Confirmation Modal */}
      <Modal isOpen={!!deleteExpenseTarget} onClose={() => setDeleteExpenseTarget(null)} title="Confirmar eliminación" size="sm">
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: 12 }} />
          <p style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
            ¿Estás seguro de que deseas eliminar este egreso de gasto? Esta acción no se puede deshacer.
          </p>
          <div className="form-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => setDeleteExpenseTarget(null)}>Cancelar</button>
            <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={confirmDeleteExpense}>Sí, eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
