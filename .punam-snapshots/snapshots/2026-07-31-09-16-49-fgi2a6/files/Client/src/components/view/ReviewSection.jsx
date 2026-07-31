import { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';
import { ReviewSectionStyles as styles } from '@styles';

export function ReviewSection({ reviewsData = [] }) {
  const [filter, setFilter] = useState('newest');

  const defaultReviews = [
    {
      id: 1,
      author: 'Aisha K.',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98a?w=100&q=80',
      rating: 5,
      text: 'Absolutely loved the aesthetics here. The food took a bit of time, but the vibe check makes up for it completely. Highly recommend for a date night.',
    },
    {
      id: 2,
      author: 'Brian M.',
      avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&q=80',
      rating: 4,
      text: 'Great spot! Gate fee is reasonable and the secure parking gave me peace of mind. Will definitely be coming back.',
    },
  ];

  const reviews = reviewsData.length > 0 ? reviewsData : defaultReviews;

  const visibleReviews = useMemo(() => {
    const cloned = [...reviews];

    if (filter === 'highest') {
      return cloned.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    if (filter === 'lowest') {
      return cloned.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    }

    return cloned.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
  }, [reviews, filter]);

  return (
    <section className={styles.ReviewContainer} aria-labelledby="reviews-heading">
      <div className={styles.HeaderRow}>
        <h3 id="reviews-heading" className={styles.Title}>
          User Reviews ({visibleReviews.length})
        </h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.FilterDropdown}
          aria-label="Filter reviews"
        >
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      <div className={styles.ReviewList}>
        {visibleReviews.map((review) => (
          <article key={review.id} className={styles.ReviewItem}>
            <img
              src={review.avatar}
              alt={review.author}
              className={styles.Avatar}
              loading="lazy"
            />
            <div className={styles.ReviewContent}>
              <div className={styles.ReviewHeader}>
                <span className={styles.AuthorName}>{review.author}</span>
                <div
                  className={styles.RatingRow}
                  aria-label={`Rating: ${review.rating} out of 5 stars`}
                >
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={clsx(i >= review.rating && styles.StarUnfilled)}
                      fill={i < review.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </div>
              <p className={styles.ReviewText}>{review.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
