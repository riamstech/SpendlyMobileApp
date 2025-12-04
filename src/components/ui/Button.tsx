import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  useWindowDimensions,
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const { width } = useWindowDimensions();
  const scale = Math.min(width / 375, 1);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: Math.max(8, 10 * scale),
          paddingHorizontal: Math.max(12, 16 * scale),
          fontSize: Math.max(12, 14 * scale),
        };
      case 'large':
        return {
          paddingVertical: Math.max(16, 18 * scale),
          paddingHorizontal: Math.max(24, 32 * scale),
          fontSize: Math.max(16, 18 * scale),
        };
      default:
        return {
          paddingVertical: Math.max(12, 14 * scale),
          paddingHorizontal: Math.max(20, 24 * scale),
          fontSize: Math.max(14, 16 * scale),
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: '#E5E7EB',
          textColor: '#111827',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: '#03A9F4',
          borderWidth: 1,
          textColor: '#03A9F4',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: '#03A9F4',
        };
      default:
        return {
          backgroundColor: '#03A9F4',
          textColor: '#fff',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Pressable
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth || 0,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
        />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontWeight: '600',
  },
});

