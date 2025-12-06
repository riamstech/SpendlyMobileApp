import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home,
  FileText,
  Wallet,
  Plus,
  TrendingUp,
  Gift,
  Settings,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface BottomTabNavigatorProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddClick: () => void;
}

export default function BottomTabNavigator({
  activeTab,
  onTabChange,
  onAddClick,
}: BottomTabNavigatorProps) {
  const { t } = useTranslation('common');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  // Responsive scaling
  const scale = Math.min(width / 375, 1);
  const isSmallScreen = width < 375;

  const tabs = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'reports', label: t('nav.reports'), icon: FileText },
    { id: 'budget', label: t('nav.budget'), icon: Wallet },
    { id: 'add', label: '+', icon: Plus, special: true },
    { id: 'investments', label: t('nav.investments'), icon: TrendingUp },
    { id: 'offers', label: t('nav.offers'), icon: Gift },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  // Responsive constants
  const iconSize = Math.max(16, Math.min(20 * scale, 20));
  const addIconSize = Math.max(22, Math.min(24 * scale, 26));
  const labelSize = Math.max(9, Math.min(10 * scale, 10));
  const addButtonSize = Math.max(44, Math.min(54 * scale, 58));

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.special) {
            return (
              <Pressable
                key={tab.id}
                onPress={onAddClick}
                style={styles.addButtonContainer}
              >
                <LinearGradient
                  colors={['#03A9F4', '#0288D1']}
                  style={[
                    styles.addButton,
                    {
                      width: addButtonSize,
                      height: addButtonSize,
                      borderRadius: addButtonSize / 2,
                    },
                  ]}
                >
                  <Icon
                    size={addIconSize}
                    color="#fff"
                  />
                </LinearGradient>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                { minHeight: isSmallScreen ? 48 : 56 },
              ]}
            >
              <Icon
                size={iconSize}
                color={isActive ? colors.primary : colors.mutedForeground}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    fontSize: labelSize,
                    color: isActive ? colors.primary : colors.mutedForeground,
                    display: isSmallScreen ? 'none' : 'flex',
                  },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {tab.label}
              </Text>

            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 8,
    minHeight: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 4,
  },
  tabActive: {
    // Active state styling handled by icon and text color
  },
  tabLabel: {
    textAlign: 'center',
    maxWidth: 80, // Allow longer labels like "Investments" to be fully visible
    flexShrink: 1,
  },
  addButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24, // Lift the button above the tab bar
    zIndex: 10,
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#03A9F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

