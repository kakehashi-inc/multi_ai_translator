/**
 * Content Script
 * Injected into web pages to handle translation
 */
import browser from 'webextension-polyfill';
import { Translator } from './translator.js';
import { getMessage } from '../utils/i18n.js';
import { isPageTranslated, hasTranslationPopup } from '../utils/dom-manager.js';

// Initialize translator
const translator = new Translator();
translator.initialize().catch(console.error);

/**
 * Listen for messages from background script
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request)
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
async function handleMessage(request) {
  const { action, text } = request;

  switch (action) {
    case 'translate-page':
      await translator.translatePage(request.language, request.provider, request.sourceLanguage);
      return { success: true };

    case 'translate-selection':
      if (text) {
        // Translate provided text (from context menu)
        const translation = await translator.translateSelection(
          text,
          false,
          request.language,
          request.provider,
          request.sourceLanguage
        );
        return { success: true, translation };
      } else {
        // Translate current selection
        await translator.translateSelection(
          null,
          true,
          request.language,
          request.provider,
          request.sourceLanguage
        );
        return { success: true };
      }

    case 'restore-original':
      translator.restoreOriginal();
      return { success: true };

    case 'has-selection': {
      const selection = window.getSelection();
      const hasSelection = !!selection && selection.toString().trim().length > 0;
      return { success: true, hasSelection };
    }

    case 'get-translation-state': {
      const translated = isPageTranslated();
      const hasPopup = hasTranslationPopup();
      return {
        success: true,
        isTranslated: translated,
        hasPopup,
        canRestore: translated || hasPopup
      };
    }

    default:
      throw new Error(getMessage('errorUnknownAction', [action]));
  }
}

/**
 * Listen for selection changes to show translate button
 */
let selectionTimeout;
document.addEventListener('mouseup', () => {
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      // Could show a floating button here
      console.log('[Content Script] Text selected:', selection.toString().substring(0, 50));
    }
  }, 300);
});

console.log('[Multi-AI Translator] Content script loaded');
