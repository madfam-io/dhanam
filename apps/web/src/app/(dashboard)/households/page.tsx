'use client';

import { useState, useEffect } from 'react';
import {
  useHouseholds,
  type Household,
  type HouseholdNetWorth,
  type HouseholdGoalSummary,
  type CreateHouseholdInput,
} from '@/hooks/useHouseholds';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Users, Plus, Home, Building2, Briefcase, Target, Loader2, DollarSign } from 'lucide-react';

export default function HouseholdsPage() {
  const {
    getHouseholds,
    getHousehold,
    createHousehold,
    getHouseholdNetWorth,
    getHouseholdGoalSummary,
    loading,
    error,
  } = useHouseholds();

  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [netWorth, setNetWorth] = useState<HouseholdNetWorth | null>(null);
  const [goalSummary, setGoalSummary] = useState<HouseholdGoalSummary | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newHousehold, setNewHousehold] = useState<CreateHouseholdInput>({
    name: '',
    type: 'family',
    baseCurrency: 'USD',
    description: '',
  });

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async () => {
    try {
      const data = await getHouseholds();
      setHouseholds(data);
    } catch (err) {
      console.error('Failed to load households:', err);
    }
  };

  const handleHouseholdClick = async (household: Household) => {
    try {
      const [fullHousehold, netWorthData, goalsData] = await Promise.all([
        getHousehold(household.id),
        getHouseholdNetWorth(household.id),
        getHouseholdGoalSummary(household.id),
      ]);

      setSelectedHousehold(fullHousehold);
      setNetWorth(netWorthData);
      setGoalSummary(goalsData);
    } catch (err) {
      console.error('Failed to load household details:', err);
    }
  };

  const handleCreateHousehold = async () => {
    try {
      await createHousehold(newHousehold);
      setIsCreateDialogOpen(false);
      setNewHousehold({
        name: '',
        type: 'family',
        baseCurrency: 'USD',
        description: '',
      });
      loadHouseholds();
    } catch (err) {
      console.error('Failed to create household:', err);
    }
  };

  const getHouseholdIcon = (type: string) => {
    switch (type) {
      case 'family':
        return <Home className="h-5 w-5" />;
      case 'trust':
        return <Building2 className="h-5 w-5" />;
      case 'estate':
        return <Building2 className="h-5 w-5" />;
      case 'partnership':
        return <Briefcase className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Households</h1>
          <p className="text-muted-foreground">
            Manage multi-generational family financial planning
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Household
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Household</DialogTitle>
              <DialogDescription>
                Create a household to organize multi-generational financial planning
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newHousehold.name}
                  onChange={(e) => setNewHousehold({ ...newHousehold, name: e.target.value })}
                  placeholder="Smith Family"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newHousehold.type}
                  onValueChange={(value: any) => setNewHousehold({ ...newHousehold, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="trust">Trust</SelectItem>
                    <SelectItem value="estate">Estate</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="currency">Base Currency</Label>
                <Select
                  value={newHousehold.baseCurrency}
                  onValueChange={(value: any) =>
                    setNewHousehold({ ...newHousehold, baseCurrency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newHousehold.description}
                  onChange={(e) =>
                    setNewHousehold({ ...newHousehold, description: e.target.value })
                  }
                  placeholder="Main family household"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHousehold} disabled={!newHousehold.name}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && households.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Households List */}
      {!loading && households.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Households Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first household to start multi-generational planning
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Household
            </Button>
          </CardContent>
        </Card>
      )}

      {households.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {households.map((household) => (
            <Card
              key={household.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleHouseholdClick(household)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getHouseholdIcon(household.type)}
                    <CardTitle className="text-xl">{household.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {household.type}
                  </Badge>
                </div>
                {household.description && (
                  <CardDescription>{household.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Members:</span>
                    <span className="font-medium">
                      {household.members?.length || household._count?.spaces || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spaces:</span>
                    <span className="font-medium">{household._count?.spaces || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Goals:</span>
                    <span className="font-medium">{household._count?.goals || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Household Details */}
      {selectedHousehold && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{selectedHousehold.name} Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Net Worth Card */}
            {netWorth && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Total Net Worth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(netWorth.totalNetWorth, selectedHousehold.baseCurrency)}
                  </div>
                  {netWorth.bySpace.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {netWorth.bySpace.map((space) => (
                        <div key={space.spaceId} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{space.spaceName}:</span>
                          <span className="font-medium">
                            {formatCurrency(space.netWorth, selectedHousehold.baseCurrency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Goals Summary Card */}
            {goalSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goals Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Goals:</span>
                      <span className="font-medium">{goalSummary.totalGoals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active:</span>
                      <span className="font-medium">{goalSummary.activeGoals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Achieved:</span>
                      <span className="font-medium">{goalSummary.achievedGoals}</span>
                    </div>
                    <div className="flex justify-between mt-4 pt-4 border-t">
                      <span className="text-muted-foreground">Target Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          goalSummary.totalTargetAmount,
                          selectedHousehold.baseCurrency
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({selectedHousehold.members?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedHousehold.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{member.user?.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {member.relationship}
                        </div>
                      </div>
                      {member.isMinor && (
                        <Badge variant="secondary" className="text-xs">
                          Minor
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
