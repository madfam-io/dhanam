import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Space } from '@dhanam/shared';

interface SpaceStore {
  currentSpace: Space | null;
  spaces: Space[];
  setCurrentSpace: (space: Space | null) => void;
  setSpaces: (spaces: Space[]) => void;
  addSpace: (space: Space) => void;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  removeSpace: (spaceId: string) => void;
}

export const useSpaceStore = create<SpaceStore>()(
  persist(
    (set) => ({
      currentSpace: null,
      spaces: [],
      setCurrentSpace: (space) => set({ currentSpace: space }),
      setSpaces: (spaces) => set({ spaces }),
      addSpace: (space) =>
        set((state) => ({ spaces: [...state.spaces, space] })),
      updateSpace: (spaceId, updates) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, ...updates } : s
          ),
          currentSpace:
            state.currentSpace?.id === spaceId
              ? { ...state.currentSpace, ...updates }
              : state.currentSpace,
        })),
      removeSpace: (spaceId) =>
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== spaceId),
          currentSpace:
            state.currentSpace?.id === spaceId ? null : state.currentSpace,
        })),
    }),
    {
      name: 'space-storage',
    }
  )
);