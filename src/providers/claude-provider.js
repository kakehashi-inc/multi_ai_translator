import { BaseProvider } from './base-provider.js';

/**
 * Claude Provider (Anthropic)
 * Supports Claude 3 family
 */
export class ClaudeProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'claude';
    this.client = null;
  }

  /**
   * Initialize Claude client
   */
  async initialize() {
    if (!this.validateConfig()) {
      throw new Error('Invalid Claude configuration');
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
   * Translate text using Claude
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
    // Claude doesn't have a models list API, return known models
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0'
    ];
  }
}
