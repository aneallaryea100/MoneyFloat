import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { getUserById } from '../db/database';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId');
        if (userId) {
          const storedUser = getUserById(userId);
          if (storedUser) setUser(storedUser);
        }
      } catch (_) {
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (loggedInUser: User) => {
    await SecureStore.setItemAsync('userId', loggedInUser.id);
    setUser(loggedInUser);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
