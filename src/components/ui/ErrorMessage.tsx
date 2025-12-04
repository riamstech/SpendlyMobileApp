import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { AlertCircle } from 'lucide-react-native';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'default' | 'inline';
}

export default function ErrorMessage({
  message,
  onDismiss,
  variant = 'default',
}: ErrorMessageProps) {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 375, 1);

  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        <AlertCircle
          size={Math.max(16, 18 * scale)}
          color="#FF5252"
          style={styles.icon}
        />
        <Text
          style={[
            styles.inlineText,
            { fontSize: Math.max(12, 13 * scale) },
          ]}
        >
          {message}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <AlertCircle
          size={Math.max(20, 24 * scale)}
          color="#FF5252"
          style={styles.icon}
        />
        <Text
          style={[
            styles.text,
            { fontSize: Math.max(14, 16 * scale) },
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: '#DC2626',
    fontWeight: '500',
  },
  inlineText: {
    flex: 1,
    color: '#FF5252',
  },
});

