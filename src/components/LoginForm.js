import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' }); // Keeping email
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validateForm = () => {
    if (!formData.email.trim()) return 'Email is required.';
    if (!formData.password.trim()) return 'Password is required.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setMessage({ text: validationError, type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include', // Try to include cookies if needed
      });

      const loginData = await loginRes.text();
      console.log('Login response (raw):', loginData, 'Status:', loginRes.status, 'Headers:', Object.fromEntries(loginRes.headers));

      let parsedLoginData = {};
      try {
        parsedLoginData = JSON.parse(loginData);
      } catch (e) {
        console.error('Failed to parse login response:', loginData);
        setMessage({ text: 'Invalid server response. Please try again.', type: 'error' });
        setLoading(false);
        return;
      }

      if (!loginRes.ok) {
        setMessage({ text: parsedLoginData.message || 'Login failed. Please check your credentials.', type: 'error' });
        setLoading(false);
        return;
      }

      localStorage.setItem('accessToken', parsedLoginData.accessToken);
      localStorage.setItem('refreshToken', parsedLoginData.refreshToken || '');

      const userRes = await fetch(`${BASE_URL}/api/users/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${parsedLoginData.accessToken}`,
        },
      });

      const userData = await userRes.json();
      console.log('User data response:', userData, 'Status:', userRes.status);

      if (userRes.ok) {
        setMessage({ text: 'Login successful!', type: 'success' });
        if (!userData.profile) {
          setTimeout(() => navigate(`/create-profile/${userData.id}`), 1500);
        } else {
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      } else if (userRes.status === 401) {
        setMessage({ text: 'Session expired. Please log in again.', type: 'error' });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } else {
        setMessage({ text: `Failed to fetch user data: ${userRes.status} - ${userData.message || 'Unknown error'}`, type: 'error' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage({ text: 'Network error. Please try again. Check console for details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="header-section">
          <Lock className="lock-icon" />
          <h1 className="title">Login</h1>
          <p className="subtitle">Access your account</p>
        </div>

        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.type === 'success' ? <CheckCircle className="message-icon" /> : <AlertCircle className="message-icon" />}
            <span className="message-text">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-container">
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter email"
                disabled={loading}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="footer-section">
          <a href="/forgot-password" className="back-link">Forgot Password?</a>
          <p className="toggle-text">New user? <a href="/register" className="toggle-link">Register here</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;