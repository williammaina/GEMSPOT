import { Link } from 'react-router-dom';
import { SiteFooterStyles as styles } from '@styles';

export function SiteFooter() {
  return (
    <footer className={styles.Footer}>
      <div className={styles.Inner}>
        <div className={styles.Brand}>
          <strong>GemSpot KE</strong>
          <p>Curated Kenya. Budgets, matatus, M-Pesa & vibe — no surprises.</p>
        </div>
        <nav className={styles.Nav} aria-label="Footer">
          <Link to="/explore">Explore</Link>
          <Link to="/events">Events</Link>
          <Link to="/saved">Saved</Link>
          <Link to="/explore?category=eats">Eats</Link>
          <Link to="/explore?category=nature">Nature</Link>
        </nav>
        <p className={styles.Copy}>© {new Date().getFullYear()} GemSpot KE · Built for real nights out</p>
      </div>
    </footer>
  );
}
