import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({
  children,
  style,
  padding,
  variant = 'default',
}: CardProps) {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 375, 1);
  const defaultPadding = padding || Math.max(16, 20 * scale);

  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
          backgroundColor: '#fff',
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: '#E5E7EB',
          backgroundColor: '#fff',
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        {
          padding: defaultPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
  },
});

