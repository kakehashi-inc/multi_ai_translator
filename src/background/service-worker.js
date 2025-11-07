/**
 * Background Service Worker
 * Handles extension lifecycle, context menus, and message passing
 */
import { createProvider } from '../providers/index.js';
import { getSettings, getProviderSettings, addToHistory } from '../utils/storage.js';

/**
 * Initialize extension
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Multi-AI Translator] Extension installed', details);

  // Create context menus
  createContextMenus();

  // Set default settings on first install
  if (details.reason === 'install') {
    console.log('[Multi-AI Translator] First install, setting default settings');
  }
});

/**
 * Create context menus
 */
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'translate-selection',
      title: 'Translate selection',
      contexts: ['selection']
    });

    chrome.contextMenus.create({
      id: 'translate-page',
      title: 'Translate page',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'restore-original',
      title: 'Restore original',
      contexts: ['page']
    });
  });
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    switch (info.menuItemId) {
      case 'translate-selection':
        await handleTranslateSelection(info, tab);
        break;
      case 'translate-page':
        await handleTranslatePage(tab);
        break;
      case 'restore-original':
        await handleRestoreOriginal(tab);
        break;
    }
  } catch (error) {
    console.error('[Multi-AI Translator] Context menu error:', error);
    showNotification('Error', error.message);
  }
});

/**
 * Handle keyboard commands
 */
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    switch (command) {
      case 'translate-page':
        await handleTranslatePage(tab);
        break;
      case 'translate-selection':
        await handleTranslateSelection(null, tab);
        break;
      case 'restore-original':
        await handleRestoreOriginal(tab);
        break;
    }
  } catch (error) {
    console.error('[Multi-AI Translator] Command error:', error);
    showNotification('Error', error.message);
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('[Multi-AI Translator] Message error:', error);
      sendResponse({ error: error.message });
    });

  return true; // Keep message channel open for async response
});

/**
 * Handle message routing
 */
async function handleMessage(request, sender) {
  const { action, data } = request;

  switch (action) {
    case 'translate':
      return await translateText(data);
    case 'getSettings':
      return await getSettings();
    case 'testProvider':
      return await testProvider(data);
    case 'getModels':
      return await getProviderModels(data);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Translate text using specified provider
 */
async function translateText({ text, targetLanguage, sourceLanguage, providerName }) {
  try {
    const settings = await getSettings();
    const provider = providerName || settings.common.defaultProvider;
    const providerConfig = settings.providers[provider];

    if (!providerConfig || !providerConfig.enabled) {
      throw new Error(`Provider ${provider} is not enabled`);
    }

    // Create and initialize provider
    const providerInstance = createProvider(provider, providerConfig);
    const translation = await providerInstance.translate(
      text,
      targetLanguage || settings.common.defaultTargetLanguage,
      sourceLanguage || 'auto'
    );

    // Add to history
    await addToHistory({
      original: text.substring(0, 100),
      translated: translation.substring(0, 100),
      provider,
      targetLanguage,
      sourceLanguage
    });

    return {
      success: true,
      translation,
      provider
    };
  } catch (error) {
    console.error('[Multi-AI Translator] Translation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test provider connection
 */
async function testProvider({ providerName, config }) {
  try {
    const providerInstance = createProvider(providerName, config);

    // Try to get models as connection test
    await providerInstance.getModels();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get available models for provider
 */
async function getProviderModels({ providerName, config }) {
  try {
    const providerInstance = createProvider(providerName, config);
    const models = await providerInstance.getModels();

    return {
      success: true,
      models
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      models: []
    };
  }
}

/**
 * Handle translate selection
 */
async function handleTranslateSelection(info, tab) {
  await chrome.tabs.sendMessage(tab.id, {
    action: 'translate-selection',
    text: info?.selectionText
  });
}

/**
 * Handle translate page
 */
async function handleTranslatePage(tab) {
  await chrome.tabs.sendMessage(tab.id, {
    action: 'translate-page'
  });
}

/**
 * Handle restore original
 */
async function handleRestoreOriginal(tab) {
  await chrome.tabs.sendMessage(tab.id, {
    action: 'restore-original'
  });
}

/**
 * Show notification
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon-128.png',
    title: title,
    message: message
  });
}

console.log('[Multi-AI Translator] Service worker loaded');
