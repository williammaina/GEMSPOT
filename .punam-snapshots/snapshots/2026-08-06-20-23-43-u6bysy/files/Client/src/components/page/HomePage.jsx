import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bus,
  CalendarDays,
  Coffee,
  Compass,
  Heart,
  MapPin,
  Music2,
  Sparkles,
  Sun,
  Trees,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import { MasterSearch } from '@components';
import { AmbientDots } from '../shared/AmbientDots.jsx';
import { useEvents, usePlaces } from '@library';
import { HomePageStyles as styles } from '@styles';

const floatCards = [
  {
    title: 'Tigoni Tea Walk',
    meta: 'Limuru · Day',
    tone: 'emerald',
    image:
      'https://images.unsplash.com/photo-1518182170546-076616fdacaf?q=80&w=400&auto=format&fit=crop',
  },
  {
    title: 'Westlands Live Night',
    meta: 'Tonight · 9 PM',
    tone: 'ruby',
    image:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop',
  },
  {
    title: 'Karura Morning Run',
    meta: 'Sat · 6:30 AM',
    tone: 'amber',
    image:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop',
  },
  {
    title: 'Nyali Coffee Yard',
    meta: 'Mombasa · Open now',
    tone: 'sapphire',
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop',
  },
  {
    title: 'Mad Max Karting',
    meta: 'Two Rivers · Ruaka',
    tone: 'violet',
    image:
      'https://images.unsplash.com/photo-1583120194098-b8ce7711df77?q=80&w=400&auto=format&fit=crop',
  },
  {
    title: 'Diani Sunset Deck',
    meta: 'Kwale · Coast',
    tone: 'coral',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop',
  },
];

const browseCategories = [
  { label: 'Nature', icon: Trees, path: '/explore?category=nature', color: '#34d399' },
  { label: 'Eats', icon: Coffee, path: '/explore?category=eats', color: '#fbbf24' },
  { label: 'Nightlife', icon: Music2, path: '/explore?category=nightlife', color: '#a78bfa' },
  { label: 'Action', icon: Zap, path: '/explore?category=action', color: '#38bdf8' },
];

const cities = [
  { name: 'Nairobi', path: '/explore?city=Nairobi' },
  { name: 'Mombasa', path: '/explore?city=Mombasa' },
  { name: 'Kisumu', path: '/explore?city=Kisumu' },
  { name: 'Nakuru', path: '/explore?city=Nakuru' },
  { name: 'Naivasha', path: '/explore?city=Naivasha' },
  { name: 'Diani', path: '/explore?city=Diani' },
];

function formatEventWhen(event) {
  const raw = event.startDate || event.start_date || event.date;
  if (!raw) return 'Date TBA';
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(raw);
  }
}

function placeHref(p) {
  const id = p.place_id ?? p.id ?? p.slug;
  return id ? `/place/${id}` : '/explore';
}

export function HomePage() {
  const { events = [], loading: eventsLoading } = useEvents?.() || { events: [], loading: false };
  const { places = [], loading: placesLoading } = usePlaces?.() || { places: [], loading: false };

  const featured = (events || []).slice(0, 8);

  // Day picks: nature, eats, action (outdoor-leaning)
  const dayPicks = (places || [])
    .filter((p) => {
      const c = String(p.category || '').toLowerCase();
      return (
        c.includes('nature') ||
        c.includes('eat') ||
        c.includes('cafe') ||
        c.includes('action') ||
        c === 'nature' ||
        c === 'eats' ||
        c === 'action'
      );
    })
    .slice(0, 4);

  // Evening picks: nightlife + late eats
  const nightPicks = (places || [])
    .filter((p) => {
      const c = String(p.category || '').toLowerCase();
      return c.includes('night') || c.includes('vibe') || c === 'nightlife';
    })
    .slice(0, 4);

  // Fallbacks if API empty
  const dayFallback = [
    {
      name: 'Karura Forest',
      town: 'Gigiri',
      category: 'nature',
      featured_image:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80',
      damage_for_two: 600,
    },
    {
      name: 'Cultiva Lavington',
      town: 'Lavington',
      category: 'eats',
      featured_image:
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80',
      damage_for_two: 3200,
    },
    {
      name: 'Climb Zone Kilimani',
      town: 'Kilimani',
      category: 'action',
      featured_image:
        'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=80',
      damage_for_two: 3000,
    },
    {
      name: 'Panari Sky Ice Rink',
      town: 'South C',
      category: 'action',
      featured_image:
        'https://images.unsplash.com/photo-1496883990599-5610038194bd?w=600&q=80',
      damage_for_two: 3500,
    },
  ];
  const nightFallback = [
    {
      name: 'The Alchemist',
      town: 'Westlands',
      category: 'nightlife',
      featured_image:
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80',
      damage_for_two: 4000,
    },
    {
      name: 'K1 Klub House',
      town: 'Parklands',
      category: 'nightlife',
      featured_image:
        'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&q=80',
      damage_for_two: 5000,
    },
    {
      name: 'Sierra Brasserie Bar',
      town: 'Westlands',
      category: 'nightlife',
      featured_image:
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=80',
      damage_for_two: 4500,
    },
    {
      name: 'Nyali Sunset Lounge',
      town: 'Nyali',
      category: 'nightlife',
      featured_image:
        'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80',
      damage_for_two: 3200,
    },
  ];

  const dayList = dayPicks.length ? dayPicks : dayFallback;
  const nightList = nightPicks.length ? nightPicks : nightFallback;

  return (
    <main className={styles.Page}>
      <section className={styles.Hero} style={{ position: 'relative', overflow: 'hidden' }}>
        <AmbientDots tone="emerald" />
        <div className={styles.FloatLayer} aria-hidden="true">
          {floatCards.map((card, i) => (
            <article
              key={card.title}
              className={styles.FloatCard}
              data-i={i}
              data-tone={card.tone}
            >
              <img src={card.image} alt="" loading="lazy" />
              <div>
                <strong>{card.title}</strong>
                <span>{card.meta}</span>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.HeroCore}>
          <p className={styles.Eyebrow}>
            <Sparkles size={14} /> GemSpot KE
          </p>
          <h1 className={styles.HeroTitle}>
            Days &amp; nights
            <br />
            <span className={styles.GradientText}>worth showing up for</span>
          </h1>
          <p className={styles.HeroSub}>
            Curated places and events across Kenya — for solo explorers, couples, locals,
            and visitors. Budgets, matatus, M-Pesa, and vibe built in. Daytime trails to
            late-night energy.
          </p>

          <div className={styles.HeroCtas}>
            <Link to="/explore" className={styles.PrimaryCta}>
              Explore places
              <ArrowRight size={16} />
            </Link>
            <Link to="/events" className={styles.GhostCta}>
              Discover events
            </Link>
          </div>

          <div className={styles.SearchShell}>
            <MasterSearch />
          </div>
        </div>
      </section>

      <section className={styles.DiscoveryPanel} aria-labelledby="discover-help">
        <div className={styles.DiscoveryInner}>
          <div>
            <p className={styles.DiscoveryKicker} id="discover-help">
              New here?
            </p>
            <h2 className={styles.DiscoveryTitle}>Find your kind of day — or night</h2>
            <p className={styles.DiscoveryCopy}>
              Solo date, couple outing, uniformed Kenyan weekend, or first trip to Kenya —
              pick a mood and we&apos;ll shortlist places with real budgets and matatu hints.
            </p>
          </div>
          <div className={styles.DiscoveryActions}>
            <Link to="/explore?category=nature" className={styles.DiscoveryLink}>
              Day outdoors
            </Link>
            <Link to="/explore?category=eats" className={styles.DiscoveryLink}>
              Brunch &amp; coffee
            </Link>
            <Link to="/explore?category=action" className={styles.DiscoveryLink}>
              Something active
            </Link>
            <Link to="/explore?category=nightlife" className={styles.DiscoveryLink}>
              Evening energy
            </Link>
            <Link to="/explore?budget=under1500" className={styles.DiscoveryLink}>
              Keep it under 1.5k
            </Link>
            <Link to="/explore?for=couple" className={styles.DiscoveryLink}>
              Couple-friendly
            </Link>
            <Link to="/explore" className={styles.DiscoveryLinkAccent}>
              Browse everything →
            </Link>
          </div>
        </div>
      </section>

      {/* Daytime picks */}
      <section className={styles.Section} aria-labelledby="day-picks">
        <div className={styles.SectionHead}>
          <h2 id="day-picks">
            <Sun size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />
            Daytime picks
          </h2>
          <Link to="/explore?category=nature" className={styles.SectionLink}>
            More day spots <ArrowRight size={14} />
          </Link>
        </div>
        <div className={styles.EventRail}>
          {placesLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.EventRailSkeleton} />
            ))}
          {!placesLoading &&
            dayList.map((p, i) => (
              <Link
                key={p.place_id || p.id || p.name || i}
                to={placeHref(p)}
                className={styles.EventRailCard}
              >
                <div className={styles.EventRailMedia}>
                  {(p.featured_image || p.image) ? (
                    <img src={p.featured_image || p.image} alt="" loading="lazy" />
                  ) : (
                    <div className={styles.EventRailPlaceholder} />
                  )}
                </div>
                <h3>{p.name || p.title}</h3>
                <p>{p.town || p.location || p.county || p.category}</p>
                {p.damage_for_two != null && (
                  <span>~KES {Number(p.damage_for_two).toLocaleString()} for two</span>
                )}
              </Link>
            ))}
        </div>
      </section>

      {/* Evening picks */}
      <section className={styles.Section} aria-labelledby="night-picks">
        <div className={styles.SectionHead}>
          <h2 id="night-picks">
            <Music2 size={18} style={{ verticalAlign: '-3px', marginRight: 8 }} />
            Evening picks
          </h2>
          <Link to="/explore?category=nightlife" className={styles.SectionLink}>
            More night spots <ArrowRight size={14} />
          </Link>
        </div>
        <div className={styles.EventRail}>
          {placesLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.EventRailSkeleton} />
            ))}
          {!placesLoading &&
            nightList.map((p, i) => (
              <Link
                key={p.place_id || p.id || p.name || i}
                to={placeHref(p)}
                className={styles.EventRailCard}
              >
                <div className={styles.EventRailMedia}>
                  {(p.featured_image || p.image) ? (
                    <img src={p.featured_image || p.image} alt="" loading="lazy" />
                  ) : (
                    <div className={styles.EventRailPlaceholder} />
                  )}
                </div>
                <h3>{p.name || p.title}</h3>
                <p>{p.town || p.location || p.county || p.category}</p>
                {p.damage_for_two != null && (
                  <span>~KES {Number(p.damage_for_two).toLocaleString()} for two</span>
                )}
              </Link>
            ))}
        </div>
      </section>

      <section className={styles.Section} aria-labelledby="featured-events">
        <div className={styles.SectionHead}>
          <h2 id="featured-events">Upcoming in Kenya</h2>
          <Link to="/events" className={styles.SectionLink}>
            See all <ArrowRight size={14} />
          </Link>
        </div>

        <div className={styles.EventRail}>
          {eventsLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.EventRailSkeleton} />
            ))}
          {!eventsLoading &&
            featured.map((event) => (
              <Link
                key={event.id || event.event_id}
                to={`/event/${event.id || event.event_id}`}
                className={styles.EventRailCard}
              >
                <div className={styles.EventRailMedia}>
                  {event.image || event.banner ? (
                    <img src={event.image || event.banner} alt="" loading="lazy" />
                  ) : (
                    <div className={styles.EventRailPlaceholder} />
                  )}
                </div>
                <h3>{event.title}</h3>
                <p>{formatEventWhen(event)}</p>
                {(event.location || event.venue_name) && (
                  <span>{event.location || event.venue_name}</span>
                )}
              </Link>
            ))}
          {!eventsLoading && featured.length === 0 && (
            <p className={styles.EmptyHint}>Events will appear here once seeded.</p>
          )}
        </div>
      </section>

      <section className={styles.Section} aria-labelledby="browse-cat">
        <div className={styles.SectionHead}>
          <h2 id="browse-cat">Browse by vibe</h2>
        </div>
        <div className={styles.CategoryGrid}>
          {browseCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                to={cat.path}
                className={styles.CategoryTile}
                style={{ ['--tile-accent']: cat.color }}
              >
                <span className={styles.CategoryIcon}>
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <span className={styles.CategoryLabel}>{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={styles.Section} aria-labelledby="who">
        <div className={styles.SectionHead}>
          <h2 id="who">Who it&apos;s for</h2>
        </div>
        <div className={styles.WhyGrid}>
          <article className={styles.WhyCard}>
            <Users size={20} />
            <h3>Solo explorers</h3>
            <p>Safe, clear options for a coffee, trail, or quiet evening on your own.</p>
          </article>
          <article className={styles.WhyCard}>
            <Heart size={20} />
            <h3>Couples &amp; dates</h3>
            <p>Damage-for-two ranges so the plan fits the mood and the wallet.</p>
          </article>
          <article className={styles.WhyCard}>
            <Compass size={20} />
            <h3>Locals &amp; visitors</h3>
            <p>Matatu hints and M-Pesa-friendly spots for Kenyans and guests alike.</p>
          </article>
          <article className={styles.WhyCard}>
            <Sun size={20} />
            <h3>Day and night</h3>
            <p>Morning runs, midday brunch, sunset decks, and late-night energy — all in one app.</p>
          </article>
        </div>
      </section>

      <section className={styles.Section} aria-labelledby="cities">
        <div className={styles.SectionHead}>
          <h2 id="cities">Explore cities</h2>
        </div>
        <div className={styles.CityRow}>
          {cities.map((c) => (
            <Link key={c.name} to={c.path} className={styles.CityChip}>
              <MapPin size={14} />
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.Section} aria-labelledby="why">
        <div className={styles.SectionHead}>
          <h2 id="why">Why GemSpot feels different</h2>
        </div>
        <div className={styles.WhyGrid}>
          <article className={styles.WhyCard}>
            <Wallet size={20} />
            <h3>Damage for two</h3>
            <p>Real budget ranges before you leave the house — not surprise bills.</p>
          </article>
          <article className={styles.WhyCard}>
            <Bus size={20} />
            <h3>Matatu directions</h3>
            <p>Stage hints and routes so getting there is part of the plan.</p>
          </article>
          <article className={styles.WhyCard}>
            <CalendarDays size={20} />
            <h3>Calendar-ready events</h3>
            <p>One tap into Google or Apple Calendar. Interest tracking included.</p>
          </article>
          <article className={styles.WhyCard}>
            <Compass size={20} />
            <h3>Kenya-first curation</h3>
            <p>From Tigoni tea ridges to Nyali evenings — local, not generic.</p>
          </article>
        </div>
      </section>

      <section className={styles.CloseBand}>
        <h2>
          Your next <span className={styles.GradientText}>unforgettable</span>
          <br />
          day or night awaits
        </h2>
        <p>Plan the place, the event, and the ride — then go.</p>
        <div className={styles.HeroCtas}>
          <Link to="/explore" className={styles.PrimaryCta}>
            Start exploring
          </Link>
          <Link to="/register" className={styles.GhostCta}>
            Create free account
          </Link>
        </div>
      </section>
    </main>
  );
}
