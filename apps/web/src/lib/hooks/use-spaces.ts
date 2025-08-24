import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Space, CreateSpaceDto, UpdateSpaceDto } from '@dhanam/shared';
import { useSpaceStore } from '@/stores/space';

const SPACES_KEY = ['spaces'];

export function useSpaces() {
  const { setCurrentSpace } = useSpaceStore();

  return useQuery({
    queryKey: SPACES_KEY,
    queryFn: async () => {
      const spaces = await apiClient.get<Space[]>('/spaces');
      if (spaces.length > 0 && !useSpaceStore.getState().currentSpace) {
        setCurrentSpace(spaces[0] || null);
      }
      return spaces;
    },
  });
}

export function useSpace(spaceId: string) {
  return useQuery({
    queryKey: [...SPACES_KEY, spaceId],
    queryFn: async () => {
      return apiClient.get<Space>(`/spaces/${spaceId}`);
    },
    enabled: !!spaceId,
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();
  const { setCurrentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async (data: CreateSpaceDto) => {
      return apiClient.post<Space>('/spaces', data);
    },
    onSuccess: (space) => {
      queryClient.invalidateQueries({ queryKey: SPACES_KEY });
      setCurrentSpace(space);
    },
  });
}

export function useUpdateSpace(spaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSpaceDto) => {
      return apiClient.patch<Space>(`/spaces/${spaceId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SPACES_KEY });
      queryClient.invalidateQueries({ queryKey: [...SPACES_KEY, spaceId] });
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();
  const { currentSpace, setCurrentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: (spaceId: string) => apiClient.delete(`/spaces/${spaceId}`),
    onSuccess: (_, deletedSpaceId) => {
      queryClient.invalidateQueries({ queryKey: SPACES_KEY });
      if (currentSpace?.id === deletedSpaceId) {
        setCurrentSpace(null);
      }
    },
  });
}