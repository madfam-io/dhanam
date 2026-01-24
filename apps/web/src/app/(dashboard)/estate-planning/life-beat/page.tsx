'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type LifeBeatStatus } from '@/lib/api/users';
import { estatePlanningApi, type Executor } from '@/lib/api/estate-planning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  HeartPulse,
  Plus,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
  Mail,
  Trash2,
} from 'lucide-react';

export default function LifeBeatPage() {
  const queryClient = useQueryClient();
  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false);
  const [isAddExecutorDialogOpen, setIsAddExecutorDialogOpen] = useState(false);
  const [alertDays, setAlertDays] = useState<number[]>([30, 60, 90]);
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [newExecutor, setNewExecutor] = useState({
    email: '',
    name: '',
    relationship: 'spouse',
  });

  // Fetch Life Beat status
  const { data: status, isLoading } = useQuery<LifeBeatStatus>({
    queryKey: ['life-beat-status'],
    queryFn: () => usersApi.getLifeBeatStatus(),
  });

  // Fetch executors
  const { data: executors = [] } = useQuery<Executor[]>({
    queryKey: ['executors'],
    queryFn: () => estatePlanningApi.getExecutors(),
  });

  // Enable Life Beat mutation
  const enableMutation = useMutation({
    mutationFn: (data: { alertDays: number[] }) => usersApi.enableLifeBeat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-beat-status'] });
      setIsEnableDialogOpen(false);
    },
  });

  // Disable Life Beat mutation
  const disableMutation = useMutation({
    mutationFn: () => usersApi.disableLifeBeat(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-beat-status'] });
    },
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: () => usersApi.checkIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-beat-status'] });
    },
  });

  // Add executor mutation
  const addExecutorMutation = useMutation({
    mutationFn: (data: { email: string; name: string; relationship: string }) =>
      estatePlanningApi.addExecutor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executors'] });
      setIsAddExecutorDialogOpen(false);
      setNewExecutor({ email: '', name: '', relationship: 'spouse' });
    },
  });

  // Remove executor mutation
  const removeExecutorMutation = useMutation({
    mutationFn: (executorId: string) => estatePlanningApi.removeExecutor(executorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executors'] });
    },
  });

  const handleEnable = () => {
    if (!legalAgreed) return;
    enableMutation.mutate({ alertDays });
  };

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      setIsEnableDialogOpen(true);
    } else {
      disableMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HeartPulse className="h-8 w-8 text-red-500" />
            Life Beat
          </h1>
          <p className="text-muted-foreground">
            Your financial safety net for life's uncertainties
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Protection Status
              </CardTitle>
              <CardDescription>
                Life Beat monitors your activity and alerts trusted contacts if needed
              </CardDescription>
            </div>
            <Switch
              checked={status?.enabled ?? false}
              onCheckedChange={handleToggle}
              disabled={disableMutation.isPending || enableMutation.isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          {status?.enabled ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Last Activity</div>
                  <div className="text-2xl font-bold">{status.daysSinceActivity ?? 0} days ago</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Alert Thresholds</div>
                  <div className="text-2xl font-bold">{status.alertDays.join(', ')} days</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Trusted Executors</div>
                  <div className="text-2xl font-bold">{status.executorCount}</div>
                </div>
              </div>

              {status.pendingAlerts.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Pending Alerts</AlertTitle>
                  <AlertDescription>
                    You have {status.pendingAlerts.length} pending inactivity alert(s). Check in to
                    reset your timer.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="w-full"
                size="lg"
              >
                {checkInMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                I'm Okay - Check In Now
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <HeartPulse className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Life Beat is Disabled</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Enable Life Beat to ensure your designated executors can access your financial
                information if something happens to you.
              </p>
              <Button onClick={() => setIsEnableDialogOpen(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Enable Life Beat
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Executors Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Designated Executors
              </CardTitle>
              <CardDescription>
                Trusted individuals who can access your financial overview
              </CardDescription>
            </div>
            <Dialog open={isAddExecutorDialogOpen} onOpenChange={setIsAddExecutorDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Executor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Executor</DialogTitle>
                  <DialogDescription>
                    Add a trusted person who can access your financial information.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="executor-name">Full Name</Label>
                    <Input
                      id="executor-name"
                      value={newExecutor.name}
                      onChange={(e) => setNewExecutor({ ...newExecutor, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="executor-email">Email Address</Label>
                    <Input
                      id="executor-email"
                      type="email"
                      value={newExecutor.email}
                      onChange={(e) => setNewExecutor({ ...newExecutor, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="executor-relationship">Relationship</Label>
                    <Select
                      value={newExecutor.relationship}
                      onValueChange={(value) =>
                        setNewExecutor({ ...newExecutor, relationship: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="child">Child</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="attorney">Attorney</SelectItem>
                        <SelectItem value="financial_advisor">Financial Advisor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddExecutorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addExecutorMutation.mutate(newExecutor)}
                    disabled={
                      addExecutorMutation.isPending || !newExecutor.email || !newExecutor.name
                    }
                  >
                    {addExecutorMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add Executor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {executors.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Executors Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add trusted individuals who can access your financial information.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {executors.map((executor) => (
                <div
                  key={executor.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{executor.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {executor.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={executor.verified ? 'default' : 'secondary'}>
                      {executor.verified ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {executor.relationship.replace('_', ' ')}
                    </Badge>
                    {executor.accessGranted && <Badge variant="destructive">Access Granted</Badge>}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExecutorMutation.mutate(executor.id)}
                      disabled={removeExecutorMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Life Beat Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold mb-2">Activity Monitoring</h4>
              <p className="text-sm text-muted-foreground">
                We track your logins and activity. If you're active, nothing happens.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold mb-2">Escalating Alerts</h4>
              <p className="text-sm text-muted-foreground">
                After 30, 60, 90 days of inactivity, we send you check-in reminders.
              </p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold mb-2">Executor Access</h4>
              <p className="text-sm text-muted-foreground">
                If you don't respond, your executors can request read-only access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enable Dialog */}
      <Dialog open={isEnableDialogOpen} onOpenChange={setIsEnableDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Enable Life Beat Protection
            </DialogTitle>
            <DialogDescription>
              Configure your inactivity thresholds and accept the legal disclaimer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Alert Thresholds (days of inactivity)</Label>
              <div className="flex gap-2 mt-2">
                {[30, 60, 90].map((days) => (
                  <Button
                    key={days}
                    variant={alertDays.includes(days) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (alertDays.includes(days)) {
                        setAlertDays(alertDays.filter((d) => d !== days));
                      } else {
                        setAlertDays([...alertDays, days].sort((a, b) => a - b));
                      }
                    }}
                  >
                    {days} days
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You'll receive reminders at each threshold. Executors are notified at the final
                threshold.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Legal Notice</AlertTitle>
              <AlertDescription className="text-sm">
                Life Beat provides read-only access to financial summaries. It does not grant
                transaction authority, account access, or legal power of attorney. This feature is
                designed for informational purposes only and should complement, not replace, proper
                estate planning with legal counsel.
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-3">
              <Checkbox
                id="legal-agree"
                checked={legalAgreed}
                onCheckedChange={(checked) => setLegalAgreed(checked as boolean)}
              />
              <label htmlFor="legal-agree" className="text-sm">
                I understand that Life Beat provides read-only financial visibility and does not
                constitute legal power of attorney or account access authority. I agree to the Terms
                of Service for this feature.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnableDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEnable}
              disabled={!legalAgreed || alertDays.length === 0 || enableMutation.isPending}
            >
              {enableMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enable Life Beat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
