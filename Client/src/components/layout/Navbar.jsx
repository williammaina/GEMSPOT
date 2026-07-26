import { Link, useLocation } from 'react-router-dom';
import { Hexagon, User } from 'lucide-react';
import { NavbarStyles as styles } from '@styles';

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: 'Nature', path: '/explore?category=nature' },
    { name: 'Eats', path: '/explore?category=eats' },
    { name: 'Nightlife', path: '/explore?category=nightlife' },
    { name: 'Action & Play', path: '/explore?category=action' },
    { name: 'Events', path: '/events' },
  ];

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
            className={location.pathname === item.path ? styles.NavLinkActive : styles.NavLink}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <button className={styles.ProfileButton}>
        <User size={16} />
        Profile
      </button>
    </nav>
  );
}