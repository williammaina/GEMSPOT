import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CategoryPill } from '@components';
import { MasterSearchStyles as styles } from '@styles';

export function MasterSearch({ onSearch }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const pills = [
    { label: 'Chinese Food', emoji: '🍜', query: 'Chinese food' },
    { label: 'Lavington', emoji: '📍', query: 'Lavington' },
    { label: 'Date Night', emoji: '❤️', query: 'Date night' },
    { label: 'Live Music', emoji: '🎤', query: 'Live music' },
  ];

  const submitSearch = (value) => {
    const nextValue = value.trim();
    if (onSearch) onSearch(nextValue);
    navigate(nextValue ? `/explore?q=${encodeURIComponent(nextValue)}` : '/explore');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitSearch(query);
  };

  const handleQuickSearch = (pill) => {
    setQuery(pill.query);
    submitSearch(pill.query);
  };

  return (
    <section className={styles.HeroContainer} aria-label="Master search">
      <form className={styles.SearchForm} onSubmit={handleSubmit}>
        <div className={styles.SearchWrapper}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type venue, event, area, or cuisine..."
            className={styles.SearchInput}
            aria-label="Search venues, events, or cuisines"
          />
          <button type="submit" className={styles.SearchButton} aria-label="Search GemSpot">
            <Search className={styles.SearchIcon} size={20} aria-hidden="true" />
          </button>
        </div>
      </form>

      <div className={styles.PillRow} role="group" aria-label="Popular search filters">
        {pills.map((pill) => (
          <CategoryPill
            key={pill.label}
            label={pill.label}
            emoji={pill.emoji}
            isActive={false}
            onClick={() => handleQuickSearch(pill)}
          />
        ))}
      </div>
    </section>
  );
}
