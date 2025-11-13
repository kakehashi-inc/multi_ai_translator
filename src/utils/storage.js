/**
 * Storage utility
 * Manages extension settings with Browser Storage API
 */
import browser from 'webextension-polyfill';

/**
 * Default settings
 */
const DEFAULT_SETTINGS = {
  common: {
    defaultProvider: 'openai',
    defaultTargetLanguage: 'en',
    uiLanguage: 'en',
    autoDetectLanguage: true
  },
  providers: {
    openai: {
      enabled: false,
      apiKey: '',
      model: '',
      temperature: 0.3,
      maxTokens: 2000
    },
    anthropic: {
      enabled: false,
      apiKey: '',
      model: '',
      maxTokens: 2000,
      temperature: 0.3
    },
    gemini: {
      enabled: false,
      apiKey: '',
      model: '',
      temperature: 0.3,
      maxOutputTokens: 2000
    },
    ollama: {
      enabled: false,
      host: 'http://127.0.0.1:11434',
      model: '',
      temperature: 0.3
    },
    'openai-compatible': {
      enabled: false,
      baseUrl: '',
      apiKey: '',
      model: '',
      temperature: 0.3
    },
    'anthropic-compatible': {
      enabled: false,
      baseUrl: '',
      apiKey: '',
      model: '',
      maxTokens: 2000,
      temperature: 0.3
    }
  },
  ui: {
    theme: 'auto',
    fontSize: 14,
    showOriginalText: true,
    highlightTranslated: true
  },
  shortcuts: {
    translatePage: 'Ctrl+Shift+T',
    translateSelection: 'Ctrl+Shift+S',
    showPopup: 'Ctrl+Shift+P',
    restoreOriginal: 'Ctrl+Shift+R'
  }
};

/**
 * Get all settings
 * @returns {Promise<object>} Settings object
 */
export async function getSettings() {
  try {
    const result = await browser.storage.local.get('settings');
    return result.settings || DEFAULT_SETTINGS;
  } catch (error) {
    // Fallback for testing
    return DEFAULT_SETTINGS;
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
  return Object.keys(settings.providers).filter(
    name => settings.providers[name].enabled
  );
}

/**
 * Reset settings to default
 * @returns {Promise<void>}
 */
export async function resetSettings() {
  await saveSettings(DEFAULT_SETTINGS);
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
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
