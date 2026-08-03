import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Loader2, Shield, Sparkles } from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { AuthPageStyles as styles } from '@styles';

const ADMIN_CREDS = {
  email: 'admin@gemspot.co.ke',
  password: 'AdminPass2026!',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, pushToast, user } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from || '/saved';

  useEffect(() => {
    if (!user?.isAuthenticated || loading || adminLoading) return;
    const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');
    navigate(isAdmin ? '/admin' : from, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishLogin = (data) => {
    const profile = data?.user || data;
    const isAdmin = Boolean(profile?.is_admin || profile?.isAdmin || profile?.role === 'admin');
    pushToast?.(isAdmin ? 'Welcome, admin' : 'Welcome back', 'success');
    navigate(isAdmin ? '/admin' : from, { replace: true });
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
      finishLogin(data);
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

  /** One-tap admin sign-in — hits the same login flow with seed admin credentials */
  const handleAdminLogin = async () => {
    setError('');
    setEmail(ADMIN_CREDS.email);
    setPassword(ADMIN_CREDS.password);
    setAdminLoading(true);
    try {
      const data = await login({
        email: ADMIN_CREDS.email,
        username: 'admin',
        password: ADMIN_CREDS.password,
      });
      finishLogin(data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Admin login failed. Seed the database or check API connectivity.';
      setError(typeof msg === 'string' ? msg : 'Admin login failed');
      pushToast?.('Admin login failed', 'error');
    } finally {
      setAdminLoading(false);
    }
  };

  const busy = loading || adminLoading;

  return (
    <main className={styles.Page}>
      <div className={styles.Backdrop} aria-hidden="true" />
      <div className={styles.Card}>
        <div className={styles.Brand}>
          <span className={styles.BrandIcon}>
            <Hexagon size={22} fill="currentColor" />
          </span>
          <h1>Sign in</h1>
          <p>Access your saved places, plans, and profile — private to your account.</p>
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
              disabled={busy}
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
                disabled={busy}
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

          <button type="submit" className={styles.PrimaryBtn} disabled={busy}>
            {loading ? (
              <>
                <Loader2 size={16} className={styles.Spin} /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className={styles.AdminGate}>
          <button
            type="button"
            className={styles.AdminBtn}
            onClick={handleAdminLogin}
            disabled={busy}
          >
            {adminLoading ? (
              <>
                <Loader2 size={16} className={styles.Spin} /> Signing in as admin…
              </>
            ) : (
              <>
                <Shield size={16} /> Login as admin
              </>
            )}
          </button>
          <p className={styles.AdminHint}>
            Uses the seeded admin account and opens the dashboard.
          </p>
        </div>

        <p className={styles.Footer}>
          New to GemSpot? <Link to="/register">Create an account</Link>
        </p>

        <div className={styles.DemoHint}>
          <strong>
            <Sparkles size={14} /> Demo explorer (offline fallback)
          </strong>
          <button
            type="button"
            className={styles.DemoBtn}
            disabled={busy}
            onClick={() => {
              setEmail('wanjiku@example.com');
              setPassword('Password123!');
              setError('');
            }}
          >
            Fill explorer · wanjiku@example.com
          </button>
        </div>
      </div>
    </main>
  );
}
