/**
 * Popup Script
 * Handles popup UI interactions
 */
import browser from 'webextension-polyfill';
import { translatePage } from '../utils/i18n.js';
import { getSettings, getEnabledProviders } from '../utils/storage.js';
import { getSupportedLanguages } from '../utils/i18n.js';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Translate UI
    translatePage();

    // Load settings
    const settings = await getSettings();

    // Populate providers
    await populateProviders(settings);

    // Populate languages
    populateLanguages(settings);

    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('[Popup] Initialization error:', error);
    showStatus('Failed to initialize popup', 'error');
  }
});

/**
 * Populate provider dropdown
 */
async function populateProviders(settings) {
  const select = document.getElementById('provider-select');
  const enabledProviders = await getEnabledProviders();

  // Clear existing options
  select.innerHTML = '<option value="">-- Select Provider --</option>';

  if (enabledProviders.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No providers configured';
    option.disabled = true;
    select.appendChild(option);
    return;
  }

  // Add enabled providers
  enabledProviders.forEach(providerName => {
    const option = document.createElement('option');
    option.value = providerName;
    option.textContent = formatProviderName(providerName);
    select.appendChild(option);
  });

  // Select default provider
  if (settings.common.defaultProvider) {
    select.value = settings.common.defaultProvider;
  }
}

/**
 * Populate language dropdown
 */
function populateLanguages(settings) {
  const select = document.getElementById('language-select');
  const languages = getSupportedLanguages();

  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    select.appendChild(option);
  });

  // Select default language
  if (settings.common.defaultTargetLanguage) {
    select.value = settings.common.defaultTargetLanguage;
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Translate page button
  document.getElementById('translate-page-btn').addEventListener('click', async () => {
    try {
      const provider = document.getElementById('provider-select').value;
      const language = document.getElementById('language-select').value;

      if (!provider) {
        showStatus('Please select a provider', 'error');
        return;
      }

      showStatus('Translating page...', 'info');

      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      await browser.tabs.sendMessage(tab.id, {
        action: 'translate-page',
        provider,
        language
      });

      showStatus('Page translation started', 'success');
    } catch (error) {
      console.error('[Popup] Translation error:', error);
      showStatus('Translation failed: ' + error.message, 'error');
    }
  });

  // Translate selection button
  document.getElementById('translate-selection-btn').addEventListener('click', async () => {
    try {
      const provider = document.getElementById('provider-select').value;
      const language = document.getElementById('language-select').value;

      if (!provider) {
        showStatus('Please select a provider', 'error');
        return;
      }

      showStatus('Translating selection...', 'info');

      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      await browser.tabs.sendMessage(tab.id, {
        action: 'translate-selection',
        provider,
        language
      });

      showStatus('Selection translated', 'success');
    } catch (error) {
      console.error('[Popup] Translation error:', error);
      showStatus('Translation failed: ' + error.message, 'error');
    }
  });

  // Restore button
  document.getElementById('restore-btn').addEventListener('click', async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      await browser.tabs.sendMessage(tab.id, {
        action: 'restore-original'
      });

      showStatus('Original content restored', 'success');
    } catch (error) {
      console.error('[Popup] Restore error:', error);
      showStatus('Restore failed: ' + error.message, 'error');
    }
  });

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });
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
    }, 3000);
  }
}

/**
 * Format provider name for display
 */
function formatProviderName(name) {
  const names = {
    'openai': 'OpenAI',
    'claude': 'Claude',
    'gemini': 'Gemini',
    'ollama': 'Ollama',
    'openai-compatible': 'OpenAI Compatible'
  };
  return names[name] || name;
}
