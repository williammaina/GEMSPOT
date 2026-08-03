import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, LayoutDashboard, MapPin, Plus, Pencil, Trash2,
  Shield, Users, Search, Save, X, Database, RefreshCw, Star,
} from 'lucide-react';
import { useApp } from '../../library/contexts/AppContext.js';
import { apiClient } from '../../library/handlers/apiClient.js';
import { placesData as seedPlaces } from '../../library/json/placesData.js';
import { eventsData as seedEvents } from '../../library/json/eventsData.js';
import {
  readAdminPlaces, writeAdminPlaces, readAdminEvents, writeAdminEvents,
} from '../../library/helpers/adminStore.js';
import { DashboardStyles as styles } from '@styles';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'places', label: 'Places', icon: MapPin },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'users', label: 'Users', icon: Users },
];

const CATEGORIES = [
  { value: 'nature', label: 'Nature' },
  { value: 'eats', label: 'Eats' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'action', label: 'Action' },
];

/** Map UI category slug → backend category name when needed */
const CAT_TO_BACKEND = {
  nature: 'Nature & Outdoors',
  eats: 'Cafes & Workspaces',
  nightlife: 'Nightlife & Vibes',
  action: 'Action & Adventure',
};

const EMPTY_PLACE = {
  name: '',
  category: 'eats',
  description: '',
  location: '',
  town: '',
  county: 'Nairobi',
  matatu: '',
  price: '',
  price_level: 'Mid-range',
  dress_code: '',
  opening_hours: '',
  image: '',
  gate_fee: '',
  wifi: true,
  verified: true,
  // eats
  menu_text: '',
  // action / nature
  activities_text: '',
  what_to_bring_text: '',
  // nightlife
  drinks_text: '',
  music_vibe: '',
};

const EMPTY_EVENT = {
  title: '',
  location: '',
  description: '',
  price: '',
  category: 'nightlife',
  image: '',
  startDate: '',
  host_name: '',
  host_org: '',
};

function linesToMenu(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      // "Dish name | 1200 | note" or "Dish name — 1200"
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 2) {
        const price = Number(String(parts[1]).replace(/[^\d.]/g, '')) || 0;
        return { name: parts[0], price, note: parts[2] || '' };
      }
      const m = line.match(/^(.*?)\s*[—–-]\s*(\d+)/);
      if (m) return { name: m[1].trim(), price: Number(m[2]), note: '' };
      return { name: line, price: 0, note: '' };
    });
}

function menuToLines(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  return arr
    .map((m) => {
      if (typeof m === 'string') return m;
      const bits = [m.name || m.title || ''];
      if (m.price) bits.push(String(m.price));
      if (m.note) bits.push(m.note);
      return bits.join(' | ');
    })
    .join('\n');
}

function linesToActivities(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      return {
        name: parts[0] || line,
        duration: parts[1] || '1–3 hrs',
        intensity: parts[2] || 'moderate',
      };
    });
}

function activitiesToLines(arr) {
  if (!Array.isArray(arr) || !arr.length) return '';
  return arr
    .map((a) => {
      if (typeof a === 'string') return a;
      return [a.name, a.duration, a.intensity].filter(Boolean).join(' | ');
    })
    .join('\n');
}

function linesToList(text) {
  return String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function listToLines(arr) {
  if (!Array.isArray(arr)) return arr ? String(arr) : '';
  return arr.join('\n');
}

function loadLocalPlaces() {
  const admin = readAdminPlaces();
  if (admin.length) {
    return admin.map((p, i) => ({
      ...p,
      place_id: p.place_id ?? p.id ?? `local-${i + 1}`,
      name: p.name || p.title,
      title: p.title || p.name,
    }));
  }
  return (seedPlaces || []).map((p, i) => ({
    ...p,
    place_id: p.place_id ?? p.id ?? `local-${i + 1}`,
    name: p.name || p.title,
    title: p.title || p.name,
  }));
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, pushToast } = useApp();
  const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');

  const [tab, setTab] = useState('overview');
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({ email: '', username: '', password: '', first_name: '', is_admin: false });
  const [showUserForm, setShowUserForm] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PLACE);
  const [saving, setSaving] = useState(false);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT);
  const [editingEvent, setEditingEvent] = useState(null);
  const [localEvents, setLocalEvents] = useState([]);
  const [statsApi, setStatsApi] = useState(null);

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

  const refresh = useCallback(async () => {
    setLoading(true);
    let list = loadLocalPlaces();
    try {
      const res = await apiClient.get('/places');
      const data = res.data?.data ?? res.data?.places ?? res.data;
      if (Array.isArray(data) && data.length) {
        list = data.map((p, i) => ({
          ...p,
          place_id: p.place_id ?? p.id ?? `api-${i}`,
          name: p.name || p.title,
          title: p.title || p.name,
          category: String(p.category || '').toLowerCase().includes('nature')
            ? 'nature'
            : String(p.category || '').toLowerCase().includes('cafe') || String(p.category || '').toLowerCase().includes('eat')
              ? 'eats'
              : String(p.category || '').toLowerCase().includes('night')
                ? 'nightlife'
                : String(p.category || '').toLowerCase().includes('action')
                  ? 'action'
                  : String(p.category || 'eats').toLowerCase(),
        }));
      }
    } catch {
      /* local fallback */
    }
    setPlaces(list);

    try {
      const er = await apiClient.get('/events');
      const ed = er.data?.data ?? er.data?.events ?? er.data;
      if (Array.isArray(ed) && ed.length) setEvents(ed);
      else setEvents(readAdminEvents().length ? readAdminEvents() : (seedEvents || []).slice(0, 20));
    } catch {
      setEvents(readAdminEvents().length ? readAdminEvents() : (seedEvents || []).slice(0, 20));
    }
    setLocalEvents(readAdminEvents());

    try {
      const sr = await apiClient.get('/admin');
      setStatsApi(sr.data || null);
    } catch {
      setStatsApi(null);
    }

    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      const data = res.data?.data ?? res.data?.users ?? res.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      pushToast?.(
        err?.response?.status === 403 ? 'Admin only' : 'Could not load users',
        'error'
      );
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin, refresh]);

  useEffect(() => {
    if (isAdmin && tab === 'users') loadUsers();
  }, [isAdmin, tab, loadUsers]);

  const filtered = useMemo(() => {
    let list = places;
    if (filterCat !== 'all') {
      list = list.filter((p) => String(p.category || '').toLowerCase() === filterCat);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          String(p.name || p.title || '').toLowerCase().includes(q) ||
          String(p.location || p.address || '').toLowerCase().includes(q) ||
          String(p.town || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [places, filterCat, query]);

  const stats = useMemo(() => {
    const byCat = CATEGORIES.map((c) => ({
      ...c,
      count: places.filter((p) => String(p.category || '').toLowerCase() === c.value).length,
    }));
    return {
      places: places.length,
      events: events.length,
      users: statsApi?.users_count ?? statsApi?.total_users ?? users.length ?? '—',
      byCat,
    };
  }, [places, events, statsApi, users.length]);

  const openNew = () => {
    setForm({ ...EMPTY_PLACE });
    setEditing('new');
  };

  const openEdit = (place) => {
    const cat = String(place.category || 'eats').toLowerCase();
    const slug = cat.includes('nature')
      ? 'nature'
      : cat.includes('night')
        ? 'nightlife'
        : cat.includes('action')
          ? 'action'
          : cat.includes('cafe') || cat.includes('eat') || cat === 'eats'
            ? 'eats'
            : cat;
    setForm({
      ...EMPTY_PLACE,
      ...place,
      name: place.name || place.title || '',
      category: slug,
      price: place.price ?? place.damage_for_two ?? '',
      matatu: place.matatu || place.matatu_route || '',
      image: place.image || place.featured_image || '',
      location: place.location || place.address || '',
      opening_hours: place.opening_hours || place.hours || '',
      dress_code: place.dress_code || place.dressCode || '',
      menu_text: menuToLines(place.menu_highlights || place.menuHighlights),
      activities_text: activitiesToLines(place.activities),
      what_to_bring_text: listToLines(place.what_to_bring || place.whatToBring),
      drinks_text: menuToLines(place.signature_drinks || place.signatureDrinks),
      music_vibe: place.music_vibe || place.musicVibe || '',
    });
    setEditing(place);
  };

  const closeForm = () => {
    setEditing(null);
    setForm(EMPTY_PLACE);
  };

  const onField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      pushToast?.('Name is required', 'error');
      return;
    }
    setSaving(true);

    const cat = form.category || 'eats';
    const menu_highlights = cat === 'eats' ? linesToMenu(form.menu_text) : undefined;
    const signature_drinks = cat === 'nightlife' ? linesToMenu(form.drinks_text) : undefined;
    const activities =
      cat === 'action' || cat === 'nature' ? linesToActivities(form.activities_text) : undefined;
    const what_to_bring =
      cat === 'action' || cat === 'nature' ? linesToList(form.what_to_bring_text) : undefined;

    const payload = {
      name: form.name.trim(),
      title: form.name.trim(),
      category: cat,
      category_name: CAT_TO_BACKEND[cat] || cat,
      description: form.description,
      address: form.location,
      location: form.location,
      town: form.town,
      county: form.county || 'Nairobi',
      matatu_route: form.matatu,
      matatu: form.matatu,
      damage_for_two: form.price ? Number(form.price) : null,
      price: form.price,
      price_level: form.price_level,
      dress_code: form.dress_code,
      opening_hours: form.opening_hours,
      gate_fee: form.gate_fee,
      featured_image: form.image,
      image: form.image,
      wifi: form.wifi,
      verified: form.verified,
      menu_highlights,
      menuHighlights: menu_highlights,
      signature_drinks,
      signatureDrinks: signature_drinks,
      activities,
      what_to_bring,
      whatToBring: what_to_bring,
      music_vibe: form.music_vibe || undefined,
    };

    let apiOk = false;
    let savedId = editing === 'new' ? null : editing.place_id || editing.id;

    try {
      if (editing === 'new') {
        const res = await apiClient.post('/places', payload);
        const saved = res.data?.place || res.data?.data || res.data;
        if (saved?.place_id || saved?.id) savedId = saved.place_id || saved.id;
        apiOk = true;
      } else if (savedId && String(savedId).match(/^\d+$/)) {
        await apiClient.put(`/places/${savedId}`, payload);
        apiOk = true;
      }
    } catch (err) {
      console.warn('Place API save failed', err?.response?.data || err.message);
    }

    const localRow = {
      ...payload,
      place_id: savedId || `admin-${Date.now()}`,
      id: savedId || `admin-${Date.now()}`,
      category: cat,
    };

    setPlaces((prev) => {
      let next;
      if (editing === 'new') next = [localRow, ...prev];
      else
        next = prev.map((p) =>
          String(p.place_id ?? p.id) === String(editing.place_id || editing.id)
            ? { ...p, ...localRow }
            : p
        );
      writeAdminPlaces(next);
      return next;
    });

    pushToast?.(
      apiOk
        ? editing === 'new'
          ? 'Place created — live on Explore'
          : 'Place updated'
        : 'Saved locally (API offline or error)',
      apiOk ? 'success' : 'info'
    );
    setSaving(false);
    closeForm();
  };

  const handleDelete = async (place) => {
    const id = place.place_id ?? place.id;
    if (!window.confirm(`Delete "${place.name || place.title}"?`)) return;
    try {
      if (String(id).match(/^\d+$/)) await apiClient.delete(`/places/${id}`);
    } catch {
      /* still remove local */
    }
    setPlaces((prev) => {
      const next = prev.filter((p) => String(p.place_id ?? p.id) !== String(id));
      writeAdminPlaces(next);
      return next;
    });
    pushToast?.('Place removed', 'success');
  };

  const toggleUserAdmin = async (u) => {
    const id = u.user_id || u.id;
    if (!id) return;
    try {
      await apiClient.patch(`/admin/users/${id}/admin`, { is_admin: !u.is_admin });
      pushToast?.(u.is_admin ? 'Admin removed' : 'Made admin', 'success');
      loadUsers();
    } catch {
      pushToast?.('Could not update user', 'error');
    }
  };


  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.email.trim() || !userForm.password) {
      pushToast?.('Email and password required', 'error');
      return;
    }
    setSavingUser(true);
    try {
      await apiClient.post('/admin/users', {
        email: userForm.email.trim(),
        username: userForm.username.trim() || userForm.email.trim().split('@')[0],
        password: userForm.password,
        first_name: userForm.first_name.trim() || 'User',
        is_admin: userForm.is_admin,
      });
      pushToast?.('User created', 'success');
      setShowUserForm(false);
      setUserForm({ email: '', username: '', password: '', first_name: '', is_admin: false });
      loadUsers();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Could not create user';
      pushToast?.(msg, 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (u) => {
    const id = u.user_id || u.id;
    const name = u.name || u.email || id;
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/admin/users/${id}`);
      pushToast?.('User deleted', 'success');
      loadUsers();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Could not delete user';
      pushToast?.(msg, 'error');
    }
  };

  if (!isAdmin) {
    return (
      <main className={styles.Page}>
        <p className={styles.Muted}>Checking admin access…</p>
      </main>
    );
  }

  const cat = form.category;

  return (
    <main className={styles.Page}>
      <header className={styles.Header}>
        <div>
          <Link to="/" className={styles.Back}>
            <ArrowLeft size={16} /> Back home
          </Link>
          <h1 className={styles.Title}>
            <Shield size={22} /> Admin dashboard
          </h1>
          <p className={styles.Sub}>
            Manage places, events, users · {user?.email || user?.name || 'admin'}
          </p>
        </div>
        <button type="button" className={styles.SecondaryBtn} onClick={refresh}>
          <RefreshCw size={16} /> Refresh
        </button>
      </header>

      <nav className={styles.Tabs}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? styles.TabActive : styles.Tab}
              onClick={() => setTab(t.id)}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </nav>

      {tab === 'overview' && (
        <section className={styles.Section}>
          <div className={styles.Stats}>
            <div className={styles.StatCard}>
              <MapPin size={20} />
              <div>
                <strong>{loading ? '…' : stats.places}</strong>
                <span>Places</span>
              </div>
            </div>
            <div className={styles.StatCard}>
              <CalendarDays size={20} />
              <div>
                <strong>{loading ? '…' : stats.events}</strong>
                <span>Events</span>
              </div>
            </div>
            <div className={styles.StatCard}>
              <Users size={20} />
              <div>
                <strong>{stats.users}</strong>
                <span>Users</span>
              </div>
            </div>
            <div className={styles.StatCard}>
              <Database size={20} />
              <div>
                <strong>{stats.byCat.reduce((a, c) => a + c.count, 0)}</strong>
                <span>Catalogued</span>
              </div>
            </div>
          </div>
          <div className={styles.CatGrid}>
            {stats.byCat.map((c) => (
              <button
                key={c.value}
                type="button"
                className={styles.CatCard}
                onClick={() => {
                  setFilterCat(c.value);
                  setTab('places');
                }}
              >
                <strong>{c.count}</strong>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          <p className={styles.Note}>
            <strong>Places</strong> support category-specific fields (menu for Eats, activities for
            Action, drinks for Nightlife). <strong>Users</strong> lists everyone registered.
            Ratings submitted on place pages are stored via <code>/api/reviews</code>.
          </p>
        </section>
      )}

      {tab === 'places' && (
        <section className={styles.Section}>
          <div className={styles.Toolbar}>
            <div className={styles.SearchWrap}>
              <Search size={16} />
              <input
                className={styles.SearchInput}
                placeholder="Search places…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className={styles.Select}
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <button type="button" className={styles.PrimaryBtn} onClick={openNew}>
              <Plus size={16} /> Add place
            </button>
          </div>

          {editing && (
            <form className={styles.FormCard} onSubmit={handleSave}>
              <div className={styles.FormHead}>
                <h2>{editing === 'new' ? 'Add place' : 'Edit place'}</h2>
                <button type="button" className={styles.IconBtn} onClick={closeForm}>
                  <X size={18} />
                </button>
              </div>
              <div className={styles.FormGrid}>
                <label>
                  Name *
                  <input
                    required
                    value={form.name}
                    onChange={(e) => onField('name', e.target.value)}
                  />
                </label>
                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) => onField('category', e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.Full}>
                  Description
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => onField('description', e.target.value)}
                  />
                </label>
                <label>
                  Location / address
                  <input
                    value={form.location}
                    onChange={(e) => onField('location', e.target.value)}
                  />
                </label>
                <label>
                  Town
                  <input value={form.town} onChange={(e) => onField('town', e.target.value)} />
                </label>
                <label>
                  County
                  <input
                    value={form.county}
                    onChange={(e) => onField('county', e.target.value)}
                  />
                </label>
                <label>
                  Matatu / directions
                  <input
                    value={form.matatu}
                    onChange={(e) => onField('matatu', e.target.value)}
                  />
                </label>
                <label>
                  Damage for two (KES)
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => onField('price', e.target.value)}
                  />
                </label>
                <label>
                  Price level
                  <select
                    value={form.price_level}
                    onChange={(e) => onField('price_level', e.target.value)}
                  >
                    <option>Budget</option>
                    <option>Mid-range</option>
                    <option>Premium</option>
                    <option>Luxury</option>
                  </select>
                </label>
                <label>
                  Dress code
                  <input
                    value={form.dress_code}
                    onChange={(e) => onField('dress_code', e.target.value)}
                  />
                </label>
                <label>
                  Opening hours
                  <input
                    value={form.opening_hours}
                    onChange={(e) => onField('opening_hours', e.target.value)}
                  />
                </label>
                <label>
                  Gate fee
                  <input
                    value={form.gate_fee}
                    onChange={(e) => onField('gate_fee', e.target.value)}
                  />
                </label>
                <label className={styles.Full}>
                  Image URL
                  <input
                    value={form.image}
                    onChange={(e) => onField('image', e.target.value)}
                    placeholder="https://…"
                  />
                </label>

                {/* Eats — popular foods / menu highlights */}
                {cat === 'eats' && (
                  <label className={styles.Full}>
                    Popular dishes (one per line: Name | price | note)
                    <textarea
                      rows={4}
                      value={form.menu_text}
                      onChange={(e) => onField('menu_text', e.target.value)}
                      placeholder={'Nyama Choma Platter | 2200 | Goat & kachumbari\nSukuma Pasta | 980 | Local greens'}
                    />
                    <span className={styles.FieldHint}>
                      Shows on place detail as menu highlights.
                    </span>
                  </label>
                )}

                {/* Nightlife — signature drinks */}
                {cat === 'nightlife' && (
                  <>
                    <label className={styles.Full}>
                      Signature drinks (one per line: Name | price | note)
                      <textarea
                        rows={4}
                        value={form.drinks_text}
                        onChange={(e) => onField('drinks_text', e.target.value)}
                        placeholder={'Dawa | 750 | Honey, lime, vodka\nTusker Pint | 350 | Cold'}
                      />
                    </label>
                    <label className={styles.Full}>
                      Music / vibe
                      <input
                        value={form.music_vibe}
                        onChange={(e) => onField('music_vibe', e.target.value)}
                        placeholder="Afrobeats, deep house…"
                      />
                    </label>
                  </>
                )}

                {/* Action / Nature — activities & what to bring */}
                {(cat === 'action' || cat === 'nature') && (
                  <>
                    <label className={styles.Full}>
                      Activities (one per line: Name | duration | intensity)
                      <textarea
                        rows={4}
                        value={form.activities_text}
                        onChange={(e) => onField('activities_text', e.target.value)}
                        placeholder={'Ridge hike | 1–3 hrs | moderate\nSunrise photos | 1 hr | easy'}
                      />
                    </label>
                    <label className={styles.Full}>
                      What to bring (one item per line)
                      <textarea
                        rows={3}
                        value={form.what_to_bring_text}
                        onChange={(e) => onField('what_to_bring_text', e.target.value)}
                        placeholder={'Water\nClosed shoes\nSun protection'}
                      />
                    </label>
                  </>
                )}
              </div>
              <div className={styles.FormActions}>
                <button type="button" className={styles.SecondaryBtn} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className={styles.PrimaryBtn} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving…' : 'Save place'}
                </button>
              </div>
            </form>
          )}

          <div className={styles.TableWrap}>
            <table className={styles.Table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5}>Loading…</td>
                  </tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5}>No places match.</td>
                  </tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.place_id ?? p.id}>
                    <td>
                      <strong>{p.name || p.title}</strong>
                    </td>
                    <td>
                      <span className={styles.Pill}>{p.category || '—'}</span>
                    </td>
                    <td>{p.location || p.address || p.town || '—'}</td>
                    <td>
                      {p.price != null
                        ? String(p.price)
                        : p.damage_for_two != null
                          ? String(p.damage_for_two)
                          : '—'}
                    </td>
                    <td className={styles.RowActions}>
                      <button
                        type="button"
                        className={styles.IconBtn}
                        onClick={() => openEdit(p)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.IconBtnDanger}
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'events' && (
        <section className={styles.Section}>
          <div className={styles.Toolbar}>
            <p className={styles.Note} style={{ flex: 1, margin: 0 }}>
              Events appear on the Events page. Include <strong>Hosted by</strong>.
            </p>
            <button
              type="button"
              className={styles.PrimaryBtn}
              onClick={() => {
                setEventForm({ ...EMPTY_EVENT });
                setEditingEvent('new');
              }}
            >
              <Plus size={16} /> Add event
            </button>
          </div>

          {editingEvent && (
            <form
              className={styles.FormCard}
              onSubmit={async (e) => {
                e.preventDefault();
                if (!eventForm.title.trim()) {
                  pushToast?.('Title required', 'error');
                  return;
                }
                const localId =
                  editingEvent === 'new'
                    ? `admin-ev-${Date.now()}`
                    : editingEvent.id || editingEvent.event_id;
                const payload = {
                  title: eventForm.title,
                  venue_name: eventForm.location,
                  location: eventForm.location,
                  description: eventForm.description,
                  start_date: eventForm.startDate || undefined,
                  startDate: eventForm.startDate || undefined,
                  ticket_price: eventForm.price,
                  price: eventForm.price,
                  banner: eventForm.image,
                  image: eventForm.image,
                  category: eventForm.category,
                  host_name: eventForm.host_name,
                  host_org: eventForm.host_org,
                  host: {
                    name: eventForm.host_name || 'GemSpot',
                    org: eventForm.host_org || '',
                  },
                };
                let apiOk = false;
                try {
                  if (editingEvent === 'new') {
                    const res = await apiClient.post('/events', payload);
                    const saved = res.data?.event || res.data?.data || res.data;
                    if (saved?.event_id || saved?.id) {
                      payload.id = saved.event_id || saved.id;
                      payload.event_id = saved.event_id || saved.id;
                    }
                  } else if (String(localId).match(/^\d+$/)) {
                    await apiClient.put(`/events/${localId}`, payload);
                    payload.id = localId;
                    payload.event_id = localId;
                  }
                  apiOk = true;
                } catch (err) {
                  console.warn('Event API save failed', err?.response?.data || err.message);
                  payload.id = localId;
                  payload.event_id = localId;
                }

                const prev = readAdminEvents();
                let next;
                if (editingEvent === 'new') next = [payload, ...prev];
                else {
                  next = prev.map((x) =>
                    String(x.id || x.event_id) === String(localId) ? { ...x, ...payload } : x
                  );
                  if (!prev.find((x) => String(x.id || x.event_id) === String(localId))) {
                    next = [payload, ...prev];
                  }
                }
                writeAdminEvents(next);
                setLocalEvents(next);
                setEvents((evs) => {
                  const map = new Map(evs.map((x) => [String(x.id || x.event_id), x]));
                  map.set(String(payload.id || payload.event_id), payload);
                  return Array.from(map.values());
                });
                pushToast?.(
                  apiOk ? 'Event saved — visible on Events page' : 'Event saved locally',
                  apiOk ? 'success' : 'info'
                );
                setEditingEvent(null);
              }}
            >
              <div className={styles.FormHead}>
                <h2>{editingEvent === 'new' ? 'Add event' : 'Edit event'}</h2>
                <button
                  type="button"
                  className={styles.IconBtn}
                  onClick={() => setEditingEvent(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.FormGrid}>
                <label>
                  Title *
                  <input
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </label>
                <label>
                  Category
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option value="food">Food</option>
                    <option value="music">Music</option>
                    <option value="nightlife">Nightlife</option>
                    <option value="nature">Nature</option>
                    <option value="sports">Sports / Action</option>
                    <option value="arts">Arts</option>
                  </select>
                </label>
                <label className={styles.Full}>
                  Description
                  <textarea
                    rows={3}
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Venue / location
                  <input
                    value={eventForm.location}
                    onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </label>
                <label>
                  Ticket price
                  <input
                    value={eventForm.price}
                    onChange={(e) => setEventForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 1500 or Free"
                  />
                </label>
                <label>
                  Hosted by (name)
                  <input
                    value={eventForm.host_name}
                    onChange={(e) => setEventForm((f) => ({ ...f, host_name: e.target.value }))}
                    placeholder="e.g. Climb Zone"
                  />
                </label>
                <label>
                  Host organisation
                  <input
                    value={eventForm.host_org}
                    onChange={(e) => setEventForm((f) => ({ ...f, host_org: e.target.value }))}
                    placeholder="e.g. Climb Zone KE"
                  />
                </label>
                <label>
                  Start date
                  <input
                    type="datetime-local"
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </label>
                <label className={styles.Full}>
                  Image URL
                  <input
                    value={eventForm.image}
                    onChange={(e) => setEventForm((f) => ({ ...f, image: e.target.value }))}
                  />
                </label>
              </div>
              <div className={styles.FormActions}>
                <button
                  type="button"
                  className={styles.SecondaryBtn}
                  onClick={() => setEditingEvent(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.PrimaryBtn}>
                  <Save size={16} /> Save event
                </button>
              </div>
            </form>
          )}

          <ul className={styles.SimpleList}>
            {(localEvents.length ? localEvents : events).length === 0 && (
              <li>No events yet. Click Add event.</li>
            )}
            {(localEvents.length ? localEvents : events).slice(0, 40).map((ev, i) => (
              <li key={ev.id || ev.event_id || i}>
                <strong>{ev.title || 'Untitled'}</strong>
                <span>
                  {ev.location || ev.venue_name || ''}
                  {(ev.host_name || ev.host?.name) &&
                    ` · Hosted by ${ev.host_name || ev.host?.name}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'users' && (
        <section className={styles.Section}>
          <div className={styles.Toolbar}>
            <p className={styles.Note} style={{ flex: 1, margin: 0 }}>
              Registered accounts. Last admin cannot be deleted or demoted.
            </p>
            <button type="button" className={styles.SecondaryBtn} onClick={loadUsers}>
              <RefreshCw size={16} /> Reload
            </button>
            <button
              type="button"
              className={styles.PrimaryBtn}
              onClick={() => setShowUserForm((v) => !v)}
            >
              <Plus size={16} /> {showUserForm ? 'Close' : 'Add user'}
            </button>
          </div>

          {showUserForm && (
            <form className={styles.FormCard} onSubmit={handleCreateUser}>
              <div className={styles.FormHead}>
                <h2>Add user</h2>
              </div>
              <div className={styles.FormGrid}>
                <label>
                  Email *
                  <input
                    required
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </label>
                <label>
                  Username
                  <input
                    value={userForm.username}
                    onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                    placeholder="optional"
                  />
                </label>
                <label>
                  First name
                  <input
                    value={userForm.first_name}
                    onChange={(e) => setUserForm((f) => ({ ...f, first_name: e.target.value }))}
                  />
                </label>
                <label>
                  Password *
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={userForm.password}
                    onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </label>
                <label className={styles.Full} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={userForm.is_admin}
                    onChange={(e) => setUserForm((f) => ({ ...f, is_admin: e.target.checked }))}
                  />
                  Grant admin access
                </label>
              </div>
              <div className={styles.FormActions}>
                <button type="button" className={styles.SecondaryBtn} onClick={() => setShowUserForm(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.PrimaryBtn} disabled={savingUser}>
                  <Save size={16} /> {savingUser ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          )}

          <div className={styles.TableWrap}>
            <table className={styles.Table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {usersLoading && (
                  <tr>
                    <td colSpan={5}>Loading users…</td>
                  </tr>
                )}
                {!usersLoading && users.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      No users from API. Sign in as admin with a live backend, or register accounts
                      first.
                    </td>
                  </tr>
                )}
                {users.map((u) => {
                  const name =
                    u.name ||
                    [u.first_name, u.last_name].filter(Boolean).join(' ') ||
                    u.username ||
                    '—';
                  return (
                    <tr key={u.user_id || u.id || u.email}>
                      <td>
                        <strong>{name}</strong>
                      </td>
                      <td>{u.email || '—'}</td>
                      <td>{u.username || '—'}</td>
                      <td>
                        <span className={styles.Pill}>
                          {u.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className={styles.RowActions}>
                        <button
                          type="button"
                          className={styles.SecondaryBtn}
                          onClick={() => toggleUserAdmin(u)}
                        >
                          {u.is_admin ? 'Revoke admin' : 'Make admin'}
                        </button>
                        <button
                          type="button"
                          className={styles.IconBtnDanger}
                          onClick={() => handleDeleteUser(u)}
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={styles.Note}>
            Demo admin: <code>admin@gemspot.co.ke / AdminPass2026!</code>
          </p>
        </section>
      )}
    </main>
  );
}
