import React from 'react';

import { useAuth } from '@/hooks/useAuth';
import {
  Ionicons,
  router,
  View,
  ScrollView,
  StyleSheet,
  PaperText as Text,
  Card,
  List,
  Divider,
  Avatar,
} from '@/lib/react-native-compat';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  badge?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'settings',
    title: 'Settings',
    description: 'Account, security, notifications',
    icon: 'settings-outline',
    route: '/more/settings',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Spending trends and insights',
    icon: 'bar-chart-outline',
    route: '/more/analytics',
  },
  {
    id: 'goals',
    title: 'Financial Goals',
    description: 'Track your savings goals',
    icon: 'flag-outline',
    route: '/more/goals',
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Generate financial reports',
    icon: 'document-text-outline',
    route: '/more/reports',
  },
  {
    id: 'recurring',
    title: 'Recurring Transactions',
    description: 'Manage subscriptions and bills',
    icon: 'repeat-outline',
    route: '/more/recurring',
  },
  {
    id: 'projections',
    title: 'Projections',
    description: 'Long-term financial forecasts',
    icon: 'analytics-outline',
    route: '/more/projections',
  },
  {
    id: 'retirement',
    title: 'Retirement Planning',
    description: 'Monte Carlo retirement simulations',
    icon: 'umbrella-outline',
    route: '/more/retirement',
  },
  {
    id: 'scenarios',
    title: 'Scenario Analysis',
    description: 'Stress test your portfolio',
    icon: 'trending-down-outline',
    route: '/more/scenarios',
  },
  {
    id: 'assets',
    title: 'Manual Assets',
    description: 'Track illiquid assets',
    icon: 'briefcase-outline',
    route: '/more/assets',
  },
  {
    id: 'households',
    title: 'Households',
    description: 'Multi-generational planning',
    icon: 'people-outline',
    route: '/more/households',
  },
  {
    id: 'estate-planning',
    title: 'Estate Planning',
    description: 'Wills and inheritance',
    icon: 'document-text-outline',
    route: '/more/estate-planning',
  },
  {
    id: 'help',
    title: 'Help & Support',
    description: 'FAQs and contact support',
    icon: 'help-circle-outline',
    route: '/more/help',
  },
];

export default function MoreScreen() {
  const { user, logout } = useAuth();

  const handleMenuPress = (item: MenuItem) => {
    if (item.badge === 'Soon') {
      // Don't navigate for coming soon items
      return;
    }
    router.push(item.route as any);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text size={64} label={user?.name?.charAt(0) || 'U'} />
            <View style={styles.profileInfo}>
              <Text variant="titleLarge" style={styles.userName}>
                {user?.name || 'User'}
              </Text>
              <Text variant="bodyMedium" style={styles.userEmail}>
                {user?.email}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <Card.Content style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <List.Item
                  title={item.title}
                  description={item.description}
                  left={() => (
                    <View style={styles.iconContainer}>
                      <Ionicons name={item.icon} size={24} color="#4CAF50" />
                    </View>
                  )}
                  right={() => (
                    <View style={styles.rightContainer}>
                      {item.badge && (
                        <View style={styles.badge}>
                          <Text variant="labelSmall" style={styles.badgeText}>
                            {item.badge}
                          </Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={20} color="#757575" />
                    </View>
                  )}
                  onPress={() => handleMenuPress(item)}
                  style={[styles.menuItem, item.badge === 'Soon' && styles.menuItemDisabled]}
                />
                {index < menuItems.length - 1 && <Divider style={styles.divider} />}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Card style={styles.logoutCard}>
          <Card.Content style={styles.logoutContent}>
            <List.Item
              title="Sign Out"
              titleStyle={styles.logoutText}
              left={() => (
                <View style={styles.logoutIconContainer}>
                  <Ionicons name="log-out-outline" size={24} color="#F44336" />
                </View>
              )}
              onPress={handleLogout}
              style={styles.logoutItem}
            />
          </Card.Content>
        </Card>

        {/* App Version */}
        <Text variant="bodySmall" style={styles.versionText}>
          Dhanam v1.0.0
        </Text>

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
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: '#212121',
  },
  userEmail: {
    color: '#757575',
    marginTop: 4,
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
  },
  menuContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#1976D2',
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    marginLeft: 72,
  },
  logoutCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
  },
  logoutContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  logoutItem: {
    paddingVertical: 12,
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  logoutText: {
    color: '#F44336',
  },
  versionText: {
    textAlign: 'center',
    color: '#9E9E9E',
    marginTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
