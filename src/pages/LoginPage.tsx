import { useState } from 'react';
import { login } from '../auth';
import type { AuthUser } from '../types';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

const DEMO_ACCOUNTS = [
  { username: 'sara.hashimi', password: 'DEWA@2025', role: 'Initiator / Requester', initials: 'SH', name: 'Sara Al Hashimi' },
  { username: 'mohammed.ketbi', password: 'DEWA@2025', role: 'Reviewer', initials: 'MK', name: 'Mohammed Al Ketbi' },
  { username: 'rashid.maktoum', password: 'DEWA@2025', role: 'Approver', initials: 'RM', name: 'Rashid Al Maktoum' },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const user = login(username.trim(), password);
      setLoading(false);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid username or password. Please try again.');
      }
    }, 600);
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="login-page">
      {/* Ambient background */}
      <div className="bg">
        <div className="bg-blob b1" />
        <div className="bg-blob b2" />
        <div className="bg-blob b3" />
      </div>

      <div className="login-container">
        {/* Left Panel */}
        <div className="login-left">
          <div className="login-left-content">
            <img src="/dewa-logo.png" alt="DEWA" className="login-dewa-img" />
            <div className="login-hero-title">
              Demand to Delivery
              <span className="login-hero-accent"> (D2D)</span>
            </div>
            <div className="login-hero-sub">
              IT Governance Platform — Enhancement Demand Management System
            </div>
            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-dot" />
                <span>Structured demand submission workflow</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-dot" />
                <span>Role-based review and approval</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-dot" />
                <span>Full pipeline governance and tracking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="login-right">
          <div className="login-form-card">
            <div className="login-form-header">
              <div className="login-form-title">Welcome back</div>
              <div className="login-form-sub">Sign in to access the D2D system</div>
            </div>

            <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
              <div className="login-field">
                <label className="login-label">Username</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    className="login-input"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input
                    className="login-input"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="login-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button className={`login-btn${loading ? ' loading' : ''}`} type="submit" disabled={loading}>
                {loading ? (
                  <span className="login-spinner" />
                ) : (
                  <>
                    Sign In
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="login-demo">
              <div className="login-demo-label">Demo Accounts — Click to fill</div>
              <div className="login-demo-cards">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.username}
                    className="login-demo-card"
                    type="button"
                    onClick={() => fillDemo(acc)}
                  >
                    <div className="login-demo-av">{acc.initials}</div>
                    <div className="login-demo-info">
                      <div className="login-demo-name">{acc.name}</div>
                      <div className="login-demo-role">{acc.role}</div>
                      <div className="login-demo-creds">{acc.username} · {acc.password}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
