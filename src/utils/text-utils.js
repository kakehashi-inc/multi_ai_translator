/**
 * Text Utilities
 * Common text processing functions used across the application
 */

/**
 * Create translation prompt
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language
 * @param {string} sourceLanguage - Source language
 * @returns {string} Formatted prompt
 */
export function createTranslationPrompt(text, targetLanguage, sourceLanguage) {
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
 * Split long text into chunks
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length per chunk
 * @returns {string[]} Array of text chunks
 */
export function splitIntoChunks(text, maxLength = 2000) {
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

/**
 * Normalize whitespace in text
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Detect if text is too long for translation
 * @param {string} text - Text to check
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} Whether text exceeds maximum length
 */
export function isTooLong(text, maxLength = 10000) {
  return text.length > maxLength;
}
