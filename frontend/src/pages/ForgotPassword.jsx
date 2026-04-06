import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ButtonSpinner } from '../components/Spinner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address');
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      setSent(true);
      toast.success('Reset link sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email. Try again.');
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

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📧</div>
            <h2 style={{ color: '#6366f1', marginBottom: '8px' }}>Check Your Email</h2>
            <p style={{ color: '#a0aec0', marginBottom: '24px', lineHeight: 1.6 }}>
              If <strong style={{ color: '#e2e8f0' }}>{email}</strong> is registered, we've sent a password reset link.
              It expires in 1 hour.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 24px', borderRadius: '8px' }}>
              ← Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <h2 className="auth-title">Forgot Password</h2>
              <p className="auth-subtitle">Enter your email and we'll send a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading && <ButtonSpinner />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="auth-footer">
                <span>Remember your password? </span>
                <Link to="/login" className="auth-link">Login</Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
