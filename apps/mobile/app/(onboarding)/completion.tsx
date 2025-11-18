import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

const completionFeatures = [
  {
    icon: 'checkmark-circle-outline',
    title: 'Configuración completa',
    description: 'Tu cuenta está lista para usar con todas las preferencias configuradas',
    color: '#10b981',
  },
  {
    icon: 'sparkles-outline',
    title: 'Experiencia personalizada',
    description: 'Dhanam se adaptará a tus preferencias de idioma, moneda y notificaciones',
    color: '#6366f1',
  },
  {
    icon: 'rocket-outline',
    title: 'Todo listo para comenzar',
    description: 'Accede a todas las funcionalidades desde tu dashboard personalizado',
    color: '#8b5cf6',
  },
];

export default function CompletionScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Refresh user data to get updated onboarding status
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleGoToDashboard = () => {
    router.replace('/(tabs)/dashboard');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <LinearGradient
          colors={['#10b981', '#059669']}
          style={{
            paddingVertical: 60,
            paddingHorizontal: 20,
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Animated trophy */}
          <View
            style={{
              width: 120,
              height: 120,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 60,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="trophy" size={60} color="white" />
          </View>

          {/* Floating sparkles */}
          <View style={{ position: 'absolute', top: 40, left: 60 }}>
            <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.8)" />
          </View>
          <View style={{ position: 'absolute', top: 50, right: 80 }}>
            <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.6)" />
          </View>
          <View style={{ position: 'absolute', top: 80, right: 40 }}>
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.8)" />
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
            ¡Felicidades, {user?.name}! 🎉
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            Has completado exitosamente la configuración de tu cuenta de Dhanam
          </Text>
        </LinearGradient>

        {/* Completion Features */}
        <View style={{ padding: 20 }}>
          {completionFeatures.map((feature, index) => (
            <View
              key={index}
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 20,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: `${feature.color}20`,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#1f2937',
                    marginBottom: 4,
                  }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 20,
                  }}
                >
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* What's Next */}
        <View
          style={{
            margin: 20,
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            🚀 ¿Qué puedes hacer ahora?
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {[
              {
                num: '1',
                title: 'Explora tu Dashboard',
                desc: 'Ve un resumen completo de tu situación financiera',
              },
              {
                num: '2',
                title: 'Conecta tus cuentas',
                desc: 'Vincula bancos y wallets para sincronización automática',
              },
              {
                num: '3',
                title: 'Crea presupuestos',
                desc: 'Establece límites de gasto y recibe alertas automáticas',
              },
              {
                num: '4',
                title: 'Analiza ESG',
                desc: 'Revisa el impacto ambiental de tus inversiones crypto',
              },
            ].map((item, index) => (
              <View
                key={index}
                style={{
                  width: (width - 80) / 2,
                  marginBottom: 16,
                  paddingRight: index % 2 === 0 ? 8 : 0,
                  paddingLeft: index % 2 === 1 ? 8 : 0,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: '#6366f1',
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                      marginTop: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      {item.num}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: 2,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                        lineHeight: 16,
                      }}
                    >
                      {item.desc}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Support Info */}
        <View
          style={{
            margin: 20,
            backgroundColor: '#fef3c7',
            borderColor: '#f59e0b',
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#92400e',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            💡 ¿Necesitas ayuda?
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#92400e',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Nuestro equipo está aquí para ayudarte a sacar el máximo provecho de Dhanam
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, color: '#92400e', marginHorizontal: 8 }}>
              📚 Centro de ayuda
            </Text>
            <Text style={{ fontSize: 12, color: '#92400e', marginHorizontal: 8 }}>
              💬 Chat de soporte
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA Button */}
      <View style={{ padding: 20, paddingTop: 10 }}>
        <TouchableOpacity
          onPress={handleGoToDashboard}
          style={{
            borderRadius: 12,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['#6366f1', '#8b5cf6']}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              marginRight: 8,
            }}
          >
            Ir a mi Dashboard
          </Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: '#6b7280',
            marginTop: 12,
          }}
        >
          ¡Comienza a tomar control de tus finanzas hoy mismo!
        </Text>
      </View>
    </SafeAreaView>
  );
}
