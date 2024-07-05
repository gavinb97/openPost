import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Get the user from sessionStorage when the component mounts
    const savedUser = sessionStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const loginContext = (userData) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logoutContext = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    console.log('Logged Out')
  };

  // Ensure that the context provides not just the user but also the login and logout functions
  const value = {
    user,
    loginContext,
    logoutContext
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
