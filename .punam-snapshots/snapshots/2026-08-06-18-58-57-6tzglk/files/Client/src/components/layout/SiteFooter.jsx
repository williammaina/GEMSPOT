import { Link, useLocation } from 'react-router-dom';
import { SiteFooterStyles as styles } from '@styles';
import { GlowWave } from '../shared/GlowWave.jsx';
import { GemSpotLogo } from '../shared/GemSpotLogo.jsx';

export function SiteFooter() {
  const { pathname } = useLocation();
  const showAmbient = pathname === '/';

  return (
    <div className={styles.FooterShell}>
      {showAmbient && (
        <div className={styles.AmbientLayer} aria-hidden="true">
          <GlowWave height={320} />
        </div>
      )}
      <footer className={styles.Footer}>
        <div className={styles.Inner}>
          <div className={styles.Brand}>
            <div className={styles.BrandLockup}>
              <GemSpotLogo size={26} />
              <strong>
                GemSpot<span className={styles.Ke}>KE</span>
              </strong>
            </div>
            <p>Curated Kenya. Budgets, matatus, M-Pesa &amp; vibe — no surprises.</p>
          </div>
          <nav className={styles.Nav} aria-label="Footer">
            <Link to="/explore">Explore</Link>
            <Link to="/events">Events</Link>
            <Link to="/saved">My list</Link>
            <Link to="/explore?category=eats">Eats</Link>
            <Link to="/explore?category=nature">Nature</Link>
          </nav>
          <p className={styles.Copy}>
            © {new Date().getFullYear()} GemSpot KE · Built for real nights out
          </p>
        </div>
      </footer>
    </div>
  );
}
