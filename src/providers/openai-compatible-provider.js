import { BaseProvider } from './base-provider.js';

/**
 * OpenAI-Compatible Provider
 * Supports any OpenAI API-compatible service (LM Studio, LocalAI, etc.)
 */
export class OpenAICompatibleProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'openai-compatible';
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
    if (!this.validateConfig()) {
      throw new Error('Invalid OpenAI-compatible configuration');
    }

    try {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const headers = {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        ...(this.config.headers || {})
      };

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
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
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        ...(this.config.headers || {})
      };

      const response = await fetch(`${this.config.baseUrl}/models`, {
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map(model => model.id);
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
