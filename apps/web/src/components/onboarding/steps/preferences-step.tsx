'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/hooks/use-auth';
import { useOnboarding } from '../onboarding-provider';
import { onboardingApi } from '@/lib/api/onboarding';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SettingsIcon, GlobeIcon, DollarSignIcon, BellIcon } from 'lucide-react';

interface PreferencesFormData {
  locale: string;
  timezone: string;
  currency: string;
  emailNotifications: boolean;
  transactionAlerts: boolean;
  budgetAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

const languages = [
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
];

const timezones = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC-6)' },
  { value: 'America/New_York', label: 'Nueva York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC-8)' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
];

const currencies = [
  { value: 'MXN', label: 'Peso Mexicano (MXN)', symbol: '$' },
  { value: 'USD', label: 'Dólar Americano (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
];

export function PreferencesStep() {
  const { user } = useAuth();
  const { updateStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { handleSubmit, watch, setValue, formState } = useForm<PreferencesFormData>({
    defaultValues: {
      locale: user?.locale || 'es',
      timezone: user?.timezone || 'America/Mexico_City',
      currency: 'MXN',
      emailNotifications: true,
      transactionAlerts: true,
      budgetAlerts: true,
      weeklyReports: false,
      monthlyReports: true,
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: PreferencesFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Update preferences
      await onboardingApi.updatePreferences(data);
      
      // Move to next step
      await updateStep('space_setup', { preferences: data });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar preferencias');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <SettingsIcon className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Configura tus preferencias
        </h1>
        <p className="text-lg text-gray-600">
          Personaliza tu experiencia en Dhanam según tus necesidades
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GlobeIcon className="w-5 h-5 text-indigo-600" />
              <span>Configuración Regional</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Language */}
            <div>
              <Label htmlFor="locale" className="text-sm font-medium">
                Idioma
              </Label>
              <Select
                value={watchedValues.locale}
                onValueChange={(value) => setValue('locale', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div>
              <Label htmlFor="timezone" className="text-sm font-medium">
                Zona horaria
              </Label>
              <Select
                value={watchedValues.timezone}
                onValueChange={(value) => setValue('timezone', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSignIcon className="w-5 h-5 text-indigo-600" />
              <span>Moneda Principal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="currency" className="text-sm font-medium">
                Selecciona tu moneda preferida para mostrar balances y reportes
              </Label>
              <Select
                value={watchedValues.currency}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      <div className="flex items-center space-x-2">
                        <span>{currency.symbol}</span>
                        <span>{currency.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BellIcon className="w-5 h-5 text-indigo-600" />
              <span>Notificaciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Notificaciones por email</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Recibe updates importantes sobre tu cuenta
                </p>
              </div>
              <Switch
                checked={watchedValues.emailNotifications}
                onCheckedChange={(checked) => setValue('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Alertas de transacciones</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Te notificamos cuando se detecten nuevas transacciones
                </p>
              </div>
              <Switch
                checked={watchedValues.transactionAlerts}
                onCheckedChange={(checked) => setValue('transactionAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Alertas de presupuesto</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Avisos cuando te acerques a los límites de gastos
                </p>
              </div>
              <Switch
                checked={watchedValues.budgetAlerts}
                onCheckedChange={(checked) => setValue('budgetAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Resumen semanal</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Recibe un resumen de gastos cada semana
                </p>
              </div>
              <Switch
                checked={watchedValues.weeklyReports}
                onCheckedChange={(checked) => setValue('weeklyReports', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Reporte mensual</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Análisis detallado de tus finanzas cada mes
                </p>
              </div>
              <Switch
                checked={watchedValues.monthlyReports}
                onCheckedChange={(checked) => setValue('monthlyReports', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? 'Guardando...' : 'Guardar y continuar'}
          </Button>
        </div>
      </form>
    </div>
  );
}