/**
 * Storage utility
 * Manages extension settings with Browser Storage API
 */
import browser from 'webextension-polyfill';
import { ConstVariables } from './const-variables.js';

const {
  PROVIDER_ORDER,
  DEFAULT_BATCH_MAX_CHARS,
  DEFAULT_BATCH_MAX_ITEMS,
  DEFAULT_PROVIDER,
  DEFAULT_LANGUAGE,
  DEFAULT_FONT_SIZE,
  DEFAULT_OPENAI_TEMPERATURE,
  DEFAULT_OPENAI_MAX_TOKENS,
  DEFAULT_ANTHROPIC_TEMPERATURE,
  DEFAULT_ANTHROPIC_MAX_TOKENS,
  DEFAULT_GEMINI_TEMPERATURE,
  DEFAULT_GEMINI_MAX_OUTPUT_TOKENS,
  DEFAULT_OLLAMA_TEMPERATURE,
  DEFAULT_OLLAMA_HOST
} = ConstVariables;

function normalizeLanguageCode(language) {
  if (!language || typeof language !== 'string') {
    return DEFAULT_LANGUAGE;
  }

  const [code] = language.split(/[-_]/);
  return code?.toLowerCase() || DEFAULT_LANGUAGE;
}

export function getBrowserLanguage() {
  try {
    if (browser?.i18n?.getUILanguage) {
      return normalizeLanguageCode(browser.i18n.getUILanguage());
    }
  } catch (error) {
    console.warn('Failed to read browser UI language', error);
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return normalizeLanguageCode(navigator.language);
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Default settings factory
 */
function createDefaultSettings() {
  const browserLanguage = getBrowserLanguage();
  const providerDefaults = {
    gemini: {
      enabled: false,
      apiKey: '',
      model: '',
      temperature: DEFAULT_GEMINI_TEMPERATURE,
      maxOutputTokens: DEFAULT_GEMINI_MAX_OUTPUT_TOKENS
    },
    anthropic: {
      enabled: false,
      apiKey: '',
      model: '',
      maxTokens: DEFAULT_ANTHROPIC_MAX_TOKENS,
      temperature: DEFAULT_ANTHROPIC_TEMPERATURE
    },
    'anthropic-compatible': {
      enabled: false,
      baseUrl: '',
      apiKey: '',
      model: '',
      maxTokens: DEFAULT_ANTHROPIC_MAX_TOKENS,
      temperature: DEFAULT_ANTHROPIC_TEMPERATURE
    },
    openai: {
      enabled: false,
      apiKey: '',
      model: '',
      temperature: DEFAULT_OPENAI_TEMPERATURE,
      maxTokens: DEFAULT_OPENAI_MAX_TOKENS
    },
    'openai-compatible': {
      enabled: false,
      baseUrl: '',
      apiKey: '',
      model: '',
      temperature: DEFAULT_OPENAI_TEMPERATURE
    },
    ollama: {
      enabled: false,
      host: DEFAULT_OLLAMA_HOST,
      model: '',
      temperature: DEFAULT_OLLAMA_TEMPERATURE
    }
  };

  const providers = {};
  PROVIDER_ORDER.forEach((name) => {
    providers[name] = { ...providerDefaults[name] };
  });

  return {
    common: {
      defaultProvider: DEFAULT_PROVIDER,
      defaultSourceLanguage: 'auto',
      defaultTargetLanguage: browserLanguage,
      uiLanguage: browserLanguage,
      batchMaxChars: DEFAULT_BATCH_MAX_CHARS,
      batchMaxItems: DEFAULT_BATCH_MAX_ITEMS
    },
    providers,
    ui: {
      theme: 'auto',
      fontSize: DEFAULT_FONT_SIZE,
      showOriginalText: true,
      highlightTranslated: true
    }
  };
}

/**
 * Get all settings
 * @returns {Promise<object>} Settings object
 */
export async function getSettings() {
  try {
    const result = await browser.storage.local.get('settings');
    return normalizeSettings(result.settings);
  } catch (error) {
    console.warn('Failed to load settings, falling back to defaults', error);
    // Fallback for testing
    return getDefaultSettings();
  }
}

/**
 * Save settings
 * @param {object} settings - Settings object
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    await browser.storage.local.set({ settings });
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Get specific provider settings
 * @param {string} providerName - Provider name
 * @returns {Promise<object>} Provider settings
 */
export async function getProviderSettings(providerName) {
  const settings = await getSettings();
  return settings.providers[providerName] || {};
}

/**
 * Save provider settings
 * @param {string} providerName - Provider name
 * @param {object} providerSettings - Provider settings
 * @returns {Promise<void>}
 */
export async function saveProviderSettings(providerName, providerSettings) {
  const settings = await getSettings();
  settings.providers[providerName] = {
    ...settings.providers[providerName],
    ...providerSettings
  };
  await saveSettings(settings);
}

/**
 * Get enabled providers
 * @returns {Promise<string[]>} Array of enabled provider names
 */
export async function getEnabledProviders() {
  const settings = await getSettings();
  const ordered = [];

  PROVIDER_ORDER.forEach((name) => {
    if (settings.providers[name]?.enabled) {
      ordered.push(name);
    }
  });

  Object.keys(settings.providers).forEach((name) => {
    if (!PROVIDER_ORDER.includes(name) && settings.providers[name]?.enabled) {
      ordered.push(name);
    }
  });

  return ordered;
}

/**
 * Reset settings to default
 * @returns {Promise<void>}
 */
export async function resetSettings() {
  await saveSettings(getDefaultSettings());
}

/**
 * Export settings as JSON
 * @returns {Promise<string>} JSON string of settings
 */
export async function exportSettings() {
  const settings = await getSettings();
  return JSON.stringify(settings, null, 2);
}

/**
 * Import settings from JSON
 * @param {string} jsonString - JSON string of settings
 * @returns {Promise<void>}
 */
export async function importSettings(jsonString) {
  try {
    const settings = JSON.parse(jsonString);
    await saveSettings(settings);
  } catch (error) {
    console.error('Invalid settings JSON provided', error);
    throw new Error('Invalid settings JSON');
  }
}

/**
 * Get translation history
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<object[]>} Array of translation history items
 */
export async function getTranslationHistory(limit = 50) {
  try {
    const result = await browser.storage.local.get('translationHistory');
    const history = result.translationHistory || [];
    return history.slice(0, limit);
  } catch (error) {
    console.warn('Failed to read translation history', error);
    return [];
  }
}

/**
 * Add item to translation history
 * @param {object} item - Translation history item
 * @returns {Promise<void>}
 */
export async function addToHistory(item) {
  try {
    const history = await getTranslationHistory();
    history.unshift({
      ...item,
      timestamp: Date.now()
    });

    // Keep only last 100 items
    const trimmedHistory = history.slice(0, 100);
    await browser.storage.local.set({ translationHistory: trimmedHistory });
  } catch (error) {
    console.error('Failed to add to history:', error);
  }
}

/**
 * Clear translation history
 * @returns {Promise<void>}
 */
export async function clearHistory() {
  try {
    await browser.storage.local.set({ translationHistory: [] });
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

/**
 * Get default settings
 * @returns {object} Default settings
 */
export function getDefaultSettings() {
  return JSON.parse(JSON.stringify(createDefaultSettings()));
}

function normalizeSettings(storedSettings) {
  const normalized = getDefaultSettings();

  if (!storedSettings) {
    return normalized;
  }

  if (storedSettings.common) {
    normalized.common = {
      ...normalized.common,
      ...storedSettings.common
    };
  }

  normalized.providers = normalized.providers || {};
  const providerNames = new Set([
    ...Object.keys(normalized.providers),
    ...(storedSettings.providers ? Object.keys(storedSettings.providers) : [])
  ]);

  providerNames.forEach((name) => {
    normalized.providers[name] = {
      ...(normalized.providers[name] || {}),
      ...(storedSettings.providers?.[name] || {})
    };
  });

  normalized.ui = {
    ...normalized.ui,
    ...(storedSettings.ui || {})
  };

  if (!normalized.common.defaultSourceLanguage) {
    normalized.common.defaultSourceLanguage = 'auto';
  }

  if (!normalized.common.defaultTargetLanguage) {
    normalized.common.defaultTargetLanguage = getBrowserLanguage();
  }

  return normalized;
}
