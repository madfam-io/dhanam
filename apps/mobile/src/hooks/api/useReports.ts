import { useQuery, useMutation } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

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

const QUERY_KEY = 'reports';

export function useAvailableReports() {
  const { currentSpace } = useSpaces();

  return useQuery<ReportTemplate[]>({
    queryKey: [QUERY_KEY, 'available', currentSpace?.id],
    queryFn: async () => {
      if (!currentSpace) throw new Error('No space selected');
      const response = await apiClient.get(
        `/reports/available?spaceId=${currentSpace.id}`
      );
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
    }) => {
      if (!currentSpace) throw new Error('No space selected');

      // Get the PDF from the API
      const response = await apiClient.get(
        `/reports/export/pdf?spaceId=${currentSpace.id}&startDate=${startDate}&endDate=${endDate}`,
        {
          responseType: 'blob',
        }
      );

      // Save to file system
      const filename = `dhanam-report-${startDate}-to-${endDate}.pdf`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, response.data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export Financial Report',
        });
      } else {
        Alert.alert('Success', `Report saved to ${fileUri}`);
      }

      return { filename, fileUri };
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
    }) => {
      if (!currentSpace) throw new Error('No space selected');

      // Get the CSV from the API
      const response = await apiClient.get(
        `/reports/export/csv?spaceId=${currentSpace.id}&startDate=${startDate}&endDate=${endDate}`,
        {
          responseType: 'blob',
        }
      );

      // Save to file system
      const filename = `dhanam-transactions-${startDate}-to-${endDate}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, response.data, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions',
        });
      } else {
        Alert.alert('Success', `Transactions saved to ${fileUri}`);
      }

      return { filename, fileUri };
    },
  });
}
