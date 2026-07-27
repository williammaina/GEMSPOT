import { Star } from 'lucide-react';
import { ReviewSectionStyles as styles } from '@styles';

export function ReviewSection() {
  const reviews = [
    {
      id: 1,
      author: 'Aisha K.',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98a?w=100&q=80',
      rating: 5,
      text: 'Absolutely loved the aesthetics here. The food took a bit of time, but the vibe check makes up for it completely. Highly recommend for a date night.'
    },
    {
      id: 2,
      author: 'Brian M.',
      avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&q=80',
      rating: 4,
      text: 'Great spot! Gate fee is reasonable and the secure parking gave me peace of mind. Will definitely be coming back.'
    }
  ];

  return (
    <div className={styles.ReviewContainer}>
      <div className={styles.HeaderRow}>
        <h3 className={styles.Title}>User Reviews</h3>
        <select className={styles.FilterDropdown}>
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>

      <div className={styles.ReviewList}>
        {reviews.map((review) => (
          <div key={review.id} className={styles.ReviewItem}>
            <img src={review.avatar} alt={review.author} className={styles.Avatar} />
            <div className={styles.ReviewContent}>
              <div className={styles.ReviewHeader}>
                <span className={styles.AuthorName}>{review.author}</span>
                <div className={styles.RatingRow}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className={styles.ReviewText}>{review.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}