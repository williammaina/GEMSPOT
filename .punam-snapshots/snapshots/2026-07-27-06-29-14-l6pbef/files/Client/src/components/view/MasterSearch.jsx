import { Search } from 'lucide-react';
import { CategoryPill } from '@components';
import { MasterSearchStyles as styles } from '@styles';

export function MasterSearch() {
  const pills = [
    { label: 'Chinese Food', emoji: '🍜', active: true },
    { label: 'Lavington', emoji: '📍', active: false },
    { label: 'Date Night', emoji: '❤️', active: true },
    { label: 'Live Music', emoji: '🎤', active: false },
  ];

  return (
    <div className={styles.HeroContainer}>
      <h1 className={styles.MainHeadline}>
        Unearth Kenya's<br />Best-Kept Secrets.
      </h1>
      
      <div className={styles.SearchWrapper}>
        <input 
          type="text" 
          placeholder="Multi-Select Search Bar: Type venue, event, or cuisine..." 
          className={styles.SearchInput}
        />
        <Search className={styles.SearchIcon} size={20} />
      </div>

      <div className={styles.PillRow}>
        {pills.map((pill, idx) => (
          <CategoryPill 
            key={idx} 
            label={pill.label} 
            emoji={pill.emoji} 
            isActive={pill.active} 
          />
        ))}
      </div>
    </div>
  );
}