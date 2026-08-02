import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { PlaceCard } from '../shared/PlaceCard.jsx';
import { PlaceCardSkeleton } from '../shared/Skeleton.jsx';
import { useApp } from '../../library/contexts/AppContext.js';
import { usePlaces } from '@library';
import { SavedPageStyles as styles } from '@styles';

export function SavedPage() {
  const { favorites = [], recentPlaces = [], interestedEvents = [] } = useApp();
  const { places, loading } = usePlaces({ category: 'all' });

  const saved = places.filter((p) => favorites.includes(String(p.place_id ?? p.id)));

  return (
    <main className={styles.Page}>
      <header className={styles.Header}>
        <p className={styles.Eyebrow}>
          <Heart size={14} /> Your shortlist
        </p>
        <h1 className={styles.Title}>Saved & planning</h1>
        <p className={styles.Sub}>
          Favorites, recently viewed places, and events you marked interested.
        </p>
      </header>

      <section className={styles.Section}>
        <div className={styles.SectionHead}>
          <h2>Saved places</h2>
          <span>{saved.length}</span>
        </div>
        {loading && (
          <div className={styles.Grid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!loading && saved.length === 0 && (
          <div className={styles.Empty}>
            <p>No saved places yet. Heart spots on Explore to build your list.</p>
            <Link to="/explore" className={styles.Cta}>
              Explore places <ArrowRight size={16} />
            </Link>
          </div>
        )}
        {!loading && saved.length > 0 && (
          <div className={styles.Grid}>
            {saved.map((place) => (
              <PlaceCard key={place.place_id ?? place.id} place={place} />
            ))}
          </div>
        )}
      </section>

      {recentPlaces.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2>Recently viewed</h2>
            <span>{recentPlaces.length}</span>
          </div>
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
      )}

      {interestedEvents.length > 0 && (
        <section className={styles.Section}>
          <div className={styles.SectionHead}>
            <h2>Interested events</h2>
            <span>{interestedEvents.length}</span>
          </div>
          <ul className={styles.SimpleList}>
            {interestedEvents.map((e) => (
              <li key={e.id}>
                <Link to={`/event/${e.id}`}>
                  <strong>{e.title}</strong>
                  <span>{e.location}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
