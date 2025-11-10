/**
 * Base Provider Class
 * All AI providers must extend this class
 */
export class BaseProvider {
  constructor(config) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * Validate provider configuration
   * @returns {boolean} Whether the configuration is valid
   */
  validateConfig() {
    throw new Error('validateConfig must be implemented by subclass');
  }

  /**
   * Translate text using the AI provider
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
   * @returns {Promise<string[]>} List of model names
   */
  async getModels() {
    throw new Error('getModels must be implemented by subclass');
  }

  /**
   * Create translation prompt
   * @param {string} text - Text to translate
   * @param {string} targetLanguage - Target language
   * @param {string} sourceLanguage - Source language
   * @returns {string} Formatted prompt
   */
  createPrompt(text, targetLanguage, sourceLanguage) {
    const sourceLangText = sourceLanguage === 'auto'
      ? 'the detected language'
      : sourceLanguage;

    return `Translate the following text from ${sourceLangText} to ${targetLanguage}.
Only provide the translation without any explanations or additional text.

Text to translate:
${text}

Translation:`;
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
   * @param {string} text - Text to split
   * @param {number} maxLength - Maximum length per chunk
   * @returns {string[]} Array of text chunks
   */
  splitIntoChunks(text, maxLength = 2000) {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks = [];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          // Single sentence is too long, force split
          chunks.push(sentence.substring(0, maxLength));
          currentChunk = sentence.substring(maxLength);
        }
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
