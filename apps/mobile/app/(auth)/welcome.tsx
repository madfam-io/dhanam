import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/styles/auth';

const features = [
  {
    icon: 'analytics-outline',
    title: 'Track Your Wealth',
    description: 'Monitor accounts from multiple banks and crypto exchanges in one place',
  },
  {
    icon: 'leaf-outline',
    title: 'ESG Insights',
    description: 'Make sustainable investment decisions with comprehensive ESG scoring',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Bank-Level Security',
    description:
      'Your data is protected with enterprise-grade encryption and biometric authentication',
  },
  {
    icon: 'globe-outline',
    title: 'LATAM Focused',
    description: 'Built for Latin America with support for local banks and currencies',
  },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <Text variant="displaySmall" style={styles.title}>
            Welcome to{'\n'}Dhanam Ledger
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Your comprehensive financial companion for budgeting, wealth tracking, and sustainable
            investing
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {features.map((feature, index) => (
            <Card key={index} style={styles.featureCard}>
              <Card.Content style={styles.featureContent}>
                <Ionicons
                  name={feature.icon as any}
                  size={32}
                  color="#4CAF50"
                  style={styles.featureIcon}
                />
                <View style={styles.featureText}>
                  <Text variant="titleMedium" style={styles.featureTitle}>
                    {feature.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* CTA Buttons */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => router.push('/(auth)/register')}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            Get Started
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/(auth)/login')}
            style={styles.secondaryButton}
            contentStyle={styles.buttonContent}
          >
            Sign In
          </Button>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
