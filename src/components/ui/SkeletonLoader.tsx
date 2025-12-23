import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonProps) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="80%" height={12} style={{ marginTop: 12 }} />
      <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonTransaction({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.transaction, { backgroundColor: colors.card }, style]}>
      <Skeleton width={44} height={44} borderRadius={22} />
      <View style={styles.transactionContent}>
        <Skeleton width="50%" height={14} />
        <Skeleton width="30%" height={12} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={60} height={16} />
    </View>
  );
}

export function SkeletonList({ count = 5, ItemComponent = SkeletonTransaction }: { count?: number; ItemComponent?: React.ComponentType<any> }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <ItemComponent key={index} style={{ marginBottom: 12 }} />
      ))}
    </View>
  );
}

export function SkeletonDashboard() {
  const { colors } = useTheme();
  
  return (
    <View style={styles.dashboard}>
      {/* Balance Card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <Skeleton width={100} height={14} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
        <Skeleton width={150} height={32} style={{ marginTop: 8, backgroundColor: 'rgba(255,255,255,0.3)' }} />
      </View>
      
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Skeleton width={60} height={12} />
          <Skeleton width={80} height={20} style={{ marginTop: 8 }} />
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Skeleton width={60} height={12} />
          <Skeleton width={80} height={20} style={{ marginTop: 8 }} />
        </View>
      </View>
      
      {/* Transactions Header */}
      <View style={styles.sectionHeader}>
        <Skeleton width={150} height={16} />
        <Skeleton width={60} height={14} />
      </View>
      
      {/* Transaction List */}
      <SkeletonList count={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  transactionContent: {
    flex: 1,
    marginLeft: 12,
  },
  dashboard: {
    padding: 16,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});

export default Skeleton;
