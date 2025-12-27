import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useDeviceType, useResponsiveLayout } from '../hooks/useDeviceType';
import BottomTabNavigator from './BottomTabNavigator';
import SidebarNavigator from './SidebarNavigator';

interface AdaptiveNavigatorProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddClick: () => void;
  children: React.ReactNode;
}

export default function AdaptiveNavigator({
  activeTab,
  onTabChange,
  onAddClick,
  children,
}: AdaptiveNavigatorProps) {
  const { isTablet } = useDeviceType();
  const { showSidebar, sidebarWidth } = useResponsiveLayout();

  if (isTablet && showSidebar) {
    return (
      <View style={styles.tabletContainer}>
        <SidebarNavigator
          activeTab={activeTab}
          onTabChange={onTabChange}
          onAddClick={onAddClick}
        />
        <View style={styles.tabletContent}>
          {children}
        </View>
      </View>
    );
  }

  // Phone layout or tablet in portrait without sidebar
  return (
    <View style={styles.phoneContainer}>
      <View style={styles.phoneContent}>
        {children}
      </View>
      <BottomTabNavigator
        activeTab={activeTab}
        onTabChange={onTabChange}
        onAddClick={onAddClick}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabletContent: {
    flex: 1,
  },
  phoneContainer: {
    flex: 1,
  },
  phoneContent: {
    flex: 1,
  },
});
