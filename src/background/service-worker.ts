/**
 * Background Service Worker
 * Handles extension lifecycle, context menus, and message passing
 */
import browser from 'webextension-polyfill';
import type { Menus, Tabs } from 'webextension-polyfill';
import { createProvider } from '../providers';
import { getSettings, addToHistory } from '../utils/storage';
import { getMessage } from '../utils/i18n';
import type { ProviderSettings } from '../types/settings';
import type { BaseProvider } from '../providers/base-provider';

type TranslatePayload = {
  text: string;
  targetLanguage?: string;
  sourceLanguage?: string;
  providerName?: string | null;
};

type ProviderRequestPayload = {
  providerName: string;
  config?: ProviderSettings;
};

type BackgroundRequest =
  | { action: 'translate'; data: TranslatePayload }
  | { action: 'getSettings' }
  | { action: 'testProvider'; data: ProviderRequestPayload }
  | { action: 'getModels'; data: ProviderRequestPayload }
  | { action: 'setLastUsedProvider'; data?: { provider?: string | null } }
  | { action: 'getLastUsedProvider' }
  | { action: string; data?: unknown };

type TranslateResponse =
  | { success: true; translation: string; provider: string }
  | { success: false; error: string };

type ProviderResponse = { success: true } | { success: false; error: string };

type ModelsResponse =
  | { success: true; models: string[] }
  | { success: false; error: string; models: string[] };

// Cache for last used provider (for performance)
let lastUsedProviderCache: string | null = null;
// Ensure we only log the session storage fallback once to avoid noisy console output
let sessionStorageWarningLogged = false;

/**
 * Get last used provider from storage
 * Works in both Chrome and Firefox
 */
async function getLastUsedProvider(): Promise<string | null> {
  if (lastUsedProviderCache !== null) {
    return lastUsedProviderCache;
  }

  try {
    // Try session storage first (Firefox 109+, Chrome)
    if (browser.storage?.session) {
      const result = await browser.storage.session.get('lastUsedProvider');
      lastUsedProviderCache = (result.lastUsedProvider as string | undefined) || null;
      return lastUsedProviderCache;
    }
  } catch (error) {
    if (!sessionStorageWarningLogged) {
      console.warn('[Service Worker] Session storage not available, using local storage', error);
      sessionStorageWarningLogged = true;
    }
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
 * Works in both Chrome and Firefox
 */
async function setLastUsedProvider(provider: string | null): Promise<void> {
  lastUsedProviderCache = provider;

  try {
    // Try session storage first (Firefox 109+, Chrome)
    if (browser.storage?.session) {
      await browser.storage.session.set({ lastUsedProvider: provider ?? null });
      return;
    }
  } catch (error) {
    if (!sessionStorageWarningLogged) {
      console.warn('[Service Worker] Session storage not available, using local storage', error);
      sessionStorageWarningLogged = true;
    }
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
  console.info('[Multi-AI Translator] Extension installed', details);

  // Create context menus
  await createContextMenus();

  // Set default settings on first install
  if (details.reason === 'install') {
    console.info('[Multi-AI Translator] First install, setting default settings');
  }
});

/**
 * Create context menus
 */
async function createContextMenus(): Promise<void> {
  try {
    await browser.contextMenus.removeAll();
  } catch (error) {
    console.warn(
      '[Multi-AI Translator] Failed to clear context menus before creating new ones',
      error
    );
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
browser.runtime.onMessage.addListener((request: BackgroundRequest, _sender, sendResponse) => {
  handleMessage(request)
    .then(sendResponse)
    .catch((error) => {
      console.error('[Multi-AI Translator] Message error:', error);
      sendResponse({ error: error.message });
    });

  return true; // Keep message channel open for async response
});

/**
 * Handle message routing
 */
async function handleMessage(request: BackgroundRequest): Promise<unknown> {
  const { action } = request;
  const data = (request as { data?: unknown }).data;

  switch (action) {
    case 'translate':
      return await translateText((data || {}) as TranslatePayload);
    case 'getSettings':
      return await getSettings();
    case 'testProvider':
      return await testProvider((data || {}) as ProviderRequestPayload);
    case 'getModels':
      return await getProviderModels((data || {}) as ProviderRequestPayload);
    case 'setLastUsedProvider':
      await setLastUsedProvider((data as { provider?: string | null })?.provider ?? null);
      return { success: true };
    case 'getLastUsedProvider':
      return { provider: await getLastUsedProvider() };
    default:
      throw new Error(getMessage('errorUnknownAction', [action]));
  }
}

/**
 * Translate text using specified provider
 */
async function translateText({
  text,
  targetLanguage,
  sourceLanguage,
  providerName
}: TranslatePayload): Promise<TranslateResponse> {
  try {
    if (!text) {
      throw new Error(getMessage('errorNoTranslatableText'));
    }
    const settings = await getSettings();
    const lastUsed = await getLastUsedProvider();
    const provider = providerName || lastUsed || settings.common.defaultProvider;

    // Save last used provider
    if (provider) {
      await setLastUsedProvider(provider);
    }
    const providerConfig = settings.providers[provider];

    if (!providerConfig || !providerConfig.enabled) {
      throw new Error(getMessage('errorProviderNotEnabled', [provider]));
    }

    // Create and initialize provider
    const providerInstance = createProvider(provider, providerConfig) as BaseProvider;
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
      targetLanguage: targetLanguage || null,
      sourceLanguage: sourceLanguage || null
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
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test provider connection
 */
async function testProvider({
  providerName,
  config
}: ProviderRequestPayload): Promise<ProviderResponse> {
  try {
    const providerInstance = createProvider(providerName, config) as BaseProvider;

    // Try to get models as connection test
    await providerInstance.getModels();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get available models for provider
 */
async function getProviderModels({
  providerName,
  config
}: ProviderRequestPayload): Promise<ModelsResponse> {
  try {
    const providerInstance = createProvider(providerName, config) as BaseProvider;
    const models = await providerInstance.getModels();

    return {
      success: true,
      models
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      models: []
    };
  }
}

/**
 * Handle translate selection
 */
async function handleTranslateSelection(
  info: Menus.OnClickData | null,
  tab?: Tabs.Tab
): Promise<void> {
  const targetTab = await resolveContentTab(tab);
  const settings = await getSettings();
  const lastUsed = await getLastUsedProvider();
  const provider = lastUsed || settings.common.defaultProvider;
  const sourceLanguage = settings.common.defaultSourceLanguage || 'auto';
  await sendMessageToTab(targetTab?.id, {
    action: 'translate-selection',
    text: info?.selectionText,
    provider,
    sourceLanguage
  });
}

/**
 * Handle translate page
 */
async function handleTranslatePage(tab?: Tabs.Tab): Promise<void> {
  const targetTab = await resolveContentTab(tab);
  const settings = await getSettings();
  const lastUsed = await getLastUsedProvider();
  const provider = lastUsed || settings.common.defaultProvider;
  const sourceLanguage = settings.common.defaultSourceLanguage || 'auto';
  await sendMessageToTab(targetTab?.id, {
    action: 'translate-page',
    provider,
    sourceLanguage
  });
}

/**
 * Handle restore original
 */
async function handleRestoreOriginal(tab?: Tabs.Tab): Promise<void> {
  const targetTab = await resolveContentTab(tab);
  await sendMessageToTab(targetTab?.id, {
    action: 'restore-original'
  });
}

/**
 * Show notification
 */
function showNotification(title: string, message: string): void {
  browser.notifications.create({
    type: 'basic',
    iconUrl: '../icons/icon-128.png',
    title: title,
    message: message
  });
}

async function sendMessageToTab(
  tabId: number | undefined,
  message: Record<string, unknown>
): Promise<unknown> {
  if (!tabId) {
    throw new Error(getMessage('errorNoActiveTab'));
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

function isMissingContentScriptError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  if (!message) return false;
  return (
    message.includes('Receiving end does not exist') ||
    message.includes('Could not establish connection')
  );
}

function isAccessDeniedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  if (!message) return false;
  return (
    message.includes('Cannot access contents of the page') ||
    message.includes('Cannot access contents of url') ||
    message.includes('Extensions manifest must request permission') ||
    message.includes('No tab with id') ||
    message.includes('Frame with ID') ||
    message.includes('blocked by the administrator')
  );
}

function getContentScriptFiles(): string[] {
  const manifest = browser.runtime.getManifest();
  if (!manifest?.content_scripts) {
    return [];
  }
  const files: string[] = [];
  manifest.content_scripts.forEach((script) => {
    (script.js || []).forEach((file) => files.push(file));
  });
  return files;
}

async function injectContentScript(tabId: number): Promise<void> {
  const files = getContentScriptFiles();
  if (files.length === 0) {
    throw new Error(getMessage('errorScriptPathMissing'));
  }

  try {
    await executeContentScripts(tabId, files);
  } catch (error) {
    console.error('[Service Worker] Failed to inject content script:', error);
    if (isAccessDeniedError(error)) {
      throw new Error(getMessage('errorPageBlocksExtensions'));
    }
    throw new Error(getMessage('errorTranslatorCouldNotLoad'));
  }
}

async function executeContentScripts(tabId: number, files: string[]): Promise<void> {
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

async function resolveContentTab(tab?: Tabs.Tab | null): Promise<Tabs.Tab | undefined> {
  if (isContentTab(tab)) {
    return tab;
  }

  const tabs = await browser.tabs.query({ currentWindow: true });
  return tabs.find((candidate) => isContentTab(candidate));
}

function isContentTab(tab?: Tabs.Tab | null): tab is Tabs.Tab {
  if (!tab?.url) return false;
  return (
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('chrome-extension://') &&
    !tab.url.startsWith('edge://')
  );
}

console.info('[Multi-AI Translator] Service worker loaded');
