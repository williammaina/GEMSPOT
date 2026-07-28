import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Compass,
  MapPin,
  ShieldCheck,
  Sparkles,
  Sparkles as SparklesIcon,
  Wallet,
  Wifi,
} from 'lucide-react';
import { MasterSearch, CategoryThemeCard } from '@components';
import { HomePageStyles as styles } from '@styles';

const cityPills = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'];

const metrics = [
  { value: '250+', label: 'curated places & moments' },
  { value: '8', label: 'discovery filters that matter' },
  { value: '1 tap', label: 'from search to plan' },
];

const discoverySignals = [
  {
    icon: MapPin,
    title: 'Localized context',
    text: 'Parking, M-Pesa, Wi-Fi, dress code, and crowd vibe in one glance.',
  },
  {
    icon: CalendarDays,
    title: 'Weekend-ready events',
    text: 'Move from discovery to calendar without leaving the experience.',
  },
  {
    icon: ShieldCheck,
    title: 'Confidence before you go',
    text: 'Practical details that help you choose faster and avoid surprises.',
  },
  {
    icon: Compass,
    title: 'Fast discovery flow',
    text: 'Browse by mood, budget, or occasion instead of scrolling endlessly.',
  },
];

const categories = [
  {
    title: 'Explore Nature\n& Trails',
    theme: 'emerald',
    badgeLabel: 'Emerald',
    image:
      'https://images.unsplash.com/photo-1518182170546-076616fdacaf?q=80&w=1200&auto=format&fit=crop',
    path: '/explore?category=nature',
  },
  {
    title: 'Cafés & Dining\nRooms',
    theme: 'amber',
    badgeLabel: 'Amber',
    image:
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1200&auto=format&fit=crop',
    path: '/explore?category=eats',
  },
  {
    title: 'Action & Play\nVenues',
    theme: 'sapphire',
    badgeLabel: 'Sapphire',
    image:
      'https://images.unsplash.com/photo-1583120194098-b8ce7711df77?q=80&w=1200&auto=format&fit=crop',
    path: '/explore?category=action',
  },
  {
    title: 'Events & Social\nPulse',
    theme: 'ruby',
    badgeLabel: 'Ruby',
    image:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200&auto=format&fit=crop',
    path: '/events',
  },
];

export function HomePage() {
  return (
    <main className={styles.HomeLayout}>
      <section className={styles.HeroSection} aria-labelledby="home-hero-title">
        <div className={styles.HeroGrid}>
          <div className={styles.HeroCopy}>
            <p className={styles.Eyebrow}>
              <SparklesIcon size={14} aria-hidden="true" />
              Discovery-first urban lifestyle platform
            </p>

            <div className={styles.CityRow} aria-label="Available cities">
              {cityPills.map((city) => (
                <span key={city} className={styles.CityPill}>
                  {city}
                </span>
              ))}
            </div>

            <h1 id="home-hero-title" className={styles.HeroTitle}>
              Find the right place before you leave home.
            </h1>

            <p className={styles.HeroSubtitle}>
              GemSpot KE turns everyday plans into a clean, premium discovery experience. Search
              places, experiences, and events with the practical details that help you move fast
              and choose well.
            </p>

            <div className={styles.ActionRow}>
              <Link to="/explore" className={styles.PrimaryButton}>
                Start exploring
                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link to="/events" className={styles.SecondaryButton}>
                Browse events
              </Link>
            </div>

            <div className={styles.MetricsRow} aria-label="Platform highlights">
              {metrics.map((metric) => (
                <div key={metric.label} className={styles.MetricCard}>
                  <strong className={styles.MetricValue}>{metric.value}</strong>
                  <span className={styles.MetricLabel}>{metric.label}</span>
                </div>
              ))}
            </div>

            <div className={styles.SearchShell}>
              <MasterSearch />
            </div>
          </div>

          <aside className={styles.HeroPanel} aria-label="Discovery highlights">
            <div className={styles.PanelHeader}>
              <span className={styles.PanelEyebrow}>
                <Sparkles size={14} aria-hidden="true" />
                Live discovery dashboard
              </span>
              <h2 className={styles.PanelTitle}>Every choice should feel informed, not rushed.</h2>
              <p className={styles.PanelText}>
                A homepage designed like a professional lifestyle product: clean hierarchy,
                sharper intent, and content that guides the next step.
              </p>
            </div>

            <div className={styles.SignalGrid}>
              {discoverySignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <article key={signal.title} className={styles.SignalCard}>
                    <span className={styles.SignalIcon}>
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3 className={styles.SignalTitle}>{signal.title}</h3>
                    <p className={styles.SignalText}>{signal.text}</p>
                  </article>
                );
              })}
            </div>

            <div className={styles.PanelFooter}>
              <div className={styles.FooterLine}>
                <Wallet size={16} aria-hidden="true" />
                Budget-aware planning for real-world outings
              </div>
              <div className={styles.FooterLine}>
                <Wifi size={16} aria-hidden="true" />
                Reliable details for work, dates, and group plans
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.CategoriesSection} aria-labelledby="browse-categories">
        <div className={styles.SectionHeader}>
          <div>
            <h2 id="browse-categories" className={styles.SectionTitle}>
              Curated entry points for every kind of plan
            </h2>
            <p className={styles.SectionDescription}>
              Move into the part of the platform that matches your mood: quiet, social, active, or
              event-driven.
            </p>
          </div>
        </div>

        <div className={styles.CategoriesGrid}>
          {categories.map((cat) => (
            <CategoryThemeCard
              key={cat.path}
              title={cat.title}
              theme={cat.theme}
              badgeLabel={cat.badgeLabel}
              image={cat.image}
              path={cat.path}
            />
          ))}
        </div>
      </section>

     
    </main>
  );
}