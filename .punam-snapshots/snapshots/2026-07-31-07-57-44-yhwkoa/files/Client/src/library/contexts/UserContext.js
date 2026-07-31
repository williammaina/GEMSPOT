import { createContext } from 'react';

// Central Context for User Profile & Preferences
export const UserContext = createContext({
  user: {
    name: 'Guest',
    isAuthenticated: false,
    preferences: []
  },
  setUser: () => {}
});