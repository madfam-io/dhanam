import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export interface ManualAsset {
  id: string;
  name: string;
  type: string;
  description?: string;
  currentValue: number;
  currency: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
  documents?: { key: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateManualAssetDto {
  name: string;
  type: string;
  description?: string;
  currentValue: number;
  currency: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
}

export interface UpdateManualAssetDto {
  name?: string;
  type?: string;
  description?: string;
  currentValue?: number;
  currency?: string;
  acquisitionDate?: string;
  acquisitionCost?: number;
}

export const ASSET_TYPES = [
  { value: 'real_estate', label: 'Real Estate', icon: 'business-outline' },
  { value: 'vehicle', label: 'Vehicle', icon: 'car-outline' },
  { value: 'domain', label: 'Web Domain', icon: 'globe-outline' },
  { value: 'private_equity', label: 'Private Equity', icon: 'trending-up-outline' },
  { value: 'angel_investment', label: 'Angel Investment', icon: 'rocket-outline' },
  { value: 'collectible', label: 'Collectible', icon: 'diamond-outline' },
  { value: 'art', label: 'Art', icon: 'color-palette-outline' },
  { value: 'jewelry', label: 'Jewelry', icon: 'sparkles-outline' },
  { value: 'other', label: 'Other', icon: 'cube-outline' },
] as const;

export type AssetType = (typeof ASSET_TYPES)[number]['value'];

const QUERY_KEY = 'manual-assets';

export function useManualAssets() {
  const { currentSpace } = useSpaces();

  return useQuery<ManualAsset[]>({
    queryKey: [QUERY_KEY, currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/spaces/${currentSpace.id}/manual-assets`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useManualAsset(assetId: string | null) {
  const { currentSpace } = useSpaces();

  return useQuery<ManualAsset>({
    queryKey: [QUERY_KEY, currentSpace?.id, assetId],
    queryFn: async () => {
      if (!currentSpace || !assetId) throw new Error('Missing parameters');
      const response = await apiClient.get(`/spaces/${currentSpace.id}/manual-assets/${assetId}`);
      return response.data;
    },
    enabled: !!currentSpace && !!assetId,
  });
}

export function useCreateManualAsset() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (dto: CreateManualAssetDto) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.post(`/spaces/${currentSpace.id}/manual-assets`, dto);
      return response.data as ManualAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useUpdateManualAsset() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({ assetId, dto }: { assetId: string; dto: UpdateManualAssetDto }) => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.patch(
        `/spaces/${currentSpace.id}/manual-assets/${assetId}`,
        dto
      );
      return response.data as ManualAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}

export function useDeleteManualAsset() {
  const queryClient = useQueryClient();
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async (assetId: string) => {
      if (!currentSpace) throw new Error('No space selected');
      await apiClient.delete(`/spaces/${currentSpace.id}/manual-assets/${assetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, currentSpace?.id] });
    },
  });
}
