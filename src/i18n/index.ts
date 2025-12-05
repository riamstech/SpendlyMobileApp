import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

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
} as const;

const deviceLocale = Localization.locale ?? 'en';
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
    compatibilityJSON: 'v3',
  })
  .catch((error) => {
    console.error('Failed to initialize i18n:', error);
    // Continue with default English if initialization fails
  });

export default i18n;
