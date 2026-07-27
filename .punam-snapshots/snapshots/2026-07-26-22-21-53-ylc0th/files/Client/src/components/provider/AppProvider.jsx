import { createContext, useState, useContext } from 'react';

// Create the Context
const AppContext = createContext();

export function AppProvider({ children }) {
  // Mocking user state for the Profile button in the Navbar
  const [user, setUser] = useState({
    name: 'Guest',
    isAuthenticated: false,
    preferences: []
  });

  // You can add theme state, global loading states, or location permissions here

  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to consume the App Context globally
export const useApp = () => useContext(AppContext);