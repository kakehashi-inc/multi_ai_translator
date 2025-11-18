/**
 * Content Script
 * Injected into web pages to handle translation
 */
import browser from 'webextension-polyfill';
import { Translator } from './translator';
import { getMessage } from '../utils/i18n';
import { isPageTranslated } from '../utils/dom-manager';

type ContentRequest =
  | {
      action: 'translate-page';
      language?: string;
      provider?: string;
      sourceLanguage?: string;
    }
  | {
      action: 'translate-selection-text';
      text: string;
      language?: string;
      provider?: string;
      sourceLanguage?: string;
    }
  | { action: 'restore-original' }
  | { action: 'has-selection' }
  | { action: 'get-selection-text' }
  | { action: 'get-translation-state' };

// Initialize translator
const translator = new Translator();
translator.initialize().catch((error) => {
  console.error('[Content Script] Failed to initialize translator:', error);
});

/**
 * Listen for messages from background script
 */
browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  handleMessage(request as ContentRequest)
    .then(sendResponse)
    .catch((error) => {
      console.error('[Content Script] Error:', error);
      sendResponse({ error: error.message });
    });

  return true; // Keep message channel open
});

/**
 * Handle messages
 */
async function handleMessage(request: ContentRequest) {
  const { action } = request;

  switch (action) {
    case 'translate-page':
      await translator.translatePage(request.language, request.provider, request.sourceLanguage);
      return { success: true };

    case 'translate-selection-text': {
      const translation = await translator.translateSelectionText(
        request.text,
        request.language,
        request.provider,
        request.sourceLanguage
      );
      return { success: true, translation };
    }

    case 'restore-original':
      translator.restoreOriginal();
      return { success: true };

    case 'has-selection': {
      const selection = window.getSelection();
      const hasSelection = !!selection && selection.toString().trim().length > 0;
      return { success: true, hasSelection };
    }

    case 'get-selection-text': {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';
      return { success: true, text };
    }

    case 'get-translation-state': {
      const translated = isPageTranslated();
      return {
        success: true,
        isTranslated: translated,
        canRestore: translated
      };
    }

    default:
      throw new Error(getMessage('errorUnknownAction', [action]));
  }
}

/**
 * Listen for selection changes to show translate button
 */
let selectionTimeout: number | null = null;
document.addEventListener('mouseup', () => {
  if (selectionTimeout) {
    clearTimeout(selectionTimeout);
  }
  selectionTimeout = window.setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      // Could show a floating button here
    }
  }, 300);
});

console.info('[Multi-AI Translator] Content script loaded');
