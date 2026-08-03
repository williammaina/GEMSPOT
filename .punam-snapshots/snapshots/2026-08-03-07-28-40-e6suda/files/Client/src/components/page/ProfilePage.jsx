import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Heart,
  LogOut,
  MapPin,
  Moon,
  Pencil,
  Save,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { updateUserHandler } from '../../library/handlers/apiHandler.js';
import { isDemoToken, getToken, setSession } from '../../app/site/private/authentication/authService.js';
import { ProfilePageStyles as styles } from '@styles';

export function ProfilePage() {
  const navigate = useNavigate();
  const {
    user,
    setUser,
    logout,
    favorites = [],
    recentPlaces = [],
    interestedEvents = [],
    planStops = [],
    theme,
    toggleTheme,
    pushToast,
  } = useApp();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    bio: '',
  });

  const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');

  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate('/login', { state: { from: '/profile' }, replace: true });
    }
  }, [user?.isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;
    const parts = String(user.name || '').trim().split(/\s+/);
    setForm({
      first_name: user.first_name || parts[0] || '',
      last_name: user.last_name || parts.slice(1).join(' ') || '',
      bio: user.bio || '',
    });
  }, [user?.email, user?.first_name, user?.last_name, user?.bio, user?.name]);

  if (!user?.isAuthenticated) {
    return null;
  }

  const displayName =
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username ||
    'Explorer';

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || 'G';

  const handleLogout = async () => {
    await logout?.();
    pushToast?.('Signed out', 'info');
    navigate('/');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      first_name: form.first_name.trim() || 'Explorer',
      last_name: form.last_name.trim() || '',
      bio: form.bio.trim(),
      name: [form.first_name, form.last_name].filter(Boolean).join(' ').trim(),
    };

    try {
      if (!isDemoToken() && getToken()) {
        const updated = await updateUserHandler(payload);
        const next = {
          ...user,
          ...updated,
          ...payload,
          name: payload.name || displayName,
          isAuthenticated: true,
        };
        setUser?.(next);
        setSession({ token: getToken(), user: next });
        pushToast?.('Profile updated', 'success');
      } else {
        // Demo / offline — update local session only
        const next = { ...user, ...payload, isAuthenticated: true };
        setUser?.(next);
        setSession({ token: getToken(), user: next });
        pushToast?.('Profile saved on this device', 'success');
      }
      setEditing(false);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not update profile';
      pushToast?.(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.Page}>
      {/* Hero identity */}
      <section className={styles.HeroCard}>
        <div className={styles.HeroTop}>
          <div className={styles.Avatar} aria-hidden="true">
            {initials}
          </div>
          <div className={styles.HeroText}>
            <div className={styles.NameRow}>
              <h1 className={styles.Title}>{displayName}</h1>
              {isAdmin && (
                <span className={styles.AdminBadge}>
                  <Shield size={12} /> Admin
                </span>
              )}
            </div>
            <p className={styles.Email}>{user.email || user.username}</p>
            {user.username && user.email && (
              <p className={styles.Username}>@{user.username}</p>
            )}
          </div>
          {!editing && (
            <button
              type="button"
              className={styles.EditBtn}
              onClick={() => setEditing(true)}
            >
              <Pencil size={15} /> Edit
            </button>
          )}
        </div>

        {!editing && user.bio && (
          <p className={styles.BioPreview}>{user.bio}</p>
        )}

        {editing && (
          <form className={styles.EditForm} onSubmit={handleSave}>
            <div className={styles.FormGrid}>
              <label>
                First name
                <input
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="First name"
                  disabled={saving}
                />
              </label>
              <label>
                Last name
                <input
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="Last name"
                  disabled={saving}
                />
              </label>
              <label className={styles.Full}>
                Bio
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="A short line about you — solo explorer, couple dates, visiting Kenya…"
                  disabled={saving}
                  maxLength={280}
                />
              </label>
            </div>
            <div className={styles.FormActions}>
              <button
                type="button"
                className={styles.GhostBtn}
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                <X size={15} /> Cancel
              </button>
              <button type="submit" className={styles.PrimaryBtn} disabled={saving}>
                <Save size={15} /> {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Stats */}
      <section className={styles.Stats} aria-label="Your activity">
        <Link to="/saved" className={styles.StatCard}>
          <Heart size={18} />
          <strong>{favorites.length}</strong>
          <span>Saved</span>
        </Link>
        <Link to="/plan" className={styles.StatCard}>
          <ClipboardList size={18} />
          <strong>{planStops.length}</strong>
          <span>Plan</span>
        </Link>
        <div className={styles.StatCard}>
          <Sparkles size={18} />
          <strong>{interestedEvents.length}</strong>
          <span>Interested</span>
        </div>
        <div className={styles.StatCard}>
          <MapPin size={18} />
          <strong>{recentPlaces.length}</strong>
          <span>Recent</span>
        </div>
      </section>

      {/* Quick links */}
      <section className={styles.Section}>
        <h2 className={styles.SectionTitle}>Shortcuts</h2>
        <div className={styles.Menu}>
          <Link to="/saved" className={styles.MenuItem}>
            <span className={styles.MenuIcon}>
              <Heart size={18} />
            </span>
            <span className={styles.MenuText}>
              <strong>Saved places</strong>
              <small>Favorites on this account</small>
            </span>
            <ChevronRight size={16} className={styles.Chevron} />
          </Link>
          <Link to="/plan" className={styles.MenuItem}>
            <span className={styles.MenuIcon}>
              <ClipboardList size={18} />
            </span>
            <span className={styles.MenuText}>
              <strong>Your plan</strong>
              <small>Stops you’ve added for the day</small>
            </span>
            <ChevronRight size={16} className={styles.Chevron} />
          </Link>
          <Link to="/explore" className={styles.MenuItem}>
            <span className={styles.MenuIcon}>
              <MapPin size={18} />
            </span>
            <span className={styles.MenuText}>
              <strong>Explore places</strong>
              <small>Nature, eats, nightlife, action</small>
            </span>
            <ChevronRight size={16} className={styles.Chevron} />
          </Link>
          <Link to="/events" className={styles.MenuItem}>
            <span className={styles.MenuIcon}>
              <CalendarDays size={18} />
            </span>
            <span className={styles.MenuText}>
              <strong>Events</strong>
              <small>Upcoming in Kenya</small>
            </span>
            <ChevronRight size={16} className={styles.Chevron} />
          </Link>
          {isAdmin && (
            <Link to="/admin" className={styles.MenuItem}>
              <span className={styles.MenuIcon}>
                <Settings size={18} />
              </span>
              <span className={styles.MenuText}>
                <strong>Admin dashboard</strong>
                <small>Places, events, users</small>
              </span>
              <ChevronRight size={16} className={styles.Chevron} />
            </Link>
          )}
        </div>
      </section>

      {/* Recent views */}
      {recentPlaces.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2 className={styles.SectionTitle}>Recently viewed</h2>
          </div>
          <ul className={styles.RecentList}>
            {recentPlaces.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link to={`/place/${p.id}`} className={styles.RecentItem}>
                  {p.image ? (
                    <img src={p.image} alt="" loading="lazy" />
                  ) : (
                    <span className={styles.RecentPlaceholder}>
                      <MapPin size={14} />
                    </span>
                  )}
                  <span>
                    <strong>{p.title || p.name}</strong>
                    <small>{p.location || p.category || 'Place'}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Preferences */}
      <section className={styles.Section}>
        <h2 className={styles.SectionTitle}>Preferences</h2>
        <div className={styles.PrefCard}>
          <div>
            <strong>Appearance</strong>
            <p>Switch between light and dark mode</p>
          </div>
          <button type="button" className={styles.ThemeBtn} onClick={() => toggleTheme?.()}>
            {theme === 'dark' ? (
              <>
                <Sun size={16} /> Light
              </>
            ) : (
              <>
                <Moon size={16} /> Dark
              </>
            )}
          </button>
        </div>
      </section>

      {/* Sign out */}
      <section className={styles.Section}>
        <button type="button" className={styles.SignOut} onClick={handleLogout}>
          <LogOut size={18} /> Sign out
        </button>
      </section>
    </main>
  );
}
