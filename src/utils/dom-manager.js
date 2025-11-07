/**
 * DOM Manager
 * Manages DOM manipulation for translation display
 */

/**
 * Translation state for current page
 */
class PageTranslationState {
  constructor() {
    this.translations = new Map();
    this.originalContents = new Map();
    this.isTranslating = false;
  }

  /**
   * Store original content
   */
  storeOriginal(element, content) {
    const id = this.getElementId(element);
    this.originalContents.set(id, content);
  }

  /**
   * Store translation
   */
  storeTranslation(element, translation, provider) {
    const id = this.getElementId(element);
    this.translations.set(id, {
      text: translation,
      provider,
      timestamp: Date.now()
    });
  }

  /**
   * Get original content
   */
  getOriginal(element) {
    const id = this.getElementId(element);
    return this.originalContents.get(id);
  }

  /**
   * Get element ID or create one
   */
  getElementId(element) {
    if (!element.dataset.translationId) {
      element.dataset.translationId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return element.dataset.translationId;
  }

  /**
   * Check if element is translated
   */
  isTranslated(element) {
    const id = element.dataset.translationId;
    return id && this.translations.has(id);
  }

  /**
   * Clear all translations
   */
  clear() {
    this.translations.clear();
    this.originalContents.clear();
  }
}

// Global translation state
const translationState = new PageTranslationState();

/**
 * Get translatable text nodes
 * @param {Element} rootElement - Root element to search
 * @returns {Node[]} Array of text nodes
 */
export function getTranslatableNodes(rootElement = document.body) {
  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script, style, and other non-visible elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'iframe', 'object'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        // Skip empty or whitespace-only nodes
        const text = node.textContent.trim();
        if (!text || text.length < 3) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node);
  }

  return nodes;
}

/**
 * Replace text node content with translation
 * @param {Node} node - Text node to replace
 * @param {string} translation - Translated text
 * @param {string} provider - Provider name
 */
export function replaceNodeContent(node, translation, provider) {
  const parent = node.parentElement;
  if (!parent) return;

  // Store original content
  translationState.storeOriginal(parent, node.textContent);

  // Replace content
  node.textContent = translation;

  // Store translation
  translationState.storeTranslation(parent, translation, provider);

  // Add visual indicator
  if (!parent.classList.contains('translated')) {
    parent.classList.add('translated');
    parent.dataset.translatedBy = provider;
  }
}

/**
 * Restore original content
 * @param {Element} rootElement - Root element to restore
 */
export function restoreOriginalContent(rootElement = document.body) {
  const translatedElements = rootElement.querySelectorAll('[data-translation-id]');

  translatedElements.forEach(element => {
    const original = translationState.getOriginal(element);
    if (original) {
      // Find text nodes and restore
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        node.textContent = original;
        break; // Only restore first text node
      }

      // Remove translation markers
      element.classList.remove('translated');
      delete element.dataset.translatedBy;
      delete element.dataset.translationId;
    }
  });

  translationState.clear();
}

/**
 * Create translation popup
 * @param {string} translation - Translated text
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {HTMLElement} Popup element
 */
export function createTranslationPopup(translation, x, y) {
  // Remove existing popup
  removeTranslationPopup();

  const popup = document.createElement('div');
  popup.id = 'multi-ai-translator-popup';
  popup.className = 'translation-popup';
  popup.textContent = translation;

  // Position popup
  popup.style.position = 'fixed';
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.zIndex = '2147483647';

  document.body.appendChild(popup);

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.className = 'popup-close';
  closeBtn.onclick = removeTranslationPopup;
  popup.appendChild(closeBtn);

  return popup;
}

/**
 * Remove translation popup
 */
export function removeTranslationPopup() {
  const popup = document.getElementById('multi-ai-translator-popup');
  if (popup) {
    popup.remove();
  }
}

/**
 * Highlight element
 * @param {Element} element - Element to highlight
 */
export function highlightElement(element) {
  element.classList.add('translation-highlight');
  setTimeout(() => {
    element.classList.remove('translation-highlight');
  }, 2000);
}

/**
 * Show loading indicator
 * @param {Element} element - Element to show indicator on
 */
export function showLoadingIndicator(element) {
  element.classList.add('translation-loading');
}

/**
 * Hide loading indicator
 * @param {Element} element - Element to hide indicator from
 */
export function hideLoadingIndicator(element) {
  element.classList.remove('translation-loading');
}

/**
 * Get selected text and position
 * @returns {object|null} {text, x, y} or null
 */
export function getSelection() {
  const selection = window.getSelection();
  const text = selection.toString().trim();

  if (!text) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    text,
    x: rect.left + rect.width / 2,
    y: rect.bottom + 10
  };
}

/**
 * Get translation state
 */
export function getTranslationState() {
  return translationState;
}

/**
 * Check if page is translated
 */
export function isPageTranslated() {
  return translationState.translations.size > 0;
}
