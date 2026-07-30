import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  LayoutDashboard,
  MapPin,
  Shield,
  Users,
} from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { apiClient } from '../../library/handlers/apiClient.js';
import { DashboardStyles as styles } from '@styles';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, pushToast } = useApp();
  const [stats, setStats] = useState({ places: '—', events: '—', users: '—' });
  const [loading, setLoading] = useState(true);

  const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');

  useEffect(() => {
    if (!user?.isAuthenticated) {
      navigate('/login', { state: { from: '/admin' }, replace: true });
      return;
    }
    if (!isAdmin) {
      pushToast?.('Admin access required', 'error');
      navigate('/profile', { replace: true });
    }
  }, [user, isAdmin, navigate, pushToast]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // Try admin endpoint, then fall back to public counts
        let placesCount = '—';
        let eventsCount = '—';
        try {
          const admin = await apiClient.get('/admin');
          const data = admin.data?.data || admin.data || {};
          placesCount = data.places_count ?? data.places ?? placesCount;
          eventsCount = data.events_count ?? data.events ?? eventsCount;
          if (data.users_count != null) {
            if (!cancelled) {
              setStats({
                places: placesCount,
                events: eventsCount,
                users: data.users_count,
              });
              setLoading(false);
              return;
            }
          }
        } catch {
          // fall through
        }
        const [placesRes, eventsRes] = await Promise.all([
          apiClient.get('/places').catch(() => null),
          apiClient.get('/events').catch(() => null),
        ]);
        const unwrap = (payload) => {
          if (!payload) return 0;
          const d = payload.data ?? payload;
          if (Array.isArray(d)) return d.length;
          if (Array.isArray(d.data)) return d.data.length;
          if (Array.isArray(d.places)) return d.places.length;
          if (Array.isArray(d.events)) return d.events.length;
          if (typeof d.total === 'number') return d.total;
          return 0;
        };
        placesCount = unwrap(placesRes);
        eventsCount = unwrap(eventsRes);
        if (!cancelled) {
          setStats({ places: placesCount, events: eventsCount, users: '—' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (isAdmin) load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!user?.isAuthenticated || !isAdmin) return null;

  return (
    <main className={styles.Page}>
      <Link to="/profile" className={styles.Back}>
        <ArrowLeft size={16} /> Profile
      </Link>

      <header className={styles.Header}>
        <div className={styles.Avatar}>
          <Shield size={26} />
        </div>
        <div>
          <h1 className={styles.Title}>Admin dashboard</h1>
          <p className={styles.Sub}>Overview of GemSpot KE content</p>
        </div>
      </header>

      <section className={styles.Stats}>
        <div>
          <strong>{loading ? '…' : stats.places}</strong>
          <span>
            <MapPin size={14} /> Places
          </span>
        </div>
        <div>
          <strong>{loading ? '…' : stats.events}</strong>
          <span>
            <CalendarDays size={14} /> Events
          </span>
        </div>
        <div>
          <strong>{loading ? '…' : stats.users}</strong>
          <span>
            <Users size={14} /> Users
          </span>
        </div>
      </section>

      <section className={styles.Menu}>
        <div className={styles.MenuItemStatic}>
          <LayoutDashboard size={18} />
          <span>
            <strong>Seed & content</strong>
            <small>Manage data via Flask seed / admin API</small>
          </span>
        </div>
        <Link to="/explore" className={styles.MenuItem}>
          <MapPin size={18} /> View places (public)
        </Link>
        <Link to="/events" className={styles.MenuItem}>
          <CalendarDays size={18} /> View events (public)
        </Link>
      </section>

      <p className={styles.Note}>
        Full CRUD admin tools can plug into <code>/api/admin</code>. This panel shows live counts from your API.
      </p>
    </main>
  );
}
