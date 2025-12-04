import React from 'react';
import * as Icons from 'lucide-react-native';

interface CategoryIconProps {
  iconName?: string | null;
  size?: number;
  color?: string;
}

/**
 * Dynamically resolves the requested icon from the Lucide React Native library.
 * Falls back to `CircleEllipsis` if the name is not found.
 */
export function CategoryIcon({
  iconName,
  size = 20,
  color = '#333',
}: CategoryIconProps) {
  // Map legacy or invalid icon names to valid Lucide icons
  const iconAliasMap: Record<string, string> = {
    GasPump: 'Fuel',
    Broom: 'Sparkles',
    MoreHorizontal: 'CircleEllipsis',
  };

  const resolvedName =
    (iconName && iconAliasMap[iconName]) || iconName || 'CircleEllipsis';

  const IconComponent =
    (resolvedName && (Icons as any)[resolvedName]) || Icons.CircleEllipsis;

  return <IconComponent size={size} color={color} />;
}

