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
let selectionOverlay: {
  container: HTMLDivElement;
  status: HTMLDivElement;
  result: HTMLPreElement;
  error: HTMLDivElement;
} | null = null;
const selectionOverlayStyleId = 'multi-ai-selection-overlay-style';

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

type SelectionOverlayMeta = {
  original: string;
  provider: string;
  targetLanguage: string;
  sourceLanguage: string;
  title: string;
  labels: {
    source: string;
    target: string;
    provider: string;
    original: string;
    result: string;
  };
  statusPreparing: string;
};

function ensureSelectionOverlayStyles(): void {
  if (document.getElementById(selectionOverlayStyleId)) {
    return;
  }
  const style = document.createElement('style');
  style.id = selectionOverlayStyleId;
  style.textContent = `
    #multi-ai-selection-overlay {
      position: fixed;
      right: 16px;
      bottom: 16px;
      width: 360px;
      max-height: calc(100vh - 32px);
      background: #ffffff;
      color: #1a202c;
      border-radius: 12px;
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 2147483647;
    }
    #multi-ai-selection-overlay.dark {
      background: #1f2933;
      color: #f7fafc;
    }
    #multi-ai-selection-overlay header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(226, 232, 240, 1);
    }
    #multi-ai-selection-overlay.dark header {
      border-bottom-color: rgba(74, 85, 104, 0.6);
    }
    #multi-ai-selection-overlay .overlay-body {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    #multi-ai-selection-overlay .meta {
      font-size: 13px;
      display: grid;
      grid-template-columns: 80px 1fr;
      row-gap: 4px;
    }
    #multi-ai-selection-overlay .meta-label {
      font-weight: 600;
      color: #4a5568;
    }
    #multi-ai-selection-overlay.dark .meta-label {
      color: #cbd5f5;
    }
    #multi-ai-selection-overlay h3 {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #4a5568;
    }
    #multi-ai-selection-overlay.dark h3 {
      color: #cbd5f5;
    }
    #multi-ai-selection-overlay pre {
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 15px;
      line-height: 1.6;
      background: rgba(226, 232, 240, 0.5);
      border-radius: 8px;
      padding: 10px;
      margin: 0;
      color: inherit;
    }
    #multi-ai-selection-overlay.dark pre {
      background: rgba(45, 55, 72, 0.8);
    }
    #multi-ai-selection-overlay .status,
    #multi-ai-selection-overlay .error {
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 13px;
    }
    #multi-ai-selection-overlay .status {
      background: #ebf4ff;
      color: #1e429f;
      border: 1px solid #c3dafe;
    }
    #multi-ai-selection-overlay.dark .status {
      background: rgba(79, 209, 197, 0.15);
      color: #bee3f8;
      border-color: rgba(79, 209, 197, 0.3);
    }
    #multi-ai-selection-overlay .error {
      background: #fed7d7;
      color: #742a2a;
      border: 1px solid #feb2b2;
    }
    #multi-ai-selection-overlay.dark .error {
      background: rgba(252, 129, 129, 0.2);
      color: #fed7d7;
      border-color: rgba(252, 129, 129, 0.4);
    }
    #multi-ai-selection-overlay button.close-btn {
      border: none;
      background: transparent;
      color: inherit;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
    }
  `;
  document.head.appendChild(style);
}

export function showSelectionOverlay(meta: SelectionOverlayMeta, onClose: () => void): void {
  ensureSelectionOverlayStyles();

  if (selectionOverlay) {
    selectionOverlay.container.remove();
    selectionOverlay = null;
  }

  const container = document.createElement('div');
  container.id = 'multi-ai-selection-overlay';
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    container.classList.add('dark');
  }

  const header = document.createElement('header');
  const title = document.createElement('span');
  title.textContent = meta.title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.onclick = () => {
    hideSelectionOverlay();
    onClose();
  };
  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'overlay-body';

  const metaSection = document.createElement('div');
  metaSection.className = 'meta';

  const metaEntries: Array<[string, string]> = [
    [meta.labels.source, meta.sourceLanguage || 'auto'],
    [meta.labels.target, meta.targetLanguage || ''],
    [meta.labels.provider, ConstVariables.formatProviderName(meta.provider)]
  ];

  metaEntries.forEach(([label, value]) => {
    const labelEl = document.createElement('span');
    labelEl.className = 'meta-label';
    labelEl.textContent = label;
    const valueEl = document.createElement('span');
    valueEl.textContent = value;
    metaSection.appendChild(labelEl);
    metaSection.appendChild(valueEl);
  });

  const originalHeading = document.createElement('h3');
  originalHeading.textContent = meta.labels.original;
  const originalPre = document.createElement('pre');
  originalPre.textContent = meta.original;

  const status = document.createElement('div');
  status.className = 'status';
  status.textContent = meta.statusPreparing;

  const error = document.createElement('div');
  error.className = 'error';
  error.hidden = true;

  const resultHeading = document.createElement('h3');
  resultHeading.textContent = meta.labels.result;
  const resultPre = document.createElement('pre');
  resultPre.textContent = '';
  const resultContainer = document.createElement('div');
  resultContainer.appendChild(resultHeading);
  resultContainer.appendChild(resultPre);
  resultContainer.hidden = true;

  body.appendChild(metaSection);
  body.appendChild(originalHeading);
  body.appendChild(originalPre);
  body.appendChild(status);
  body.appendChild(error);
  body.appendChild(resultContainer);

  container.appendChild(header);
  container.appendChild(body);
  document.body.appendChild(container);

  selectionOverlay = {
    container,
    status,
    result: resultPre,
    error
  };
}

export function updateSelectionOverlayStatus(message: string): void {
  if (!selectionOverlay) return;
  selectionOverlay.status.textContent = message;
  selectionOverlay.status.hidden = false;
  selectionOverlay.error.hidden = true;
  selectionOverlay.result.parentElement!.hidden = true;
}

export function showSelectionOverlayResult(text: string): void {
  if (!selectionOverlay) return;
  selectionOverlay.result.textContent = text;
  selectionOverlay.status.hidden = true;
  selectionOverlay.error.hidden = true;
  selectionOverlay.result.parentElement!.hidden = false;
}

export function showSelectionOverlayError(message: string): void {
  if (!selectionOverlay) return;
  selectionOverlay.error.textContent = message;
  selectionOverlay.error.hidden = false;
  selectionOverlay.status.hidden = true;
  selectionOverlay.result.parentElement!.hidden = true;
}

export function hideSelectionOverlay(): void {
  selectionOverlay?.container.remove();
  selectionOverlay = null;
}

export function getTranslationState(): PageTranslationState {
  return translationState;
}

export function isPageTranslated(): boolean {
  return translationState.getTranslationCount() > 0;
}
