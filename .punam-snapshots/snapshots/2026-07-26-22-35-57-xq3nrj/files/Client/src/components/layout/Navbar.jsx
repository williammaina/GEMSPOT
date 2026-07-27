import { Link, useLocation } from 'react-router-dom';
import { Hexagon, User } from 'lucide-react';
import { NavbarStyles as styles } from '@styles';
// 1. Import the global state hook
import { useApp } from '@components'; 

export function Navbar() {
  const location = useLocation();
  // 2. Consume the user state
  const { user } = useApp(); 

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
        {/* 3. Render the dynamic username ('Guest' by default) */}
        {user.name}
      </button>
    </nav>
  );
}