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
      // Dynamic import for Google Gen AI SDK
      const { GoogleGenAI } = await import('@google/genai');

      this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
      this.modelName = this.config.model;
      this.generationConfig = {
        temperature: this.config.temperature || 0.3,
        maxOutputTokens: this.config.maxOutputTokens || 2000
      };
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
    await this.ensureInitialized();

    return await this.withErrorHandling(async () => {
      const prompt = this.createPrompt(text, targetLanguage, sourceLanguage);

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        generationConfig: this.generationConfig
      });

      return response.text.trim();
    });
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      await this.ensureInitialized();

      const response = await this.client.models.list();
      return response.models
        .filter(model => model.name.includes('gemini'))
        .map(model => model.name.replace('models/', ''));
    } catch (error) {
      console.warn('Failed to fetch models from Google Gen AI API', error);
      return [];
    }
  }
}
