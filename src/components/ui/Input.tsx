import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: object;
}

export default function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...textInputProps
}: InputProps) {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const scale = Math.min(width / 375, 1);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label, 
          { 
            fontSize: Math.max(13, 14 * scale),
            color: colors.foreground,
          }
        ]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          error && styles.inputError,
          { 
            paddingLeft: leftIcon ? 40 : 16, 
            paddingRight: rightIcon ? 40 : 16,
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            { 
              fontSize: Math.max(14, 16 * scale),
              color: colors.foreground,
            },
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          {...textInputProps}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={[
          styles.errorText, 
          { 
            fontSize: Math.max(11, 12 * scale),
            color: colors.destructive,
          }
        ]}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
  },
  inputError: {
    // Error border color handled inline with theme colors
  },
  leftIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
  },
  errorText: {
    marginTop: 4,
    color: '#FF5252',
  },
});

