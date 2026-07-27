import { useState } from 'react';
import { Search } from 'lucide-react';
import { CategoryPill } from '@components';
import { MasterSearchStyles as styles } from '@styles';

export function MasterSearch({ onSearch }) {
  const [query, setQuery] = useState('');

  const pills = [
    { label: 'Chinese Food', emoji: '🍜', active: true },
    { label: 'Lavington', emoji: '📍', active: false },
    { label: 'Date Night', emoji: '❤️', active: true },
    { label: 'Live Music', emoji: '🎤', active: false },
  ];

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  return (
    <section className={styles.HeroContainer} aria-label="Master Search Hero">
      <h1 className={styles.MainHeadline}>
        Unearth Kenya's<br />
        <span className={styles.HeadlineAccent}>Best-Kept Secrets.</span>
      </h1>
      
      <div className={styles.SearchWrapper}>
        <input 
          type="text" 
          value={query}
          onChange={handleInputChange}
          placeholder="Type venue, event, area, or cuisine..." 
          className={styles.SearchInput}
          aria-label="Search venues, events, or cuisines"
        />
        <Search className={styles.SearchIcon} size={20} aria-hidden="true" />
      </div>

      <div className={styles.PillRow} role="group" aria-label="Popular Search Filters">
        {pills.map((pill, idx) => (
          <CategoryPill 
            key={idx} 
            label={pill.label} 
            emoji={pill.emoji} 
            isActive={pill.active} 
          />
        ))}
      </div>
    </section>
  );
}