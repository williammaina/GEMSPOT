import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  Compass,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Music2,
  Settings,
  Sparkles,
  Sun,
  User,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import { GemSpotLogo } from '../shared/GemSpotLogo.jsx';
import { NavbarStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

const navItems = [
  {
    name: 'Explore',
    path: '/explore',
    icon: Compass,
    match: (loc) => loc.pathname === '/explore' && !loc.search.includes('category='),
  },
  {
    name: 'Nature',
    path: '/explore?category=nature',
    icon: Compass,
    match: (loc) => loc.search.includes('category=nature'),
  },
  {
    name: 'Eats',
    path: '/explore?category=eats',
    icon: Utensils,
    match: (loc) => loc.search.includes('category=eats'),
  },
  {
    name: 'Nightlife',
    path: '/explore?category=nightlife',
    icon: Music2,
    match: (loc) => loc.search.includes('category=nightlife'),
  },
  {
    name: 'Action',
    path: '/explore?category=action',
    icon: Zap,
    match: (loc) => loc.search.includes('category=action'),
  },
  {
    name: 'Events',
    path: '/events',
    icon: CalendarDays,
    match: (loc) => loc.pathname.startsWith('/event'),
  },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, theme, toggleTheme, favorites = [], planStops = [], logout, pushToast } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const favCount = Array.isArray(favorites) ? favorites.length : 0;
  const planCount = Array.isArray(planStops) ? planStops.length : 0;
  const isAdmin = Boolean(user?.is_admin || user?.isAdmin || user?.role === 'admin');
  const signedIn = Boolean(user?.isAuthenticated);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const onDoc = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleLogout = async () => {
    await logout?.();
    pushToast?.('Signed out', 'info');
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className={styles.NavbarWrap}>
      <a href="#main-content" className={styles.SkipLink}>
        Skip to content
      </a>

      <nav className={styles.NavbarContainer} aria-label="Primary">
        <Link to="/" className={styles.BrandMark} aria-label="GemSpot KE home">
          <span className={styles.BrandIconShell} aria-hidden="true">
            <GemSpotLogo size={30} className={styles.LogoIcon} />
          </span>
          <span className={styles.BrandCopy}>
            <span className={styles.BrandNameRow}>
              <span className={styles.BrandName}>GemSpot</span>
              <span className={styles.BrandKe} aria-label="Kenya">KE</span>
            </span>
            <span className={styles.BrandTagline}>Curated nights &amp; days</span>
          </span>
        </Link>

        <div className={styles.NavLinks}>
          {navItems.map((item) => {
            const active = item.match(location);
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

        <div className={styles.NavActions}>
          <button
            type="button"
            className={styles.IconButton}
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          <Link
            to="/saved"
            className={styles.IconButton}
            title="My list"
            aria-label={
              favCount || planCount
                ? `My list · ${favCount} saved · ${planCount} plan`
                : 'My list — saved & plan'
            }
          >
            <Heart size={16} />
            {(favCount + planCount) > 0 && (
              <span className={styles.Badge}>
                {favCount + planCount > 9 ? '9+' : favCount + planCount}
              </span>
            )}
          </Link>
          <div className={styles.ProfileWrap} ref={profileRef}>
            <button
              type="button"
              className={styles.ProfileButton}
              onClick={() => setProfileOpen((v) => !v)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <span className={styles.ProfileAvatar} aria-hidden="true">
                <User size={15} />
              </span>
              <span className={styles.ProfileText}>
                <span className={styles.ProfileLabel}>
                  {signedIn ? user?.name || user?.username || 'You' : 'Guest'}
                </span>
                <span className={styles.ProfileName}>
                  {signedIn ? (isAdmin ? 'Admin' : 'Signed in') : 'Sign in'}
                </span>
              </span>
            </button>

            {profileOpen && (
              <div className={styles.ProfileMenu} role="menu">
                {signedIn ? (
                  <>
                    <Link to="/profile" role="menuitem" onClick={() => setProfileOpen(false)}>
                      <User size={15} /> Profile
                    </Link>
                    <Link to="/saved" role="menuitem" onClick={() => setProfileOpen(false)}>
                      <Heart size={15} /> My list
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" role="menuitem" onClick={() => setProfileOpen(false)}>
                        <Settings size={15} /> Admin
                      </Link>
                    )}
                    <button type="button" role="menuitem" onClick={handleLogout}>
                      <LogOut size={15} /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" role="menuitem" onClick={() => setProfileOpen(false)}>
                      <LogIn size={15} /> Sign in
                    </Link>
                    <Link to="/register" role="menuitem" onClick={() => setProfileOpen(false)}>
                      <User size={15} /> Create account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.MenuBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className={styles.MobileMenu} role="dialog" aria-label="Menu">
          {navItems.map((item) => {
            const active = item.match(location);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={active ? styles.MobileLinkActive : styles.MobileLink}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
          <Link to="/saved" className={styles.MobileLink} onClick={() => setMenuOpen(false)}>
            <Heart size={16} /> Saved
          </Link>
          {signedIn ? (
            <Link to="/profile" className={styles.MobileLink} onClick={() => setMenuOpen(false)}>
              <User size={16} /> Profile
            </Link>
          ) : (
            <Link to="/login" className={styles.MobileLink} onClick={() => setMenuOpen(false)}>
              <LogIn size={16} /> Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
