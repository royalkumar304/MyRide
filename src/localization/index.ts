import { en } from './en';
import { hi } from './hi';
import { hinglish } from './hinglish';

export type SupportedLanguage = 'en' | 'hi' | 'hinglish';

export const translations = {
  en,
  hi,
  hinglish,
};

export const getTranslation = (lang: SupportedLanguage = 'en'): typeof en => {
  return translations[lang] || translations.en;
};

export default getTranslation;
