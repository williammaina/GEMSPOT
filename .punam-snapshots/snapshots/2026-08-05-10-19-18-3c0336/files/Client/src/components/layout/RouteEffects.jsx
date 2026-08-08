import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES = {
  '/': 'GemSpot KE — Curated Kenya',
  '/explore': 'Explore places — GemSpot KE',
  '/events': 'Events — GemSpot KE',
  '/saved': 'My list — GemSpot KE',
  '/login': 'Sign in — GemSpot KE',
  '/register': 'Create account — GemSpot KE',
  '/profile': 'Profile — GemSpot KE',
  '/admin': 'Admin — GemSpot KE',
  '/plan': 'My list — GemSpot KE',
};

export function RouteEffects() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [location.pathname, location.search]);

  useEffect(() => {
    let title = TITLES[location.pathname];
    if (!title) {
      if (location.pathname.startsWith('/place/')) title = 'Place details — GemSpot KE';
      else if (location.pathname.startsWith('/event/')) title = 'Event details — GemSpot KE';
      else title = 'GemSpot KE';
    }
    if (location.search.includes('category=eats')) title = 'Eats — GemSpot KE';
    if (location.search.includes('category=nature')) title = 'Nature — GemSpot KE';
    if (location.search.includes('category=nightlife')) title = 'Nightlife — GemSpot KE';
    if (location.search.includes('category=action')) title = 'Action & Play — GemSpot KE';
    document.title = title;
  }, [location.pathname, location.search]);

  return null;
}
