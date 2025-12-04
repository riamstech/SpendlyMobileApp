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
              <View style={styles.header}>
                {title && (
                  <Text
                    style={[
                      styles.title,
                      { fontSize: Math.max(18, 20 * scale) },
                    ]}
                  >
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <Pressable onPress={onClose} style={styles.closeButton}>
                    <X size={24 * scale} color="#666" />
                  </Pressable>
                )}
              </View>
            )}
            <ScrollView
              style={styles.content}
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
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
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
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontWeight: 'bold',
    color: '#212121',
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

