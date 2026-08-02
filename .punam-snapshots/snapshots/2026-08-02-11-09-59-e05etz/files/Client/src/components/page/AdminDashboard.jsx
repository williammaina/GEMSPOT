import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, LayoutDashboard, MapPin, Plus, Pencil, Trash2,
  Shield, Users, Search, Save, X, Database, RefreshCw,
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
const EMPTY_PLACE = {
  name: '', title: '', category: 'eats', description: '', location: '', town: '',
  county: 'Nairobi', matatu: '', price: '', price_level: 'Mid-range', dress_code: '',
  opening_hours: '', image: '', gate_fee: '', wifi: true, parking: true, verified: true,
};
function loadLocalPlaces() {
  const admin = readAdminPlaces();
  if (admin.length) return admin.map((p, i) => ({
    ...p, place_id: p.place_id ?? p.id ?? `local-${i + 1}`,
    name: p.name || p.title, title: p.title || p.name,
  }));
  return (seedPlaces || []).map((p, i) => ({
    ...p, place_id: p.place_id ?? p.id ?? `local-${i + 1}`,
    name: p.name || p.title, title: p.title || p.name,
  }));
}
function saveLocalPlaces(list) {
  writeAdminPlaces(list);
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, pushToast } = useApp();
  const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');
  const [tab, setTab] = useState('overview');
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PLACE);
  const [saving, setSaving] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', location: '', description: '', price: '', category: 'food', image: '', startDate: '' });
  const [editingEvent, setEditingEvent] = useState(null);
  const [localEvents, setLocalEvents] = useState([]);

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
          ...p, place_id: p.place_id ?? p.id ?? `api-${i}`,
          name: p.name || p.title, title: p.title || p.name,
        }));
      }
    } catch {}
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
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin, refresh]);

  const filtered = useMemo(() => {
    let list = places;
    if (filterCat !== 'all') list = list.filter((p) => String(p.category || '').toLowerCase() === filterCat);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        String(p.name || p.title || '').toLowerCase().includes(q) ||
        String(p.location || '').toLowerCase().includes(q) ||
        String(p.town || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [places, filterCat, query]);

  const stats = useMemo(() => {
    const byCat = CATEGORIES.map((c) => ({
      ...c, count: places.filter((p) => String(p.category || '').toLowerCase() === c.value).length,
    }));
    return { places: places.length, events: events.length || '—', byCat };
  }, [places, events]);

  const openNew = () => { setForm({ ...EMPTY_PLACE }); setEditing('new'); };
  const openEdit = (place) => {
    setForm({
      ...EMPTY_PLACE, ...place,
      name: place.name || place.title || '', title: place.title || place.name || '',
      price: place.price ?? place.damage_for_two ?? '',
      matatu: place.matatu || place.matatu_route || '',
      image: place.image || place.featured_image || '',
      opening_hours: place.opening_hours || place.hours || '',
      dress_code: place.dress_code || place.dressCode || '',
    });
    setEditing(place);
  };
  const closeForm = () => { setEditing(null); setForm(EMPTY_PLACE); };
  const onField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) { pushToast?.('Name is required', 'error'); return; }
    setSaving(true);
    const payload = {
      ...form, title: form.title || form.name, name: form.name,
      place_id: editing === 'new' ? `admin-${Date.now()}` : (editing.place_id || editing.id),
      damage_for_two: form.price ? Number(form.price) : null,
      featured_image: form.image, matatu_route: form.matatu,
    };
    let apiOk = false;
    try {
      if (editing === 'new') await apiClient.post('/places', payload);
      else await apiClient.put(`/places/${payload.place_id}`, payload);
      apiOk = true;
    } catch {}
    setPlaces((prev) => {
      let next;
      if (editing === 'new') next = [{ ...payload }, ...prev];
      else next = prev.map((p) => String(p.place_id ?? p.id) === String(payload.place_id) ? { ...p, ...payload } : p);
      writeAdminPlaces(next);
      return next;
    });
    pushToast?.(apiOk ? (editing === 'new' ? 'Place created' : 'Place updated') : 'Saved locally (API offline)', 'success');
    setSaving(false);
    closeForm();
  };

  const handleDelete = async (place) => {
    const id = place.place_id ?? place.id;
    if (!window.confirm(`Delete "${place.name || place.title}"?`)) return;
    try { await apiClient.delete(`/places/${id}`); } catch {}
    setPlaces((prev) => {
      const next = prev.filter((p) => String(p.place_id ?? p.id) !== String(id));
      writeAdminPlaces(next);
      return next;
    });
    pushToast?.('Place removed', 'success');
  };

  if (!isAdmin) return (<main className={styles.Page}><p className={styles.Muted}>Checking admin access…</p></main>);

  return (
    <main className={styles.Page}>
      <header className={styles.Header}>
        <div>
          <Link to="/" className={styles.Back}><ArrowLeft size={16} /> Back home</Link>
          <h1 className={styles.Title}><Shield size={22} /> Admin dashboard</h1>
          <p className={styles.Sub}>Manage places, events and content · {user?.email || user?.name || 'admin'}</p>
        </div>
        <button type="button" className={styles.SecondaryBtn} onClick={refresh}><RefreshCw size={16} /> Refresh</button>
      </header>

      <nav className={styles.Tabs}>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} type="button" className={tab === t.id ? styles.TabActive : styles.Tab} onClick={() => setTab(t.id)}>
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </nav>

      {tab === 'overview' && (
        <section className={styles.Section}>
          <div className={styles.Stats}>
            <div className={styles.StatCard}><MapPin size={20} /><div><strong>{loading ? '…' : stats.places}</strong><span>Places</span></div></div>
            <div className={styles.StatCard}><CalendarDays size={20} /><div><strong>{loading ? '…' : stats.events}</strong><span>Events</span></div></div>
            <div className={styles.StatCard}><Database size={20} /><div><strong>{stats.byCat.reduce((a, c) => a + c.count, 0)}</strong><span>Catalogued</span></div></div>
          </div>
          <div className={styles.CatGrid}>
            {stats.byCat.map((c) => (
              <button key={c.value} type="button" className={styles.CatCard} onClick={() => { setFilterCat(c.value); setTab('places'); }}>
                <strong>{c.count}</strong><span>{c.label}</span>
              </button>
            ))}
          </div>
          <p className={styles.Note}>Use <strong>Places</strong> to add nature, eats, nightlife and action. API first, local fallback.</p>
        </section>
      )}

      {tab === 'places' && (
        <section className={styles.Section}>
          <div className={styles.Toolbar}>
            <div className={styles.SearchWrap}>
              <Search size={16} />
              <input className={styles.SearchInput} placeholder="Search places…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select className={styles.Select} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <button type="button" className={styles.PrimaryBtn} onClick={openNew}><Plus size={16} /> Add place</button>
          </div>

          {editing && (
            <form className={styles.FormCard} onSubmit={handleSave}>
              <div className={styles.FormHead}>
                <h2>{editing === 'new' ? 'Add place' : 'Edit place'}</h2>
                <button type="button" className={styles.IconBtn} onClick={closeForm}><X size={18} /></button>
              </div>
              <div className={styles.FormGrid}>
                <label>Name *<input required value={form.name} onChange={(e) => onField('name', e.target.value)} /></label>
                <label>Category
                  <select value={form.category} onChange={(e) => onField('category', e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </label>
                <label className={styles.Full}>Description<textarea rows={3} value={form.description} onChange={(e) => onField('description', e.target.value)} /></label>
                <label>Location<input value={form.location} onChange={(e) => onField('location', e.target.value)} /></label>
                <label>Town<input value={form.town} onChange={(e) => onField('town', e.target.value)} /></label>
                <label>County<input value={form.county} onChange={(e) => onField('county', e.target.value)} /></label>
                <label>Matatu / directions<input value={form.matatu} onChange={(e) => onField('matatu', e.target.value)} /></label>
                <label>Damage for two (KES)<input type="number" value={form.price} onChange={(e) => onField('price', e.target.value)} /></label>
                <label>Price level
                  <select value={form.price_level} onChange={(e) => onField('price_level', e.target.value)}>
                    <option>Budget</option><option>Mid-range</option><option>Premium</option><option>Luxury</option>
                  </select>
                </label>
                <label>Dress code<input value={form.dress_code} onChange={(e) => onField('dress_code', e.target.value)} /></label>
                <label>Opening hours<input value={form.opening_hours} onChange={(e) => onField('opening_hours', e.target.value)} /></label>
                <label>Gate fee<input value={form.gate_fee} onChange={(e) => onField('gate_fee', e.target.value)} /></label>
                <label className={styles.Full}>Image URL<input value={form.image} onChange={(e) => onField('image', e.target.value)} /></label>
              </div>
              <div className={styles.FormActions}>
                <button type="button" className={styles.SecondaryBtn} onClick={closeForm}>Cancel</button>
                <button type="submit" className={styles.PrimaryBtn} disabled={saving}><Save size={16} /> {saving ? 'Saving…' : 'Save place'}</button>
              </div>
            </form>
          )}

          <div className={styles.TableWrap}>
            <table className={styles.Table}>
              <thead><tr><th>Name</th><th>Category</th><th>Location</th><th>Price</th><th /></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={5}>Loading…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={5}>No places match.</td></tr>}
                {filtered.map((p) => (
                  <tr key={p.place_id ?? p.id}>
                    <td><strong>{p.name || p.title}</strong></td>
                    <td><span className={styles.Pill}>{p.category || '—'}</span></td>
                    <td>{p.location || p.town || '—'}</td>
                    <td>{p.price != null ? String(p.price) : (p.damage_for_two != null ? String(p.damage_for_two) : '—')}</td>
                    <td className={styles.RowActions}>
                      <button type="button" className={styles.IconBtn} onClick={() => openEdit(p)}><Pencil size={15} /></button>
                      <button type="button" className={styles.IconBtnDanger} onClick={() => handleDelete(p)}><Trash2 size={15} /></button>
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
            <p className={styles.Note} style={{ flex: 1, margin: 0 }}>Create events shown on the Events page.</p>
            <button type="button" className={styles.PrimaryBtn} onClick={() => {
              setEventForm({ title: '', location: '', description: '', price: '', category: 'food', image: '', startDate: '' });
              setEditingEvent('new');
            }}><Plus size={16} /> Add event</button>
          </div>
          {editingEvent && (
            <form className={styles.FormCard} onSubmit={async (e) => {
              e.preventDefault();
              if (!eventForm.title.trim()) { pushToast?.('Title required', 'error'); return; }
              const localId = editingEvent === 'new' ? `admin-ev-${Date.now()}` : (editingEvent.id || editingEvent.event_id);
              const payload = {
                ...eventForm,
                id: localId,
                event_id: localId,
                title: eventForm.title,
                venue_name: eventForm.location,
                location: eventForm.location,
                start_date: eventForm.startDate || undefined,
                startDate: eventForm.startDate || undefined,
                ticket_price: eventForm.price,
                price: eventForm.price,
                banner: eventForm.image,
                image: eventForm.image,
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
                }
                apiOk = true;
              } catch {}
              const prev = readAdminEvents();
              let next;
              if (editingEvent === 'new') next = [payload, ...prev];
              else next = prev.map((x) => String(x.id || x.event_id) === String(localId) ? { ...x, ...payload } : x);
              if (editingEvent !== 'new' && !prev.find((x) => String(x.id || x.event_id) === String(localId))) {
                next = [payload, ...prev];
              }
              writeAdminEvents(next);
              setLocalEvents(next);
              setEvents((evs) => {
                const map = new Map(evs.map((x) => [String(x.id || x.event_id), x]));
                map.set(String(payload.id), payload);
                return Array.from(map.values());
              });
              pushToast?.(apiOk ? 'Event saved — visible on Events page' : 'Event saved locally (API offline)', 'success');
              setEditingEvent(null);
            }}>
              <div className={styles.FormHead}>
                <h2>{editingEvent === 'new' ? 'Add event' : 'Edit event'}</h2>
                <button type="button" className={styles.IconBtn} onClick={() => setEditingEvent(null)}><X size={18} /></button>
              </div>
              <div className={styles.FormGrid}>
                <label>Title *<input required value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} /></label>
                <label>Category
                  <select value={eventForm.category} onChange={(e) => setEventForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="food">Food</option>
                    <option value="music">Music</option>
                    <option value="nightlife">Nightlife</option>
                    <option value="nature">Nature</option>
                    <option value="sports">Sports</option>
                    <option value="arts">Arts</option>
                  </select>
                </label>
                <label className={styles.Full}>Description<textarea rows={3} value={eventForm.description} onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))} /></label>
                <label>Location<input value={eventForm.location} onChange={(e) => setEventForm((f) => ({ ...f, location: e.target.value }))} /></label>
                <label>Price / ticket<input value={eventForm.price} onChange={(e) => setEventForm((f) => ({ ...f, price: e.target.value }))} placeholder="e.g. 1500 or Free" /></label>
                <label>Start date<input type="datetime-local" value={eventForm.startDate} onChange={(e) => setEventForm((f) => ({ ...f, startDate: e.target.value }))} /></label>
                <label className={styles.Full}>Image URL<input value={eventForm.image} onChange={(e) => setEventForm((f) => ({ ...f, image: e.target.value }))} /></label>
              </div>
              <div className={styles.FormActions}>
                <button type="button" className={styles.SecondaryBtn} onClick={() => setEditingEvent(null)}>Cancel</button>
                <button type="submit" className={styles.PrimaryBtn}><Save size={16} /> Save event</button>
              </div>
            </form>
          )}
          <ul className={styles.SimpleList}>
            {(localEvents.length ? localEvents : events).length === 0 && <li>No events yet. Click Add event.</li>}
            {(localEvents.length ? localEvents : events).slice(0, 40).map((ev, i) => (
              <li key={ev.id || ev.event_id || i}>
                <strong>{ev.title || 'Untitled'}</strong>
                <span>{ev.location || ev.venue_name || ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'users' && (
        <section className={styles.Section}>
          <p className={styles.Note}>Demo admin: <code>admin@gemspot.co.ke / AdminPass2026!</code></p>
        </section>
      )}
    </main>
  );
}
