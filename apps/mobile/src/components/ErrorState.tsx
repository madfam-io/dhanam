import { ComponentProps } from 'react';

import { Ionicons, View, StyleSheet, PaperText as Text, Button } from '@/lib/react-native-compat';

interface ErrorStateProps {
  title: string;
  message: string;
  action?: () => void;
  actionLabel?: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
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
      <Ionicons name={icon} size={80} color="#E0E0E0" style={styles.icon} />
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
