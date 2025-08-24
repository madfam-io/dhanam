'use client';

import { useState } from 'react';
import { useOnboarding } from '../onboarding-provider';
import { Button } from '@dhanam/ui';
import { Card, CardContent } from '@dhanam/ui';
import {
  PlayCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  SkipForwardIcon,
} from 'lucide-react';

const features = [
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    description:
      'Tu vista central con resumen de cuentas, gastos recientes y tendencias financieras',
    image: '📊',
    tips: [
      'Ve el balance de todas tus cuentas en tiempo real',
      'Analiza tus gastos por categoría con gráficos interactivos',
      'Recibe alertas importantes sobre tu situación financiera',
    ],
  },
  {
    id: 'accounts',
    title: 'Gestión de Cuentas',
    description: 'Conecta y administra todas tus cuentas bancarias y wallets desde un lugar',
    image: '🏦',
    tips: [
      'Conecta bancos mexicanos, estadounidenses y exchanges crypto',
      'Monitorea wallets Bitcoin y Ethereum sin compartir claves privadas',
      'Sincronización automática de transacciones y balances',
    ],
  },
  {
    id: 'budgets',
    title: 'Presupuestos Inteligentes',
    description:
      'Crea presupuestos por categoría y recibe alertas cuando te acerques a los límites',
    image: '💰',
    tips: [
      'Configura límites personalizados por categoría',
      'Alertas automáticas al 80% y 100% del presupuesto',
      'Análisis de variaciones mes a mes',
    ],
  },
  {
    id: 'transactions',
    title: 'Transacciones',
    description: 'Ve todas tus transacciones organizadas y categorizadas automáticamente',
    image: '📋',
    tips: [
      'Categorización automática con inteligencia artificial',
      'Búsqueda y filtros avanzados',
      'Edita categorías y añade notas personales',
    ],
  },
  {
    id: 'esg',
    title: 'Análisis ESG',
    description: 'Evalúa el impacto ambiental y social de tus inversiones en criptomonedas',
    image: '🌱',
    tips: [
      'Puntuación ESG para cada criptomoneda en tu portafolio',
      'Análisis de huella de carbono de tus inversiones',
      'Recomendaciones para inversiones más sostenibles',
    ],
  },
  {
    id: 'reports',
    title: 'Reportes y Análisis',
    description: 'Obtén insights profundos sobre tus hábitos financieros y tendencias',
    image: '📈',
    tips: [
      'Reportes mensuales detallados por email',
      'Análisis de cashflow con proyecciones',
      'Exporta datos a CSV para análisis avanzado',
    ],
  },
];

export function FeatureTourStep() {
  const { updateStep, skipStep } = useOnboarding();
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  const handleNext = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(currentFeature + 1);
    }
  };

  const handlePrevious = () => {
    if (currentFeature > 0) {
      setCurrentFeature(currentFeature - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      await updateStep('completed');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await skipStep('feature_tour');
    } catch (error) {
      console.error('Error skipping step:', error);
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <PlayCircleIcon className="w-10 h-10 text-purple-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tour de funciones</h1>
        <p className="text-lg text-gray-600">
          Descubre todo lo que puedes hacer con Dhanam para maximizar tu gestión financiera
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2">
          {features.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentFeature
                  ? 'bg-purple-600'
                  : index < currentFeature
                    ? 'bg-purple-300'
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="ml-4 text-sm text-gray-500">
          {currentFeature + 1} de {features.length}
        </span>
      </div>

      {/* Feature showcase */}
      <Card className="mb-8">
        <CardContent className="p-8">
          {features[currentFeature] && (
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{features[currentFeature].image}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{features[currentFeature].title}</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">{features[currentFeature].description}</p>
          </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">✨ Características principales:</h3>
              <ul className="space-y-2">
                {features[currentFeature].tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center mb-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentFeature === 0}
          className="flex items-center space-x-2"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span>Anterior</span>
        </Button>

        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isSkipping}
            className="text-gray-500 hover:text-gray-700"
          >
            <SkipForwardIcon className="w-4 h-4 mr-1" />
            {isSkipping ? 'Saltando...' : 'Saltar tour'}
          </Button>
        </div>

        {currentFeature < features.length - 1 ? (
          <Button onClick={handleNext} className="flex items-center space-x-2">
            <span>Siguiente</span>
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="bg-green-600 hover:bg-green-700 flex items-center space-x-2"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>{isCompleting ? 'Finalizando...' : 'Completar configuración'}</span>
          </Button>
        )}
      </div>

      {/* Quick access */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
        <h3 className="font-semibold text-indigo-900 mb-2">¿Listo para comenzar?</h3>
        <p className="text-indigo-800 text-sm mb-4">
          Todas estas funciones estarán disponibles en tu dashboard. También puedes consultar
          nuestra documentación en cualquier momento.
        </p>
        <div className="flex justify-center space-x-4 text-sm">
          <span className="text-indigo-600">📚 Centro de ayuda</span>
          <span className="text-indigo-600">💬 Soporte en vivo</span>
          <span className="text-indigo-600">🎯 Tours interactivos</span>
        </div>
      </div>
    </div>
  );
}
