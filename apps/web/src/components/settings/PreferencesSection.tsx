'use client';

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Bell, Shield, Palette, DollarSign, Leaf, Database, AlertCircle, CheckCircle } from 'lucide-react';

export function PreferencesSection() {
  const { preferences, updatePreferences, bulkUpdatePreferences, resetPreferences, isLoading, error } = usePreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!preferences) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const handleSingleUpdate = async (field: keyof typeof preferences, value: any) => {
    try {
      setIsSaving(true);
      await updatePreferences({ [field]: value });
      setSuccessMessage('Preferencias actualizadas correctamente');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating preference:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkUpdate = async (category: string, updates: any) => {
    try {
      setIsSaving(true);
      await bulkUpdatePreferences({ [category]: updates });
      setSuccessMessage(`Preferencias de ${category} actualizadas correctamente`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error bulk updating preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('¿Estás seguro que quieres restablecer todas las preferencias a sus valores por defecto?')) {
      try {
        setIsSaving(true);
        await resetPreferences();
        setSuccessMessage('Preferencias restablecidas a valores por defecto');
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Error resetting preferences:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="flex items-center gap-2 p-4 text-green-600 bg-green-50 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notificaciones</CardTitle>
          </div>
          <CardDescription>
            Configura cómo y cuándo quieres recibir notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Notificaciones por email</h4>
                <p className="text-sm text-muted-foreground">Recibir notificaciones generales por correo</p>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => handleSingleUpdate('emailNotifications', checked)}
                disabled={isSaving}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Alertas de transacciones</h4>
                <p className="text-sm text-muted-foreground">Notificaciones cuando se detectan nuevas transacciones</p>
              </div>
              <Switch
                checked={preferences.transactionAlerts}
                onCheckedChange={(checked) => handleSingleUpdate('transactionAlerts', checked)}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Alertas de presupuesto</h4>
                <p className="text-sm text-muted-foreground">Avisos cuando te acerques o superes límites de presupuesto</p>
              </div>
              <Switch
                checked={preferences.budgetAlerts}
                onCheckedChange={(checked) => handleSingleUpdate('budgetAlerts', checked)}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Reportes semanales</h4>
                <p className="text-sm text-muted-foreground">Resumen semanal de tu actividad financiera</p>
              </div>
              <Switch
                checked={preferences.weeklyReports}
                onCheckedChange={(checked) => handleSingleUpdate('weeklyReports', checked)}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium">Reportes mensuales</h4>
                <p className="text-sm text-muted-foreground">Análisis mensual detallado de tus finanzas</p>
              </div>
              <Switch
                checked={preferences.monthlyReports}
                onCheckedChange={(checked) => handleSingleUpdate('monthlyReports', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacidad</CardTitle>
          </div>
          <CardDescription>
            Controla cómo se usan tus datos y tu privacidad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Compartir datos</h4>
              <p className="text-sm text-muted-foreground">Permitir compartir datos anónimos para mejorar el producto</p>
            </div>
            <Switch
              checked={preferences.dataSharing}
              onCheckedChange={(checked) => handleSingleUpdate('dataSharing', checked)}
              disabled={isSaving}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Seguimiento de analíticas</h4>
              <p className="text-sm text-muted-foreground">Permitir recopilar datos de uso para mejorar la experiencia</p>
            </div>
            <Switch
              checked={preferences.analyticsTracking}
              onCheckedChange={(checked) => handleSingleUpdate('analyticsTracking', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Anuncios personalizados</h4>
              <p className="text-sm text-muted-foreground">Mostrar contenido y ofertas relevantes basadas en tu actividad</p>
            </div>
            <Switch
              checked={preferences.personalizedAds}
              onCheckedChange={(checked) => handleSingleUpdate('personalizedAds', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Apariencia</CardTitle>
          </div>
          <CardDescription>
            Personaliza la apariencia de tu dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Tema</h4>
              <Select
                value={preferences.themeMode}
                onValueChange={(value) => handleSingleUpdate('themeMode', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Oscuro</SelectItem>
                  <SelectItem value="system">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Layout del dashboard</h4>
              <Select
                value={preferences.dashboardLayout}
                onValueChange={(value) => handleSingleUpdate('dashboardLayout', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Estándar</SelectItem>
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="detailed">Detallado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Vista compacta</h4>
              <p className="text-sm text-muted-foreground">Mostrar más información en menos espacio</p>
            </div>
            <Switch
              checked={preferences.compactView}
              onCheckedChange={(checked) => handleSingleUpdate('compactView', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Mostrar saldos</h4>
              <p className="text-sm text-muted-foreground">Mostrar saldos de cuentas en las vistas principales</p>
            </div>
            <Switch
              checked={preferences.showBalances}
              onCheckedChange={(checked) => handleSingleUpdate('showBalances', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <CardTitle>Preferencias Financieras</CardTitle>
          </div>
          <CardDescription>
            Configura cómo se manejan y muestran tus datos financieros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Moneda por defecto</h4>
              <Select
                value={preferences.defaultCurrency}
                onValueChange={(value) => handleSingleUpdate('defaultCurrency', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                  <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Formato de exportación</h4>
              <Select
                value={preferences.exportFormat}
                onValueChange={(value) => handleSingleUpdate('exportFormat', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Categorización automática</h4>
              <p className="text-sm text-muted-foreground">Asignar categorías automáticamente a las transacciones</p>
            </div>
            <Switch
              checked={preferences.autoCategorizeTxns}
              onCheckedChange={(checked) => handleSingleUpdate('autoCategorizeTxns', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Ocultar datos sensibles</h4>
              <p className="text-sm text-muted-foreground">Enmascarar saldos y montos por defecto</p>
            </div>
            <Switch
              checked={preferences.hideSensitiveData}
              onCheckedChange={(checked) => handleSingleUpdate('hideSensitiveData', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* ESG Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            <CardTitle>Preferencias ESG</CardTitle>
          </div>
          <CardDescription>
            Configura cómo se muestran las métricas ambientales, sociales y de gobernanza
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Mostrar puntuaciones ESG</h4>
              <p className="text-sm text-muted-foreground">Mostrar métricas ESG para activos crypto</p>
            </div>
            <Switch
              checked={preferences.esgScoreVisibility}
              onCheckedChange={(checked) => handleSingleUpdate('esgScoreVisibility', checked)}
              disabled={isSaving}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Alertas de sustentabilidad</h4>
              <p className="text-sm text-muted-foreground">Recibir notificaciones sobre impacto ambiental</p>
            </div>
            <Switch
              checked={preferences.sustainabilityAlerts}
              onCheckedChange={(checked) => handleSingleUpdate('sustainabilityAlerts', checked)}
              disabled={isSaving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Reportes de impacto</h4>
              <p className="text-sm text-muted-foreground">Incluir análisis de impacto en reportes mensuales</p>
            </div>
            <Switch
              checked={preferences.impactReporting}
              onCheckedChange={(checked) => handleSingleUpdate('impactReporting', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Backup Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Respaldo de Datos</CardTitle>
          </div>
          <CardDescription>
            Configurar respaldos automáticos de tus datos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Respaldo automático</h4>
              <p className="text-sm text-muted-foreground">Crear respaldos periódicos de tus datos</p>
            </div>
            <Switch
              checked={preferences.autoBackup}
              onCheckedChange={(checked) => handleSingleUpdate('autoBackup', checked)}
              disabled={isSaving}
            />
          </div>
          
          {preferences.autoBackup && (
            <div className="space-y-2">
              <h4 className="font-medium">Frecuencia de respaldo</h4>
              <Select
                value={preferences.backupFrequency || 'weekly'}
                onValueChange={(value) => handleSingleUpdate('backupFrequency', value)}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Restablecer Preferencias</CardTitle>
          <CardDescription>
            Restablecer todas las preferencias a sus valores por defecto. Esta acción no se puede deshacer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleReset}
            disabled={isSaving}
          >
            {isSaving ? 'Restableciendo...' : 'Restablecer a valores por defecto'}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Última actualización: {new Date(preferences.updatedAt).toLocaleDateString()}</span>
            <Badge variant="secondary">
              {Object.keys(preferences).length - 4} configuraciones disponibles
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}