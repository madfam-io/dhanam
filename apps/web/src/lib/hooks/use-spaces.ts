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
      const response = await apiClient.get<Space[]>('/spaces');
      const spaces = response.data;
      if (spaces.length > 0 && !useSpaceStore.getState().currentSpace) {
        setCurrentSpace(spaces[0]);
      }
      return spaces;
    },
  });
}

export function useSpace(spaceId: string) {
  return useQuery({
    queryKey: [...SPACES_KEY, spaceId],
    queryFn: async () => {
      const response = await apiClient.get<Space>(`/spaces/${spaceId}`);
      return response.data;
    },
    enabled: !!spaceId,
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();
  const { setCurrentSpace } = useSpaceStore();

  return useMutation({
    mutationFn: async (data: CreateSpaceDto) => {
      const response = await apiClient.post<Space>('/spaces', data);
      return response.data;
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
      const response = await apiClient.patch<Space>(`/spaces/${spaceId}`, data);
      return response.data;
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