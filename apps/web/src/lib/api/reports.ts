import { apiClient } from './client';

export interface ReportType {
  id: string;
  name: string;
  type: 'pdf' | 'csv';
  createdAt: string;
}

export interface GenerateReportParams {
  spaceId: string;
  startDate: string;
  endDate: string;
  format?: 'pdf' | 'csv';
}

export const reportsApi = {
  /**
   * Get available report types for a space
   */
  getAvailableReports: async (spaceId: string): Promise<{ reports: ReportType[] }> => {
    return apiClient.get<{ reports: ReportType[] }>(`/reports/${spaceId}`);
  },

  /**
   * Get PDF report download URL
   */
  getPdfReportUrl: (spaceId: string, startDate: string, endDate: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dhan.am/v1';
    return `${baseUrl}/reports/${spaceId}/download/pdf?startDate=${startDate}&endDate=${endDate}`;
  },

  /**
   * Get CSV export download URL
   */
  getCsvExportUrl: (spaceId: string, startDate: string, endDate: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dhan.am/v1';
    return `${baseUrl}/reports/${spaceId}/download/csv?startDate=${startDate}&endDate=${endDate}`;
  },

  /**
   * Download PDF report
   */
  downloadPdfReport: async (
    spaceId: string,
    startDate: string,
    endDate: string
  ): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dhan.am/v1';
    const response = await fetch(
      `${baseUrl}/reports/${spaceId}/download/pdf?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    return response.blob();
  },

  /**
   * Download CSV export
   */
  downloadCsvExport: async (
    spaceId: string,
    startDate: string,
    endDate: string
  ): Promise<Blob> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.dhan.am/v1';
    const response = await fetch(
      `${baseUrl}/reports/${spaceId}/download/csv?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download export');
    }

    return response.blob();
  },
};
