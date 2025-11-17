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
  hideLoadingIndicator,
  updateTranslationStatus,
  clearTranslationStatus
} from '../utils/dom-manager.js';
import { PromptBuilder } from '../utils/prompt-builder.js';
import { ConstVariables } from '../utils/const-variables.js';

const {
  DEFAULT_BATCH_MAX_CHARS,
  DEFAULT_BATCH_MAX_ITEMS,
  STATUS_CLEAR_DELAY_MS,
  BATCH_THROTTLE_DELAY_MS
} = ConstVariables;

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
    return browser.runtime.sendMessage({ action: 'getSettings' });
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

    updateTranslationStatus('Scanning page for translatable text…');
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
      updateTranslationStatus(`Found ${textGroups.length} text blocks to translate…`);

      const maxChars = Number(this.settings.common.batchMaxChars) || DEFAULT_BATCH_MAX_CHARS;
      const maxItems = Number(this.settings.common.batchMaxItems) || DEFAULT_BATCH_MAX_ITEMS;
      const totalGroups = textGroups.length;
      let translated = 0;
      const errors = [];
      let batchIndexCounter = 0;

      const createBatch = () => ({
        entries: [],
        refs: [],
        texts: [],
        charCount: 0
      });

      let currentBatch = createBatch();

      const flushBatch = async () => {
        if (!currentBatch.texts.length) {
          return;
        }

        try {
          const sourceLanguage = 'auto';
          const requestPayload = PromptBuilder.buildRequestPayload(currentBatch.texts);
          const result = await this.translateText(requestPayload, target, sourceLanguage, provider);

          if (!result?.success) {
            throw new Error(result?.error || 'Translation failed');
          }

          let translations = PromptBuilder.parseResponsePayload(
            result.translation,
            currentBatch.texts
          );

          if (!translations.length) {
            translations = this.splitTranslation(result.translation, currentBatch.texts.length);
          }

          currentBatch.refs.forEach((ref, idx) => {
            const translatedText = translations[idx] ?? ref.original;
            if (translatedText) {
              replaceNodeContent(ref.node, translatedText, provider);
            }
            ref.entry.completed = (ref.entry.completed || 0) + 1;
            if (ref.entry.completed === ref.entry.textCount) {
              translated++;
              hideLoadingIndicator(ref.entry.group.parent);
              updateTranslationStatus(`Translated ${translated}/${totalGroups} blocks`);
            }
          });
        } catch (error) {
          console.error('[Translator] Error translating batch:', error);
          currentBatch.entries.forEach(entry => {
            hideLoadingIndicator(entry.group.parent);
            errors.push(`Block ${entry.index}: ${error.message}`);
          });
        } finally {
          currentBatch = createBatch();
          await this.delay(BATCH_THROTTLE_DELAY_MS);
        }
      };

      for (const group of textGroups) {
        batchIndexCounter++;
        updateTranslationStatus(`Queuing block ${batchIndexCounter}/${totalGroups}…`);
        showLoadingIndicator(group.parent);

        const entry = {
          group,
          index: batchIndexCounter,
          textCount: group.nodes.length,
          completed: 0
        };
        currentBatch.entries.push(entry);

        group.nodes.forEach((node) => {
          const original = node.textContent;
          currentBatch.texts.push(original);
          currentBatch.refs.push({
            entry,
            node,
            original
          });
          currentBatch.charCount += original.length;
        });

        if (currentBatch.texts.length >= maxItems || currentBatch.charCount >= maxChars) {
          await flushBatch();
        }
      }

      if (currentBatch.texts.length > 0) {
        await flushBatch();
      }

      console.log(`[Translator] Translated ${translated}/${textGroups.length} groups`);

      if (errors.length > 0) {
        updateTranslationStatus(
          `Translated ${translated}/${totalGroups} blocks. ${errors.length} blocks failed.`,
          translated > 0 ? 'info' : 'error'
        );
        errors.forEach(message => console.error('[Translator] Block error:', message));
      } else {
        updateTranslationStatus(`Translation completed: ${translated}/${totalGroups} blocks translated.`, 'success');
      }
    } finally {
      this.isTranslating = false;
      clearTranslationStatus(STATUS_CLEAR_DELAY_MS);
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

      const requestPayload = PromptBuilder.buildRequestPayload([textToTranslate]);
      const result = await this.translateText(requestPayload, target, 'auto', provider);

      if (!result.success) {
        throw new Error(result.error);
      }

      let translations = PromptBuilder.parseResponsePayload(result.translation, [textToTranslate]);
      if (!translations.length) {
        translations = [result.translation];
      }

      const translated = translations[0] ?? textToTranslate;

      if (showPopup && position) {
        createTranslationPopup(translated, position.x, position.y);
      }
      return translated;
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
    return browser.runtime.sendMessage({
      action: 'translate',
      data: {
        text,
        targetLanguage,
        sourceLanguage,
        providerName
      }
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
