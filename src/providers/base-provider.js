import { createTranslationPrompt, splitIntoChunks as splitText } from '../utils/text-utils.js';

/**
 * Base Provider Class
 * All AI providers must extend this class
 */
export class BaseProvider {
  constructor(config) {
    this.config = config;
    this.name = 'base';
    this.client = null;
  }

  /**
   * Ensure client is initialized before use
   * Common pattern used by all providers
   * @protected
   */
  async ensureInitialized() {
    if (!this.client) {
      await this.initialize();
    }
  }

  /**
   * Execute operation with error handling
   * Common pattern used by all providers
   * @protected
   * @param {Function} operation - Async operation to execute
   * @returns {Promise<any>} Result of operation
   */
  async withErrorHandling(operation) {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Initialize the provider client
   * Must be implemented by subclass
   * @abstract
   */
  async initialize() {
    throw new Error('initialize must be implemented by subclass');
  }

  /**
   * Validate provider configuration
   * Must be implemented by subclass
   * @abstract
   * @returns {boolean} Whether the configuration is valid
   */
  validateConfig() {
    throw new Error('validateConfig must be implemented by subclass');
  }

  /**
   * Translate text using the AI provider
   * Must be implemented by subclass
   * @abstract
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @param {string} sourceLanguage - Source language (optional)
   * @returns {Promise<string>} Translated text
   */
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    throw new Error('translate must be implemented by subclass');
  }

  /**
   * Get available models for this provider
   * Must be implemented by subclass
   * @abstract
   * @returns {Promise<string[]>} List of model names
   */
  async getModels() {
    throw new Error('getModels must be implemented by subclass');
  }

  /**
   * Create translation prompt
   * Delegates to utility function for reusability
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @param {string} sourceLanguage - Source language
   * @returns {string} Formatted prompt
   */
  createPrompt(text, targetLanguage, sourceLanguage) {
    return createTranslationPrompt(text, targetLanguage, sourceLanguage);
  }

  /**
   * Handle API errors
   * @param {Error} error - The error object
   * @throws {Error} Formatted error with helpful message
   */
  handleError(error) {
    console.error(`[${this.name}] Error:`, error);

    if (error.message.includes('API key')) {
      throw new Error(`Invalid API key for ${this.name}`);
    }
    if (error.message.includes('rate limit')) {
      throw new Error(`Rate limit exceeded for ${this.name}`);
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error(`Network error when connecting to ${this.name}`);
    }

    throw new Error(`Translation failed: ${error.message}`);
  }

  /**
   * Split long text into chunks
   * Delegates to utility function for reusability
   * @param {string} text - Text to split
   * @param {number} maxLength - Maximum length per chunk
   * @returns {string[]} Array of text chunks
   */
  splitIntoChunks(text, maxLength = 2000) {
    return splitText(text, maxLength);
  }
}
