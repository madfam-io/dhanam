'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useOnboarding } from '../onboarding-provider';
import { Button } from '@dhanam/ui';
import { Card, CardContent } from '@dhanam/ui';
import {
  TrendingUpIcon,
  ShieldIcon,
  PieChartIcon,
  SmartphoneIcon,
  ArrowRightIcon,
} from 'lucide-react';

const features = [
  {
    icon: TrendingUpIcon,
    title: 'Gestión Inteligente',
    description: 'Conecta todas tus cuentas bancarias y wallets crypto en un solo lugar',
  },
  {
    icon: PieChartIcon,
    title: 'Análisis ESG',
    description: 'Evalúa el impacto ambiental y social de tus inversiones cryptocurrency',
  },
  {
    icon: ShieldIcon,
    title: 'Seguridad Total',
    description: 'Autenticación de dos factores y cifrado de extremo a extremo',
  },
  {
    icon: SmartphoneIcon,
    title: 'Multi-Plataforma',
    description: 'Accede desde web y móvil con sincronización en tiempo real',
  },
];

export function WelcomeStep() {
  const { user } = useAuth();
  const { updateStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await updateStep('email_verification');
    } catch (error) {
      console.error('Error proceeding to next step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* Welcome header */}
      <div className="mb-12">
        <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
          <span className="text-3xl">👋</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ¡Bienvenido a Dhanam, {user?.name}!
        </h1>
        <p className="text-xl text-gray-600">
          Tu nueva plataforma de gestión financiera personal y empresarial con análisis ESG
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="border-2 border-gray-100 hover:border-indigo-200 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <feature.icon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* What to expect */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 mb-8">
        <CardContent className="p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">¿Qué sigue?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div>
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-medium text-gray-900 mb-1">Verifica tu email</h3>
              <p className="text-sm text-gray-600">Confirma tu cuenta para mayor seguridad</p>
            </div>
            <div>
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-medium text-gray-900 mb-1">Configura preferencias</h3>
              <p className="text-sm text-gray-600">Personaliza idioma, moneda y notificaciones</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🏦</div>
              <h3 className="font-medium text-gray-900 mb-1">Conecta cuentas</h3>
              <p className="text-sm text-gray-600">Vincula bancos y wallets para sincronizar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={isLoading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8"
        >
          {isLoading ? 'Cargando...' : 'Comenzar configuración'}
          <ArrowRightIcon className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-sm text-gray-500 mt-3">Solo tomará unos minutos configurar tu cuenta</p>
      </div>
    </div>
  );
}
