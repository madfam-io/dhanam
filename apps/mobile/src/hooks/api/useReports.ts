import { useQuery, useMutation } from '@tanstack/react-query';
import { Linking, Alert } from 'react-native';

import { apiClient } from '@/services/api';

import { useSpaces } from '../useSpaces';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  format: 'pdf' | 'csv';
}

export interface ReportSummary {
  transactionCount: number;
  totalIncome: number;
  totalExpenses: number;
  netCashflow: number;
  currency: string;
  budgetCount: number;
  accountCount: number;
}

export interface ReportDownloadResponse {
  downloadUrl: string;
  filename: string;
  expiresAt: string;
}

const QUERY_KEY = 'reports';

export function useAvailableReports() {
  const { currentSpace } = useSpaces();

  return useQuery<ReportTemplate[]>({
    queryKey: [QUERY_KEY, 'available', currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(`/reports/available?spaceId=${currentSpace.id}`);
      return response.data;
    },
    enabled: !!currentSpace,
  });
}

export function useReportSummary(startDate: string, endDate: string) {
  const { currentSpace } = useSpaces();

  return useQuery<ReportSummary>({
    queryKey: [QUERY_KEY, 'summary', currentSpace?.id, startDate, endDate],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(
        `/reports/summary?spaceId=${currentSpace.id}&startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    },
    enabled: !!currentSpace && !!startDate && !!endDate,
  });
}

export function useGeneratePdfReport() {
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }): Promise<ReportDownloadResponse> => {
      if (!currentSpace) throw new Error('No space selected');

      // Request a download URL from the API
      const response = await apiClient.post<ReportDownloadResponse>(`/reports/export/pdf`, {
        spaceId: currentSpace.id,
        startDate,
        endDate,
      });

      return response.data;
    },
    onSuccess: async (data) => {
      // Open the download URL in the browser
      const canOpen = await Linking.canOpenURL(data.downloadUrl);
      if (canOpen) {
        await Linking.openURL(data.downloadUrl);
      } else {
        Alert.alert('Error', 'Unable to open download link');
      }
    },
  });
}

export function useGenerateCsvReport() {
  const { currentSpace } = useSpaces();

  return useMutation({
    mutationFn: async ({
      startDate,
      endDate,
    }: {
      startDate: string;
      endDate: string;
    }): Promise<ReportDownloadResponse> => {
      if (!currentSpace) throw new Error('No space selected');

      // Request a download URL from the API
      const response = await apiClient.post<ReportDownloadResponse>(`/reports/export/csv`, {
        spaceId: currentSpace.id,
        startDate,
        endDate,
      });

      return response.data;
    },
    onSuccess: async (data) => {
      // Open the download URL in the browser
      const canOpen = await Linking.canOpenURL(data.downloadUrl);
      if (canOpen) {
        await Linking.openURL(data.downloadUrl);
      } else {
        Alert.alert('Error', 'Unable to open download link');
      }
    },
  });
}
