/**
 * Background Service Worker
 * Handles extension lifecycle, context menus, and message passing
 */
import browser from 'webextension-polyfill';
import { createProvider } from '../providers/index.js';
import { getSettings, getProviderSettings, addToHistory } from '../utils/storage.js';

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
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  const targetTab = await resolveContentTab(tab);
  await sendMessageToTab(targetTab?.id, {
    action: 'translate-selection',
    text: info?.selectionText
  });
}

/**
 * Handle translate page
 */
async function handleTranslatePage(tab) {
  const targetTab = await resolveContentTab(tab);
  await sendMessageToTab(targetTab?.id, {
    action: 'translate-page'
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
