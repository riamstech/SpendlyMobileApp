import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDeviceType, useResponsiveLayout } from '../hooks/useDeviceType';
import { useTheme } from '../contexts/ThemeContext';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: object;
  style?: object;
}

export default function ResponsiveContainer({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
  style,
}: ResponsiveContainerProps) {
  const { isTablet } = useDeviceType();
  const { padding, contentMaxWidth } = useResponsiveLayout();
  const { colors } = useTheme();

  const containerStyle = [
    styles.container,
    {
      paddingHorizontal: padding,
      width: '100%',
    },
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          containerStyle,
          contentContainerStyle,
        ]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: number;
  gap?: number;
  style?: object;
}

export function ResponsiveGrid({
  children,
  minItemWidth = 300,
  gap,
  style,
}: ResponsiveGridProps) {
  const { isTablet, width } = useDeviceType();
  const { columns, gap: defaultGap, padding } = useResponsiveLayout();

  const gridGap = gap ?? defaultGap;
  const availableWidth = isTablet ? width - padding * 2 : width - padding * 2;
  const calculatedColumns = Math.max(1, Math.floor(availableWidth / minItemWidth));
  const actualColumns = isTablet ? Math.min(calculatedColumns, columns) : 1;

  return (
    <View
      style={[
        styles.grid,
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: gridGap,
          marginHorizontal: isTablet ? 0 : 0,
        },
        style,
      ]}
    >
      {React.Children.map(children, (child, index) => {
        if (!child) return null;
        
        const itemWidth = isTablet
          ? `${(100 - (actualColumns - 1) * (gridGap / availableWidth) * 100) / actualColumns}%`
          : '100%';

        return (
          <View
            style={{
              width: isTablet ? (availableWidth - gridGap * (actualColumns - 1)) / actualColumns : '100%',
              minWidth: isTablet ? minItemWidth : undefined,
            }}
          >
            {child}
          </View>
        );
      })}
    </View>
  );
}

interface ResponsiveRowProps {
  children: React.ReactNode;
  gap?: number;
  style?: object;
  stackOnPhone?: boolean;
}

export function ResponsiveRow({
  children,
  gap,
  style,
  stackOnPhone = true,
}: ResponsiveRowProps) {
  const { isTablet } = useDeviceType();
  const { gap: defaultGap } = useResponsiveLayout();

  const rowGap = gap ?? defaultGap;
  const shouldStack = stackOnPhone && !isTablet;

  return (
    <View
      style={[
        {
          flexDirection: shouldStack ? 'column' : 'row',
          gap: rowGap,
        },
        style,
      ]}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;
        // On tablet (row layout), wrap children with flex: 1 for equal width
        if (!shouldStack) {
          return (
            <View style={{ flex: 1 }}>
              {child}
            </View>
          );
        }
        return child;
      })}
    </View>
  );
}

interface ResponsiveCardProps {
  children: React.ReactNode;
  flex?: number;
  style?: object;
}

export function ResponsiveCard({ children, flex = 1, style }: ResponsiveCardProps) {
  const { isTablet } = useDeviceType();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          flex: isTablet ? flex : undefined,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  grid: {
    width: '100%',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
});
