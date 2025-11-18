/**
 * Internationalization utility
 * Manages translations and locale switching
 */
import browser from 'webextension-polyfill';

type LanguageEntry = {
  code: string;
  name: string;
};

let currentLocale = 'en';
let messages: Record<string, string> = {};

/**
 * Initialize i18n with messages from browser.i18n
 */
export function initI18n(): void {
  // Get user's preferred language
  try {
    currentLocale = browser.i18n.getUILanguage().split('-')[0];
  } catch (error) {
    console.warn('Failed to detect UI language, defaulting to en', error);
    currentLocale = 'en';
  }
}

/**
 * Get translated message
 * @param {string} key - Message key
 * @param {string[]} substitutions - Optional substitutions
 * @returns {string} Translated message
 */
export function getMessage(key: string, substitutions: string[] = []): string {
  try {
    return browser.i18n.getMessage(key, substitutions) || key;
  } catch (error) {
    console.warn('Failed to get localized message', key, error);
    // Fallback for testing environment
    return messages[key] || key;
  }
}

/**
 * Get current locale
 * @returns {string} Current locale code
 */
export function getCurrentLocale(): string {
  return currentLocale;
}

/**
 * Set locale (for testing)
 * @param {string} locale - Locale code
 */
export function setLocale(locale: string): void {
  currentLocale = locale;
}

/**
 * Set messages (for testing)
 * @param {object} msgs - Messages object
 */
export function setMessages(msgs: Record<string, string>): void {
  messages = { ...msgs };
}

/**
 * Translate all elements with data-i18n attribute
 */
export function translatePage(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');

  elements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const text = getMessage(key);

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      const attr = element.getAttribute('data-i18n-attr') || 'placeholder';
      element.setAttribute(attr, text);
    } else {
      element.textContent = text;
    }
  });
}

/**
 * Get language name from code
 * @param {string} code - Language code
 * @returns {string} Language name
 */
export function getLanguageName(code: string): string {
  const languageNames = {
    en: 'English',
    ja: '日本語',
    zh: '中文',
    ko: '한국어',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ru: 'Русский',
    ar: 'العربية',
    hi: 'हिन्दी'
  };

  return languageNames[code] || code;
}

/**
 * Get supported languages
 * @returns {object[]} Array of {code, name} objects
 */
export function getSupportedLanguages(): LanguageEntry[] {
  return [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' }
  ];
}

// Initialize on load
if (typeof window !== 'undefined') {
  initI18n();
}
