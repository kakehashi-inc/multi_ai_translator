/**
 * Background Service Worker
 * Handles extension lifecycle, context menus, and message passing
 */
import browser from 'webextension-polyfill';
import { createProvider } from '../providers/index.js';
import { getSettings, addToHistory } from '../utils/storage.js';

// Cache for last used provider (for performance)
let lastUsedProviderCache = null;

/**
 * Get last used provider from storage
 * Works in both Chromium and Firefox
 */
async function getLastUsedProvider() {
  if (lastUsedProviderCache !== null) {
    return lastUsedProviderCache;
  }

  try {
    // Try session storage first (Firefox 109+, Chromium)
    if (browser.storage?.session) {
      const result = await browser.storage.session.get('lastUsedProvider');
      lastUsedProviderCache = result.lastUsedProvider || null;
      return lastUsedProviderCache;
    }
  } catch (error) {
    console.warn('[Service Worker] Session storage not available, using local storage', error);
  }

  // Fallback to local storage (persists until browser restart)
  try {
    const result = await browser.storage.local.get('lastUsedProvider');
    lastUsedProviderCache = result.lastUsedProvider || null;
    return lastUsedProviderCache;
  } catch (error) {
    console.warn('[Service Worker] Failed to get last used provider', error);
    return null;
  }
}

/**
 * Set last used provider to storage
 * Works in both Chromium and Firefox
 */
async function setLastUsedProvider(provider) {
  lastUsedProviderCache = provider;

  try {
    // Try session storage first (Firefox 109+, Chromium)
    if (browser.storage?.session) {
      await browser.storage.session.set({ lastUsedProvider: provider });
      return;
    }
  } catch (error) {
    console.warn('[Service Worker] Session storage not available, using local storage', error);
  }

  // Fallback to local storage (persists until browser restart)
  try {
    await browser.storage.local.set({ lastUsedProvider: provider });
  } catch (error) {
    console.warn('[Service Worker] Failed to set last used provider', error);
  }
}

/**
 * Initialize extension
 */
browser.runtime.onInstalled.addListener(async (details) => {
  console.log('[Multi-AI Translator] Extension installed', details);

  // Create context menus
  await createContextMenus();

  // Set default settings on first install
  if (details.reason === 'install') {
    console.log('[Multi-AI Translator] First install, setting default settings');
  }
});

/**
 * Create context menus
 */
async function createContextMenus() {
  try {
    await browser.contextMenus.removeAll();
  } catch (error) {
    console.warn('[Multi-AI Translator] Failed to clear context menus before creating new ones', error);
  }

  const menuItems = [
    {
      id: 'translate-selection',
      title: 'Translate selection',
      contexts: ['selection']
    },
    {
      id: 'translate-page',
      title: 'Translate page',
      contexts: ['page']
    },
    {
      id: 'restore-original',
      title: 'Restore original',
      contexts: ['page']
    }
  ];

  for (const item of menuItems) {
    try {
      await browser.contextMenus.create(item);
    } catch (error) {
      console.error('[Multi-AI Translator] Failed to create context menu', item.id, error);
    }
  }
}

/**
 * Handle context menu clicks
 */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
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
browser.commands.onCommand.addListener(async (command) => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

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
browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  handleMessage(request)
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
async function handleMessage(request, _sender) {
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
    case 'setLastUsedProvider':
      await setLastUsedProvider(data?.provider || null);
      return { success: true };
    case 'getLastUsedProvider':
      return { provider: await getLastUsedProvider() };
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
    const lastUsed = await getLastUsedProvider();
    const provider = providerName || lastUsed || settings.common.defaultProvider;

    // Save last used provider
    if (provider) {
      await setLastUsedProvider(provider);
    }
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
  const targetTab = await resolveContentTab(tab);
  const settings = await getSettings();
  const lastUsed = await getLastUsedProvider();
  const provider = lastUsed || settings.common.defaultProvider;
  await sendMessageToTab(targetTab?.id, {
    action: 'translate-selection',
    text: info?.selectionText,
    provider
  });
}

/**
 * Handle translate page
 */
async function handleTranslatePage(tab) {
  const targetTab = await resolveContentTab(tab);
  const settings = await getSettings();
  const lastUsed = await getLastUsedProvider();
  const provider = lastUsed || settings.common.defaultProvider;
  await sendMessageToTab(targetTab?.id, {
    action: 'translate-page',
    provider
  });
}

/**
 * Handle restore original
 */
async function handleRestoreOriginal(tab) {
  const targetTab = await resolveContentTab(tab);
  await sendMessageToTab(targetTab?.id, {
    action: 'restore-original'
  });
}

/**
 * Show notification
 */
function showNotification(title, message) {
  browser.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon-128.png',
    title: title,
    message: message
  });
}

async function sendMessageToTab(tabId, message) {
  if (!tabId) {
    throw new Error('No active tab available');
  }

  try {
    return await browser.tabs.sendMessage(tabId, message);
  } catch (error) {
    if (isMissingContentScriptError(error)) {
      await injectContentScript(tabId);
      return await browser.tabs.sendMessage(tabId, message);
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

function getContentScriptFiles() {
  const manifest = browser.runtime.getManifest();
  if (!manifest?.content_scripts) {
    return [];
  }
  const files = [];
  manifest.content_scripts.forEach(script => {
    (script.js || []).forEach(file => files.push(file));
  });
  return files;
}

async function injectContentScript(tabId) {
  const files = getContentScriptFiles();
  if (files.length === 0) {
    throw new Error('Translator script path is missing from manifest.');
  }

  try {
    await executeContentScripts(tabId, files);
  } catch (error) {
    console.error('[Service Worker] Failed to inject content script:', error);
    if (isAccessDeniedError(error)) {
      throw new Error('This page does not allow extensions (e.g. chrome:// or the Web Store). Please try another page or reload after enabling the extension.');
    }
    throw new Error('Translator could not load on this page yet. Please reload the tab and try again.');
  }
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

  throw new Error('Runtime does not support script injection APIs.');
}

async function resolveContentTab(tab) {
  if (isContentTab(tab)) {
    return tab;
  }

  const tabs = await browser.tabs.query({ currentWindow: true });
  return tabs.find(isContentTab);
}

function isContentTab(tab) {
  if (!tab?.url) return false;
  return !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('chrome-extension://') &&
    !tab.url.startsWith('edge://');
}

console.log('[Multi-AI Translator] Service worker loaded');
