import { BaseProvider } from './base-provider.js';

/**
 * Ollama Provider
 * Supports local Ollama models
 */
export class OllamaProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'ollama';
    this.client = null;
  }

  /**
   * Initialize Ollama client
   */
  async initialize() {
    if (!this.validateConfig()) {
      throw new Error('Invalid Ollama configuration');
    }

    try {
      // Dynamic import for Ollama
      const { Ollama } = await import('ollama/browser');

      this.client = new Ollama({
        host: this.config.host || 'http://127.0.0.1:11434'
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    return !!this.config.model;
  }

  /**
   * Translate text using Ollama
   */
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    await this.ensureInitialized();

    return await this.withErrorHandling(async () => {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const response = await this.client.generate({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature || 0.3
        }
      });

      return response.response.trim();
    });
  }

  /**
   * Get available models from local Ollama instance
   */
  async getModels() {
    try {
      await this.ensureInitialized();

      const response = await this.client.list();
      return response.models.map(model => model.name);
    } catch (error) {
      console.warn('Failed to fetch Ollama models. Is Ollama running?', error);
      return [];
    }
  }

  /**
   * Check if Ollama is running
   */
  async isAvailable() {
    try {
      await this.getModels();
      return true;
    } catch (error) {
      return false;
    }
  }
}
