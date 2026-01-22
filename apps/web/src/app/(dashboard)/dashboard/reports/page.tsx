'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Input } from '@dhanam/ui';
import { Label } from '@dhanam/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dhanam/ui';
import {
  FileText,
  Download,
  Loader2,
  Calendar,
  FileSpreadsheet,
  FileType,
  TrendingUp,
  PiggyBank,
} from 'lucide-react';
import { useSpaceStore } from '@/stores/space';
import { reportsApi } from '@/lib/api/reports';
import { toast } from 'sonner';

const reportTemplates = [
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Complete financial overview including income, expenses, and net worth',
    icon: FileText,
    format: 'pdf',
  },
  {
    id: 'transaction-export',
    name: 'Transaction Export',
    description: 'Export all transactions for the selected period',
    icon: FileSpreadsheet,
    format: 'csv',
  },
  {
    id: 'budget-performance',
    name: 'Budget Performance',
    description: 'Detailed budget tracking and category analysis',
    icon: PiggyBank,
    format: 'pdf',
  },
  {
    id: 'net-worth-trend',
    name: 'Net Worth Trend',
    description: 'Track your net worth changes over time',
    icon: TrendingUp,
    format: 'pdf',
  },
];

function getDefaultStartDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0] as string;
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0] as string;
}

export default function ReportsPage() {
  const { currentSpace } = useSpaceStore();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate);
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: availableReports, isLoading } = useQuery({
    queryKey: ['available-reports', currentSpace?.id],
    queryFn: () => {
      if (!currentSpace) throw new Error('No current space');
      return reportsApi.getAvailableReports(currentSpace.id);
    },
    enabled: !!currentSpace,
  });

  const handleGenerateReport = async () => {
    if (!currentSpace?.id) {
      toast.error('Please select a space first');
      return;
    }

    setIsGenerating(true);

    try {
      let blob: Blob;
      const spaceId = currentSpace.id;

      if (exportFormat === 'csv') {
        blob = await reportsApi.downloadCsvExport(spaceId, startDate, endDate);
      } else {
        blob = await reportsApi.downloadPdfReport(spaceId, startDate, endDate);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhanam-${selectedReport || 'report'}-${startDate}-to-${endDate}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickExport = async (format: 'pdf' | 'csv') => {
    if (!currentSpace?.id) {
      toast.error('Please select a space first');
      return;
    }

    setIsGenerating(true);

    try {
      let blob: Blob;
      const spaceId = currentSpace.id;

      if (format === 'csv') {
        blob = await reportsApi.downloadCsvExport(spaceId, startDate, endDate);
      } else {
        blob = await reportsApi.downloadPdfReport(spaceId, startDate, endDate);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhanam-report-${startDate}-to-${endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${format.toUpperCase()} downloaded successfully`);
    } catch (error) {
      toast.error('Failed to download');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Please select a space to generate reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate and export financial reports and data
        </p>
      </div>

      {/* Quick Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Quick Export
          </CardTitle>
          <CardDescription>
            Quickly export your financial data for the selected date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleQuickExport('pdf')}
                disabled={isGenerating}
                variant="default"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileType className="mr-2 h-4 w-4" />
                )}
                PDF Report
              </Button>
              <Button
                onClick={() => handleQuickExport('csv')}
                disabled={isGenerating}
                variant="outline"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                CSV Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Report Templates</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedReport === template.id;

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'hover:border-muted-foreground/50'
                }`}
                onClick={() => setSelectedReport(isSelected ? null : template.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{template.name}</h3>
                        <span className="text-xs uppercase text-muted-foreground bg-muted px-2 py-1 rounded">
                          {template.format}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Custom Report
          </CardTitle>
          <CardDescription>
            Configure and generate a custom report with specific parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={exportFormat}
                onValueChange={(value: 'pdf' | 'csv') => setExportFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="csv">CSV Export</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : availableReports?.reports && availableReports.reports.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>Pre-configured report types for your space</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableReports.reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {report.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickExport(report.type as 'pdf' | 'csv')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
