import { useEffect, useMemo, useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { ReviewSectionStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';
import {
  submitReviewHandler,
  fetchReviewsHandler,
} from '../../library/handlers/apiHandler.js';

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
  const text = raw.text || raw.review_text || raw.comment || raw.body || '';
  const id = raw.review_id ?? raw.id ?? `r-${index}`;
  const created = raw.created_at || raw.createdAt || null;
  return {
    id: String(id),
    author,
    avatar,
    rating: Number(raw.rating) || 0,
    text,
    created,
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
  const [remoteReviews, setRemoteReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Load reviews for this place from the API (all users)
  useEffect(() => {
    if (!placeId) return undefined;
    let cancelled = false;
    setLoadingReviews(true);
    fetchReviewsHandler({ place_id: placeId })
      .then((list) => {
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : list?.data || list?.reviews || [];
        setRemoteReviews(arr.map(normalizeReview).filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setRemoteReviews([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const merged = useMemo(() => {
    const fromProps = (reviewsData || []).map(normalizeReview).filter(Boolean);
    const map = new Map();
    [...fromProps, ...remoteReviews, ...localReviews].forEach((r) => {
      if (r?.id) map.set(String(r.id), r);
    });
    return Array.from(map.values());
  }, [reviewsData, remoteReviews, localReviews]);

  const visibleReviews = useMemo(() => {
    const list = [...merged];
    if (filter === 'highest') list.sort((a, b) => b.rating - a.rating);
    else if (filter === 'lowest') list.sort((a, b) => a.rating - b.rating);
    else {
      list.sort((a, b) => {
        const ta = a.created ? new Date(a.created).getTime() : 0;
        const tb = b.created ? new Date(b.created).getTime() : 0;
        return tb - ta;
      });
    }
    return list;
  }, [merged, filter]);

  const avg =
    merged.length > 0
      ? merged.reduce((s, r) => s + (r.rating || 0), 0) / merged.length
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signedIn) {
      pushToast?.('Sign in to rate this place', 'info');
      return;
    }
    if (!rating) {
      pushToast?.('Pick a star rating', 'error');
      return;
    }
    if (!placeId) {
      pushToast?.('Missing place', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        place_id: Number(placeId) || placeId,
        rating,
        review_text: text.trim(),
        comment: text.trim(),
      };
      const created = await submitReviewHandler(payload);
      const normalizedNew = normalizeReview(
        created?.review ||
          created || {
            rating,
            review_text: text,
            author: user?.name || user?.username || 'You',
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
          }
      );
      if (normalizedNew) {
        setLocalReviews((prev) => [normalizedNew, ...prev]);
        onReviewAdded?.(normalizedNew);
      }
      setText('');
      setRating(0);
      pushToast?.('Rating submitted — thank you!', 'success');
      // Refresh from server so other users' + yours stay in sync
      try {
        const list = await fetchReviewsHandler({ place_id: placeId });
        const arr = Array.isArray(list) ? list : list?.data || [];
        setRemoteReviews(arr.map(normalizeReview).filter(Boolean));
      } catch {
        /* keep local */
      }
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
          {merged.length > 0 && (
            <p className={styles.AvgLine}>
              <Star size={14} fill="currentColor" /> {avg.toFixed(1)} · {merged.length} review
              {merged.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <div className={styles.FilterRow} role="group" aria-label="Filter reviews">
          {[
            { id: 'newest', label: 'Newest' },
            { id: 'highest', label: 'Highest' },
            { id: 'lowest', label: 'Lowest' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? styles.FilterActive : styles.Filter}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <form className={styles.RateForm} onSubmit={handleSubmit}>
        <p className={styles.RateLabel}>Rate this place</p>
        <div className={styles.StarPicker}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={styles.StarBtn}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              aria-label={`${n} stars`}
            >
              <Star
                size={22}
                className={n <= (hover || rating) ? styles.StarOn : styles.StarOff}
                fill={n <= (hover || rating) ? 'currentColor' : 'none'}
              />
            </button>
          ))}
          <span className={styles.RateHint}>{rating ? `${rating}/5` : 'Tap a star'}</span>
        </div>
        <textarea
          className={styles.RateText}
          placeholder={signedIn ? 'What stood out? (optional)' : 'Sign in to leave a review'}
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
        {loadingReviews && merged.length === 0 && (
          <p className={styles.EmptyLine}>Loading reviews…</p>
        )}
        {!loadingReviews && visibleReviews.length === 0 && (
          <p className={styles.EmptyLine}>No reviews yet — be the first to rate this spot.</p>
        )}
        {visibleReviews.map((review) => (
          <article key={review.id} className={styles.ReviewItem}>
            <img
              src={review.avatar}
              alt=""
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
