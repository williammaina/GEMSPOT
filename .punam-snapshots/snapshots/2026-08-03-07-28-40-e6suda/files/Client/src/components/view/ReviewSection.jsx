import { useMemo, useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { ReviewSectionStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';
import { submitReviewHandler } from '../../library/handlers/apiHandler.js';
import { Link } from 'react-router-dom';

function normalizeReview(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null;
  const user = raw.user || {};
  const author =
    raw.author ||
    user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    user.username ||
    'Explorer';
  const avatar =
    raw.avatar ||
    user.profile_image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=0d9f6e&color=fff`;
  const text =
    raw.text ||
    raw.review_text ||
    raw.comment ||
    raw.body ||
    '';
  const id = raw.review_id ?? raw.id ?? index;
  return {
    id,
    author,
    avatar,
    rating: Number(raw.rating) || 0,
    text,
  };
}

export function ReviewSection({ reviewsData = [], placeId, onReviewAdded }) {
  const { user, pushToast } = useApp();
  const signedIn = Boolean(user?.isAuthenticated || user?.email);
  const [filter, setFilter] = useState('newest');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localReviews, setLocalReviews] = useState([]);

  const defaultReviews = [
    {
      id: 'd1',
      author: 'Aisha K.',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98a?w=100&q=80',
      rating: 5,
      text: 'Absolutely loved the aesthetics here. The vibe check makes up for the wait. Highly recommend for a date night.',
    },
    {
      id: 'd2',
      author: 'Brian M.',
      avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=100&q=80',
      rating: 4,
      text: 'Great spot! Gate fee is reasonable and the secure parking gave me peace of mind.',
    },
  ];

  const normalized = useMemo(() => {
    const fromProps = (reviewsData || []).map(normalizeReview).filter(Boolean);
    const merged = [...localReviews, ...fromProps];
    const seen = new Set();
    const unique = [];
    for (const r of merged) {
      const key = String(r.id);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(r);
    }
    return unique.length > 0 ? unique : defaultReviews;
  }, [reviewsData, localReviews]);

  const visibleReviews = useMemo(() => {
    const cloned = [...normalized];
    if (filter === 'highest') return cloned.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (filter === 'lowest') return cloned.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    return cloned.sort((a, b) => String(b.id).localeCompare(String(a.id)));
  }, [normalized, filter]);

  const avg =
    normalized.length > 0
      ? normalized.reduce((s, r) => s + (r.rating || 0), 0) / normalized.length
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signedIn) {
      pushToast?.('Sign in to rate this place', 'info');
      return;
    }
    if (!rating || rating < 1) {
      pushToast?.('Pick a star rating', 'error');
      return;
    }
    if (!placeId) {
      pushToast?.('Missing place id', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        place_id: placeId,
        rating,
        review_text: text.trim() || undefined,
        text: text.trim() || undefined,
      };
      const created = await submitReviewHandler(payload);
      const normalizedNew = normalizeReview(
        created?.review || created || {
          rating,
          review_text: text,
          author: user?.name || user?.username || 'You',
          id: `local-${Date.now()}`,
        }
      );
      if (normalizedNew) {
        setLocalReviews((prev) => [normalizedNew, ...prev]);
        onReviewAdded?.(normalizedNew);
      }
      setText('');
      setRating(0);
      pushToast?.('Thanks for your rating!', 'success');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Could not submit review';
      pushToast?.(typeof msg === 'string' ? msg : 'Could not submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.ReviewContainer} aria-labelledby="reviews-heading">
      <div className={styles.HeaderRow}>
        <div>
          <h3 id="reviews-heading" className={styles.Title}>
            Ratings & reviews
          </h3>
          <p className={styles.AvgLine}>
            <Star size={14} fill="currentColor" />
            {avg ? avg.toFixed(1) : '—'} average · {visibleReviews.length} review
            {visibleReviews.length === 1 ? '' : 's'}
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.FilterDropdown}
          aria-label="Filter reviews"
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest</option>
          <option value="lowest">Lowest</option>
        </select>
      </div>

      {/* Rate this place */}
      <form className={styles.RateForm} onSubmit={handleSubmit}>
        <p className={styles.RateLabel}>Rate this place</p>
        <div className={styles.StarPicker} role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={styles.StarBtn}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              aria-pressed={rating === n}
            >
              <Star
                size={22}
                fill={n <= (hover || rating) ? 'currentColor' : 'none'}
                className={n <= (hover || rating) ? styles.StarOn : styles.StarOff}
              />
            </button>
          ))}
          {rating > 0 && <span className={styles.RateHint}>{rating}/5</span>}
        </div>
        <textarea
          className={styles.RateText}
          placeholder={signedIn ? 'Share what made the vibe… (optional)' : 'Sign in to leave a review'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          disabled={!signedIn || submitting}
          maxLength={800}
        />
        <div className={styles.RateActions}>
          {signedIn ? (
            <button type="submit" className={styles.RateSubmit} disabled={submitting || !rating}>
              {submitting ? <Loader2 size={16} className={styles.Spin} /> : <Send size={16} />}
              Submit rating
            </button>
          ) : (
            <Link to="/login" className={styles.RateSubmit}>
              Sign in to rate
            </Link>
          )}
        </div>
      </form>

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
              {review.text && <p className={styles.ReviewText}>{review.text}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
