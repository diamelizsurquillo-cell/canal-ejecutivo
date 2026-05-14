import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseForm from './pages/CourseForm';
import CalendarView from './pages/CalendarView';
import Teachers from './pages/Teachers';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Cargando...</p></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={
        <PrivateRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cursos" element={<Courses />} />
              <Route path="/cursos/nuevo" element={<CourseForm />} />
              <Route path="/cursos/editar/:id" element={<CourseForm />} />
              <Route path="/calendario" element={<CalendarView />} />
              <Route path="/docentes" element={<Teachers />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  );
}
