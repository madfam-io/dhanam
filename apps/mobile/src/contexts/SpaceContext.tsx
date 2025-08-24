import React, { createContext, useContext } from 'react';

import { useSpaces, Space } from '@/hooks/useSpaces';

interface SpaceContextType {
  spaces: Space[];
  currentSpace: Space | null;
  loading: boolean;
  createSpace: (data: Omit<Space, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Space>;
  switchSpace: (space: Space) => void;
  refetch: () => Promise<void>;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const spaceHook = useSpaces();

  return <SpaceContext.Provider value={spaceHook}>{children}</SpaceContext.Provider>;
}

export function useSpaceContext(): SpaceContextType {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error('useSpaceContext must be used within a SpaceProvider');
  }
  return context;
}

// Also export the hook for convenience
export { useSpaces };
