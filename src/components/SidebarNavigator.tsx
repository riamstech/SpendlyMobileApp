import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
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
  ChevronRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsiveLayout } from '../hooks/useDeviceType';

interface SidebarNavigatorProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddClick: () => void;
}

export default function SidebarNavigator({
  activeTab,
  onTabChange,
  onAddClick,
}: SidebarNavigatorProps) {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const { sidebarWidth, fontSize } = useResponsiveLayout();

  const tabs = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'reports', label: t('nav.reports'), icon: FileText },
    { id: 'budget', label: t('nav.budget'), icon: Wallet },
    { id: 'investments', label: t('nav.investments'), icon: TrendingUp },
    { id: 'offers', label: t('nav.offers'), icon: Gift },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          width: sidebarWidth,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: colors.card,
          borderRightColor: colors.border,
        },
      ]}
    >
      {/* Logo/Brand Area */}
      <View style={styles.brandContainer}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.brandName, { color: colors.foreground, fontSize: fontSize.xl }]}>
          Spendly
        </Text>
      </View>

      {/* Add Transaction Button */}
      <Pressable onPress={onAddClick} style={styles.addButtonWrapper}>
        <LinearGradient
          colors={['#03A9F4', '#0288D1']}
          style={styles.addButton}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>
            {t('addTransaction.addTransactionButton')}
          </Text>
        </LinearGradient>
      </Pressable>

      {/* Navigation Items */}
      <ScrollView 
        style={styles.navContainer}
        showsVerticalScrollIndicator={false}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[
                styles.navItem,
                isActive && [styles.navItemActive, { backgroundColor: colors.primary + '15' }],
              ]}
            >
              <View style={styles.navItemLeft}>
                <Icon
                  size={22}
                  color={isActive ? colors.primary : colors.mutedForeground}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <Text
                  style={[
                    styles.navItemLabel,
                    {
                      fontSize: fontSize.base,
                      color: isActive ? colors.primary : colors.foreground,
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.mutedForeground, fontSize: fontSize.xs }]}>
          Spendly v1.0.2
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRightWidth: 1,
    height: '100%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  brandName: {
    fontWeight: '700',
  },
  addButtonWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  navContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemActive: {
    // Background color applied dynamically
  },
  navItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  navItemLabel: {
    // Styles applied dynamically
  },
  activeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  footerText: {
    textAlign: 'center',
  },
});
