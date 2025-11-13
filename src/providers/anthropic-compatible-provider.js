import { BaseProvider } from './base-provider.js';

/**
 * Anthropic-Compatible Provider
 * Supports any Anthropic API-compatible service
 */
export class AnthropicCompatibleProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'anthropic-compatible';
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
    if (!this.validateConfig()) {
      throw new Error('Invalid Anthropic-compatible configuration');
    }

    try {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const headers = {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        ...(this.config.apiKey && { 'x-api-key': this.config.apiKey }),
        ...(this.config.headers || {})
      };

      const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens || 2000,
          temperature: this.config.temperature || 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content[0].text.trim();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Get available models
   */
  async getModels() {
    if (!this.validateConfig()) {
      return [];
    }

    try {
      const headers = {
        'anthropic-version': '2023-06-01',
        ...(this.config.apiKey && { 'x-api-key': this.config.apiKey }),
        ...(this.config.headers || {})
      };

      const response = await fetch(`${this.config.baseUrl}/v1/models`, {
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map(model => model.id);
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
