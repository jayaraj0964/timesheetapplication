import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import '../App.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const BASE_URL = 'https://springbootemployetimesheet-1.onrender.com';

  const handleSubmit = async () => {
    if (!email.trim()) {
      setMessage({ text: 'Email is required', type: 'error' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const text = await res.text();
      setMessage({ text, type: res.ok ? 'success' : 'error' });
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage({ text: 'Network error. Please try again later.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="header-section">
          <Mail className="lock-icon" size={48} />
          <h1 className="title">Forgot Password</h1>
          <p className="subtitle">Enter your email to receive a reset link</p>
        </div>

        {message.text && (
          <div className={`message ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
            {message.type === 'success' ? <CheckCircle className="message-icon" /> : <AlertCircle className="message-icon" />}
            <span className="message-text">{message.text}</span>
          </div>
        )}

        <div className="form-container">
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="submit-button">
            {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
          </button>
        </div>

        <div className="footer-section">
          <a href="/" className="back-link">Back to Login</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;