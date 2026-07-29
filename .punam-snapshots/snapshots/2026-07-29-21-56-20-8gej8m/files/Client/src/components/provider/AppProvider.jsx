import { useState } from 'react';
import { AppContext } from '../../library/contexts/AppContext.js';
import { AppProviderStyles as styles } from '@styles';

export function AppProvider({ children }) {
  const [user, setUser] = useState({
    name: 'Guest',
    isAuthenticated: false,
    preferences: [],
  });

  const value = {
    user,
    setUser,
  };

  return (
    <AppContext.Provider value={value}>
      <div className={styles.ProviderContainer}>
        {children}
      </div>
    </AppContext.Provider>
  );
}