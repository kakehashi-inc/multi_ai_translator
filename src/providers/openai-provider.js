import { BaseProvider } from './base-provider.js';

/**
 * OpenAI Provider
 * Supports GPT-4, GPT-3.5-turbo, etc.
 */
export class OpenAIProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'openai';
    this.client = null;
  }

  /**
   * Initialize OpenAI client
   */
  async initialize() {
    if (!this.validateConfig()) {
      throw new Error('Invalid OpenAI configuration');
    }

    try {
      // Dynamic import for OpenAI
      const { OpenAI } = await import('openai');

      this.client = new OpenAI({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
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
    return !!(this.config.apiKey && this.config.model);
  }

  /**
   * Translate text using OpenAI
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
   * Get available models
   */
  async getModels() {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const response = await this.client.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      console.warn('Failed to fetch models from OpenAI API', error);
      return [];
    }
  }
}
