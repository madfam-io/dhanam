import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
  title: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
  icon?: string;
}

export function ErrorState({
  title,
  message,
  action,
  actionLabel = 'Try Again',
  icon = 'alert-circle-outline',
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={80} color="#E0E0E0" style={styles.icon} />
      <Text variant="headlineSmall" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyLarge" style={styles.message}>
        {message}
      </Text>
      {action && (
        <Button
          mode="contained"
          onPress={action}
          style={styles.action}
          contentStyle={styles.actionContent}
        >
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FAFAFA',
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    color: '#212121',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    color: '#757575',
    marginBottom: 32,
    lineHeight: 24,
  },
  action: {
    paddingHorizontal: 24,
  },
  actionContent: {
    paddingVertical: 8,
  },
});