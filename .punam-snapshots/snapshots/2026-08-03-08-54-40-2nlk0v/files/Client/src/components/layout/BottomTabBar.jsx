import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Compass, Heart, Home } from 'lucide-react';
import { BottomTabBarStyles as styles } from '@styles';

const tabs = [
  { to: '/', label: 'Home', icon: Home, match: (p) => p === '/' },
  { to: '/explore', label: 'Explore', icon: Compass, match: (p) => p.startsWith('/explore') || p.startsWith('/place') },
  { to: '/events', label: 'Events', icon: CalendarDays, match: (p) => p.startsWith('/event') },
  { to: '/saved', label: 'Saved', icon: Heart, match: (p) => p.startsWith('/saved') },
];

export function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav className={styles.Bar} aria-label="Mobile primary">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={active ? styles.TabActive : styles.Tab}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
