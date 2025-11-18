/**
 * DOM Manager
 * Manages DOM manipulation for translation display
 */

import { ConstVariables } from './const-variables';

type TranslationRecord = {
  text: string;
  provider: string;
  timestamp: number;
};

type StatusType = 'info' | 'success' | 'error';

export type SelectionPosition = {
  text: string;
  x: number;
  y: number;
};

class PageTranslationState {
  private readonly translations = new Map<string, TranslationRecord>();
  private readonly originalContents = new Map<string, string>();

  storeOriginal(element: HTMLElement, content: string | null): void {
    const id = this.getElementId(element);
    this.originalContents.set(id, content ?? '');
  }

  storeTranslation(element: HTMLElement, translation: string, provider: string): void {
    const id = this.getElementId(element);
    this.translations.set(id, {
      text: translation,
      provider,
      timestamp: Date.now()
    });
  }

  getOriginal(element: Element): string | undefined {
    const id = this.getElementId(element as HTMLElement);
    return this.originalContents.get(id);
  }

  getElementId(element: HTMLElement): string {
    if (!element.dataset.translationId) {
      element.dataset.translationId = `trans_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 11)}`;
    }
    return element.dataset.translationId;
  }

  clear(): void {
    this.translations.clear();
    this.originalContents.clear();
  }

  getTranslationCount(): number {
    return this.translations.size;
  }
}

const translationState = new PageTranslationState();
let statusOverlay: HTMLDivElement | null = null;
let statusHideTimeout: number | null = null;

export function getTranslatableNodes(
  rootElement: Element | Document = document.body ?? document
): Text[] {
  const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Node): number => {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      const tagName = parent.tagName.toLowerCase();
      if (['script', 'style', 'noscript', 'iframe', 'object', 'code'].includes(tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      const text = (node.textContent || '').trim();
      if (!text || text.length < 3) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes: Text[] = [];
  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) {
    nodes.push(currentNode as Text);
  }

  return nodes;
}

export function replaceNodeContent(node: Text, translation: string, provider: string): void {
  const parent = node.parentElement;
  if (!parent || parent.closest('code, pre, kbd, samp')) {
    return;
  }

  const element = parent as HTMLElement;
  translationState.storeOriginal(element, node.textContent);
  node.textContent = translation;
  translationState.storeTranslation(element, translation, provider);

  if (!element.classList.contains('translated')) {
    element.classList.add('translated');
    element.dataset.translatedBy = provider;
  }
}

export function restoreOriginalContent(
  rootElement: Element | Document = document.body ?? document
): void {
  const translatedElements = rootElement.querySelectorAll<HTMLElement>('[data-translation-id]');

  translatedElements.forEach((element) => {
    const original = translationState.getOriginal(element);
    if (!original) {
      return;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const node = walker.nextNode() as Text | null;
    if (node) {
      node.textContent = original;
    }

    element.classList.remove('translated');
    delete element.dataset.translatedBy;
    delete element.dataset.translationId;
  });

  translationState.clear();
}

export function createTranslationPopup(translation: string, x: number, y: number): HTMLDivElement {
  removeTranslationPopup();

  const popup = document.createElement('div');
  popup.id = 'multi-ai-translator-popup';
  popup.className = 'translation-popup';
  popup.textContent = translation;

  popup.style.position = 'fixed';
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.zIndex = '2147483647';

  document.body.appendChild(popup);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.className = 'popup-close';
  closeBtn.onclick = removeTranslationPopup;
  popup.appendChild(closeBtn);

  return popup;
}

export function removeTranslationPopup(): void {
  const popup = document.getElementById('multi-ai-translator-popup');
  popup?.remove();
}

export function highlightElement(element: HTMLElement): void {
  element.classList.add('translation-highlight');
  window.setTimeout(() => {
    element.classList.remove('translation-highlight');
  }, ConstVariables.HIGHLIGHT_DURATION_MS);
}

export function showLoadingIndicator(element: Element): void {
  element.classList.add('translation-loading');
}

export function hideLoadingIndicator(element: Element): void {
  element.classList.remove('translation-loading');
}

export function clearAllLoadingIndicators(): void {
  const loadingElements = document.querySelectorAll<HTMLElement>('.translation-loading');
  loadingElements.forEach((el) => el.classList.remove('translation-loading'));
}

export function updateTranslationStatus(message: string, type: StatusType = 'info'): void {
  if (!statusOverlay) {
    statusOverlay = document.createElement('div');
    statusOverlay.id = 'multi-ai-translation-status';
    Object.assign(statusOverlay.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      zIndex: '2147483647',
      maxWidth: '320px',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4'
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(statusOverlay);
  }

  if (statusHideTimeout) {
    clearTimeout(statusHideTimeout);
    statusHideTimeout = null;
  }

  const colors: Record<StatusType, { bg: string; text: string }> = {
    info: { bg: '#1e40af', text: '#fff' },
    success: { bg: '#15803d', text: '#fff' },
    error: { bg: '#b91c1c', text: '#fff' }
  };

  const palette = colors[type];
  statusOverlay.style.background = palette.bg;
  statusOverlay.style.color = palette.text;
  statusOverlay.textContent = message;
}

export function clearTranslationStatus(delay = 0): void {
  if (!statusOverlay) {
    return;
  }

  if (statusHideTimeout) {
    clearTimeout(statusHideTimeout);
    statusHideTimeout = null;
  }

  if (delay > 0) {
    statusHideTimeout = window.setTimeout(() => {
      statusOverlay?.remove();
      statusOverlay = null;
      statusHideTimeout = null;
    }, delay);
  } else {
    statusOverlay.remove();
    statusOverlay = null;
  }
}

export function getSelection(): SelectionPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const text = selection.toString().trim();
  if (!text) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    text,
    x: rect.left + rect.width / 2,
    y: rect.bottom + 10
  };
}

export function getTranslationState(): PageTranslationState {
  return translationState;
}

export function isPageTranslated(): boolean {
  return translationState.getTranslationCount() > 0;
}

export function hasTranslationPopup(): boolean {
  return !!document.getElementById('multi-ai-translator-popup');
}
