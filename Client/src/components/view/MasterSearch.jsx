import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { CategoryPill } from '@components';
import { MasterSearchStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

export function MasterSearch({ onSearch }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('places'); // places | events
  const navigate = useNavigate();
  const { addRecentSearch, recentSearches } = useApp();

  const pills =
    mode === 'events'
      ? [
          { label: 'Live Music', emoji: '🎤', query: 'music' },
          { label: 'Food', emoji: '🍜', query: 'food' },
          { label: 'Nightlife', emoji: '🌙', query: 'nightlife' },
          { label: 'Nature', emoji: '🌿', query: 'nature' },
        ]
      : [
          { label: 'Chinese Food', emoji: '🍜', query: 'Chinese food' },
          { label: 'Lavington', emoji: '📍', query: 'Lavington' },
          { label: 'Date Night', emoji: '❤️', query: 'Date night' },
          { label: 'Tigoni', emoji: '🍵', query: 'Tigoni' },
        ];

  const submitSearch = (value) => {
    const nextValue = value.trim();
    if (onSearch) onSearch(nextValue);
    if (nextValue) addRecentSearch?.(nextValue);
    if (mode === 'events') {
      navigate(nextValue ? `/events?q=${encodeURIComponent(nextValue)}` : '/events');
    } else {
      navigate(nextValue ? `/explore?q=${encodeURIComponent(nextValue)}` : '/explore');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitSearch(query);
  };

  return (
    <section className={styles.HeroContainer} aria-label="Master search">
      <div className={styles.ModeRow} role="tablist" aria-label="Search type">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'places'}
          className={mode === 'places' ? styles.ModeActive : styles.Mode}
          onClick={() => setMode('places')}
        >
          Places
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'events'}
          className={mode === 'events' ? styles.ModeActive : styles.Mode}
          onClick={() => setMode('events')}
        >
          Events
        </button>
      </div>

      <form className={styles.SearchForm} onSubmit={handleSubmit}>
        <div className={styles.SearchWrapper}>
          <Search size={18} className={styles.SearchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.SearchInput}
            placeholder={
              mode === 'events'
                ? 'Search events, venues, vibes…'
                : 'Search places, areas, food, vibes…'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={mode === 'events' ? 'Search events' : 'Search places'}
          />
          <button type="submit" className={styles.SearchButton}>
            Search
          </button>
          {query.trim() && recentSearches?.some((s) => s.toLowerCase().includes(query.trim().toLowerCase())) && (
            <ul className={styles.Suggestions} role="listbox">
              {recentSearches
                .filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()))
                .slice(0, 5)
                .map((s) => (
                  <li key={s}>
                    <button type="button" onClick={() => { setQuery(s); submitSearch(s); }}>
                      {s}
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </form>

      <div className={styles.PillRow}>
        {pills.map((pill) => (
          <CategoryPill
            key={pill.label}
            label={pill.label}
            emoji={pill.emoji}
            onClick={() => {
              setQuery(pill.query);
              submitSearch(pill.query);
            }}
          />
        ))}
      </div>

      {recentSearches?.length > 0 && (
        <div className={styles.RecentRow}>
          <span className={styles.RecentLabel}>Recent</span>
          {recentSearches.slice(0, 4).map((term) => (
            <button
              key={term}
              type="button"
              className={styles.RecentChip}
              onClick={() => {
                setQuery(term);
                submitSearch(term);
              }}
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
