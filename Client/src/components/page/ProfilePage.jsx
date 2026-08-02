import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Heart,
  LogOut,
  MapPin,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { DashboardStyles as styles } from '@styles';

export function ProfilePage() {
  const navigate = useNavigate();
  const {
    user,
    logout,
    favorites = [],
    recentPlaces = [],
    interestedEvents = [],
    pushToast,
  } = useApp();

  const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');

  const handleLogout = async () => {
    await logout?.();
    pushToast?.('Signed out', 'info');
    navigate('/');
  };

  if (!user?.isAuthenticated) {
    navigate('/login', { state: { from: '/profile' }, replace: true });
    return null;
  }

  const displayName =
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username ||
    'Explorer';

  return (
    <main className={styles.Page}>
      <header className={styles.Header}>
        <div className={styles.Avatar}>
          <User size={28} />
        </div>
        <div>
          <h1 className={styles.Title}>{displayName}</h1>
          <p className={styles.Sub}>{user.email || user.username}</p>
          {isAdmin && (
            <span className={styles.AdminBadge}>
              <Shield size={12} /> Admin
            </span>
          )}
        </div>
      </header>

      <section className={styles.Stats}>
        <div>
          <strong>{favorites.length}</strong>
          <span>Saved places</span>
        </div>
        <div>
          <strong>{interestedEvents.length}</strong>
          <span>Interested</span>
        </div>
        <div>
          <strong>{recentPlaces.length}</strong>
          <span>Recent views</span>
        </div>
      </section>

      <section className={styles.Menu}>
        <Link to="/saved" className={styles.MenuItem}>
          <Heart size={18} /> Saved & planning
        </Link>
        <Link to="/plan" className={styles.MenuItem}>
          <CalendarDays size={18} /> Your plan
        </Link>
        <Link to="/explore" className={styles.MenuItem}>
          <MapPin size={18} /> Explore places
        </Link>
        {isAdmin && (
          <Link to="/admin" className={styles.MenuItem}>
            <Settings size={18} /> Admin dashboard
          </Link>
        )}
        <button type="button" className={styles.MenuDanger} onClick={handleLogout}>
          <LogOut size={18} /> Sign out
        </button>
      </section>

      {user.bio && (
        <section className={styles.Bio}>
          <h2>About</h2>
          <p>{user.bio}</p>
        </section>
      )}
    </main>
  );
}
