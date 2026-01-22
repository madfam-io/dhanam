'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dhanam/ui';
import { Button } from '@dhanam/ui';
import { Switch } from '@dhanam/ui';
import { Label } from '@dhanam/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@dhanam/ui';
import { Separator } from '@dhanam/ui';
import {
  Loader2,
  Bell,
  Shield,
  Palette,
  DollarSign,
  Leaf,
  HardDrive,
  RotateCcw,
} from 'lucide-react';
import { preferencesApi, UserPreferences } from '@/lib/api/preferences';
import { toast } from 'sonner';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => preferencesApi.getPreferences(),
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<UserPreferences>) => preferencesApi.updatePreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Preferences updated');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => preferencesApi.resetPreferences(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Preferences reset to defaults');
      setIsResetting(false);
    },
    onError: () => {
      toast.error('Failed to reset preferences');
      setIsResetting(false);
    },
  });

  const handleToggle = (key: keyof UserPreferences) => {
    if (!preferences) return;
    updateMutation.mutate({ [key]: !preferences[key] });
  };

  const handleSelectChange = (key: keyof UserPreferences, value: string) => {
    updateMutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setIsResetting(true)}
          disabled={resetMutation.isPending}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>

      {/* Reset Confirmation */}
      {isResetting && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reset all preferences to defaults?</p>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsResetting(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how and when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Transaction Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified about new transactions</p>
            </div>
            <Switch
              checked={preferences.transactionAlerts}
              onCheckedChange={() => handleToggle('transactionAlerts')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alerts when approaching budget limits
              </p>
            </div>
            <Switch
              checked={preferences.budgetAlerts}
              onCheckedChange={() => handleToggle('budgetAlerts')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive weekly financial summaries</p>
            </div>
            <Switch
              checked={preferences.weeklyReports}
              onCheckedChange={() => handleToggle('weeklyReports')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about security-related events
              </p>
            </div>
            <Switch
              checked={preferences.securityAlerts}
              onCheckedChange={() => handleToggle('securityAlerts')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>Control your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analytics Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Help improve Dhanam with usage analytics
              </p>
            </div>
            <Switch
              checked={preferences.analyticsTracking}
              onCheckedChange={() => handleToggle('analyticsTracking')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Hide Sensitive Data</Label>
              <p className="text-sm text-muted-foreground">Mask balances and amounts by default</p>
            </div>
            <Switch
              checked={preferences.hideSensitiveData}
              onCheckedChange={() => handleToggle('hideSensitiveData')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Display
          </CardTitle>
          <CardDescription>Customize how Dhanam looks and feels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred color theme</p>
            </div>
            <Select
              value={preferences.themeMode}
              onValueChange={(value) => handleSelectChange('themeMode', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Compact View</Label>
              <p className="text-sm text-muted-foreground">Use a more condensed layout</p>
            </div>
            <Switch
              checked={preferences.compactView}
              onCheckedChange={() => handleToggle('compactView')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Balances</Label>
              <p className="text-sm text-muted-foreground">Display account balances by default</p>
            </div>
            <Switch
              checked={preferences.showBalances}
              onCheckedChange={() => handleToggle('showBalances')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial
          </CardTitle>
          <CardDescription>Configure financial settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Default Currency</Label>
              <p className="text-sm text-muted-foreground">
                Currency used for display and calculations
              </p>
            </div>
            <Select
              value={preferences.defaultCurrency}
              onValueChange={(value) => handleSelectChange('defaultCurrency', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MXN">MXN</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Categorize Transactions</Label>
              <p className="text-sm text-muted-foreground">
                Automatically categorize new transactions
              </p>
            </div>
            <Switch
              checked={preferences.autoCategorizeTxns}
              onCheckedChange={() => handleToggle('autoCategorizeTxns')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ESG */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            ESG Settings
          </CardTitle>
          <CardDescription>Environmental, Social, and Governance preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show ESG Scores</Label>
              <p className="text-sm text-muted-foreground">
                Display ESG scores for crypto holdings
              </p>
            </div>
            <Switch
              checked={preferences.esgScoreVisibility}
              onCheckedChange={() => handleToggle('esgScoreVisibility')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Sustainability Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get alerts about ESG score changes
              </p>
            </div>
            <Switch
              checked={preferences.sustainabilityAlerts}
              onCheckedChange={() => handleToggle('sustainabilityAlerts')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Impact Reporting</Label>
              <p className="text-sm text-muted-foreground">
                Include ESG impact in periodic reports
              </p>
            </div>
            <Switch
              checked={preferences.impactReporting}
              onCheckedChange={() => handleToggle('impactReporting')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup & Export
          </CardTitle>
          <CardDescription>Data backup and export preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Backup</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your data periodically
              </p>
            </div>
            <Switch
              checked={preferences.autoBackup}
              onCheckedChange={() => handleToggle('autoBackup')}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Export Format</Label>
              <p className="text-sm text-muted-foreground">Default format for data exports</p>
            </div>
            <Select
              value={preferences.exportFormat}
              onValueChange={(value) => handleSelectChange('exportFormat', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
