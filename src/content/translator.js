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
import { getMessage } from '../utils/i18n.js';

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
  async translatePage(targetLanguage = null, providerName = null, sourceLanguage = null) {
    if (this.isTranslating) {
      console.warn('[Translator] Translation already in progress');
      return;
    }

    this.isTranslating = true;

    updateTranslationStatus(getMessage('statusScanning'));
    try {
      // Get settings if not loaded
      if (!this.settings) {
        await this.initialize();
      }

      const target = targetLanguage || this.settings.common.defaultTargetLanguage;
      const provider = providerName || this.settings.common.defaultProvider;
      const source = sourceLanguage || this.settings.common.defaultSourceLanguage || 'auto';

      console.log(`[Translator] Translating page from ${source} to ${target} using ${provider}`);

      // Get translatable nodes
      const nodes = getTranslatableNodes();
      console.log(`[Translator] Found ${nodes.length} translatable nodes`);

      if (nodes.length === 0) {
        throw new Error(getMessage('errorNoTranslatableText'));
      }

      // Group nodes by parent element to reduce API calls
      const textGroups = this.groupNodesByParent(nodes);
      const totalGroups = textGroups.length;
      updateTranslationStatus(getMessage('statusFoundBlocks', [totalGroups.toString()]));

      const maxChars = Number(this.settings.common.batchMaxChars) || DEFAULT_BATCH_MAX_CHARS;
      const maxItems = Number(this.settings.common.batchMaxItems) || DEFAULT_BATCH_MAX_ITEMS;

      // Estimate total batches based on groups and batch size
      // This is an approximation since batches are created dynamically
      // Calculate average characters per group to better estimate batches
      const avgCharsPerGroup =
        nodes.reduce((sum, node) => sum + node.textContent.length, 0) / totalGroups;
      const itemsPerBatch = Math.min(
        maxItems,
        Math.floor(maxChars / Math.max(avgCharsPerGroup, 1))
      );
      const estimatedTotalBatches = Math.max(1, Math.ceil(totalGroups / itemsPerBatch));

      let translated = 0;
      const errors = [];
      let batchIndexCounter = 0;
      let batchNumber = 0;
      let maxBatchNumber = estimatedTotalBatches;

      // Process batches one at a time and free memory immediately after each batch
      const processBatch = async (batchTexts, batchRefs, batchEntries) => {
        batchNumber++;
        // Update max batch number if we exceed the estimate
        maxBatchNumber = Math.max(maxBatchNumber, batchNumber);
        try {
          // Update progress with current batch number and total (estimated or actual)
          updateTranslationStatus(
            getMessage('statusTranslating', [batchNumber.toString(), maxBatchNumber.toString()])
          );

          const requestPayload = PromptBuilder.buildRequestPayload(batchTexts);
          const result = await this.translateText(requestPayload, target, source, provider);

          if (!result?.success) {
            throw new Error(result?.error || getMessage('errorTranslationFailed'));
          }

          let translations = PromptBuilder.parseResponsePayload(result.translation, batchTexts);

          if (!translations.length) {
            console.warn('[Translator] Failed to parse structured response, using fallback');
            translations = this.splitTranslation(result.translation, batchTexts.length);
          }

          // Apply translations immediately as they are parsed
          let batchTranslated = 0;
          batchRefs.forEach((ref, idx) => {
            const translatedText = translations[idx];
            if (translatedText && translatedText.trim() && translatedText !== ref.original) {
              replaceNodeContent(ref.node, translatedText, provider);
              ref.entry.completed = (ref.entry.completed || 0) + 1;
            } else if (!translatedText || !translatedText.trim()) {
              console.warn(`[Translator] Empty translation for item ${idx}, keeping original`);
              ref.entry.completed = (ref.entry.completed || 0) + 1;
            } else {
              ref.entry.completed = (ref.entry.completed || 0) + 1;
            }

            if (ref.entry.completed === ref.entry.textCount) {
              batchTranslated++;
              translated++;
              hideLoadingIndicator(ref.entry.group.parent);
            }
          });

          // Free memory: clear processed data references
          // Note: DOM nodes are kept as they are needed for display
          // Only clear the temporary batch data structures
          return batchTranslated;
        } catch (error) {
          console.error('[Translator] Error translating batch:', error);
          batchEntries.forEach((entry) => {
            hideLoadingIndicator(entry.group.parent);
            errors.push(`Block ${entry.index}: ${error.message}`);
          });
          return 0;
        }
      };

      // Build and process batches incrementally
      let currentBatch = {
        texts: [],
        refs: [],
        entries: [],
        charCount: 0
      };

      for (const group of textGroups) {
        batchIndexCounter++;
        showLoadingIndicator(group.parent);

        const entry = {
          group,
          index: batchIndexCounter,
          textCount: group.nodes.length,
          completed: 0
        };

        // Collect nodes for this group
        const groupTexts = [];
        const groupRefs = [];
        group.nodes.forEach((node) => {
          const original = node.textContent;
          groupTexts.push(original);
          groupRefs.push({
            entry,
            node,
            original
          });
        });

        // Add to current batch
        currentBatch.texts.push(...groupTexts);
        currentBatch.refs.push(...groupRefs);
        currentBatch.entries.push(entry);
        currentBatch.charCount += groupTexts.reduce((sum, text) => sum + text.length, 0);

        // Process batch when limits are reached
        if (currentBatch.texts.length >= maxItems || currentBatch.charCount >= maxChars) {
          const batchTexts = currentBatch.texts;
          const batchRefs = currentBatch.refs;
          const batchEntries = currentBatch.entries;

          await processBatch(batchTexts, batchRefs, batchEntries);

          // Free memory: clear batch data immediately after processing
          currentBatch.texts = [];
          currentBatch.refs = [];
          currentBatch.entries = [];
          currentBatch.charCount = 0;

          await this.delay(BATCH_THROTTLE_DELAY_MS);
        }
      }

      // Process remaining batch
      if (currentBatch.texts.length > 0) {
        const batchTexts = currentBatch.texts;
        const batchRefs = currentBatch.refs;
        const batchEntries = currentBatch.entries;

        await processBatch(batchTexts, batchRefs, batchEntries);

        // Free memory: clear batch data
        currentBatch.texts = null;
        currentBatch.refs = null;
        currentBatch.entries = null;
        currentBatch = null;
      }

      // Free memory: clear textGroups reference after processing
      // Note: DOM nodes remain in the document, only our references are cleared
      const finalTranslated = translated;
      const finalErrors = errors.length;
      const totalBatches = batchNumber;

      console.log(
        `[Translator] Processed ${totalBatches} batches, translated ${finalTranslated}/${totalGroups} groups`
      );

      if (finalErrors > 0) {
        updateTranslationStatus(
          getMessage('statusCompletedWithErrors', [
            totalBatches.toString(),
            finalErrors.toString()
          ]),
          finalTranslated > 0 ? 'info' : 'error'
        );
        errors.forEach((message) => console.error('[Translator] Block error:', message));
      } else {
        updateTranslationStatus(
          getMessage('statusCompleted', [totalBatches.toString()]),
          'success'
        );
      }

      // Clear errors array to free memory
      errors.length = 0;
    } finally {
      this.isTranslating = false;
      clearTranslationStatus(STATUS_CLEAR_DELAY_MS);
    }
  }

  /**
   * Translate selection
   */
  async translateSelection(
    text = null,
    showPopup = true,
    targetLanguage = null,
    providerName = null,
    sourceLanguage = null
  ) {
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
      const source = sourceLanguage || this.settings.common.defaultSourceLanguage || 'auto';

      console.log(
        `[Translator] Translating selection from ${source} to ${target} using ${provider}`
      );

      const requestPayload = PromptBuilder.buildRequestPayload([textToTranslate]);
      const result = await this.translateText(requestPayload, target, source, provider);

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

    nodes.forEach((node) => {
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
