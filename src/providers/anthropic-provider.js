import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './base-provider.js';
import { ConstVariables } from '../utils/const-variables.js';

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
    if (this.client) {
      return;
    }

    if (!this.config.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    try {
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
    if (!this.validateConfig()) {
      throw new Error('Invalid Anthropic configuration');
    }

    await this.ensureInitialized();

    return await this.withErrorHandling(async () => {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens ?? ConstVariables.DEFAULT_ANTHROPIC_MAX_TOKENS,
        temperature: this.config.temperature ?? ConstVariables.DEFAULT_ANTHROPIC_TEMPERATURE,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return response.content[0].text.trim();
    });
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      await this.ensureInitialized();

      const response = await this.client.models.list();
      return response.data.map((model) => model.id);
    } catch (error) {
      console.warn('Failed to fetch models from Anthropic API', error);
      return [];
    }
  }
}
