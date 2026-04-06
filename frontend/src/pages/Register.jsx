import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const roles = [
  { value: 'admin', label: 'Admin', icon: '🛡️' },
  { value: 'faculty', label: 'Faculty', icon: '👨‍🏫' },
  { value: 'student', label: 'Student', icon: '🎓' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNumber: '', course: '', year: '', branch: '', phone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill required fields');
    if (role === 'student' && (!form.rollNumber || !form.course || !form.year)) {
      return toast.error('Roll number, course and year are required for students');
    }
    setLoading(true);
    try {
      let cleanPhone = undefined;
      if (form.phone && form.phone.trim() !== '') {
        cleanPhone = form.phone.replace(/[^0-9]/g, '').slice(-10);
      }
      
      const payload = { 
        ...form, 
        role, 
        year: form.year ? Number(form.year) : undefined,
        phone: cleanPhone,
      };
      
      // Clean up empty strings so Joi respects optional()
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === undefined) {
          delete payload[key];
        }
      });

      const data = await register(payload);
      toast.success('Registration successful!');
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <h1>Create Account</h1>
          <p>Join the College ERP System</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Select Role</label>
          <div className="role-select-grid">
            {roles.map(r => (
              <div key={r.value} className={`role-option ${role === r.value ? 'active' : ''}`} onClick={() => setRole(r.value)}>
                <span>{r.icon}</span>
                <p>{r.label}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" placeholder="john@college.edu" value={form.email} onChange={set('email')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} />
          </div>

          {role === 'student' && (
            <>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input className="form-input" placeholder="CS2024001" value={form.rollNumber} onChange={set('rollNumber')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Course *</label>
                  <input className="form-input" placeholder="B.Tech CSE" value={form.course} onChange={set('course')} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Year *</label>
                  <select className="form-select" value={form.year} onChange={set('year')}>
                    <option value="">Select Year</option>
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <input className="form-input" placeholder="Computer Science" value={form.branch} onChange={set('branch')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 9876543210" value={form.phone} onChange={set('phone')} />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
