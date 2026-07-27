import { MasterSearch, CategoryThemeCard } from '@components';
import { HomePageStyles as styles } from '@styles';

export function HomePage() {
  const categories = [
    {
      title: 'Explore Nature\n& Trails',
      theme: 'emerald',
      badgeLabel: 'Emerald',
      image: 'https://images.unsplash.com/photo-1518182170546-076616fdacaf?q=80&w=600&auto=format&fit=crop',
      path: '/explore?category=nature'
    },
    {
      title: 'Cafe & Eats\nHubs',
      theme: 'amber',
      badgeLabel: 'Amber',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop',
      path: '/explore?category=eats'
    },
    {
      title: 'Action & Play\nVenues',
      theme: 'sapphire',
      badgeLabel: 'Sapphire',
      image: 'https://images.unsplash.com/photo-1583120194098-b8ce7711df77?q=80&w=600&auto=format&fit=crop',
      path: '/explore?category=action'
    },
    {
      title: 'Social Pulse &\nEvents',
      theme: 'ruby',
      badgeLabel: 'Ruby',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=600&auto=format&fit=crop',
      path: '/events'
    }
  ];

  return (
    <main className={styles.HomeLayout}>
      <MasterSearch />
      
      <div className={styles.CategoriesGrid}>
        {categories.map((cat, idx) => (
          <CategoryThemeCard 
            key={idx}
            title={cat.title}
            theme={cat.theme}
            badgeLabel={cat.badgeLabel}
            image={cat.image}
            path={cat.path}
          />
        ))}
      </div>
    </main>
  );
}