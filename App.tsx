import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SessionProvider } from './src/context/SessionContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/db/database';

export default function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <AuthProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </SessionProvider>
    </AuthProvider>
  );
}
