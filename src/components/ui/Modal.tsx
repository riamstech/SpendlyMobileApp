import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  fullScreen?: boolean;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  fullScreen = false,
}: ModalProps) {
  const { width, height } = useWindowDimensions();
  const { isDark, colors } = useTheme();
  const scale = Math.min(width / 375, 1);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.card },
            fullScreen
              ? { width: width, height: height * 0.9 }
              : {
                  width: width * 0.9,
                  maxWidth: 500,
                  maxHeight: height * 0.8,
                },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {(title || showCloseButton) && (
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                {title && (
                  <Text
                    style={[
                      styles.title,
                      { 
                        fontSize: Math.max(14, Math.min(16 * scale, 16)),
                        color: colors.foreground,
                      },
                    ]}
                  >
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <Pressable onPress={onClose} style={styles.closeButton}>
                    <X size={24 * scale} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>
            )}
            <ScrollView
              style={[styles.content, { backgroundColor: colors.card }]}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 0,
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});

