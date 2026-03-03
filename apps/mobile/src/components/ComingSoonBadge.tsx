import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ComingSoonBadgeProps {
  label?: string;
}

export function ComingSoonBadge({ label = 'Coming Soon' }: ComingSoonBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
});
