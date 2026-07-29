import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Compass, Hexagon, MapPinned, Sparkles, User } from 'lucide-react';
import { NavbarStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

export function Navbar() {
  const location = useLocation();
  const { user } = useApp();

  const navItems = [
    { name: 'Nature', path: '/explore?category=nature', icon: Compass },
    { name: 'Eats', path: '/explore?category=eats', icon: Sparkles },
    { name: 'Nightlife', path: '/explore?category=nightlife', icon: MapPinned },
    { name: 'Action & Play', path: '/explore?category=action', icon: Compass },
    { name: 'Events', path: '/events', icon: CalendarDays },
  ];


  

  const isActive = (path) => location.pathname + location.search === path;

  return (
    <header className={styles.NavbarWrap}>
      <nav className={styles.NavbarContainer} aria-label="Primary">
        <Link to="/" className={styles.BrandMark} aria-label="GemSpot KE home">
          <span className={styles.BrandIconShell} aria-hidden="true">
            <Hexagon className={styles.LogoIcon} size={22} fill="currentColor" />
          </span>

          <span className={styles.BrandCopy}>
            <span className={styles.BrandName}>GEMSPOT KE</span>
            <span className={styles.BrandTagline}>
              <Sparkles size={12} aria-hidden="true" />
              Discovery-first Kenya
            </span>
          </span>
        </Link>

        <div className={styles.NavLinks}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={active ? styles.NavLinkActive : styles.NavLink}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        <button type="button" className={styles.ProfileButton} aria-label="Profile menu">
          <span className={styles.ProfileAvatar} aria-hidden="true">
            <User size={16} />
          </span>

          <span className={styles.ProfileText}>
            <span className={styles.ProfileLabel}>Profile</span>
            <span className={styles.ProfileName}>{user?.name || 'Guest'}</span>
          </span>
        </button>
      </nav>
    </header>
  );
}