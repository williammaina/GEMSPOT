import { createContext, useState, useContext } from 'react';
import { AppProviderStyles as styles } from '@styles';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState({
    name: 'Guest',
    isAuthenticated: false,
    preferences: []
  });

  return (
    <AppContext.Provider value={{ user, setUser }}>
      <div className={styles.ProviderContainer}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);