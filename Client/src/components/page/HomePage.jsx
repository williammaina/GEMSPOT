import { MasterSearch, CategoryThemeCard } from '@components';
import { HomePageStyles as styles } from '@styles';

export function HomePage() {
  const categories = [
    {
      title: 'Explore Nature\n& Trails',
      theme: 'emerald',
      badgeLabel: 'Emerald',
      image: 'https://images.unsplash.com/photo-1518182170546-076616fdacaf?q=80&w=600&auto=format&fit=crop',
      path: '/explore?category=nature',
    },
    {
      title: 'Cafe & Eats\nHubs',
      theme: 'amber',
      badgeLabel: 'Amber',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop',
      path: '/explore?category=eats',
    },
    {
      title: 'Action & Play\nVenues',
      theme: 'sapphire',
      badgeLabel: 'Sapphire',
      image: 'https://images.unsplash.com/photo-1583120194098-b8ce7711df77?q=80&w=600&auto=format&fit=crop',
      path: '/explore?category=action',
    },
    {
      title: 'Social Pulse &\nEvents',
      theme: 'ruby',
      badgeLabel: 'Ruby',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=600&auto=format&fit=crop',
      path: '/events',
    },
  ];

  return (
    <main className={styles.HomeLayout}>
      <section className={styles.HeroSection} aria-labelledby="home-hero-title">
        <div className={styles.HeroInner}>
          <p className={styles.HeroEyebrow}>GemSpot KE · Premium discovery</p>
          <h1 id="home-hero-title" className={styles.HeroTitle}>
            Unearth Kenya&apos;s Best-Kept Secrets.
          </h1>
          <p className={styles.HeroSubtitle}>
            Search, filter, and explore curated places, experiences, and events through a calm
            luxury interface built for fast discovery and confident decisions.
          </p>

          <div className={styles.HeroMetaRow} aria-label="Highlights">
            <span className={styles.HeroMetaChip}>Curated spots</span>
            <span className={styles.HeroMetaChip}>Near you</span>
            <span className={styles.HeroMetaChip}>Date night ideas</span>
            <span className={styles.HeroMetaChip}>Live events</span>
          </div>
        </div>
      </section>

      <div className={styles.SearchBlock}>
        <MasterSearch />
      </div>

      <section className={styles.CategoriesSection} aria-labelledby="browse-categories">
        <div className={styles.CategoriesHeader}>
          <div>
            <h2 id="browse-categories" className={styles.CategoriesTitle}>
              Browse by mood and moment
            </h2>
            <p className={styles.CategoriesDescription}>
              Each card is designed as a fast entry point into the experience you want next.
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