export const locales = ['en', 'ru', 'de', 'fr', 'es', 'zh', 'ko', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
