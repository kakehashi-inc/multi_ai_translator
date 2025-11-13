import { BaseProvider } from './base-provider.js';

/**
 * Anthropic-Compatible Provider
 * Supports any Anthropic API-compatible service
 * Uses official Anthropic SDK with custom baseURL
 */
export class AnthropicCompatibleProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'anthropic-compatible';
    this.client = null;
  }

  /**
   * Initialize Anthropic client with custom baseURL
   */
  async initialize() {
    if (!this.validateConfig()) {
      throw new Error('Invalid Anthropic-compatible configuration');
    }

    try {
      // Dynamic import for Anthropic SDK
      const Anthropic = (await import('@anthropic-ai/sdk')).default;

      this.client = new Anthropic({
        apiKey: this.config.apiKey || 'dummy-key', // Some compatible services may not require API key
        baseURL: this.config.baseUrl,
        dangerouslyAllowBrowser: true
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
   * Translate text using Anthropic-compatible API
   */
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens || 2000,
        temperature: this.config.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text.trim();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get available models using official Anthropic SDK
   */
  async getModels() {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const response = await this.client.models.list();
      return response.data.map(model => model.id);
    } catch (error) {
      console.warn('Failed to fetch models from Anthropic-compatible endpoint', error);
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
