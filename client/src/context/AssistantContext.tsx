import React, { createContext, useContext, useState } from 'react';
import { StadiumState } from '../types';

interface AssistantContextType {
  selectedZoneId: string;
  setSelectedZoneId: (id: string) => void;
  stadiumState: StadiumState | null;
  setStadiumState: (state: StadiumState | null) => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [stadiumState, setStadiumState] = useState<StadiumState | null>(null);

  return (
    <AssistantContext.Provider value={{ selectedZoneId, setSelectedZoneId, stadiumState, setStadiumState }}>
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
