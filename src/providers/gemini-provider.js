import { BaseProvider } from './base-provider.js';

/**
 * Gemini Provider (Google)
 * Supports Gemini Pro and other models
 */
export class GeminiProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'gemini';
    this.client = null;
    this.model = null;
  }

  /**
   * Initialize Gemini client
   */
  async initialize() {
    if (!this.validateConfig()) {
      throw new Error('Invalid Gemini configuration');
    }

    try {
      // Dynamic import for Google Generative AI
      const { GoogleGenerativeAI } = await import('@google/generative-ai');

      this.client = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.client.getGenerativeModel({
        model: this.config.model || 'gemini-pro',
        generationConfig: {
          temperature: this.config.temperature || 0.3,
          maxOutputTokens: this.config.maxOutputTokens || 2000
        }
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
   * Translate text using Gemini
   */
  async translate(text, targetLanguage, sourceLanguage = 'auto') {
    if (!this.model) {
      await this.initialize();
    }

    try {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      return response.text().trim();
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

      const models = await this.client.listModels();
      return models
        .filter(model => model.name.includes('gemini'))
        .map(model => model.name.replace('models/', ''));
    } catch (error) {
      console.warn('Failed to fetch models, using defaults', error);
      return [
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-ultra'
      ];
    }
  }
}
