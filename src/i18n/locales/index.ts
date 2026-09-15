import { en } from './en';
import { es } from './es';
import { ja } from './ja';
import { fr } from './fr';
import { de } from './de';
import { pt } from './pt';
import { ko } from './ko';
import { it } from './it';
import { hi } from './hi';
import type { SupportedLanguage } from '../ui';

export const locales = {
  en,
  es,
  ja,
  fr,
  de,
  pt,
  ko,
  it,
  hi,
};

export function getLocaleData(lang: SupportedLanguage) {
  return locales[lang] || locales.en;
}
