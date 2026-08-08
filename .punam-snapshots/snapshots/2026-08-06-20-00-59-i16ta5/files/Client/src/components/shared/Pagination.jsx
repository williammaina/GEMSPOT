import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../../styles/components/shared/Pagination.module.css';

/**
 * Accessible pagination control.
 * page is 1-based.
 */
export function Pagination({
  page = 1,
  pageSize = 9,
  total = 0,
  onChange,
  label = 'Results',
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) {
    return total > 0 ? (
      <p className={styles.MetaOnly} aria-live="polite">
        Showing {total} {label.toLowerCase()}
      </p>
    ) : null;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const go = (p) => {
    const next = Math.min(totalPages, Math.max(1, p));
    if (next !== page) onChange?.(next);
  };

  // window of page numbers
  const windowSize = 5;
  let from = Math.max(1, page - Math.floor(windowSize / 2));
  let to = Math.min(totalPages, from + windowSize - 1);
  from = Math.max(1, to - windowSize + 1);
  const nums = [];
  for (let i = from; i <= to; i++) nums.push(i);

  return (
    <nav className={styles.Bar} aria-label="Pagination">
      <p className={styles.Meta} aria-live="polite">
        {start}–{end} of {total} {label.toLowerCase()}
      </p>
      <div className={styles.Controls}>
        <button
          type="button"
          className={styles.Btn}
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        {from > 1 && (
          <>
            <button type="button" className={styles.Page} onClick={() => go(1)}>
              1
            </button>
            {from > 2 && <span className={styles.Ellipsis}>…</span>}
          </>
        )}
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            className={n === page ? styles.PageActive : styles.Page}
            onClick={() => go(n)}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        ))}
        {to < totalPages && (
          <>
            {to < totalPages - 1 && <span className={styles.Ellipsis}>…</span>}
            <button type="button" className={styles.Page} onClick={() => go(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          className={styles.Btn}
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}

/** Slice helper for any list */
export function paginate(items, page, pageSize) {
  const list = Array.isArray(items) ? items : [];
  const start = (Math.max(1, page) - 1) * pageSize;
  return list.slice(start, start + pageSize);
}
