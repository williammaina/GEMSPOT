import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bus,
  CalendarDays,
  Coffee,
  Compass,
  HelpCircle,
  MapPin,
  Music2,
  Shuffle,
  Sparkles,
  Trees,
  Wallet,
  Zap,
} from 'lucide-react';
import { MasterSearch } from '@components';
import { AmbientDots } from '../shared/AmbientDots.jsx';
import { useEvents } from '@library';
import { HomePageStyles as styles } from '@styles';

const floatCards = [
  {
    title: 'Tigoni Tea Walk',
    meta: 'Limuru · Kiambu',
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
  { label: 'Action', icon: Zap, path: '/explore?category=action', color: '#60a5fa' },
  { label: 'Events', icon: CalendarDays, path: '/events', color: '#f472b6' },
  { label: 'Near you', icon: MapPin, path: '/explore?sort=distance', color: '#2dd4bf' },
  { label: 'Budget', icon: Wallet, path: '/explore?budget=under1500', color: '#fb923c' },
  { label: 'Matatu-ready', icon: Bus, path: '/explore', color: '#94a3b8' },
];

const cities = [
  { name: 'Nairobi', path: '/explore?q=Nairobi' },
  { name: 'Mombasa', path: '/explore?q=Mombasa' },
  { name: 'Kisumu', path: '/explore?q=Kisumu' },
  { name: 'Nakuru', path: '/explore?q=Nakuru' },
  { name: 'Kiambu', path: '/explore?q=Tigoni' },
];

function formatEventWhen(event) {
  const bits = [event.weekday, event.day, event.month, event.time].filter(Boolean);
  if (bits.length) return bits.join(' · ');
  if (event.startDate) {
    try {
      return new Date(event.startDate).toLocaleString('en', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return 'Upcoming';
    }
  }
  return 'Upcoming';
}

export function HomePage() {
  const { events, loading } = useEvents({ category: 'all' });
  const featured = events.slice(0, 8);

  return (
    <main className={styles.Page}>
      <div className={styles.GlowA} aria-hidden="true" />
      <div className={styles.GlowB} aria-hidden="true" />
      <div className={styles.DotGrid} aria-hidden="true" />

      <section className={styles.Hero} style={{ position: 'relative', overflow: 'hidden' }}>
      <AmbientDots tone="emerald" />
        <div className={styles.FloatField} aria-hidden="true">
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
            Delightful nights
            <br />
            <span className={styles.GradientText}>start here</span>
          </h1>
          <p className={styles.HeroSub}>
            Curated places and events across Kenya — budgets, matatus, M-Pesa, and vibe
            built in. No surprises.
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
            <p className={styles.DiscoveryKicker} id="discover-help">New here?</p>
            <h2 className={styles.DiscoveryTitle}>Don&apos;t know what you want yet</h2>
            <p className={styles.DiscoveryCopy}>
              Tell us the mood — we&apos;ll narrow Kenya to a shortlist with budgets and matatu hints built in.
            </p>
          </div>
          <div className={styles.DiscoveryActions}>
            <Link to="/explore?category=nature" className={styles.DiscoveryLink}>Outdoor reset</Link>
            <Link to="/explore?category=eats&budget=mid" className={styles.DiscoveryLink}>Good meal · mid budget</Link>
            <Link to="/explore?category=nightlife" className={styles.DiscoveryLink}>Tonight&apos;s vibe</Link>
            <Link to="/explore?category=action" className={styles.DiscoveryLink}>Something active</Link>
            <Link to="/explore?budget=under1500" className={styles.DiscoveryLink}>Keep it under 1.5k</Link>
            <Link to="/explore" className={styles.DiscoveryLinkAccent}>Browse everything →</Link>
          </div>
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
          {loading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.EventRailSkeleton} />
            ))}
          {!loading &&
            featured.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className={styles.EventRailCard}
              >
                <div className={styles.EventRailMedia}>
                  {event.image ? (
                    <img src={event.image} alt="" loading="lazy" />
                  ) : (
                    <div className={styles.EventRailPlaceholder} />
                  )}
                </div>
                <h3>{event.title}</h3>
                <p>{formatEventWhen(event)}</p>
                {event.location && <span>{event.location}</span>}
              </Link>
            ))}
          {!loading && featured.length === 0 && (
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
            <p>From Tigoni tea ridges to Nyali nights — local, not generic.</p>
          </article>
        </div>
      </section>

      <section className={styles.CloseBand}>
        <h2>
          Your next <span className={styles.GradientText}>unforgettable</span>
          <br />
          memory awaits
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