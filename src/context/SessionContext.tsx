import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DailySession } from '../types';

interface SessionContextType {
  activeSession: DailySession | null;
  setActiveSession: (session: DailySession | null) => void;
}

const SessionContext = createContext<SessionContextType>({
  activeSession: null,
  setActiveSession: () => {},
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [activeSession, setActiveSession] = useState<DailySession | null>(null);
  return (
    <SessionContext.Provider value={{ activeSession, setActiveSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
