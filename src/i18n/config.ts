import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import deCommon from '@/i18n/locales/de/common.json';
import deGame from '@/i18n/locales/de/game.json';
import deHome from '@/i18n/locales/de/home.json';
import deMaze from '@/i18n/locales/de/maze.json';
import enCommon from '@/i18n/locales/en/common.json';
import enGame from '@/i18n/locales/en/game.json';
import enHome from '@/i18n/locales/en/home.json';
import enMaze from '@/i18n/locales/en/maze.json';
import esCommon from '@/i18n/locales/es/common.json';
import esGame from '@/i18n/locales/es/game.json';
import esHome from '@/i18n/locales/es/home.json';
import esMaze from '@/i18n/locales/es/maze.json';
import frCommon from '@/i18n/locales/fr/common.json';
import frGame from '@/i18n/locales/fr/game.json';
import frHome from '@/i18n/locales/fr/home.json';
import frMaze from '@/i18n/locales/fr/maze.json';
import itCommon from '@/i18n/locales/it/common.json';
import itGame from '@/i18n/locales/it/game.json';
import itHome from '@/i18n/locales/it/home.json';
import itMaze from '@/i18n/locales/it/maze.json';

export const I18N_NAMESPACES = ['common', 'home', 'game', 'maze'] as const;

const SUPPORTED = ['en', 'it', 'fr', 'de', 'es'] as const;

function resolveLanguage(): string {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return SUPPORTED.includes(code as (typeof SUPPORTED)[number]) ? code : 'en';
}

const resources = {
  de: {
    common: deCommon,
    home: deHome,
    game: deGame,
    maze: deMaze,
  },
  en: {
    common: enCommon,
    home: enHome,
    game: enGame,
    maze: enMaze,
  },
  es: {
    common: esCommon,
    home: esHome,
    game: esGame,
    maze: esMaze,
  },
  fr: {
    common: frCommon,
    home: frHome,
    game: frGame,
    maze: frMaze,
  },
  it: {
    common: itCommon,
    home: itHome,
    game: itGame,
    maze: itMaze,
  },
} as const;

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  ns: [...I18N_NAMESPACES],
  defaultNS: 'common',
  lng: resolveLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  // With multiple namespaces in useTranslation([...]), resolve keys across all listed NS (not only the first).
  react: {
    nsMode: 'fallback',
  },
});

export default i18n;
