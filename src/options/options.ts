// @ts-nocheck
/**
 * Options Page Script
 * Handles settings management
 */
import browser from 'webextension-polyfill';
import { translatePage, getSupportedLanguages } from '../utils/i18n';
import {
  getSettings,
  saveSettings,
  resetSettings,
  exportSettings,
  importSettings,
  getBrowserLanguage
} from '../utils/storage';
import { ConstVariables } from '../utils/const-variables';

const {
  PROVIDER_ORDER,
  DEFAULT_BATCH_MAX_ITEMS,
  DEFAULT_BATCH_MAX_CHARS,
  DEFAULT_OPENAI_TEMPERATURE,
  DEFAULT_OPENAI_MAX_TOKENS,
  DEFAULT_ANTHROPIC_TEMPERATURE,
  DEFAULT_ANTHROPIC_MAX_TOKENS,
  DEFAULT_GEMINI_TEMPERATURE,
  DEFAULT_GEMINI_MAX_OUTPUT_TOKENS,
  DEFAULT_OLLAMA_TEMPERATURE,
  DEFAULT_OLLAMA_HOST,
  DEFAULT_LANGUAGE,
  DEFAULT_FONT_SIZE
} = ConstVariables;

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Translate UI
    translatePage();

    // Load settings
    const settings = await getSettings();

    populateLanguages(settings.common.defaultTargetLanguage || getBrowserLanguage());
    loadSettingsToUI(settings);

    // Set up event listeners
    setupEventListeners();
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
  document.querySelectorAll('.tab-btn').forEach((btn) => {
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
    { id: 'gemini-fetch-models', provider: 'gemini' },
    { id: 'anthropic-fetch-models', provider: 'anthropic' },
    { id: 'anthropic-compatible-fetch-models', provider: 'anthropic-compatible' },
    { id: 'openai-fetch-models', provider: 'openai' },
    { id: 'openai-compatible-fetch-models', provider: 'openai-compatible' },
    { id: 'ollama-fetch-models', provider: 'ollama' }
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
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
}

/**
 * Load settings to UI
 */
function loadSettingsToUI(settings) {
  // Providers
  PROVIDER_ORDER.forEach((provider) => {
    const config = settings.providers[provider];
    const enabledEl = document.getElementById(`${provider}-enabled`);

    if (enabledEl) {
      enabledEl.checked = config.enabled;
    }

    // Load provider-specific settings
    Object.keys(config).forEach((key) => {
      if (key === 'enabled') return;

      const fieldName =
        provider === 'openai-compatible'
          ? `${provider}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
          : `${provider}-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;

      const el = document.getElementById(fieldName);
      if (el) {
        el.value = config[key] || '';
      }
    });
  });

  const openaiTempInput = document.getElementById('openai-temperature');
  if (openaiTempInput) {
    openaiTempInput.placeholder = `${DEFAULT_OPENAI_TEMPERATURE}`;
  }

  const anthropicTokensInput = document.getElementById('anthropic-max-tokens');
  if (anthropicTokensInput) {
    anthropicTokensInput.placeholder = `${DEFAULT_ANTHROPIC_MAX_TOKENS}`;
  }

  const anthropicCompatibleTokensInput = document.getElementById('anthropic-compatible-max-tokens');
  if (anthropicCompatibleTokensInput) {
    anthropicCompatibleTokensInput.placeholder = `${DEFAULT_ANTHROPIC_MAX_TOKENS}`;
  }

  const ollamaHostInput = document.getElementById('ollama-host');
  if (ollamaHostInput) {
    ollamaHostInput.placeholder = DEFAULT_OLLAMA_HOST;
  }

  // Common settings
  const defaultSourceLanguage = document.getElementById('default-source-language');
  if (defaultSourceLanguage) {
    populateSourceLanguageDropdown(
      defaultSourceLanguage,
      settings.common.defaultSourceLanguage || 'auto'
    );
  }

  const defaultTargetLanguage = document.getElementById('default-target-language');
  if (defaultTargetLanguage) {
    defaultTargetLanguage.value = settings.common.defaultTargetLanguage || getBrowserLanguage();
  }

  const batchMaxItems = document.getElementById('batch-max-items');
  if (batchMaxItems) {
    batchMaxItems.placeholder = `${DEFAULT_BATCH_MAX_ITEMS}`;
    const resolvedItems = Number(settings.common.batchMaxItems);
    batchMaxItems.value = Number.isFinite(resolvedItems) ? resolvedItems : '';
  }

  const batchMaxChars = document.getElementById('batch-max-chars');
  if (batchMaxChars) {
    batchMaxChars.placeholder = `${DEFAULT_BATCH_MAX_CHARS}`;
    const resolvedChars = Number(settings.common.batchMaxChars);
    batchMaxChars.value = Number.isFinite(resolvedChars) ? resolvedChars : '';
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
    ui: {}
  };

  // Providers
  PROVIDER_ORDER.forEach((provider) => {
    const enabled = document.getElementById(`${provider}-enabled`)?.checked || false;

    settings.providers[provider] = { enabled };

    // Collect provider-specific settings
    if (provider === 'openai') {
      settings.providers[provider].apiKey = document.getElementById('openai-api-key')?.value || '';
      settings.providers[provider].model = document.getElementById('openai-model')?.value || '';
      const openaiTempValue = document.getElementById('openai-temperature')?.value ?? '';
      const parsedOpenaiTemp = parseFloat(openaiTempValue);
      settings.providers[provider].temperature = Number.isFinite(parsedOpenaiTemp)
        ? parsedOpenaiTemp
        : DEFAULT_OPENAI_TEMPERATURE;
      settings.providers[provider].maxTokens = DEFAULT_OPENAI_MAX_TOKENS;
    } else if (provider === 'anthropic') {
      settings.providers[provider].apiKey =
        document.getElementById('anthropic-api-key')?.value || '';
      settings.providers[provider].model = document.getElementById('anthropic-model')?.value || '';
      const anthropicMaxTokens = parseInt(
        document.getElementById('anthropic-max-tokens')?.value ?? '',
        10
      );
      settings.providers[provider].maxTokens = Number.isFinite(anthropicMaxTokens)
        ? anthropicMaxTokens
        : DEFAULT_ANTHROPIC_MAX_TOKENS;
      settings.providers[provider].temperature = DEFAULT_ANTHROPIC_TEMPERATURE;
    } else if (provider === 'gemini') {
      settings.providers[provider].apiKey = document.getElementById('gemini-api-key')?.value || '';
      settings.providers[provider].model = document.getElementById('gemini-model')?.value || '';
      settings.providers[provider].temperature = DEFAULT_GEMINI_TEMPERATURE;
      settings.providers[provider].maxOutputTokens = DEFAULT_GEMINI_MAX_OUTPUT_TOKENS;
    } else if (provider === 'ollama') {
      const hostValue = document.getElementById('ollama-host')?.value || '';
      settings.providers[provider].host = hostValue || DEFAULT_OLLAMA_HOST;
      settings.providers[provider].model = document.getElementById('ollama-model')?.value || '';
      settings.providers[provider].temperature = DEFAULT_OLLAMA_TEMPERATURE;
    } else if (provider === 'openai-compatible') {
      settings.providers[provider].baseUrl =
        document.getElementById('openai-compatible-base-url')?.value || '';
      settings.providers[provider].apiKey =
        document.getElementById('openai-compatible-api-key')?.value || '';
      settings.providers[provider].model =
        document.getElementById('openai-compatible-model')?.value || '';
      settings.providers[provider].temperature = DEFAULT_OPENAI_TEMPERATURE;
    } else if (provider === 'anthropic-compatible') {
      settings.providers[provider].baseUrl =
        document.getElementById('anthropic-compatible-base-url')?.value || '';
      settings.providers[provider].apiKey =
        document.getElementById('anthropic-compatible-api-key')?.value || '';
      settings.providers[provider].model =
        document.getElementById('anthropic-compatible-model')?.value || '';
      const anthCompatibleMaxTokens = parseInt(
        document.getElementById('anthropic-compatible-max-tokens')?.value ?? '',
        10
      );
      settings.providers[provider].maxTokens = Number.isFinite(anthCompatibleMaxTokens)
        ? anthCompatibleMaxTokens
        : DEFAULT_ANTHROPIC_MAX_TOKENS;
      settings.providers[provider].temperature = DEFAULT_ANTHROPIC_TEMPERATURE;
    }
  });

  // Common settings
  // Note: defaultProvider is no longer configurable - last used provider is automatically saved
  const sourceLanguageField = document.getElementById('default-source-language');
  const selectedSourceLanguage = sourceLanguageField?.value;
  settings.common.defaultSourceLanguage =
    selectedSourceLanguage && selectedSourceLanguage.trim() ? selectedSourceLanguage : 'auto';

  const targetLanguageField = document.getElementById('default-target-language');
  const selectedTargetLanguage = targetLanguageField?.value;
  settings.common.defaultTargetLanguage =
    selectedTargetLanguage && selectedTargetLanguage.trim()
      ? selectedTargetLanguage
      : getBrowserLanguage();

  settings.common.uiLanguage = DEFAULT_LANGUAGE;

  const batchItemsInput = document.getElementById('batch-max-items');
  const parsedBatchItems = parseInt(batchItemsInput?.value ?? '', 10);
  settings.common.batchMaxItems = Number.isFinite(parsedBatchItems)
    ? parsedBatchItems
    : DEFAULT_BATCH_MAX_ITEMS;

  const batchCharsInput = document.getElementById('batch-max-chars');
  const parsedBatchChars = parseInt(batchCharsInput?.value ?? '', 10);
  settings.common.batchMaxChars = Number.isFinite(parsedBatchChars)
    ? parsedBatchChars
    : DEFAULT_BATCH_MAX_CHARS;

  // UI settings
  settings.ui.theme = document.getElementById('theme')?.value || 'auto';
  settings.ui.showOriginalText = document.getElementById('show-original-text')?.checked ?? true;
  settings.ui.highlightTranslated =
    document.getElementById('highlight-translated')?.checked ?? true;
  settings.ui.fontSize = DEFAULT_FONT_SIZE;

  return settings;
}

/**
 * Populate source language dropdown
 */
function populateSourceLanguageDropdown(select, selectedLanguage) {
  if (!select) return;

  select.innerHTML = '';

  const languages = getSupportedLanguages();

  // Add auto-detect option
  const autoOption = document.createElement('option');
  autoOption.value = 'auto';
  autoOption.textContent = 'Auto-detect';
  select.appendChild(autoOption);

  // Add supported languages
  languages.forEach((lang) => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    select.appendChild(option);
  });

  // Select default source language
  if (selectedLanguage) {
    select.value = selectedLanguage;
  } else {
    select.value = 'auto';
  }
}

/**
 * Populate target language dropdown
 */
function populateLanguages(selectedLanguage) {
  const select = document.getElementById('default-target-language');
  if (!select) return;

  select.innerHTML = '';

  const languages = getSupportedLanguages();

  languages.forEach((lang) => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    select.appendChild(option);
  });

  const preferredLanguage = selectedLanguage || getBrowserLanguage();
  if (preferredLanguage) {
    select.value = preferredLanguage;
  }

  if (!select.value && languages.length > 0) {
    select.value = languages[0].code;
  }
}

/**
 * Fetch models from provider
 */
async function fetchModels(providerName) {
  try {
    const displayName = ConstVariables.formatProviderName(providerName);
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
      response.models.forEach((model) => {
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
  const getValue = (id) => document.getElementById(id)?.value?.trim() || '';

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
      const host = getValue('ollama-host') || DEFAULT_OLLAMA_HOST;
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
