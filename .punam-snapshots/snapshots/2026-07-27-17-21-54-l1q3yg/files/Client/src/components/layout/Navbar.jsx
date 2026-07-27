import { Link, useLocation } from 'react-router-dom';
import { Hexagon, User } from 'lucide-react';
import { NavbarStyles as styles } from '@styles';
import { useApp } from '../../library/contexts/AppContext.js';

export function Navbar() {
  const location = useLocation();
  const { user } = useApp(); 

  const navItems = [
    { name: 'Nature', path: '/explore?category=nature' },
    { name: 'Eats', path: '/explore?category=eats' },
    { name: 'Nightlife', path: '/explore?category=nightlife' },
    { name: 'Action & Play', path: '/explore?category=action' },
    { name: 'Events', path: '/events' },
  ];

  // Helper to check exact active routes including query params
  const isActive = (path) => {
    return location.pathname + location.search === path;
  };

  return (
    <nav className={styles.NavbarContainer}>
      <Link to="/" className={styles.Logo}>
        <Hexagon className={styles.LogoIcon} size={24} fill="currentColor" />
        GEMSPOT KE
      </Link>

      <div className={styles.NavLinks}>
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            to={item.path} 
            className={isActive(item.path) ? styles.NavLinkActive : styles.NavLink}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <button className={styles.ProfileButton}>
        <User size={16} />
        {user?.name || 'Guest'}
      </button>
    </nav>
  );
}