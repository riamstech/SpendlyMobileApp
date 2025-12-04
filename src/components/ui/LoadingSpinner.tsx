import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 'large',
  color,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { width } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const scale = Math.min(width / 375, 1);
  
  // Use theme color if not provided
  const indicatorColor = color || colors.primary;
  
  // Animation value for rotating spinner
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotating circle animation - smooth continuous rotation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerSize = size === 'large' ? 50 : 36;
  const strokeWidth = size === 'large' ? 4 : 3;

  const content = (
    <View style={styles.container}>
      {/* Modern rotating circle spinner with gradient effect */}
      <View style={[styles.spinnerContainer, { width: spinnerSize, height: spinnerSize }]}>
        <Animated.View
          style={[
            styles.spinnerCircle,
            {
              width: spinnerSize,
              height: spinnerSize,
              borderWidth: strokeWidth,
              borderColor: isDark 
                ? 'rgba(255, 255, 255, 0.15)'
                : `${indicatorColor}30`,
              borderTopColor: indicatorColor,
              borderRightColor: indicatorColor,
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
              transform: [{ rotate: spin }],
            },
          ]}
        />
        {/* Inner circle for depth */}
        <View
          style={[
            styles.innerCircle,
            {
              width: spinnerSize - strokeWidth * 4,
              height: spinnerSize - strokeWidth * 4,
              borderWidth: 1,
              borderColor: isDark 
                ? 'rgba(255, 255, 255, 0.08)'
                : `${indicatorColor}20`,
            },
          ]}
        />
      </View>
      {text && (
        <Text
          style={[
            styles.text,
            { 
              fontSize: Math.max(14, 16 * scale), 
              marginTop: 24,
              color: colors.mutedForeground,
              fontWeight: '500',
            },
          ]}
        >
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerCircle: {
    borderRadius: 999,
    position: 'absolute',
  },
  innerCircle: {
    borderRadius: 999,
    position: 'absolute',
  },
  text: {
    textAlign: 'center',
  },
});

