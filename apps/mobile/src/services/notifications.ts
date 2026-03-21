import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiClient } from '@/services/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android';
  deviceId: string;
}

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  deepLink?: string;
  read: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'budget_alert'
  | 'budget_exceeded'
  | 'transaction_new'
  | 'transaction_large'
  | 'account_sync'
  | 'account_error'
  | 'goal_milestone'
  | 'goal_achieved'
  | 'security_alert'
  | 'system_update'
  | 'recurring_reminder'
  | 'esg_update';

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  budget_alert: 'pie-chart-outline',
  budget_exceeded: 'alert-circle-outline',
  transaction_new: 'receipt-outline',
  transaction_large: 'cash-outline',
  account_sync: 'sync-outline',
  account_error: 'warning-outline',
  goal_milestone: 'flag-outline',
  goal_achieved: 'trophy-outline',
  security_alert: 'shield-outline',
  system_update: 'information-circle-outline',
  recurring_reminder: 'repeat-outline',
  esg_update: 'leaf-outline',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  budget_alert: '#FF9800',
  budget_exceeded: '#F44336',
  transaction_new: '#2196F3',
  transaction_large: '#9C27B0',
  account_sync: '#4CAF50',
  account_error: '#F44336',
  goal_milestone: '#FF9800',
  goal_achieved: '#4CAF50',
  security_alert: '#F44336',
  system_update: '#2196F3',
  recurring_reminder: '#607D8B',
  esg_update: '#4CAF50',
};

/**
 * Get the notification icon name for a given notification type.
 */
export function getNotificationIcon(type: NotificationType): string {
  return NOTIFICATION_ICONS[type] || 'notifications-outline';
}

/**
 * Get the notification color for a given notification type.
 */
export function getNotificationColor(type: NotificationType): string {
  return NOTIFICATION_COLORS[type] || '#757575';
}

/**
 * Register for push notifications.
 * Requests permission, gets the Expo push token, and registers it with the backend.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.warn('Push notifications require a physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    if (__DEV__) console.warn('Push notification permission not granted');
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });

    await Notifications.setNotificationChannelAsync('budget-alerts', {
      name: 'Budget Alerts',
      description: 'Notifications when budgets approach or exceed limits',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transactions',
      description: 'New and large transaction notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync('security', {
      name: 'Security',
      description: 'Security alerts and login notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
    });
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  const token = tokenData.data;

  // Register token with the backend
  try {
    await apiClient.post('/notifications/register', {
      token,
      platform: Platform.OS as 'ios' | 'android',
      deviceId: Constants.installationId || 'unknown',
    });
  } catch (error) {
    if (__DEV__) console.error('Failed to register push token with backend:', error);
  }

  return token;
}

/**
 * Unregister push notifications (e.g., on logout).
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await apiClient.delete('/notifications/unregister');
  } catch (error) {
    if (__DEV__) console.error('Failed to unregister push token:', error);
  }
}

/**
 * Get the current badge count.
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count.
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all delivered notifications.
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}

/**
 * Schedule a local notification (e.g., for recurring reminders).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput,
  data?: Record<string, string>
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger,
  });
}

/**
 * Cancel a scheduled local notification.
 */
export async function cancelScheduledNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancel all scheduled local notifications.
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Add a listener for when a notification is received while the app is foregrounded.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when the user taps a notification.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the deep link path from a notification type and data.
 */
export function getNotificationDeepLink(
  type: NotificationType,
  data?: Record<string, string>
): string | null {
  switch (type) {
    case 'budget_alert':
    case 'budget_exceeded':
      return data?.budgetId ? `/budgets/${data.budgetId}` : '/(tabs)/budgets';
    case 'transaction_new':
    case 'transaction_large':
      return data?.transactionId ? `/transactions/${data.transactionId}` : '/(tabs)/transactions';
    case 'account_sync':
    case 'account_error':
      return data?.accountId ? `/accounts/${data.accountId}` : '/(tabs)/accounts';
    case 'goal_milestone':
    case 'goal_achieved':
      return '/(tabs)/more/goals';
    case 'security_alert':
      return '/(tabs)/more/settings';
    case 'recurring_reminder':
      return '/(tabs)/more/recurring';
    case 'esg_update':
      return '/(tabs)/esg';
    case 'system_update':
    default:
      return null;
  }
}
