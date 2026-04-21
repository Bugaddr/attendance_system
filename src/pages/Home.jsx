import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, UserPlus, Mail, Lock, User, Shield, MapPin, Zap } from 'lucide-react';

export default function Home() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'teacher') navigate('/teacher');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isLogin) {
      const res = await login(email, password);
      if (res.success) {
        navigate('/teacher');
      } else {
        setError(res.error);
      }
    } else {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name, role: 'teacher' })
        });
        const data = await res.json();
        if (res.ok) {
          setIsLogin(true);
          setError('');
          alert('Registration successful! Please log in.');
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Registration failed');
      }
    }
    setLoading(false);
  };

  const features = [
    { icon: <MapPin size={20} />, title: 'Geofenced', desc: '50m radius verification' },
    { icon: <Shield size={20} />, title: 'Anti-Proxy', desc: 'Live selfie required' },
    { icon: <Zap size={20} />, title: 'Instant', desc: 'QR code based check-in' }
  ];

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div className="text-center mb-8">
          <div style={{
            display: 'inline-flex', padding: '1rem',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 'var(--radius-full)',
            marginBottom: '1.25rem',
            border: '1px solid rgba(99, 102, 241, 0.15)'
          }}>
            <GraduationCap size={48} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="gradient-text" style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', marginBottom: '0.5rem' }}>
            Secure Attendance
          </h1>
          <p className="text-muted" style={{ fontSize: '0.9375rem', lineHeight: '1.6', maxWidth: '360px', margin: '0 auto' }}>
            Geolocation-verified attendance for modern educators
          </p>
        </div>

        <div className="flex gap-3 justify-center mb-6">
          {features.map((f, i) => (
            <div key={i} className="text-center" style={{
              padding: '0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              flex: 1
            }}>
              <div style={{ color: 'var(--primary)', marginBottom: '0.375rem', display: 'flex', justifyContent: 'center' }}>{f.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{f.title}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>

          <div className="toggle-wrapper">
            <div className="toggle-slider" style={{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }}></div>
            <button className={`toggle-btn ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>
              <LogIn size={16} /> Login
            </button>
            <button className={`toggle-btn ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>
              <UserPlus size={16} /> Register
            </button>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input type="text" placeholder="Full Name" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            )}

            <div className="input-group">
              <Mail size={18} className="input-icon" />
              <input type="email" placeholder="Email Address" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input type="password" placeholder="Password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>

            <button type="submit" className="btn w-full btn-pill" disabled={loading}
              style={{ padding: '0.875rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In to Dashboard' : 'Create Teacher Account')}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
