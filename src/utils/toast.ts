import Toast from 'react-native-toast-message';
import i18n from '../i18n';

export const showToast = {
  success: (message: string, title?: string) => {
    Toast.show({
      type: 'success',
      text1: title || i18n.t('common.success', { defaultValue: 'Success' }),
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },
  error: (message: string, title?: string) => {
    Toast.show({
      type: 'error',
      text1: title || i18n.t('common.error', { defaultValue: 'Error' }),
      text2: message,
      position: 'top',
      visibilityTime: 4000,
    });
  },
  info: (message: string, title?: string) => {
    Toast.show({
      type: 'info',
      text1: title || i18n.t('common.info', { defaultValue: 'Info' }),
      text2: message,
      position: 'top',
      visibilityTime: 3000,
    });
  },
};
