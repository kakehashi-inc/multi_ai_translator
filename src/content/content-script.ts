/**
 * Content Script
 * Injected into web pages to handle translation
 */
import browser from 'webextension-polyfill';
import { Translator } from './translator';
import { getMessage } from '../utils/i18n';
import {
  isPageTranslated,
  showSelectionOverlay,
  updateSelectionOverlayStatus,
  showSelectionOverlayResult,
  showSelectionOverlayError,
  hideSelectionOverlay
} from '../utils/dom-manager';

type ContentRequest =
  | {
      action: 'translate-page';
      language?: string;
      provider?: string;
      sourceLanguage?: string;
    }
  | {
      action: 'translate-selection-inline';
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

    case 'translate-selection-inline':
      await handleInlineSelectionTranslation(request);
      return { success: true };

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

async function handleInlineSelectionTranslation(
  request: Extract<ContentRequest, { action: 'translate-selection-inline' }>
) {
  const translatorMeta = {
    original: request.text,
    provider: request.provider || '',
    targetLanguage: request.language || '',
    sourceLanguage: request.sourceLanguage || 'auto',
    title: getMessage('selectionPopupTitle'),
    labels: {
      source: getMessage('labelSelectionSource'),
      target: getMessage('labelSelectionTarget'),
      provider: getMessage('labelSelectionProvider'),
      original: getMessage('labelSelectionOriginal'),
      result: getMessage('labelSelectionResult')
    },
    statusPreparing: getMessage('statusSelectionPreparing')
  };

  showSelectionOverlay(translatorMeta, () => {
    hideSelectionOverlay();
  });

  try {
    const chunks = splitSelectionText(request.text);
    const translations: string[] = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const current = (i + 1).toString();
      const total = chunks.length.toString();
      updateSelectionOverlayStatus(getMessage('statusTranslating', [current, total]));
      const translation = await translator.translateSelectionText(
        chunks[i],
        request.language,
        request.provider,
        request.sourceLanguage
      );
      translations.push(translation.trim());
    }
    showSelectionOverlayResult(translations.join('\n\n').trim());
  } catch (error) {
    console.error('[Content Script] Inline selection translation failed', error);
    const message = error instanceof Error ? error.message : getMessage('errorTranslationFailed');
    showSelectionOverlayError(message);
    throw error;
  }
}

function splitSelectionText(text: string, maxLength = 1800): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= maxLength) {
    return [normalized];
  }

  const chunks: string[] = [];
  let remaining = normalized;

  while (remaining.length > maxLength) {
    let breakpoint = Math.max(
      remaining.lastIndexOf('\n', maxLength),
      remaining.lastIndexOf('。', maxLength),
      remaining.lastIndexOf('、', maxLength),
      remaining.lastIndexOf(' ', maxLength)
    );

    if (breakpoint === -1 || breakpoint < maxLength * 0.4) {
      breakpoint = maxLength;
    }

    const chunk = remaining.slice(0, breakpoint).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    remaining = remaining.slice(breakpoint).trimStart();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks.length ? chunks : [normalized];
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
