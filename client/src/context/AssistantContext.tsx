import React, { createContext, useContext, useState, useEffect } from 'react';
import { StadiumState } from '../types';

interface AssistantContextType {
  selectedZoneId: string;
  setSelectedZoneId: (id: string) => void;
  stadiumState: StadiumState | null;
  setStadiumState: (state: StadiumState | null) => void;
  refreshState: () => Promise<void>;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [stadiumState, setStadiumState] = useState<StadiumState | null>(null);

  const refreshState = async () => {
    try {
      const res = await fetch('/api/stadium/state');
      if (res.ok) {
        const data = await res.json();
        setStadiumState(data);
      }
    } catch (err) {
      console.error('Error fetching global stadium state:', err);
    }
  };

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AssistantContext.Provider value={{ selectedZoneId, setSelectedZoneId, stadiumState, setStadiumState, refreshState }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
