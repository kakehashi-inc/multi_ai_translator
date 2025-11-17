/**
 * Options Page Script
 * Handles settings management
 */
import browser from 'webextension-polyfill';
import { translatePage, getSupportedLanguages } from '../utils/i18n.js';
import {
  getSettings,
  saveSettings,
  resetSettings,
  exportSettings,
  importSettings,
  getBrowserLanguage
} from '../utils/storage.js';

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Translate UI
    translatePage();

    // Load settings
    const settings = await getSettings();
    loadSettingsToUI(settings);

    // Set up event listeners
    setupEventListeners();

    // Populate language dropdown
    populateLanguages();
  } catch (error) {
    console.error('[Options] Initialization error:', error);
    showStatus('Failed to load settings', 'error');
  }
});

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  // Save button
  document.getElementById('save-btn').addEventListener('click', async () => {
    try {
      const settings = collectSettingsFromUI();
      await saveSettings(settings);
      showStatus('Settings saved successfully', 'success');
    } catch (error) {
      console.error('[Options] Save error:', error);
      showStatus('Failed to save settings: ' + error.message, 'error');
    }
  });

  // Reset button
  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await resetSettings();
        const settings = await getSettings();
        loadSettingsToUI(settings);
        showStatus('Settings reset to defaults', 'success');
      } catch (error) {
        console.error('[Options] Reset error:', error);
        showStatus('Failed to reset settings', 'error');
      }
    }
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', async () => {
    try {
      const json = await exportSettings();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'multi-ai-translator-settings.json';
      a.click();
      URL.revokeObjectURL(url);
      showStatus('Settings exported', 'success');
    } catch (error) {
      console.error('[Options] Export error:', error);
      showStatus('Failed to export settings', 'error');
    }
  });

  // Import button
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file-input').click();
  });

  // Import file input
  document.getElementById('import-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importSettings(text);
      const settings = await getSettings();
      loadSettingsToUI(settings);
      showStatus('Settings imported successfully', 'success');
    } catch (error) {
      console.error('[Options] Import error:', error);
      showStatus('Failed to import settings: ' + error.message, 'error');
    }

    // Reset file input
    e.target.value = '';
  });

  // Fetch models buttons
  [
    { id: 'openai-fetch-models', provider: 'openai' },
    { id: 'anthropic-fetch-models', provider: 'anthropic' },
    { id: 'gemini-fetch-models', provider: 'gemini' },
    { id: 'ollama-fetch-models', provider: 'ollama' },
    { id: 'openai-compatible-fetch-models', provider: 'openai-compatible' },
    { id: 'anthropic-compatible-fetch-models', provider: 'anthropic-compatible' }
  ].forEach(({ id, provider }) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', async () => {
        await fetchModels(provider);
      });
    }
  });
}

/**
 * Switch tab
 */
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
}

/**
 * Load settings to UI
 */
function loadSettingsToUI(settings) {
  // Providers
  const providers = ['openai', 'anthropic', 'gemini', 'ollama', 'openai-compatible', 'anthropic-compatible'];

  providers.forEach(provider => {
    const config = settings.providers[provider];
    const enabledEl = document.getElementById(`${provider}-enabled`);

    if (enabledEl) {
      enabledEl.checked = config.enabled;
    }

    // Load provider-specific settings
    Object.keys(config).forEach(key => {
      if (key === 'enabled') return;

      const fieldName = provider === 'openai-compatible'
        ? `${provider}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        : `${provider}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;

      const el = document.getElementById(fieldName);
      if (el) {
        el.value = config[key] || '';
      }
    });
  });

  // Common settings
  const defaultProvider = document.getElementById('default-provider');
  if (defaultProvider) {
    defaultProvider.value = settings.common.defaultProvider;
  }

  const defaultTargetLanguage = document.getElementById('default-target-language');
  if (defaultTargetLanguage) {
    defaultTargetLanguage.value =
      settings.common.defaultTargetLanguage || getBrowserLanguage();
  }

  const autoDetect = document.getElementById('auto-detect-language');
  if (autoDetect) {
    autoDetect.checked = settings.common.autoDetectLanguage;
  }

  // UI settings
  const theme = document.getElementById('theme');
  if (theme) {
    theme.value = settings.ui.theme;
  }

  const showOriginal = document.getElementById('show-original-text');
  if (showOriginal) {
    showOriginal.checked = settings.ui.showOriginalText;
  }

  const highlightTranslated = document.getElementById('highlight-translated');
  if (highlightTranslated) {
    highlightTranslated.checked = settings.ui.highlightTranslated;
  }
}

/**
 * Collect settings from UI
 */
function collectSettingsFromUI() {
  const settings = {
    common: {},
    providers: {},
    ui: {},
    shortcuts: {}
  };

  // Providers
  const providers = ['openai', 'anthropic', 'gemini', 'ollama', 'openai-compatible', 'anthropic-compatible'];

  providers.forEach(provider => {
    const enabled = document.getElementById(`${provider}-enabled`)?.checked || false;

    settings.providers[provider] = { enabled };

    // Collect provider-specific settings
    if (provider === 'openai') {
      settings.providers[provider].apiKey = document.getElementById('openai-api-key')?.value || '';
      settings.providers[provider].model = document.getElementById('openai-model')?.value || '';
      settings.providers[provider].temperature = parseFloat(document.getElementById('openai-temperature')?.value || '0.3');
      settings.providers[provider].maxTokens = 2000;
    } else if (provider === 'anthropic') {
      settings.providers[provider].apiKey = document.getElementById('anthropic-api-key')?.value || '';
      settings.providers[provider].model = document.getElementById('anthropic-model')?.value || '';
      settings.providers[provider].maxTokens = parseInt(document.getElementById('anthropic-max-tokens')?.value || '2000');
      settings.providers[provider].temperature = 0.3;
    } else if (provider === 'gemini') {
      settings.providers[provider].apiKey = document.getElementById('gemini-api-key')?.value || '';
      settings.providers[provider].model = document.getElementById('gemini-model')?.value || '';
      settings.providers[provider].temperature = 0.3;
      settings.providers[provider].maxOutputTokens = 2000;
    } else if (provider === 'ollama') {
      settings.providers[provider].host = document.getElementById('ollama-host')?.value || 'http://127.0.0.1:11434';
      settings.providers[provider].model = document.getElementById('ollama-model')?.value || '';
      settings.providers[provider].temperature = 0.3;
    } else if (provider === 'openai-compatible') {
      settings.providers[provider].baseUrl = document.getElementById('openai-compatible-base-url')?.value || '';
      settings.providers[provider].apiKey = document.getElementById('openai-compatible-api-key')?.value || '';
      settings.providers[provider].model = document.getElementById('openai-compatible-model')?.value || '';
      settings.providers[provider].temperature = 0.3;
    } else if (provider === 'anthropic-compatible') {
      settings.providers[provider].baseUrl = document.getElementById('anthropic-compatible-base-url')?.value || '';
      settings.providers[provider].apiKey = document.getElementById('anthropic-compatible-api-key')?.value || '';
      settings.providers[provider].model = document.getElementById('anthropic-compatible-model')?.value || '';
      settings.providers[provider].maxTokens = parseInt(document.getElementById('anthropic-compatible-max-tokens')?.value || '2000');
      settings.providers[provider].temperature = 0.3;
    }
  });

  // Common settings
  settings.common.defaultProvider = document.getElementById('default-provider')?.value || 'openai';
  settings.common.defaultTargetLanguage =
    document.getElementById('default-target-language')?.value || getBrowserLanguage();
  settings.common.autoDetectLanguage = document.getElementById('auto-detect-language')?.checked || true;
  settings.common.uiLanguage = 'en';

  // UI settings
  settings.ui.theme = document.getElementById('theme')?.value || 'auto';
  settings.ui.showOriginalText = document.getElementById('show-original-text')?.checked || true;
  settings.ui.highlightTranslated = document.getElementById('highlight-translated')?.checked || true;
  settings.ui.fontSize = 14;

  // Shortcuts (keep existing)
  settings.shortcuts = {
    translatePage: 'Ctrl+Shift+T',
    translateSelection: 'Ctrl+Shift+S',
    showPopup: 'Ctrl+Shift+P',
    restoreOriginal: 'Ctrl+Shift+R'
  };

  return settings;
}

/**
 * Populate language dropdown
 */
function populateLanguages() {
  const select = document.getElementById('default-target-language');
  if (!select) return;

  const languages = getSupportedLanguages();

  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    select.appendChild(option);
  });
}

/**
 * Fetch models from provider
 */
async function fetchModels(providerName) {
  try {
    const displayName = formatProviderName(providerName);
    showStatus(`Fetching models from ${displayName}...`, 'info');

    const { config, error } = buildModelFetchConfig(providerName);
    if (error) {
      showStatus(error, 'error');
      return;
    }

    const response = await browser.runtime.sendMessage({
      action: 'getModels',
      data: { providerName, config }
    });

    if (response.success && response.models.length > 0) {
      const modelField = document.getElementById(`${providerName}-model`);

      // Create datalist for autocomplete
      const datalistId = `${providerName}-models-list`;
      let datalist = document.getElementById(datalistId);

      if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = datalistId;
        modelField.parentNode.appendChild(datalist);
        modelField.setAttribute('list', datalistId);
      }

      datalist.innerHTML = '';
      response.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        datalist.appendChild(option);
      });

      showStatus(`Found ${response.models.length} models`, 'success');
    } else if (response.success) {
      showStatus('No models found. Please enter a model manually.', 'info');
    } else {
      showStatus(response.error || 'No models found', 'error');
    }
  } catch (error) {
    console.error('[Options] Fetch models error:', error);
    showStatus('Failed to fetch models: ' + error.message, 'error');
  }
}

function buildModelFetchConfig(providerName) {
  const getValue = id => document.getElementById(id)?.value?.trim() || '';

  switch (providerName) {
    case 'openai': {
      const apiKey = getValue('openai-api-key');
      return apiKey
        ? { config: { apiKey } }
        : { error: 'OpenAI API key is required to fetch models.' };
    }
    case 'anthropic': {
      const apiKey = getValue('anthropic-api-key');
      return apiKey
        ? { config: { apiKey } }
        : { error: 'Anthropic API key is required to fetch models.' };
    }
    case 'gemini': {
      const apiKey = getValue('gemini-api-key');
      return apiKey
        ? { config: { apiKey } }
        : { error: 'Gemini API key is required to fetch models.' };
    }
    case 'ollama': {
      const host = getValue('ollama-host') || 'http://127.0.0.1:11434';
      return { config: { host } };
    }
    case 'openai-compatible': {
      const baseUrl = getValue('openai-compatible-base-url');
      if (!baseUrl) {
        return { error: 'Base URL is required to fetch models from OpenAI-compatible providers.' };
      }
      return {
        config: {
          baseUrl,
          apiKey: getValue('openai-compatible-api-key')
        }
      };
    }
    case 'anthropic-compatible': {
      const baseUrl = getValue('anthropic-compatible-base-url');
      if (!baseUrl) {
        return {
          error: 'Base URL is required to fetch models from Anthropic-compatible providers.'
        };
      }
      return {
        config: {
          baseUrl,
          apiKey: getValue('anthropic-compatible-api-key')
        }
      };
    }
    default:
      return { config: {} };
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;

  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusEl.className = 'status-message';
    }, 5000);
  }
}

/**
 * Format provider name for display
 */
function formatProviderName(name) {
  const names = {
    'openai': 'OpenAI',
    'anthropic': 'Anthropic (Claude)',
    'gemini': 'Gemini',
    'ollama': 'Ollama',
    'openai-compatible': 'OpenAI Compatible',
    'anthropic-compatible': 'Anthropic Compatible'
  };
  return names[name] || name;
}
