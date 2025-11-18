import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState, ComponentProps } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts/AuthContext';
import { useOnboarding } from '../../src/contexts/OnboardingContext';

const { width } = Dimensions.get('window');

const features: Array<{
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  color: string;
}> = [
  {
    icon: 'trending-up-outline',
    title: 'Gestión Inteligente',
    description: 'Conecta todas tus cuentas bancarias y wallets crypto en un solo lugar',
    color: '#10b981',
  },
  {
    icon: 'leaf-outline',
    title: 'Análisis ESG',
    description: 'Evalúa el impacto ambiental y social de tus inversiones cryptocurrency',
    color: '#059669',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Seguridad Total',
    description: 'Autenticación biométrica y cifrado de extremo a extremo',
    color: '#6366f1',
  },
  {
    icon: 'phone-portrait-outline',
    title: 'Acceso Móvil',
    description: 'Gestiona tus finanzas desde cualquier lugar con nuestra app móvil',
    color: '#8b5cf6',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { updateStep } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await updateStep('email_verification');
      router.push('/(onboarding)/email-verification');
    } catch (error) {
      console.error('Error proceeding to next step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={{
            paddingVertical: 60,
            paddingHorizontal: 20,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 36 }}>👋</Text>
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            ¡Bienvenido a Dhanam, {user?.name}!
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            Tu nueva plataforma de gestión financiera personal y empresarial con análisis ESG
          </Text>
        </LinearGradient>

        {/* Features */}
        <View style={{ padding: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginBottom: 30,
            }}
          >
            {features.map((feature, index) => (
              <View
                key={index}
                style={{
                  width: (width - 60) / 2,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: `${feature.color}20`,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name={feature.icon} size={20} color={feature.color} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: 4,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    lineHeight: 16,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>

          {/* What's next */}
          <View
            style={{
              backgroundColor: '#f0f9ff',
              borderColor: '#0ea5e9',
              borderWidth: 1,
              borderRadius: 12,
              padding: 20,
              marginBottom: 30,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#0c4a6e',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              ¿Qué sigue?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>📧</Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '500', color: '#0c4a6e', textAlign: 'center' }}
                >
                  Verifica tu email
                </Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>⚙️</Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '500', color: '#0c4a6e', textAlign: 'center' }}
                >
                  Configura preferencias
                </Text>
              </View>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>🏦</Text>
                <Text
                  style={{ fontSize: 12, fontWeight: '500', color: '#0c4a6e', textAlign: 'center' }}
                >
                  Conecta cuentas
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* CTA Button */}
      <View style={{ padding: 20, paddingTop: 10 }}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={isLoading}
          style={{
            backgroundColor: isLoading ? '#9ca3af' : '#6366f1',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
        >
          {isLoading && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
          <Text
            style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600',
              marginRight: isLoading ? 0 : 8,
            }}
          >
            {isLoading ? 'Cargando...' : 'Comenzar configuración'}
          </Text>
          {!isLoading && <Ionicons name="arrow-forward" size={20} color="white" />}
        </TouchableOpacity>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: '#6b7280',
            marginTop: 12,
          }}
        >
          Solo tomará unos minutos configurar tu cuenta
        </Text>
      </View>
    </SafeAreaView>
  );
}
