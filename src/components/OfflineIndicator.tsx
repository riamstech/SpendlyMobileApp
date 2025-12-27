import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react-native';

export default function OfflineIndicator() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = isConnected === false || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <WifiOff size={14} color="#fff" />
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
