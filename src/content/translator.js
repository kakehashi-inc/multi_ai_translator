/**
 * Translator Module
 * Core translation logic for content scripts
 */
import browser from 'webextension-polyfill';
import {
  getTranslatableNodes,
  replaceNodeContent,
  restoreOriginalContent,
  createTranslationPopup,
  removeTranslationPopup,
  getSelection,
  showLoadingIndicator,
  hideLoadingIndicator
} from '../utils/dom-manager.js';

/**
 * Translator class
 */
export class Translator {
  constructor() {
    this.isTranslating = false;
    this.settings = null;
  }

  /**
   * Initialize translator
   */
  async initialize() {
    this.settings = await this.getSettings();
  }

  /**
   * Get settings from background
   */
  async getSettings() {
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(
        { action: 'getSettings' },
        (response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Translate page
   */
  async translatePage(targetLanguage = null, providerName = null) {
    if (this.isTranslating) {
      console.warn('[Translator] Translation already in progress');
      return;
    }

    this.isTranslating = true;

    try {
      // Get settings if not loaded
      if (!this.settings) {
        await this.initialize();
      }

      const target = targetLanguage || this.settings.common.defaultTargetLanguage;
      const provider = providerName || this.settings.common.defaultProvider;

      console.log(`[Translator] Translating page to ${target} using ${provider}`);

      // Get translatable nodes
      const nodes = getTranslatableNodes();
      console.log(`[Translator] Found ${nodes.length} translatable nodes`);

      if (nodes.length === 0) {
        throw new Error('No translatable text found on this page.');
      }

      // Group nodes by parent element to reduce API calls
      const textGroups = this.groupNodesByParent(nodes);

      // Translate each group
      let translated = 0;
      for (const group of textGroups) {
        showLoadingIndicator(group.parent);

        try {
          const text = group.nodes.map(n => n.textContent).join(' ');

          const result = await this.translateText(text, target, 'auto', provider);

          if (!result?.success) {
            throw new Error(result?.error || 'Translation failed');
          }

          // Split translation back to nodes (simple approach)
          const translations = this.splitTranslation(result.translation, group.nodes.length);

          group.nodes.forEach((node, index) => {
            if (translations[index]) {
              replaceNodeContent(node, translations[index], provider);
            }
          });

          translated++;
        } catch (error) {
          console.error('[Translator] Error translating group:', error);
          throw error;
        } finally {
          hideLoadingIndicator(group.parent);
        }

        // Add small delay to avoid rate limiting
        await this.delay(100);
      }

      console.log(`[Translator] Translated ${translated}/${textGroups.length} groups`);
    } finally {
      this.isTranslating = false;
    }
  }

  /**
   * Translate selection
   */
  async translateSelection(text = null, showPopup = true, targetLanguage = null, providerName = null) {
    try {
      // Get settings if not loaded
      if (!this.settings) {
        await this.initialize();
      }

      let textToTranslate = text;
      let position = null;

      // If no text provided, get selection
      if (!textToTranslate) {
        const selection = getSelection();
        if (!selection) {
          console.warn('[Translator] No text selected');
          return;
        }
        textToTranslate = selection.text;
        position = { x: selection.x, y: selection.y };
      }

      const target = targetLanguage || this.settings.common.defaultTargetLanguage;
      const provider = providerName || this.settings.common.defaultProvider;

      console.log(`[Translator] Translating selection to ${target} using ${provider}`);

      const result = await this.translateText(textToTranslate, target, 'auto', provider);

      if (result.success) {
        if (showPopup && position) {
          createTranslationPopup(result.translation, position.x, position.y);
        }
        return result.translation;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[Translator] Error translating selection:', error);
      throw error;
    }
  }

  /**
   * Restore original content
   */
  restoreOriginal() {
    console.log('[Translator] Restoring original content');
    restoreOriginalContent();
    removeTranslationPopup();
  }

  /**
   * Translate text via background script
   */
  async translateText(text, targetLanguage, sourceLanguage, providerName) {
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(
        {
          action: 'translate',
          data: {
            text,
            targetLanguage,
            sourceLanguage,
            providerName
          }
        },
        (response) => {
          if (browser.runtime.lastError) {
            reject(browser.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * Group nodes by parent element
   */
  groupNodesByParent(nodes) {
    const groups = new Map();

    nodes.forEach(node => {
      const parent = node.parentElement;
      if (!groups.has(parent)) {
        groups.set(parent, []);
      }
      groups.get(parent).push(node);
    });

    return Array.from(groups.entries()).map(([parent, nodes]) => ({
      parent,
      nodes
    }));
  }

  /**
   * Split translation back to match node count
   */
  splitTranslation(translation, nodeCount) {
    if (nodeCount === 1) {
      return [translation];
    }

    // Simple split by sentences
    const sentences = translation.match(/[^.!?]+[.!?]+/g) || [translation];

    if (sentences.length >= nodeCount) {
      return sentences.slice(0, nodeCount);
    }

    // If fewer sentences, pad with empty strings
    return [...sentences, ...Array(nodeCount - sentences.length).fill('')];
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
