import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>
      <div className="login-card">
        <div className="login-logo">
          <GraduationCap size={48} />
          <h1>CANAL EJECUTIVO</h1>
          <p>Gestión de Cursos y Programación Académica</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email"><Mail size={16} /> Correo electrónico</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com" required autoFocus />
          </div>

          <div className="form-group">
            <label htmlFor="password"><Lock size={16} /> Contraseña</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-hints">
          <p><strong>Demo Admin:</strong> admin@academichub.com / admin123</p>
          <p><strong>Demo Docente:</strong> maria@academichub.com / docente123</p>
        </div>
      </div>
    </div>
  );
}
