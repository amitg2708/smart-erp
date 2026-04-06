import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ButtonSpinner } from '../components/Spinner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;
  const strengthLabel = ['', 'Weak', 'Medium', 'Strong'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/reset-password/${token}`, { password });
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired reset link. Request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">🎓</span>
          <h1 className="logo-text">Smart College ERP</h1>
        </div>

        <div className="auth-header">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            {password && (
              <div style={{ marginTop: '6px' }}>
                <div style={{ height: '4px', borderRadius: '2px', background: '#2d2d44', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(strength / 3) * 100}%`, background: strengthColor[strength], transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '12px', color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="form-input"
              placeholder="Repeat your new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{ borderColor: confirm && confirm !== password ? '#ef4444' : undefined }}
            />
            {confirm && confirm !== password && (
              <span style={{ fontSize: '12px', color: '#ef4444' }}>Passwords do not match</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading && <ButtonSpinner />}
            {loading ? 'Resetting...' : '🔒 Reset Password'}
          </button>

          <div className="auth-footer">
            <Link to="/forgot-password" className="auth-link">Request new link</Link>
            {' · '}
            <Link to="/login" className="auth-link">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
