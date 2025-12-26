import { useWindowDimensions, Platform } from 'react-native';
import { useMemo } from 'react';

export type DeviceType = 'phone' | 'tablet';
export type ScreenSize = 'small' | 'medium' | 'large' | 'xlarge';

interface DeviceInfo {
  deviceType: DeviceType;
  isTablet: boolean;
  isPhone: boolean;
  screenSize: ScreenSize;
  isLandscape: boolean;
  width: number;
  height: number;
}

interface ResponsiveLayout {
  columns: number;
  cardWidth: number;
  sidebarWidth: number;
  contentMaxWidth: number;
  padding: number;
  gap: number;
  showSidebar: boolean;
  modalWidth: number | string;
  inputHeight: number;
  buttonHeight: number;
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
}

// iPad breakpoints
const TABLET_MIN_WIDTH = 768;
const TABLET_LARGE_WIDTH = 1024;

export function useDeviceType(): DeviceInfo {
  const { width, height } = useWindowDimensions();
  
  return useMemo(() => {
    const isLandscape = width > height;
    const shortestSide = Math.min(width, height);
    const longestSide = Math.max(width, height);
    
    // Determine if tablet based on shortest side (works in both orientations)
    const isTablet = shortestSide >= TABLET_MIN_WIDTH || 
                     (Platform.OS === 'ios' && shortestSide >= 600);
    
    // Determine screen size category
    let screenSize: ScreenSize;
    if (shortestSide < 375) {
      screenSize = 'small';
    } else if (shortestSide < TABLET_MIN_WIDTH) {
      screenSize = 'medium';
    } else if (shortestSide < TABLET_LARGE_WIDTH) {
      screenSize = 'large';
    } else {
      screenSize = 'xlarge';
    }
    
    return {
      deviceType: isTablet ? 'tablet' : 'phone',
      isTablet,
      isPhone: !isTablet,
      screenSize,
      isLandscape,
      width,
      height,
    };
  }, [width, height]);
}

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height, isTablet, isLandscape, screenSize } = useDeviceType();
  
  return useMemo(() => {
    if (isTablet) {
      // iPad layouts
      const showSidebar = isLandscape || width >= TABLET_LARGE_WIDTH;
      const sidebarWidth = showSidebar ? 280 : 0;
      const availableWidth = width - sidebarWidth;
      
      // Calculate columns based on available width
      let columns: number;
      if (availableWidth >= 1200) {
        columns = 4;
      } else if (availableWidth >= 900) {
        columns = 3;
      } else {
        columns = 2;
      }
      
      const padding = 24;
      const gap = 20;
      const cardWidth = (availableWidth - (padding * 2) - (gap * (columns - 1))) / columns;
      
      return {
        columns,
        cardWidth: Math.floor(cardWidth),
        sidebarWidth,
        contentMaxWidth: 1400,
        padding,
        gap,
        showSidebar,
        modalWidth: Math.min(600, width * 0.8),
        inputHeight: 52,
        buttonHeight: 52,
        fontSize: {
          xs: 12,
          sm: 14,
          base: 16,
          lg: 18,
          xl: 22,
          xxl: 28,
          xxxl: 36,
        },
      };
    }
    
    // iPhone layouts
    const isSmallPhone = screenSize === 'small';
    
    return {
      columns: 1,
      cardWidth: width - 32,
      sidebarWidth: 0,
      contentMaxWidth: width,
      padding: isSmallPhone ? 12 : 16,
      gap: isSmallPhone ? 12 : 16,
      showSidebar: false,
      modalWidth: '100%',
      inputHeight: isSmallPhone ? 44 : 48,
      buttonHeight: isSmallPhone ? 44 : 48,
      fontSize: {
        xs: isSmallPhone ? 10 : 11,
        sm: isSmallPhone ? 11 : 12,
        base: isSmallPhone ? 13 : 14,
        lg: isSmallPhone ? 15 : 16,
        xl: isSmallPhone ? 18 : 20,
        xxl: isSmallPhone ? 22 : 24,
        xxxl: isSmallPhone ? 28 : 32,
      },
    };
  }, [width, height, isTablet, isLandscape, screenSize]);
}

// Utility function to get responsive value
export function getResponsiveValue<T>(
  deviceType: DeviceType,
  phoneValue: T,
  tabletValue: T
): T {
  return deviceType === 'tablet' ? tabletValue : phoneValue;
}

// Utility function for responsive styles
export function createResponsiveStyles<T extends Record<string, any>>(
  phoneStyles: T,
  tabletStyles: Partial<T>
): (isTablet: boolean) => T {
  return (isTablet: boolean) => {
    if (isTablet) {
      return { ...phoneStyles, ...tabletStyles };
    }
    return phoneStyles;
  };
}

export default useDeviceType;
