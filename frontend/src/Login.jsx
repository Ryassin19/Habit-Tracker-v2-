import React, { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const endpoint = isSignUp ? '/signup' : '/login';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      if (isSignUp) {
        setMessage('Account created successfully! Please sign in.');
        setIsSignUp(false);
        setPassword('');
      } else {
        localStorage.setItem('token', data.access_token);
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        
        <div className="ai-eyebrow" style={{ textAlign: 'center', marginBottom: '4px' }}>
          {isSignUp ? '✨ Join Us' : '⚡ Welcome Back'}
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>
          {isSignUp ? 'Create Account' : 'Habit Tracker'}
        </h1>

        {error && (
          <div style={{ color: 'var(--red)', background: 'var(--red-light)', padding: '10px', borderRadius: 'var(--radius)', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(192, 57, 43, 0.2)' }}>
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div style={{ color: 'var(--teal)', background: 'var(--teal-light)', padding: '10px', borderRadius: 'var(--radius)', fontSize: '13px', marginBottom: '16px', border: '1px solid var(--teal-dim)' }}>
            🎉 {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              placeholder="Username"
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '12px' }}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--ink-3)', fontFamily: 'system-ui, sans-serif' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }} 
            style={{ color: 'var(--teal)', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </div>

      </div>
    </div>
  );
}