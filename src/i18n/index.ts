import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import enCommon from '../locales/en/common.json';
import esCommon from '../locales/es/common.json';
import zhCNCommon from '../locales/zh-CN/common.json';
import hiCommon from '../locales/hi/common.json';
import arCommon from '../locales/ar/common.json';
import frCommon from '../locales/fr/common.json';
import ptBRCommon from '../locales/pt-BR/common.json';
import deCommon from '../locales/de/common.json';
import jaCommon from '../locales/ja/common.json';
import ruCommon from '../locales/ru/common.json';
import nlCommon from '../locales/nl/common.json';
import itCommon from '../locales/it/common.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'zh-CN', name: '简体中文' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'ar', name: 'العربية' },
  { code: 'fr', name: 'Français' },
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ja', name: '日本語' },
  { code: 'ru', name: 'Русский' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'it', name: 'Italiano' },
];

const resources = {
  en: { common: enCommon },
  es: { common: esCommon },
  'zh-CN': { common: zhCNCommon },
  hi: { common: hiCommon },
  ar: { common: arCommon },
  fr: { common: frCommon },
  'pt-BR': { common: ptBRCommon },
  de: { common: deCommon },
  ja: { common: jaCommon },
  ru: { common: ruCommon },
  nl: { common: nlCommon },
  it: { common: itCommon },
};

// Get device locale using the new API
const getDeviceLocale = (): string => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      return locales[0].languageTag || 'en';
    }
  } catch (e) {
    // Fallback if getLocales fails
  }
  return 'en';
};

const deviceLocale = getDeviceLocale();
const normalizedLocale = (() => {
  const lower = deviceLocale.toLowerCase();
  if (lower.startsWith('pt-br')) return 'pt-BR';
  if (lower.startsWith('zh')) return 'zh-CN';
  const base = deviceLocale.split('-')[0];
  if (resources[base as keyof typeof resources]) return base;
  return 'en';
})();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: normalizedLocale,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });

// Function to load saved language from AsyncStorage and apply it
export const loadSavedLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = await AsyncStorage.getItem('userLanguage');
    if (savedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    // Ignore errors, keep default language
  }
};

// Auto-load saved language on app start
loadSavedLanguage();

export default i18n;
