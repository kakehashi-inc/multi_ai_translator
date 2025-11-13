import { BaseProvider } from './base-provider.js';

/**
 * OpenAI-Compatible Provider
 * Supports any OpenAI API-compatible service (LM Studio, LocalAI, etc.)
 * Uses official OpenAI SDK with custom baseURL
 */
export class OpenAICompatibleProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'openai-compatible';
    this.client = null;
  }

  /**
   * Initialize OpenAI client with custom baseURL
   */
  async initialize() {
    if (!this.validateConfig()) {
      throw new Error('Invalid OpenAI-compatible configuration');
    }

    try {
      // Dynamic import for OpenAI SDK
      const { OpenAI } = await import('openai');

      this.client = new OpenAI({
        apiKey: this.config.apiKey || 'dummy-key', // Some compatible services don't require API key
        baseURL: this.config.baseUrl,
        dangerouslyAllowBrowser: true // Required for browser extension
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    return !!(this.config.baseUrl && this.config.model);
  }

  /**
   * Translate text using OpenAI-compatible API
   */
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Provide only the translation without any explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature || 0.3,
        max_tokens: this.config.maxTokens || 2000
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get available models using official OpenAI SDK
   */
  async getModels() {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const response = await this.client.models.list();
      return response.data.map(model => model.id);
    } catch (error) {
      console.warn('Failed to fetch models from OpenAI-compatible endpoint', error);
      return [];
    }
  }

  /**
   * Test connection to the API
   */
  async testConnection() {
    try {
      await this.getModels();
      return true;
    } catch (error) {
      return false;
    }
  }
}
