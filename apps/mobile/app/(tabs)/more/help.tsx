import React from 'react';
import { Linking } from 'react-native';

import {
  Ionicons,
  View,
  ScrollView,
  StyleSheet,
  PaperText as Text,
  Card,
  List,
  Divider,
} from '@/lib/react-native-compat';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 'connect-accounts',
    question: 'How do I connect my bank accounts?',
    answer:
      'Navigate to the Accounts tab and tap "Add Account". Select your bank from the list and follow the secure authentication process. Your credentials are never stored on our servers.',
  },
  {
    id: 'premium-features',
    question: 'What features are included in Premium?',
    answer:
      'Premium includes unlimited Monte Carlo simulations, scenario analysis, retirement planning tools, goal probability calculations, and priority support.',
  },
  {
    id: 'data-security',
    question: 'How is my financial data protected?',
    answer:
      'All data is encrypted at rest using AES-256 encryption. We use bank-level security (256-bit SSL) for data transmission. Your login is protected with optional 2FA.',
  },
  {
    id: 'sync-frequency',
    question: 'How often is my account data updated?',
    answer:
      'Account balances and transactions are synced automatically every hour. You can also manually refresh by pulling down on the Accounts screen.',
  },
  {
    id: 'export-data',
    question: 'Can I export my financial data?',
    answer:
      'Yes! Go to Settings > Data & Privacy > Export Data. You can export in CSV, PDF, or JSON formats.',
  },
  {
    id: 'multi-currency',
    question: 'Does Dhanam support multiple currencies?',
    answer:
      'Yes, Dhanam supports MXN, USD, and EUR. Currency conversion rates are updated daily from Banxico.',
  },
];

interface SupportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  action: () => void;
}

export default function HelpScreen() {
  const [expandedFaq, setExpandedFaq] = React.useState<string | null>(null);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@dhan.am?subject=Dhanam Support Request');
  };

  const handleOpenDocs = () => {
    Linking.openURL('https://docs.dhan.am');
  };

  const handleOpenStatus = () => {
    Linking.openURL('https://status.dhan.am');
  };

  const supportOptions: SupportOption[] = [
    {
      id: 'email',
      title: 'Email Support',
      description: 'Get help from our support team',
      icon: 'mail-outline',
      action: handleEmailSupport,
    },
    {
      id: 'docs',
      title: 'Documentation',
      description: 'Browse our help articles',
      icon: 'book-outline',
      action: handleOpenDocs,
    },
    {
      id: 'status',
      title: 'System Status',
      description: 'Check service availability',
      icon: 'pulse-outline',
      action: handleOpenStatus,
    },
  ];

  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Support Options */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Contact Support
            </Text>
            {supportOptions.map((option, index) => (
              <React.Fragment key={option.id}>
                <List.Item
                  title={option.title}
                  description={option.description}
                  left={() => (
                    <View style={styles.iconContainer}>
                      <Ionicons name={option.icon} size={22} color="#4CAF50" />
                    </View>
                  )}
                  right={() => <Ionicons name="chevron-forward" size={20} color="#757575" />}
                  onPress={option.action}
                  style={styles.listItem}
                />
                {index < supportOptions.length - 1 && <Divider style={styles.divider} />}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        {/* FAQ Section */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Frequently Asked Questions
            </Text>
            {faqItems.map((faq, index) => (
              <React.Fragment key={faq.id}>
                <List.Item
                  title={faq.question}
                  titleNumberOfLines={2}
                  titleStyle={styles.faqQuestion}
                  left={() => (
                    <View style={styles.faqIconContainer}>
                      <Ionicons name="help-circle-outline" size={22} color="#1976D2" />
                    </View>
                  )}
                  right={() => (
                    <Ionicons
                      name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#757575"
                    />
                  )}
                  onPress={() => toggleFaq(faq.id)}
                  style={styles.faqItem}
                />
                {expandedFaq === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text variant="bodyMedium" style={styles.faqAnswerText}>
                      {faq.answer}
                    </Text>
                  </View>
                )}
                {index < faqItems.length - 1 && <Divider style={styles.divider} />}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        {/* App Info */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              App Information
            </Text>
            <View style={styles.appInfo}>
              <View style={styles.appInfoRow}>
                <Text variant="bodyMedium" style={styles.appInfoLabel}>
                  Version
                </Text>
                <Text variant="bodyMedium" style={styles.appInfoValue}>
                  1.0.0
                </Text>
              </View>
              <Divider style={styles.infoDivider} />
              <View style={styles.appInfoRow}>
                <Text variant="bodyMedium" style={styles.appInfoLabel}>
                  Build
                </Text>
                <Text variant="bodyMedium" style={styles.appInfoValue}>
                  2026.01.25
                </Text>
              </View>
              <Divider style={styles.infoDivider} />
              <View style={styles.appInfoRow}>
                <Text variant="bodyMedium" style={styles.appInfoLabel}>
                  Platform
                </Text>
                <Text variant="bodyMedium" style={styles.appInfoValue}>
                  React Native + Expo
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Legal Links */}
        <Card style={styles.sectionCard}>
          <Card.Content style={styles.sectionContent}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Legal
            </Text>
            <List.Item
              title="Privacy Policy"
              left={() => (
                <View style={styles.legalIconContainer}>
                  <Ionicons name="shield-outline" size={22} color="#757575" />
                </View>
              )}
              right={() => <Ionicons name="open-outline" size={20} color="#757575" />}
              onPress={() => Linking.openURL('https://dhan.am/privacy')}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Terms of Service"
              left={() => (
                <View style={styles.legalIconContainer}>
                  <Ionicons name="document-text-outline" size={22} color="#757575" />
                </View>
              )}
              right={() => <Ionicons name="open-outline" size={20} color="#757575" />}
              onPress={() => Linking.openURL('https://dhan.am/terms')}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    elevation: 1,
  },
  sectionContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#757575',
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItem: {
    paddingVertical: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  legalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  faqItem: {
    paddingVertical: 8,
  },
  faqQuestion: {
    fontWeight: '500',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 64,
  },
  faqAnswerText: {
    color: '#616161',
    lineHeight: 22,
  },
  divider: {
    marginLeft: 64,
  },
  infoDivider: {
    marginVertical: 8,
  },
  appInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  appInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  appInfoLabel: {
    color: '#757575',
  },
  appInfoValue: {
    color: '#212121',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
});
