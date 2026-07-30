import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, LayoutDashboard, MapPin, Shield, Users,
  Sparkles, TrendingUp, Eye, Heart, Settings, Database,
} from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { apiClient } from '../../library/handlers/apiClient.js';
import { placesData } from '../../library/json/placesData.js';
import { DashboardStyles as styles } from '@styles';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, pushToast, recentPlaces = [], favorites = [] } = useApp();
  const [stats, setStats] = useState({ places: placesData.length, events: '—', users: '—' });
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
        let placesCount = placesData.length;
        let eventsCount = '—';
        let usersCount = '—';
        try {
          const admin = await apiClient.get('/admin');
          const data = admin.data?.data || admin.data || {};
          placesCount = data.places_count ?? data.places ?? placesCount;
          eventsCount = data.events_count ?? data.events ?? eventsCount;
          usersCount = data.users_count ?? usersCount;
        } catch {
          try {
            const [placesRes, eventsRes] = await Promise.all([
              apiClient.get('/places').catch(() => null),
              apiClient.get('/events').catch(() => null),
            ]);
            const unwrap = (payload) => {
              if (!payload) return null;
              const d = payload.data ?? payload;
              if (Array.isArray(d)) return d.length;
              if (Array.isArray(d.data)) return d.data.length;
              if (Array.isArray(d.places)) return d.places.length;
              if (Array.isArray(d.events)) return d.events.length;
              if (typeof d.total === 'number') return d.total;
              return null;
            };
            placesCount = unwrap(placesRes) ?? placesCount;
            eventsCount = unwrap(eventsRes) ?? eventsCount;
          } catch { /* seed */ }
        }
        if (!cancelled) setStats({ places: placesCount, events: eventsCount, users: usersCount });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (isAdmin) load();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const byCategory = useMemo(() => {
    const map = {};
    placesData.forEach((p) => {
      const c = p.category || 'other';
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  if (!user?.isAuthenticated || !isAdmin) return null;

  return (
    <main className={styles.Page}>
      <Link to="/profile" className={styles.Back}>
        <ArrowLeft size={16} /> Profile
      </Link>
      <header className={styles.Header}>
        <div className={styles.Avatar}><Shield size={26} /></div>
        <div>
          <h1 className={styles.Title}>Admin dashboard</h1>
          <p className={styles.Sub}>
            Signed in as {user?.name || user?.email || 'Admin'} · GemSpot KE ops
          </p>
        </div>
      </header>
      <section className={styles.Stats}>
        <div className={styles.StatCard}>
          <strong>{loading ? '…' : stats.places}</strong>
          <span><MapPin size={14} /> Places</span>
        </div>
        <div className={styles.StatCard}>
          <strong>{loading ? '…' : stats.events}</strong>
          <span><CalendarDays size={14} /> Events</span>
        </div>
        <div className={styles.StatCard}>
          <strong>{loading ? '…' : stats.users}</strong>
          <span><Users size={14} /> Users</span>
        </div>
        <div className={styles.StatCard}>
          <strong>{Array.isArray(favorites) ? favorites.length : 0}</strong>
          <span><Heart size={14} /> Your saves</span>
        </div>
      </section>
      <section className={styles.TwoCol}>
        <div className={styles.Panel}>
          <h2><Database size={16} /> Places by category</h2>
          <ul className={styles.CatList}>
            {byCategory.map(([cat, n]) => (
              <li key={cat}>
                <span className={styles.CatName} data-cat={cat}>{cat}</span>
                <span className={styles.CatCount}>{n}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.Panel}>
          <h2><Eye size={16} /> Recent views</h2>
          {recentPlaces.length === 0 ? (
            <p className={styles.Empty}>No place views yet.</p>
          ) : (
            <ul className={styles.RecentList}>
              {recentPlaces.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link to={`/place/${p.id}`}>{p.title || p.id}</Link>
                  <small>{p.location}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className={styles.Menu}>
        <div className={styles.MenuItemStatic}>
          <LayoutDashboard size={18} />
          <span>
            <strong>Content pipeline</strong>
            <small>Seed data + Flask /api/admin for live CRUD</small>
          </span>
        </div>
        <Link to="/explore" className={styles.MenuItem}><MapPin size={18} /> Browse places</Link>
        <Link to="/events" className={styles.MenuItem}><CalendarDays size={18} /> Browse events</Link>
        <Link to="/explore?category=nature" className={styles.MenuItem}><Sparkles size={18} /> Nature listings</Link>
        <Link to="/explore?category=eats" className={styles.MenuItem}><TrendingUp size={18} /> Eats listings</Link>
        <div className={styles.MenuItemStatic}>
          <Settings size={18} />
          <span><strong>Settings</strong><small>Theme, API base URL via .env</small></span>
        </div>
      </section>
      <p className={styles.Note}>
        Demo admin: <code>admin@gemspot.co.ke</code> / <code>AdminPass2026!</code> — works offline.
        Wire full CRUD to <code>/api/admin</code> when the backend is ready.
      </p>
    </main>
  );
}
