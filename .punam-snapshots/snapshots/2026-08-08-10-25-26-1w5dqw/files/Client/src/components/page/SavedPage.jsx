import { useMemo, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ExternalLink,
  Heart,
  MapPin,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Navigation,
  MessageCircle,
  Route,
  CheckCircle2,
} from 'lucide-react';
import { PlaceCard } from '../shared/PlaceCard.jsx';
import { PlaceCardSkeleton } from '../shared/Skeleton.jsx';
import { useApp } from '../../library/contexts/AppContext.js';
import { usePlaces } from '@library';
import { SavedPageStyles as styles } from '@styles';
import { Pagination, paginate } from '../shared/Pagination.jsx';

const TABS = [
  { id: 'plan', label: 'Plan', icon: ClipboardList },
  { id: 'saved', label: 'Saved', icon: Heart },
  { id: 'recent', label: 'Recent', icon: Sparkles },
  { id: 'pick', label: "Today's pick", icon: Sparkles },
];

/**
 * Unified "My list" hub — wishlist + night plan + recent in one place.
 * Deep-link: /saved?tab=plan | saved | recent
 * /plan redirects here with tab=plan.
 */
export function SavedPage() {
  const [params, setParams] = useSearchParams();
  const tab = normalizeTab(params.get('tab'));

  const { favorites = [],
    planStops = [],
    recentPlaces = [],
    interestedEvents = [],
    removeFromPlan,
    addToPlan,
    isInPlan,
    clearPlan,
    reorderPlan,
    toggleInterestedEvent,
    pushToast, remindPlanInOneHour, enableNotifications, whatsappRemindLink } = useApp();

  const { places, loading } = usePlaces({ category: 'all' });
  const todaysPick = places?.[0] || null;

  const savedPlaces = useMemo(
    () => places.filter((p) => favorites.includes(String(p.place_id ?? p.id))),
    [places, favorites]
  );

  const planCount = planStops.length;
  const savedEventCount = interestedEvents.length;
  const savedCount = favorites.length + interestedEvents.length;
  const recentCount = recentPlaces.length;

  const setTab = (id) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  // Smart default: open Plan if it has items and no explicit tab
  useEffect(() => {
    if (params.get('tab')) return;
    if (planStops.length > 0) {
      setParams({ tab: 'plan' }, { replace: true });
    }
  }, [params, planStops.length, setParams]);

    const buildPlanText = () => {
    const lines = ['My GemSpot plan 🇰🇪', ''];
    planStops.forEach((p, i) => {
      const kind = p.type === 'event' ? 'Event' : 'Place';
      lines.push(`${i + 1}. [${kind}] ${p.title || p.name || 'Stop'}`);
      if (p.location) lines.push(`   ${p.location}`);
    });
    lines.push('', 'Open on GemSpot:', typeof window !== 'undefined' ? window.location.href : '');
    return lines.join('\n');
  };

  const handleShare = async () => {
    const text = buildPlanText();
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My GemSpot plan', text, url });
        pushToast?.('Shared', 'success');
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(text);
      pushToast?.('Plan copied — paste into WhatsApp', 'success');
    } catch {
      pushToast?.('Could not share', 'error');
    }
  };

  const moveStop = (id, dir) => {
    const idx = planStops.findIndex((p) => p.id === String(id));
    if (idx < 0) return;
    const next = [...planStops];
    const j = dir === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    reorderPlan?.(next);
  };

  return (
    <main className={styles.Page}>
      <header className={styles.Header}>
        <p className={styles.Eyebrow}>
          <Heart size={14} /> Your shortlist
        </p>
        <div className={styles.TitleRow}>
          <h1 className={styles.Title}>My list</h1>
          {tab === 'plan' && planCount > 0 && (
            <button type="button" className={styles.ShareBtn} onClick={handleShare}>
              <Share2 size={15} /> Share
            </button>
          )}
        </div>
        <p className={styles.Sub}>
          Wishlist, tonight’s plan, and what you’ve been browsing — one place.
        </p>
      </header>

      <div className={styles.Tabs} role="tablist" aria-label="List sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count =
            t.id === 'plan'
              ? planCount
              : t.id === 'saved'
                ? savedCount
                : t.id === 'pick'
                  ? todaysPick
                    ? 1
                    : 0
                  : recentCount;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? styles.TabActive : styles.Tab}
              onClick={() => setTab(t.id)}
            >
              <Icon size={15} />
              <span>{t.label}</span>
              {count > 0 && <span className={styles.TabCount}>{count}</span>}
            </button>
          );
        })}
      </div>

      {tab === 'plan' && (
        <PlanPanel
          planStops={planStops}
          removeFromPlan={removeFromPlan}
          clearPlan={clearPlan}
          moveStop={moveStop}
        />
      )}

      {tab === 'saved' && (
        <SavedPanel
          loading={loading}
          savedPlaces={savedPlaces}
          interestedEvents={interestedEvents}
          isInPlan={isInPlan}
          addToPlan={addToPlan}
          toggleInterestedEvent={toggleInterestedEvent}
          pushToast={pushToast}
        />
      )}

      {tab === 'recent' && <RecentPanel recentPlaces={recentPlaces} />}

      {tab === 'pick' && (
        <TodaysPickPanel
          pick={todaysPick}
          loading={loading}
          addToPlan={addToPlan}
          isInPlan={isInPlan}
        />
      )}
    </main>
  );
}

function normalizeTab(raw) {
  const v = String(raw || 'saved').toLowerCase();
  if (v === 'plan' || v === 'planning') return 'plan';
  if (v === 'recent' || v === 'history') return 'recent';
  if (v === 'pick' || v === 'today' || v === "today's pick") return 'pick';
  return 'saved';
}

function PlanPanel({
  planStops,
  removeFromPlan,
  clearPlan,
  moveStop,
}) {
  const empty = planStops.length === 0;

  if (empty) {
    return (
      <div className={styles.Empty}>
        <div className={styles.EmptyIcon}>
          <ClipboardList size={28} />
        </div>
        <h2 className={styles.EmptyTitle}>No stops yet</h2>
        <p>
          Build tonight’s route from Saved places or events — open the{' '}
          <strong>Saved</strong> tab and tap <strong>Add to plan</strong>.
        </p>
        <div className={styles.EmptyLinks}>
          <Link to="/saved?tab=saved" className={styles.Cta}>
            Open wishlist <ArrowRight size={16} />
          </Link>
          <Link to="/events" className={styles.CtaGhost}>
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Panel}>
      <div className={styles.PanelToolbar}>
        <p className={styles.PanelHint}>
          Ordered stops for your night — reorder, then run the next-steps checklist.
        </p>
        <button type="button" className={styles.ClearBtn} onClick={() => clearPlan?.()}>
          Clear plan
        </button>
      </div>

      <PlanNextSteps planStops={planStops} />

      <section className={styles.Section}>
        <div className={styles.SectionHead}>
          <h2>Stops</h2>
          <span>{planStops.length}</span>
        </div>
        <ol className={styles.PlanList}>
          {planStops.map((p, i) => {
            const isEvent = p.type === 'event';
            const href = isEvent ? `/event/${p.id}` : `/place/${p.id}`;
            return (
              <li key={`${p.type || 'place'}-${p.id}`} className={styles.PlanRow}>
                <span className={isEvent ? styles.StepEvent : styles.Step}>
                  {isEvent ? <CalendarDays size={14} /> : i + 1}
                </span>
                <Link to={href} className={styles.PlanMain}>
                  {p.image ? (
                    <img src={p.image} alt="" className={styles.Thumb} loading="lazy" />
                  ) : (
                    <span className={styles.ThumbPlaceholder}>
                      {isEvent ? <CalendarDays size={16} /> : <MapPin size={16} />}
                    </span>
                  )}
                  <span className={styles.Meta}>
                    <strong>{p.title || p.name}</strong>
                    <small>
                      {isEvent ? 'Event' : 'Place'}
                      {p.location ? ` · ${p.location}` : ''}
                    </small>
                  </span>
                </Link>
                <div className={styles.PlanActions}>
                  <button
                    type="button"
                    className={styles.IconGhost}
                    disabled={i === 0}
                    aria-label="Move up"
                    onClick={() => moveStop(p.id, 'up')}
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.IconGhost}
                    disabled={i === planStops.length - 1}
                    aria-label="Move down"
                    onClick={() => moveStop(p.id, 'down')}
                  >
                    <ChevronDown size={16} />
                  </button>
                  <Link to={href} className={styles.ViewBtn} title="View">
                    <ExternalLink size={14} />
                  </Link>
                  <button
                    type="button"
                    className={styles.RemoveBtn}
                    onClick={() => removeFromPlan?.(p.id)}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function SavedPanel({
  loading,
  savedPlaces,
  interestedEvents = [],
  isInPlan,
  addToPlan,
  toggleInterestedEvent,
  pushToast,
}) {
  const [placePage, setPlacePage] = useState(1);
  const PLACE_PAGE = 6;
  const pagePlaces = paginate(savedPlaces, placePage, PLACE_PAGE);

  if (loading) {
    return (
      <div className={styles.Grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <PlaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const empty = savedPlaces.length === 0 && interestedEvents.length === 0;

  if (empty) {
    return (
      <div className={styles.Empty}>
        <div className={styles.EmptyIcon}>
          <Heart size={28} />
        </div>
        <h2 className={styles.EmptyTitle}>Nothing saved yet</h2>
        <p>
          Heart places on Explore, or tap <strong>I’m interested</strong> on events — then add
          them to tonight’s plan when you’re ready.
        </p>
        <div className={styles.EmptyLinks}>
          <Link to="/explore" className={styles.Cta}>
            Explore places <ArrowRight size={16} />
          </Link>
          <Link to="/events" className={styles.CtaGhost}>
            Browse events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Panel}>
      <p className={styles.PanelHint}>
        Wishlist of places and events. Tap <strong>Add to plan</strong> when you’re ready to go.
      </p>

      {savedPlaces.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2>Places</h2>
            <span>{savedPlaces.length}</span>
          </div>
          <div className={styles.Grid}>
            {pagePlaces.map((place) => {
              const id = String(place.place_id ?? place.id);
              const inPlan = isInPlan?.(id);
              return (
                <div key={id} className={styles.SavedCardWrap}>
                  <PlaceCard place={place} />
                  <button
                    type="button"
                    className={inPlan ? styles.AddPlanBtnOn : styles.AddPlanBtn}
                    disabled={inPlan}
                    onClick={() => addToPlan?.(place)}
                  >
                    {inPlan ? (
                      <>In plan</>
                    ) : (
                      <>
                        <Plus size={14} /> Add to plan
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <Pagination
            page={placePage}
            pageSize={PLACE_PAGE}
            total={savedPlaces.length}
            onChange={setPlacePage}
            label="saved places"
          />
        </section>
      )}

      {interestedEvents.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2>Events</h2>
            <span>{interestedEvents.length}</span>
          </div>
          <ul className={styles.PlanList}>
            {interestedEvents.map((e) => {
              const inPlan = isInPlan?.(e.id);
              return (
                <li key={e.id} className={styles.PlanRow}>
                  <span className={styles.StepEvent}>
                    <CalendarDays size={14} />
                  </span>
                  <Link to={`/event/${e.id}`} className={styles.PlanMain}>
                    {e.image ? (
                      <img src={e.image} alt="" className={styles.Thumb} loading="lazy" />
                    ) : (
                      <span className={styles.ThumbPlaceholder}>
                        <CalendarDays size={16} />
                      </span>
                    )}
                    <span className={styles.Meta}>
                      <strong>{e.title}</strong>
                      <small>
                        {[e.startDate, e.location].filter(Boolean).join(' · ') || 'Event'}
                      </small>
                    </span>
                  </Link>
                  <div className={styles.PlanActions}>
                    <button
                      type="button"
                      className={inPlan ? styles.AddPlanBtnOn : styles.AddPlanBtn}
                      style={{ width: 'auto', padding: '8px 12px' }}
                      disabled={inPlan}
                      onClick={() => addToPlan?.({ ...e, type: 'event' })}
                    >
                      {inPlan ? 'In plan' : (
                        <>
                          <Plus size={14} /> Plan
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className={styles.RemoveBtn}
                      title="Remove from saved"
                      onClick={() => {
                        toggleInterestedEvent?.(e);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function RecentPanel({ recentPlaces }) {
  if (!recentPlaces.length) {
    return (
      <div className={styles.Empty}>
        <div className={styles.EmptyIcon}>
          <Sparkles size={28} />
        </div>
        <h2 className={styles.EmptyTitle}>No recent views</h2>
        <p>Places you open will show up here for quick return.</p>
        <Link to="/explore" className={styles.Cta}>
          Start exploring <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <section className={styles.Section}>
      <ul className={styles.SimpleList}>
        {recentPlaces.map((p) => (
          <li key={p.id}>
            <Link to={`/place/${p.id}`}>
              <strong>{p.title}</strong>
              <span>{p.location}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}


function PlanNextSteps({ planStops = [] }) {
  const { remindPlanInOneHour, enableNotifications, pushToast, whatsappRemindLink } = useApp();
  const [done, setDone] = useState({});
  const toggle = (id) => setDone((d) => ({ ...d, [id]: !d[id] }));

  const mapsUrl = (() => {
    const parts = planStops
      .map((p) => p.location || p.title)
      .filter(Boolean)
      .map(encodeURIComponent);
    if (!parts.length) return 'https://www.google.com/maps';
    if (parts.length === 1) return `https://www.google.com/maps/search/?api=1&query=${parts[0]}`;
    return `https://www.google.com/maps/dir/${parts.join('/')}`;
  })();

  const waText = encodeURIComponent(
    ['My GemSpot plan:', ...planStops.map((p, i) => `${i + 1}. ${p.title}${p.location ? ` — ${p.location}` : ''}`)].join('\n')
  );

  const steps = [
    {
      id: 'route',
      icon: Route,
      title: 'Build the route',
      body: 'Open all stops in Google Maps as a multi-stop route.',
      action: (
        <a className={styles.NextBtn} href={mapsUrl} target="_blank" rel="noreferrer">
          <Navigation size={14} /> Open route
        </a>
      ),
    },
    {
      id: 'share',
      icon: MessageCircle,
      title: 'Share with your people',
      body: 'Send the plan on WhatsApp so everyone has the same list.',
      action: (
        <a
          className={styles.NextBtn}
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
      ),
    },
    {
      id: 'budget',
      icon: CheckCircle2,
      title: 'Agree budget & meet point',
      body: 'Confirm damage for two, M-Pesa, and where you meet before stop 1.',
      action: null,
    },
    {
      id: 'go',
      icon: Navigation,
      title: 'Go stop by stop',
      body: 'Check off each stop as you finish — keep the night moving.',
      action: null,
    },
    {
      id: 'remind',
      icon: CalendarDays,
      title: 'Remind me',
      body: 'Browser notification in 1 hour, or send yourself a WhatsApp note.',
      action: (
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className={styles.NextBtn}
            onClick={async () => {
              await enableNotifications?.();
              remindPlanInOneHour?.(planStops);
              pushToast?.('Reminder set for 1 hour', 'success');
              toggle('remind');
            }}
          >
            Notify in 1h
          </button>
          <a
            className={styles.NextBtn}
            href={whatsappRemindLink?.(
              ['My GemSpot plan:', ...planStops.map((p, i) => `${i + 1}. ${p.title}`)].join('\n')
            )}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
        </span>
      ),
    },
  ];

  return (
    <section className={styles.NextSection} aria-label="What next">
      <div className={styles.SectionHead}>
        <h2>What next</h2>
        <span>After you plan</span>
      </div>
      <ul className={styles.NextList}>
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.id} className={done[s.id] ? styles.NextItemDone : styles.NextItem}>
              <button
                type="button"
                className={styles.NextCheck}
                aria-pressed={Boolean(done[s.id])}
                onClick={() => toggle(s.id)}
              >
                <Icon size={16} />
              </button>
              <div className={styles.NextBody}>
                <strong>{s.title}</strong>
                <p>{s.body}</p>
                {s.action}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TodaysPickPanel({ pick, loading, addToPlan, isInPlan }) {
  if (loading) {
    return (
      <div className={styles.Grid}>
        <PlaceCardSkeleton />
      </div>
    );
  }
  if (!pick) {
    return (
      <div className={styles.Empty}>
        <div className={styles.EmptyIcon}>
          <Sparkles size={28} />
        </div>
        <h2 className={styles.EmptyTitle}>No pick yet</h2>
        <p>Explore places and we will surface a strong recommendation here.</p>
        <Link to="/explore" className={styles.Cta}>
          Explore <ArrowRight size={16} />
        </Link>
      </div>
    );
  }
  const id = String(pick.place_id ?? pick.id);
  const inPlan = isInPlan?.(id);
  return (
    <div className={styles.Panel}>
      <p className={styles.PanelHint}>
        Handpicked for you from the current catalogue — save it to your plan in one tap.
      </p>
      <div className={styles.SavedCardWrap}>
        <PlaceCard place={pick} />
        <button
          type="button"
          className={inPlan ? styles.AddPlanBtnOn : styles.AddPlanBtn}
          disabled={inPlan}
          onClick={() => addToPlan?.(pick)}
        >
          {inPlan ? 'In plan' : (<><Plus size={14} /> Add to plan</>)}
        </button>
        <Link to={`/place/${id}`} className={styles.Cta} style={{ justifyContent: 'center' }}>
          View details <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
