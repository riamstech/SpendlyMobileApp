
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { textStyles, createResponsiveTextStyles } from '../constants/fonts';

type Props = {
  onFinish: () => void;
};

// Animated dot component with bounce effect
const AnimatedDot = ({ delay, scale }: { delay: number; scale: number }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bounceAnim, {
            toValue: -8,
            duration: 300,
            delay,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    bounceAnimation.start();
    return () => bounceAnimation.stop();
  }, [bounceAnim, opacityAnim, delay]);

  return (
    <Animated.View
      style={{
        width: Math.max(6, Math.min(8 * scale, 10)),
        height: Math.max(6, Math.min(8 * scale, 10)),
        borderRadius: Math.max(3, Math.min(4 * scale, 5)),
        backgroundColor: 'rgba(255, 255, 255, 1)',
        opacity: opacityAnim,
        transform: [{ translateY: bounceAnim }],
      }}
    />
  );
};

// Simple Spendly splash screen:
// - Same blue gradient as web
// - White rounded tile with logo-dark.png
// - "Track. Save. Grow." tagline
// - Three animated loading dots
export default function SplashScreen({ onFinish }: Props) {
  const { t } = useTranslation('common');
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  const { width } = useWindowDimensions();
  const responsiveTextStyles = createResponsiveTextStyles(width);
  const scale = width / 375;

  useEffect(() => {
    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    Animated.spring(logoScale, {
      toValue: 1,
      damping: 14,
      stiffness: 180,
      useNativeDriver: true,
    }).start();

    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 500,
      delay: 500,
      useNativeDriver: true,
    }).start();

    Animated.timing(dotsOpacity, {
      toValue: 1,
      duration: 400,
      delay: 900,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(onFinish, 2000);
    return () => clearTimeout(timeout);
  }, [logoOpacity, logoScale, taglineOpacity, dotsOpacity, onFinish]);

  return (
    <LinearGradient
      colors={['#03A9F4', '#0288D1']}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <Image
            source={require('../../assets/logo-dark.png')}
            style={{
              width: Math.max(120, Math.min(140 * scale, 160)),
              height: Math.max(120, Math.min(140 * scale, 160)),
            }}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text style={[styles.tagline, responsiveTextStyles.h4, { opacity: taglineOpacity }]}>
          {t('footer.tagline', { defaultValue: 'Track. Save. Grow.' })}
        </Animated.Text>

        <Animated.View style={[styles.dotsContainer, { opacity: dotsOpacity }]}>
          {[0, 1, 2].map((i) => (
            <AnimatedDot key={i} delay={i * 150} scale={scale} />
          ))}
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    marginTop: 24,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 8,
  },
});

