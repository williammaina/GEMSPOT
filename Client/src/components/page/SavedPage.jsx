import { useMemo, useEffect } from 'react';
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
} from 'lucide-react';
import { PlaceCard } from '../shared/PlaceCard.jsx';
import { PlaceCardSkeleton } from '../shared/Skeleton.jsx';
import { useApp } from '../../library/contexts/AppContext.js';
import { usePlaces } from '@library';
import { SavedPageStyles as styles } from '@styles';

const TABS = [
  { id: 'plan', label: 'Plan', icon: ClipboardList },
  { id: 'saved', label: 'Saved', icon: Heart },
  { id: 'recent', label: 'Recent', icon: Sparkles },
];

/**
 * Unified "My list" hub — wishlist + night plan + recent in one place.
 * Deep-link: /saved?tab=plan | saved | recent
 * /plan redirects here with tab=plan.
 */
export function SavedPage() {
  const [params, setParams] = useSearchParams();
  const tab = normalizeTab(params.get('tab'));

  const {
    favorites = [],
    planStops = [],
    recentPlaces = [],
    interestedEvents = [],
    removeFromPlan,
    addToPlan,
    isInPlan,
    clearPlan,
    reorderPlan,
    toggleInterestedEvent,
    pushToast,
  } = useApp();

  const { places, loading } = usePlaces({ category: 'all' });

  const savedPlaces = useMemo(
    () => places.filter((p) => favorites.includes(String(p.place_id ?? p.id))),
    [places, favorites]
  );

  const planCount = planStops.length + interestedEvents.length;
  const savedCount = favorites.length;
  const recentCount = recentPlaces.length;

  const setTab = (id) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, { replace: true });
  };

  // Smart default: open Plan if it has items and no explicit tab
  useEffect(() => {
    if (params.get('tab')) return;
    if (planStops.length > 0 || interestedEvents.length > 0) {
      setParams({ tab: 'plan' }, { replace: true });
    }
  }, [params, planStops.length, interestedEvents.length, setParams]);

  const buildPlanText = () => {
    const lines = ['My GemSpot plan 🇰🇪', ''];
    planStops.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.title || p.name || 'Stop'}`);
      if (p.location) lines.push(`   ${p.location}`);
    });
    interestedEvents.forEach((e) => {
      lines.push(`• Event: ${e.title}`);
      if (e.location) lines.push(`   ${e.location}`);
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
            t.id === 'plan' ? planCount : t.id === 'saved' ? savedCount : recentCount;
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
          interestedEvents={interestedEvents}
          removeFromPlan={removeFromPlan}
          clearPlan={clearPlan}
          toggleInterestedEvent={toggleInterestedEvent}
          pushToast={pushToast}
          moveStop={moveStop}
        />
      )}

      {tab === 'saved' && (
        <SavedPanel
          loading={loading}
          savedPlaces={savedPlaces}
          isInPlan={isInPlan}
          addToPlan={addToPlan}
        />
      )}

      {tab === 'recent' && <RecentPanel recentPlaces={recentPlaces} />}
    </main>
  );
}

function normalizeTab(raw) {
  const v = String(raw || 'saved').toLowerCase();
  if (v === 'plan' || v === 'planning') return 'plan';
  if (v === 'recent' || v === 'history') return 'recent';
  return 'saved';
}

function PlanPanel({
  planStops,
  interestedEvents,
  removeFromPlan,
  clearPlan,
  toggleInterestedEvent,
  pushToast,
  moveStop,
}) {
  const empty = planStops.length === 0 && interestedEvents.length === 0;

  if (empty) {
    return (
      <div className={styles.Empty}>
        <div className={styles.EmptyIcon}>
          <ClipboardList size={28} />
        </div>
        <h2 className={styles.EmptyTitle}>No stops yet</h2>
        <p>
          Build tonight’s route from Saved places, Explore, or a place page — tap{' '}
          <strong>Add to plan</strong>.
        </p>
        <div className={styles.EmptyLinks}>
          <Link to="/explore" className={styles.Cta}>
            Explore places <ArrowRight size={16} />
          </Link>
          <Link to="/saved?tab=saved" className={styles.CtaGhost}>
            Open wishlist
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.Panel}>
      <div className={styles.PanelToolbar}>
        <p className={styles.PanelHint}>
          Ordered stops for your night — reorder, open, or clear.
        </p>
        <button type="button" className={styles.ClearBtn} onClick={() => clearPlan?.()}>
          Clear plan
        </button>
      </div>

      {planStops.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2>Places</h2>
            <span>{planStops.length}</span>
          </div>
          <ol className={styles.PlanList}>
            {planStops.map((p, i) => (
              <li key={p.id} className={styles.PlanRow}>
                <span className={styles.Step}>{i + 1}</span>
                <Link to={`/place/${p.id}`} className={styles.PlanMain}>
                  {p.image ? (
                    <img src={p.image} alt="" className={styles.Thumb} loading="lazy" />
                  ) : (
                    <span className={styles.ThumbPlaceholder}>
                      <MapPin size={16} />
                    </span>
                  )}
                  <span className={styles.Meta}>
                    <strong>{p.title || p.name}</strong>
                    <small>{p.location || p.town || p.category || 'Place'}</small>
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
                  <Link to={`/place/${p.id}`} className={styles.ViewBtn} title="View">
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
            ))}
          </ol>
        </section>
      )}

      {interestedEvents.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2>Events</h2>
            <span>{interestedEvents.length}</span>
          </div>
          <ul className={styles.PlanList}>
            {interestedEvents.map((e) => (
              <li key={e.id} className={styles.PlanRow}>
                <span className={styles.StepEvent}>
                  <CalendarDays size={14} />
                </span>
                <Link to={`/event/${e.id}`} className={styles.PlanMain}>
                  <span className={styles.Meta}>
                    <strong>{e.title}</strong>
                    <small>{e.location || 'Event'}</small>
                  </span>
                </Link>
                <div className={styles.PlanActions}>
                  <Link to={`/event/${e.id}`} className={styles.ViewBtn}>
                    <ExternalLink size={14} />
                  </Link>
                  <button
                    type="button"
                    className={styles.RemoveBtn}
                    onClick={() => {
                      toggleInterestedEvent?.(e);
                      pushToast?.('Removed interest', 'info');
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SavedPanel({ loading, savedPlaces, isInPlan, addToPlan }) {
  if (loading) {
    return (
      <div className={styles.Grid}>
        {Array.from({ length: 3 }).map((_, i) => (
          <PlaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (savedPlaces.length === 0) {
    return (
      <div className={styles.Empty}>
        <div className={styles.EmptyIcon}>
          <Heart size={28} />
        </div>
        <h2 className={styles.EmptyTitle}>Nothing saved yet</h2>
        <p>Heart spots while you explore — then pull them into tonight’s plan when you’re ready.</p>
        <Link to="/explore" className={styles.Cta}>
          Explore places <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.Panel}>
      <p className={styles.PanelHint}>
        Long-term wishlist. Tap <strong>Add to plan</strong> when you’re ready to go.
      </p>
      <div className={styles.Grid}>
        {savedPlaces.map((place) => {
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
