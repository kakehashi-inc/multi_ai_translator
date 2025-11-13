import { BaseProvider } from './base-provider.js';

/**
 * Anthropic Provider
 * Supports Claude 3 and 4 models via Anthropic API
 */
export class AnthropicProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'anthropic';
    this.client = null;
  }

  /**
   * Initialize Anthropic client
   */
  async initialize() {
    if (!this.validateConfig()) {
      throw new Error('Invalid Anthropic configuration');
    }

    try {
      // Dynamic import for Anthropic
      const Anthropic = (await import('@anthropic-ai/sdk')).default;

      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        baseURL: this.config.baseURL,
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
    return !!(this.config.apiKey && this.config.model);
  }

  /**
   * Translate text using Anthropic API
   */
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    if (!this.client) {
      await this.initialize();
    }

    try {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const response = await this.client.messages.create({
        model: this.config.model || 'claude-3-sonnet-20240229',
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
   * Get available models
   */
  async getModels() {
    try {
      if (!this.client) {
        await this.initialize();
      }

      const response = await this.client.models.list();
      return response.data.map(model => model.id);
    } catch (error) {
      console.warn('Failed to fetch models from Anthropic API', error);
      return [];
    }
  }
}
