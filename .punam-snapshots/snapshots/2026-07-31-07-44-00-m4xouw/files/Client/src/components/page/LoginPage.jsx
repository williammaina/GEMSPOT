import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Loader2, Shield, Sparkles } from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { AuthPageStyles as styles } from '@styles';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, pushToast, user } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from || '/saved';

  // Only redirect if user arrives already signed in (e.g. deep-link /login while session live).
  // Successful form submit handles its own navigation to avoid double-fire.
  useEffect(() => {
    if (!user?.isAuthenticated || loading) return;
    const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');
    navigate(isAdmin ? '/admin' : from, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fillDemo = (kind) => {
    if (kind === 'admin') {
      setEmail('admin@gemspot.co.ke');
      setPassword('AdminPass2026!');
    } else {
      setEmail('wanjiku@example.com');
      setPassword('Password123!');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await login({
        email: email.trim(),
        username: email.trim(),
        password,
      });
      const profile = data?.user || data;
      const isAdmin = Boolean(profile?.is_admin || profile?.isAdmin || profile?.role === 'admin');
      pushToast?.(isAdmin ? 'Welcome, admin' : 'Welcome back', 'success');
      navigate(isAdmin ? '/admin' : from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Login failed. Check your email and password.';
      setError(typeof msg === 'string' ? msg : 'Login failed');
      pushToast?.('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.Page}>
      <div className={styles.Backdrop} aria-hidden="true" />
      <div className={styles.Card}>
        <div className={styles.Brand}>
          <span className={styles.BrandIcon}>
            <Hexagon size={22} fill="currentColor" />
          </span>
          <h1>Sign in</h1>
          <p>Access saved places, night plans, and your GemSpot profile.</p>
        </div>

        <form className={styles.Form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.Error} role="alert">
              {error}
            </div>
          )}

          <label className={styles.Field}>
            <span>Email or username</span>
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </label>

          <label className={styles.Field}>
            <span>Password</span>
            <div className={styles.PasswordWrap}>
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.EyeBtn}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button type="submit" className={styles.PrimaryBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className={styles.Spin} /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className={styles.Footer}>
          New to GemSpot? <Link to="/register">Create an account</Link>
        </p>

        <div className={styles.DemoHint}>
          <strong>
            <Sparkles size={14} /> Demo accounts (work offline)
          </strong>
          <button type="button" className={styles.DemoBtn} onClick={() => fillDemo('admin')}>
            <Shield size={14} /> Admin · admin@gemspot.co.ke
          </button>
          <button type="button" className={styles.DemoBtn} onClick={() => fillDemo('user')}>
            Explorer · wanjiku@example.com
          </button>
        </div>
      </div>
    </main>
  );
}
