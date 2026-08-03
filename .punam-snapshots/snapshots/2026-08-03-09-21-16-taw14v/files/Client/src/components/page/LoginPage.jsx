import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Loader2, Shield, Sparkles } from 'lucide-react';
import { GemSpotLogo } from '../shared/GemSpotLogo.jsx';
import { useApp } from '../../library/contexts/AppContext.js';
import { AuthPageStyles as styles } from '@styles';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, pushToast, user } = useApp();
  const adminMode = searchParams.get('mode') === 'admin';

  const [email, setEmail] = useState(adminMode ? 'admin@gemspot.co.ke' : '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from || '/saved';

  useEffect(() => {
    if (!user?.isAuthenticated || loading) return;
    const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');
    navigate(isAdmin ? '/admin' : from, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When landing via "Login as admin", focus password and clear any auto-login
  useEffect(() => {
    if (adminMode) {
      setEmail('admin@gemspot.co.ke');
      setPassword('');
      setError('');
    }
  }, [adminMode]);

  const finishLogin = (data) => {
    const profile = data?.user || data;
    const isAdmin = Boolean(profile?.is_admin || profile?.isAdmin || profile?.role === 'admin');
    if (adminMode && !isAdmin) {
      setError('This account is not an admin. Use an admin email and password.');
      pushToast?.('Not an admin account', 'error');
      return;
    }
    pushToast?.(isAdmin ? 'Login successful — welcome, admin' : 'Login successful', 'success');
    navigate(isAdmin ? '/admin' : from, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      pushToast?.('Enter email and password', 'error');
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

  /** Navigate to admin login form — does NOT auto-sign-in */
  const goAdminLogin = () => {
    navigate('/login?mode=admin', { replace: true });
    setEmail('admin@gemspot.co.ke');
    setPassword('');
    setError('');
    pushToast?.('Enter admin credentials to continue', 'info');
  };

  return (
    <main className={styles.Page}>
      <div className={styles.Backdrop} aria-hidden="true" />
      <div className={styles.Card}>
        <div className={styles.Brand}>
          <span className={styles.BrandIcon}>
            {adminMode ? <Shield size={22} /> : <GemSpotLogo size={28} />}
          </span>
          <p className={styles.BrandLockup}>
            <span className={styles.BrandWord}>GemSpot</span>
            <span className={styles.BrandKe}>KE</span>
          </p>
          <h1>{adminMode ? 'Admin sign in' : 'Sign in'}</h1>
          <p>
            {adminMode
              ? 'Enter the admin email and password to open the dashboard.'
              : 'Access your saved places, plans, and profile — private to your account.'}
          </p>
        </div>

        <form className={styles.Form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.Error} role="alert">
              {error}
            </div>
          )}

          <label className={styles.Field}>
            <span>{adminMode ? 'Admin email' : 'Email or username'}</span>
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={adminMode ? 'admin@gemspot.co.ke' : 'you@example.com'}
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
                autoFocus={adminMode}
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
            ) : adminMode ? (
              'Sign in as admin'
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {!adminMode && (
          <div className={styles.AdminGate}>
            <button type="button" className={styles.AdminBtn} onClick={goAdminLogin} disabled={loading}>
              <Shield size={16} /> Login as admin
            </button>
            <p className={styles.AdminHint}>
              Opens the admin sign-in form — you still enter the password.
            </p>
          </div>
        )}

        {adminMode && (
          <p className={styles.Footer}>
            Not an admin? <Link to="/login">Back to regular sign in</Link>
          </p>
        )}

        {!adminMode && (
          <>
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
                disabled={loading}
                onClick={() => {
                  setEmail('wanjiku@example.com');
                  setPassword('Password123!');
                  setError('');
                }}
              >
                Fill explorer · wanjiku@example.com
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
