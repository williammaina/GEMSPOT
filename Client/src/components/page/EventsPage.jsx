import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarPlus,
  Clock,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import { EventsPageStyles as styles } from '@styles';
import { useCalendar, useEvents } from '@library';
import { useApp } from '../../library/contexts/AppContext.js';

/**
 * Luma-inspired Events page:
 * - Sticky filter + search toolbar
 * - Horizontal date chips
 * - Featured event highlight
 * - Date-grouped list rows (time | content | CTA)
 * - Calendar / “I’m interested” actions
 */

const vibeFilters = [
  { id: 'all', label: 'All events' },
  { id: 'music', label: 'Music' },
  { id: 'food', label: 'Food' },
  { id: 'sports', label: 'Sports' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'arts', label: 'Arts' },
  { id: 'nature', label: 'Nature' },
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseEventDate(event) {
  if (event.startDate) {
    const d = new Date(event.startDate);
    if (!Number.isNaN(d.getTime())) return d;
  }
  // fallback from day/month strings
  if (event.day && event.month) {
    const year = new Date().getFullYear();
    const d = new Date(`${event.month} ${event.day}, ${year}`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function formatDayChip(date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return { label: 'Today', sub: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }) };
  if (diff === 1) return { label: 'Tomorrow', sub: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }) };
  return {
    label: date.toLocaleDateString('en', { weekday: 'short' }),
    sub: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
  };
}

function formatTime(event, date) {
  if (event.time) return event.time;
  if (date) {
    return date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  }
  return '';
}

function groupByDate(events) {
  const map = new Map();
  for (const event of events) {
    const d = parseEventDate(event);
    const key = d ? startOfDay(d).toISOString() : 'soon';
    if (!map.has(key)) map.set(key, { date: d, items: [] });
    map.get(key).items.push(event);
  }
  return [...map.entries()]
    .sort(([a], [b]) => {
      if (a === 'soon') return 1;
      if (b === 'soon') return -1;
      return a.localeCompare(b);
    })
    .map(([key, val]) => ({ key, ...val }));
}

export function EventsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { syncEvent } = useCalendar();
  const { toggleInterestedEvent, isInterestedEvent, pushToast } = useApp();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');

  const { events, featured: featuredEvent, loading, source, total } = useEvents({
    query,
    category: activeFilter,
  });

  const dayChips = useMemo(() => {
    const chips = [{ id: 'all', label: 'All', sub: 'Upcoming' }];
    const seen = new Set();
    for (const event of events) {
      const d = parseEventDate(event);
      if (!d) continue;
      const key = startOfDay(d).toISOString();
      if (seen.has(key)) continue;
      seen.add(key);
      const { label, sub } = formatDayChip(d);
      chips.push({ id: key, label, sub, date: d });
      if (chips.length >= 8) break;
    }
    return chips;
  }, [events]);

  const filtered = useMemo(() => {
    if (selectedDay === 'all') return events;
    return events.filter((e) => {
      const d = parseEventDate(e);
      if (!d) return false;
      return startOfDay(d).toISOString() === selectedDay;
    });
  }, [events, selectedDay]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);


  return (
    <main className={styles.Page}>
      {/* Luma-style top bar */}
      <header className={styles.Toolbar}>
        <div className={styles.ToolbarLeft}>
          <h1 className={styles.PageTitle}>Events</h1>
          <p className={styles.PageSub}>
            Discover what’s happening across Kenya
            {source === 'api' && <span className={styles.LiveDot}> · live</span>}
          </p>
        </div>

        <form className={styles.Search} onSubmit={(e) => e.preventDefault()} role="search">
          <Search size={18} className={styles.SearchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.SearchInput}
            placeholder="Search events, venues, cities…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search events"
          />
        </form>
      </header>

      {/* Category pills */}
      <div className={styles.PillRow} role="group" aria-label="Event categories">
        {vibeFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            className={activeFilter === f.id ? styles.PillActive : styles.Pill}
            onClick={() => setActiveFilter(f.id)}
            aria-pressed={activeFilter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date chips — Luma calendar strip */}
      <div className={styles.DateStrip} role="tablist" aria-label="Filter by day">
        {dayChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={selectedDay === chip.id}
            className={selectedDay === chip.id ? styles.DateChipActive : styles.DateChip}
            onClick={() => setSelectedDay(chip.id)}
          >
            <span className={styles.DateChipLabel}>{chip.label}</span>
            <span className={styles.DateChipSub}>{chip.sub}</span>
          </button>
        ))}
      </div>

      {/* Featured */}
      {featuredEvent && selectedDay === 'all' && !query && (
        <section className={styles.Featured} aria-label="Featured event">
          <div className={styles.FeaturedMedia}>
            {featuredEvent.image ? (
              <img src={featuredEvent.image} alt="" className={styles.FeaturedImg} />
            ) : (
              <div className={styles.FeaturedImgPlaceholder} />
            )}
            <span className={styles.FeaturedBadge}>
              <Sparkles size={12} /> Featured
            </span>
          </div>
          <div className={styles.FeaturedBody}>
            <p className={styles.FeaturedWhen}>
              {[featuredEvent.weekday, featuredEvent.day, featuredEvent.month, featuredEvent.time]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <h2 className={styles.FeaturedTitle}>
              <button
                type="button"
                className={styles.FeaturedTitleBtn}
                onClick={() => navigate(`/event/${featuredEvent.id}`)}
              >
                {featuredEvent.title}
              </button>
            </h2>
            <p className={styles.FeaturedDesc}>{featuredEvent.description}</p>
            <div className={styles.FeaturedMeta}>
              {featuredEvent.location && (
                <span>
                  <MapPin size={14} /> {featuredEvent.location}
                </span>
              )}
              {featuredEvent.price && (
                <span>
                  <Ticket size={14} /> {featuredEvent.price}
                </span>
              )}
            </div>
            <div className={styles.FeaturedActions}>
              <button
                type="button"
                className={styles.BtnPrimary}
                onClick={() => { syncEvent(featuredEvent); pushToast?.('Opening Google Calendar…', 'success'); }}
              >
                <CalendarPlus size={16} /> Add to calendar
              </button>
              <button
                type="button"
                className={
                  isInterestedEvent?.(featuredEvent.id)
                    ? styles.BtnInterestedOn
                    : styles.BtnInterested
                }
                onClick={() => toggleInterestedEvent?.(featuredEvent)}
              >
                <Users size={16} />
                {isInterestedEvent?.(featuredEvent.id) ? 'Interested' : "I'm interested"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Grouped event list */}
      <section className={styles.ListSection} aria-label="Upcoming events">
        <div className={styles.ListHead}>
          <h2 className={styles.ListTitle}>
            {loading ? 'Loading…' : `${filtered.length} event${filtered.length === 1 ? '' : 's'}`}
          </h2>
          <span className={styles.ListHint}>{total} total curated</span>
        </div>

        {!loading && filtered.length === 0 && (
          <div className={styles.Empty}>
            <p className={styles.EmptyTitle}>No events for this filter</p>
            <p className={styles.EmptyText}>Try another day or clear the category.</p>
            <button
              type="button"
              className={styles.BtnGhost}
              onClick={() => {
                setQuery('');
                setActiveFilter('all');
                setSelectedDay('all');
              }}
            >
              Reset filters
            </button>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.key} className={styles.DayGroup}>
            <h3 className={styles.DayHeading}>
              {group.date
                ? group.date.toLocaleDateString('en', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Coming up'}
            </h3>

            <ul className={styles.EventList}>
              {group.items.map((event) => {
                const d = parseEventDate(event);
                const time = formatTime(event, d);
                const isOn = isInterestedEvent?.(event.id);
                return (
                  <li
                    key={event.id}
                    className={styles.EventRow}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/event/${event.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/event/${event.id}`);
                      }
                    }}
                  >
                    <div className={styles.EventTime}>
                      <span className={styles.EventTimeMain}>{time || 'TBA'}</span>
                      {event.weekday && (
                        <span className={styles.EventTimeSub}>{event.weekday}</span>
                      )}
                    </div>

                    <div className={styles.EventMain}>
                      {event.image && (
                        <img
                          src={event.image}
                          alt=""
                          className={styles.EventThumb}
                          loading="lazy"
                        />
                      )}
                      <div className={styles.EventCopy}>
                        <h4 className={styles.EventTitle}>{event.title}</h4>
                        <div className={styles.EventMeta}>
                          {event.location && (
                            <span>
                              <MapPin size={13} /> {event.location}
                            </span>
                          )}
                          {event.price && (
                            <span>
                              <Ticket size={13} /> {event.price}
                            </span>
                          )}
                          {event.category && (
                            <span className={styles.EventCat}>{event.category}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.EventActions}>
                      <button
                        type="button"
                        className={isOn ? styles.RowBtnOn : styles.RowBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleInterestedEvent?.(event);
                        }}
                        aria-pressed={isOn}
                      >
                        {isOn ? 'Interested' : 'Interest'}
                      </button>
                      <button
                        type="button"
                        className={styles.RowBtnGhost}
                        onClick={(e) => {
                          e.stopPropagation();
                          syncEvent(event);
                          pushToast?.('Opening Google Calendar…', 'success');
                        }}
                        aria-label={`Add ${event.title} to calendar`}
                      >
                        <CalendarPlus size={15} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {/* Explore places CTA */}
      <section className={styles.CtaBand}>
        <div>
          <h2 className={styles.CtaTitle}>Looking for places instead?</h2>
          <p className={styles.CtaText}>
            Browse cafés, nightlife, nature trails, and action spots with budgets and logistics.
          </p>
        </div>
        <Link to="/explore" className={styles.BtnPrimary}>
          Explore places <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
