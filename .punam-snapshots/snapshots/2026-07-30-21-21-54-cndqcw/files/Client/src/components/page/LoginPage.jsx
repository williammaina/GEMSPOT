import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (user?.isAuthenticated) navigate(from, { replace: true });
  }, [user?.isAuthenticated, from, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({
        email: email.trim(),
        username: email.trim(),
        password,
      });
      const profile = data?.user || data;
      const isAdmin = Boolean(profile?.is_admin || profile?.isAdmin || profile?.role === 'admin');
      pushToast?.('Welcome back', 'success');
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
      <div className={styles.Card}>
        <div className={styles.Brand}>
          <span className={styles.BrandIcon}>
            <Hexagon size={22} fill="currentColor" />
          </span>
          <h1>Sign in</h1>
          <p>Access saved places, plans, and your GemSpot profile.</p>
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
              />
              <button
                type="button"
                className={styles.EyeBtn}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
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
          <strong>Demo accounts</strong>
          <span>admin@gemspot.co.ke · AdminPass2026!</span>
          <span>wanjiku@example.com · Password123!</span>
        </div>
      </div>
    </main>
  );
}
