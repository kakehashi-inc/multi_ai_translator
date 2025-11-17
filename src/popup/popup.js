/**
 * Popup Script
 * Handles popup UI interactions
 */
import browser from 'webextension-polyfill';
import { translatePage, getMessage } from '../utils/i18n.js';
import { getSettings, getEnabledProviders } from '../utils/storage.js';
import { getSupportedLanguages } from '../utils/i18n.js';
import { ConstVariables } from '../utils/const-variables.js';

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
    populateTargetLanguages(settings);
    populateSourceLanguages(settings);

    // Load last used provider
    await loadLastUsedProvider();

    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('[Popup] Initialization error:', error);
    showStatus(getMessage('errorFailedToInitialize'), 'error');
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
    option.textContent = 'Enable a provider in Settings';
    option.disabled = true;
    select.appendChild(option);
    return;
  }

  // Add enabled providers
  enabledProviders.forEach((providerName) => {
    const option = document.createElement('option');
    option.value = providerName;
    option.textContent = ConstVariables.formatProviderName(providerName);
    select.appendChild(option);
  });

  // Select default provider (will be overridden by lastUsedProvider if available)
  if (settings.common.defaultProvider) {
    select.value = settings.common.defaultProvider;
  }

  if (!select.value && enabledProviders.length > 0) {
    select.value = enabledProviders[0];
  }
}

/**
 * Load last used provider and select it in dropdown
 */
async function loadLastUsedProvider() {
  try {
    const response = await browser.runtime.sendMessage({
      action: 'getLastUsedProvider'
    });

    if (response?.provider) {
      const select = document.getElementById('provider-select');
      const enabledProviders = await getEnabledProviders();

      // Only select if provider is still enabled
      if (enabledProviders.includes(response.provider)) {
        select.value = response.provider;
      }
    }
  } catch (error) {
    console.warn('[Popup] Failed to load last used provider:', error);
  }
}

/**
 * Populate source language dropdown
 */
function populateSourceLanguages(settings) {
  const select = document.getElementById('source-language-select');
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
  const defaultSourceLanguage = settings.common.defaultSourceLanguage || 'auto';
  select.value = defaultSourceLanguage;
}

/**
 * Populate target language dropdown
 */
function populateTargetLanguages(settings) {
  const select = document.getElementById('language-select');
  const languages = getSupportedLanguages();

  languages.forEach((lang) => {
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
      const targetLanguage = document.getElementById('language-select').value;
      const sourceLanguage = document.getElementById('source-language-select').value;

      if (!provider) {
        showStatus(getMessage('errorPleaseSelectProvider'), 'error');
        return;
      }

      showStatus(getMessage('statusTranslatingPage'), 'info');

      // Save last used provider
      await browser.runtime.sendMessage({
        action: 'setLastUsedProvider',
        data: { provider }
      });

      const response = await sendMessageToActiveTab({
        action: 'translate-page',
        provider,
        language: targetLanguage,
        sourceLanguage
      });

      if (!response?.success) {
        throw new Error(response?.error || getMessage('errorTranslationFailed'));
      }

      showStatus(getMessage('statusPageTranslationStarted'), 'success');
    } catch (error) {
      console.error('[Popup] Translation error:', error);
      showStatus(getMessage('errorTranslationFailedWithMessage', [error.message]), 'error');
    }
  });

  // Translate selection button
  document.getElementById('translate-selection-btn').addEventListener('click', async () => {
    try {
      const provider = document.getElementById('provider-select').value;
      const targetLanguage = document.getElementById('language-select').value;
      const sourceLanguage = document.getElementById('source-language-select').value;

      if (!provider) {
        showStatus(getMessage('errorPleaseSelectProvider'), 'error');
        return;
      }

      showStatus(getMessage('statusTranslatingSelection'), 'info');

      // Save last used provider
      await browser.runtime.sendMessage({
        action: 'setLastUsedProvider',
        data: { provider }
      });

      const response = await sendMessageToActiveTab({
        action: 'translate-selection',
        provider,
        language: targetLanguage,
        sourceLanguage
      });

      if (!response?.success) {
        throw new Error(response?.error || getMessage('errorTranslationFailed'));
      }

      showStatus(getMessage('statusSelectionTranslated'), 'success');
    } catch (error) {
      console.error('[Popup] Translation error:', error);
      showStatus(getMessage('errorTranslationFailedWithMessage', [error.message]), 'error');
    }
  });

  // Restore button
  document.getElementById('restore-btn').addEventListener('click', async () => {
    try {
      const response = await sendMessageToActiveTab({
        action: 'restore-original'
      });

      if (!response?.success) {
        throw new Error(response?.error || getMessage('errorRestoreFailed'));
      }

      showStatus(getMessage('statusOriginalContentRestored'), 'success');
    } catch (error) {
      console.error('[Popup] Restore error:', error);
      showStatus(getMessage('errorRestoreFailedWithMessage', [error.message]), 'error');
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
let statusTimeoutId = null;

function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;

  if (statusTimeoutId) {
    clearTimeout(statusTimeoutId);
    statusTimeoutId = null;
  }

  if (type === 'success' || type === 'info') {
    statusTimeoutId = setTimeout(() => {
      statusTimeoutId = null;
      statusEl.className = 'status-message';
    }, 5000);
  }
}

async function sendMessageToActiveTab(message) {
  const tab = await getContentTabForAction();
  if (!tab?.id) {
    throw new Error(getMessage('errorNoRegularWebPage'));
  }

  try {
    return await browser.tabs.sendMessage(tab.id, message);
  } catch (error) {
    if (isMissingContentScriptError(error)) {
      await injectContentScript(tab.id);
      return await browser.tabs.sendMessage(tab.id, message);
    }
    throw error;
  }
}

function isMissingContentScriptError(error) {
  if (!error?.message) return false;
  return (
    error.message.includes('Receiving end does not exist') ||
    error.message.includes('Could not establish connection')
  );
}

async function getContentTabForAction() {
  const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (isContentTab(activeTab)) {
    return activeTab;
  }

  // Fallback: pick the first non-internal tab in the current window
  const tabs = await browser.tabs.query({ currentWindow: true });
  return tabs.find(isContentTab);
}

function isContentTab(tab) {
  if (!tab?.url) return false;
  return (
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('chrome-extension://') &&
    !tab.url.startsWith('edge://')
  );
}

function isAccessDeniedError(error) {
  if (!error?.message) return false;
  return (
    error.message.includes('Cannot access contents of the page') ||
    error.message.includes('Cannot access contents of url') ||
    error.message.includes('Extensions manifest must request permission') ||
    error.message.includes('No tab with id') ||
    error.message.includes('Frame with ID') ||
    error.message.includes('blocked by the administrator')
  );
}

async function injectContentScript(tabId) {
  const files = getContentScriptFiles();
  if (files.length === 0) {
    throw new Error(getMessage('errorScriptPathMissing'));
  }

  try {
    await executeContentScripts(tabId, files);
  } catch (error) {
    console.error('[Popup] Failed to inject content script:', error);
    if (isAccessDeniedError(error)) {
      throw new Error(getMessage('errorPageBlocksExtensions'));
    }
    throw new Error(getMessage('errorTranslatorCouldNotLoad'));
  }
}

function getContentScriptFiles() {
  const manifest = browser.runtime.getManifest();
  if (!manifest?.content_scripts) {
    return [];
  }

  const files = [];
  manifest.content_scripts.forEach((script) => {
    (script.js || []).forEach((file) => files.push(file));
  });
  return files;
}

async function executeContentScripts(tabId, files) {
  if (browser.scripting?.executeScript) {
    await browser.scripting.executeScript({
      target: { tabId },
      files
    });
    return;
  }

  if (browser.tabs?.executeScript) {
    for (const file of files) {
      await browser.tabs.executeScript(tabId, { file });
    }
    return;
  }

  throw new Error(getMessage('errorRuntimeNotSupported'));
}
