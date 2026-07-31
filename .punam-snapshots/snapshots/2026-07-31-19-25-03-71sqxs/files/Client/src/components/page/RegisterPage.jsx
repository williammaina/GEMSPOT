import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Loader2 } from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { AuthPageStyles as styles } from '@styles';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, pushToast, user } = useApp();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.isAuthenticated) navigate('/saved', { replace: true });
  }, [user?.isAuthenticated, navigate]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim() || form.email.split('@')[0],
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      pushToast?.('Account created', 'success');
      navigate('/saved', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed';
      setError(typeof msg === 'string' ? msg : 'Registration failed');
      pushToast?.('Could not create account', 'error');
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
          <h1>Create account</h1>
          <p>Save places, mark events, and build night plans.</p>
        </div>

        <form className={styles.Form} onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.Error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.Row2}>
            <label className={styles.Field}>
              <span>First name</span>
              <input value={form.first_name} onChange={set('first_name')} required />
            </label>
            <label className={styles.Field}>
              <span>Last name</span>
              <input value={form.last_name} onChange={set('last_name')} required />
            </label>
          </div>

          <label className={styles.Field}>
            <span>Username</span>
            <input
              value={form.username}
              onChange={set('username')}
              placeholder="optional"
              autoComplete="username"
            />
          </label>

          <label className={styles.Field}>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </label>

          <label className={styles.Field}>
            <span>Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="+2547…"
              autoComplete="tel"
            />
          </label>

          <label className={styles.Field}>
            <span>Password</span>
            <div className={styles.PasswordWrap}>
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                autoComplete="new-password"
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

          <label className={styles.Field}>
            <span>Confirm password</span>
            <input
              type={showPw ? 'text' : 'password'}
              value={form.confirm}
              onChange={set('confirm')}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" className={styles.PrimaryBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className={styles.Spin} /> Creating…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className={styles.Footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
