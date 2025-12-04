import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  useWindowDimensions,
} from 'react-native';

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
  const scale = Math.min(width / 375, 1);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { fontSize: Math.max(13, 14 * scale) }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          error && styles.inputError,
          { paddingLeft: leftIcon ? 40 : 16, paddingRight: rightIcon ? 40 : 16 },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            { fontSize: Math.max(14, 16 * scale) },
            style,
          ]}
          placeholderTextColor="#9CA3AF"
          {...textInputProps}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && (
        <Text style={[styles.errorText, { fontSize: Math.max(11, 12 * scale) }]}>
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
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF5252',
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

