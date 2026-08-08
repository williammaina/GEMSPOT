import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Star,
  Send,
  Loader2,
  Camera,
  Video,
  Users,
  Wallet,
  Lightbulb,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { ReviewSectionStyles as styles } from '@styles';
import { Pagination, paginate } from '../shared/Pagination.jsx';
import { useApp } from '../../library/contexts/AppContext.js';
import {
  submitReviewHandler,
  fetchReviewsHandler,
} from '../../library/handlers/apiHandler.js';

const CROWD_OPTS = [
  { id: 'quiet', label: 'Quiet' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'busy', label: 'Busy' },
  { id: 'packed', label: 'Packed' },
];

const VIBE_OPTS = ['Chill', 'Lively', 'Romantic', 'Family', 'Party', 'Work-friendly'];

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
  return {
    id: String(id),
    author,
    avatar,
    rating: Number(raw.rating) || 0,
    text,
    created: raw.created_at || raw.createdAt || null,
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    videos: Array.isArray(raw.videos) ? raw.videos : [],
    vibe: raw.vibe || null,
    crowd: raw.crowd || raw.crowd_status || null,
    budgetKes: raw.budgetKes ?? raw.budget_kes ?? raw.budget ?? null,
    tip: raw.tip || raw.practical_tip || null,
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReviewSection({ reviewsData = [], placeId, onReviewAdded, onCrowdReport }) {
  const { user, pushToast } = useApp();
  const signedIn = Boolean(user?.isAuthenticated || user?.email);
  const [filter, setFilter] = useState('newest');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [vibe, setVibe] = useState('');
  const [crowd, setCrowd] = useState('');
  const [budget, setBudget] = useState('');
  const [tip, setTip] = useState('');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [localReviews, setLocalReviews] = useState([]);
  const [remoteReviews, setRemoteReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const photoRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!placeId) return undefined;
    let cancelled = false;
    setLoadingReviews(true);
    // Local community store
    try {
      const raw = localStorage.getItem(`gemspot-community-${placeId}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && !cancelled) setLocalReviews(arr.map(normalizeReview).filter(Boolean));
      }
    } catch {
      /* */
    }
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

  const sortedReviews = useMemo(() => {
    const list = [...merged];
    if (filter === 'highest') list.sort((a, b) => b.rating - a.rating);
    else if (filter === 'tips') list.sort((a, b) => (b.tip ? 1 : 0) - (a.tip ? 1 : 0));
    else if (filter === 'media') list.sort((a, b) => (b.photos?.length || 0) + (b.videos?.length || 0) - ((a.photos?.length || 0) + (a.videos?.length || 0)));
    else {
      list.sort((a, b) => {
        const ta = a.created ? new Date(a.created).getTime() : 0;
        const tb = b.created ? new Date(b.created).getTime() : 0;
        return tb - ta;
      });
    }
    return list;
  }, [merged, filter]);

  const visibleReviews = useMemo(
    () => paginate(sortedReviews, page, PAGE_SIZE),
    [sortedReviews, page]
  );

  useEffect(() => { setPage(1); }, [filter, placeId]);

  const avg =
    merged.length > 0
      ? merged.reduce((s, r) => s + (r.rating || 0), 0) / merged.length
      : 0;

  const intel = useMemo(() => {
    const crowds = merged.map((r) => r.crowd).filter(Boolean);
    const vibes = merged.map((r) => r.vibe).filter(Boolean);
    const budgets = merged.map((r) => Number(r.budgetKes)).filter((n) => Number.isFinite(n) && n > 0);
    const mode = (arr) => {
      if (!arr.length) return null;
      const counts = {};
      arr.forEach((x) => {
        counts[x] = (counts[x] || 0) + 1;
      });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };
    return {
      crowd: mode(crowds),
      vibe: mode(vibes),
      budgetAvg: budgets.length ? Math.round(budgets.reduce((a, b) => a + b, 0) / budgets.length) : null,
      tipCount: merged.filter((r) => r.tip).length,
      mediaCount: merged.reduce((s, r) => s + (r.photos?.length || 0) + (r.videos?.length || 0), 0),
    };
  }, [merged]);

  const onPhotos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    const urls = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      if (f.size > 2.5e6) {
        pushToast?.('Photo too large (max ~2.5MB)', 'error');
        continue;
      }
      urls.push(await fileToDataUrl(f));
    }
    setPhotos((prev) => [...prev, ...urls].slice(0, 4));
    e.target.value = '';
  };

  const onVideos = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 1);
    const urls = [];
    for (const f of files) {
      if (!f.type.startsWith('video/')) continue;
      if (f.size > 8e6) {
        pushToast?.('Video too large (max ~8MB for local preview)', 'error');
        continue;
      }
      urls.push(await fileToDataUrl(f));
    }
    setVideos(urls);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signedIn) {
      pushToast?.('Sign in to share local intel', 'info');
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
        vibe: vibe || undefined,
        crowd_status: crowd || undefined,
        budget_kes: budget ? Number(budget) : undefined,
        practical_tip: tip.trim() || undefined,
        photos,
        videos,
      };
      let created;
      try {
        created = await submitReviewHandler(payload);
      } catch {
        created = null;
      }
      const normalizedNew = normalizeReview(
        created?.review ||
          created || {
            rating,
            review_text: text,
            author: user?.name || user?.username || 'You',
            id: `local-${Date.now()}`,
            created_at: new Date().toISOString(),
            vibe,
            crowd,
            budgetKes: budget ? Number(budget) : null,
            tip: tip.trim(),
            photos,
            videos,
          }
      );
      if (normalizedNew) {
        setLocalReviews((prev) => {
          const next = [normalizedNew, ...prev];
          try {
            localStorage.setItem(`gemspot-community-${placeId}`, JSON.stringify(next.slice(0, 40)));
          } catch {
            /* quota */
          }
          return next;
        });
        onReviewAdded?.(normalizedNew);
        if (crowd && onCrowdReport) onCrowdReport(crowd);
      }
      setText('');
      setRating(0);
      setVibe('');
      setCrowd('');
      setBudget('');
      setTip('');
      setPhotos([]);
      setVideos([]);
      pushToast?.('Thanks — your local intel is live', 'success');
    } catch (err) {
      pushToast?.(err?.message || 'Could not submit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.ReviewContainer} aria-labelledby="reviews-heading">
      <div className={styles.HeaderRow}>
        <div>
          <h3 id="reviews-heading" className={styles.Title}>
            Community intel
          </h3>
          {merged.length > 0 && (
            <p className={styles.AvgLine}>
              <Star size={14} fill="currentColor" /> {avg.toFixed(1)} · {merged.length} contribution
              {merged.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <div className={styles.FilterRow} role="group" aria-label="Filter">
          {[
            { id: 'newest', label: 'Newest' },
            { id: 'highest', label: 'Highest' },
            { id: 'tips', label: 'Tips' },
            { id: 'media', label: 'Media' },
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

      {(intel.crowd || intel.vibe || intel.budgetAvg || intel.tipCount > 0) && (
        <div className={styles.IntelStrip}>
          {intel.vibe && (
            <span className={styles.IntelChip}>
              <Sparkles size={13} /> Vibe: {intel.vibe}
            </span>
          )}
          {intel.crowd && (
            <span className={styles.IntelChip}>
              <Users size={13} /> Crowd: {intel.crowd}
            </span>
          )}
          {intel.budgetAvg != null && (
            <span className={styles.IntelChip}>
              <Wallet size={13} /> ~KSh {intel.budgetAvg.toLocaleString()} confirmed
            </span>
          )}
          {intel.tipCount > 0 && (
            <span className={styles.IntelChip}>
              <Lightbulb size={13} /> {intel.tipCount} tips
            </span>
          )}
          {intel.mediaCount > 0 && (
            <span className={styles.IntelChip}>
              <ImageIcon size={13} /> {intel.mediaCount} media
            </span>
          )}
        </div>
      )}

      <form className={styles.RateForm} onSubmit={handleSubmit}>
        <p className={styles.RateLabel}>Share what it’s really like</p>
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

        <div className={styles.FieldGrid}>
          <label className={styles.Field}>
            <span><Sparkles size={13} /> Vibe update</span>
            <select value={vibe} onChange={(e) => setVibe(e.target.value)} disabled={!signedIn}>
              <option value="">Select vibe</option>
              {VIBE_OPTS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className={styles.Field}>
            <span><Users size={13} /> Crowd status</span>
            <select value={crowd} onChange={(e) => setCrowd(e.target.value)} disabled={!signedIn}>
              <option value="">How full is it?</option>
              {CROWD_OPTS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.Field}>
            <span><Wallet size={13} /> Budget for two (KSh)</span>
            <input
              type="number"
              min="0"
              step="50"
              placeholder="e.g. 2500"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={!signedIn}
            />
          </label>
        </div>

        <textarea
          className={styles.RateText}
          placeholder={signedIn ? 'What stood out?' : 'Sign in to leave a review'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          disabled={!signedIn || submitting}
          maxLength={800}
        />
        <input
          className={styles.TipInput}
          placeholder="Practical tip (matatu, parking, queue to skip…)"
          value={tip}
          onChange={(e) => setTip(e.target.value)}
          disabled={!signedIn || submitting}
          maxLength={200}
        />

        <div className={styles.MediaRow}>
          <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={onPhotos} />
          <input ref={videoRef} type="file" accept="video/*" hidden onChange={onVideos} />
          <button type="button" className={styles.MediaBtn} disabled={!signedIn} onClick={() => photoRef.current?.click()}>
            <Camera size={15} /> Photos {photos.length ? `(${photos.length})` : ''}
          </button>
          <button type="button" className={styles.MediaBtn} disabled={!signedIn} onClick={() => videoRef.current?.click()}>
            <Video size={15} /> Video {videos.length ? '(1)' : ''}
          </button>
        </div>
        {(photos.length > 0 || videos.length > 0) && (
          <div className={styles.MediaPreview}>
            {photos.map((src, i) => (
              <img key={i} src={src} alt="" className={styles.Thumb} />
            ))}
            {videos.map((src, i) => (
              <video key={`v-${i}`} src={src} className={styles.ThumbVideo} controls muted playsInline />
            ))}
          </div>
        )}

        <div className={styles.RateActions}>
          {signedIn ? (
            <button type="submit" className={styles.RateSubmit} disabled={submitting || !rating}>
              {submitting ? <Loader2 size={16} className={styles.Spin} /> : <Send size={16} />}
              Post intel
            </button>
          ) : (
            <Link to="/login" className={styles.RateSubmit}>
              Sign in to contribute
            </Link>
          )}
        </div>
      </form>

      <div className={styles.ReviewList}>
        {loadingReviews && merged.length === 0 && (
          <p className={styles.EmptyLine}>Loading community intel…</p>
        )}
        {!loadingReviews && visibleReviews.length === 0 && (
          <p className={styles.EmptyLine}>No intel yet — share a photo, tip, or crowd status.</p>
        )}
        {visibleReviews.map((review) => (
          <article key={review.id} className={styles.ReviewItem}>
            <img src={review.avatar} alt="" className={styles.Avatar} loading="lazy" />
            <div className={styles.ReviewContent}>
              <div className={styles.ReviewHeader}>
                <span className={styles.AuthorName}>{review.author}</span>
                <div className={styles.RatingRow} aria-label={`${review.rating} stars`}>
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
              <div className={styles.TagRow}>
                {review.vibe && <span className={styles.Tag}>{review.vibe}</span>}
                {review.crowd && <span className={styles.Tag}>Crowd: {review.crowd}</span>}
                {review.budgetKes != null && (
                  <span className={styles.Tag}>~KSh {Number(review.budgetKes).toLocaleString()}</span>
                )}
              </div>
              {review.text && <p className={styles.ReviewText}>{review.text}</p>}
              {review.tip && (
                <p className={styles.TipLine}>
                  <Lightbulb size={13} /> {review.tip}
                </p>
              )}
              {(review.photos?.length > 0 || review.videos?.length > 0) && (
                <div className={styles.MediaPreview}>
                  {review.photos?.map((src, i) => (
                    <img key={i} src={src} alt="" className={styles.Thumb} />
                  ))}
                  {review.videos?.map((src, i) => (
                    <video key={`rv-${i}`} src={src} className={styles.ThumbVideo} controls muted playsInline />
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={sortedReviews.length}
        onChange={setPage}
        label="reviews"
      />
    </section>
  );
}
