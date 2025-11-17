import { Ollama } from 'ollama/browser';
import { BaseProvider } from './base-provider.js';
import { ConstVariables } from '../utils/const-variables.js';

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
    if (this.client) {
      return;
    }

    try {
      this.client = new Ollama({
        host: this.config.host || ConstVariables.DEFAULT_OLLAMA_HOST
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
    if (!this.validateConfig()) {
      throw new Error('Invalid Ollama configuration');
    }

    await this.ensureInitialized();

    return await this.withErrorHandling(async () => {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const response = await this.client.generate({
        model: this.config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: this.config.temperature ?? ConstVariables.DEFAULT_OLLAMA_TEMPERATURE
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
      console.warn('Ollama provider availability check failed', error);
      return false;
    }
  }
}
