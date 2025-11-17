import { GoogleGenAI } from '@google/genai';
import { BaseProvider } from './base-provider.js';
import { ConstVariables } from '../utils/const-variables.js';

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
    if (this.client) {
      return;
    }

    if (!this.config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    try {
      this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
      this.modelName = this.config.model;
      this.generationConfig = {
        temperature: this.config.temperature ?? ConstVariables.DEFAULT_GEMINI_TEMPERATURE,
        maxOutputTokens:
          this.config.maxOutputTokens ?? ConstVariables.DEFAULT_GEMINI_MAX_OUTPUT_TOKENS
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
    if (!this.validateConfig()) {
      throw new Error('Invalid Gemini configuration');
    }

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

      const pager = await this.client.models.list({
        config: {
          pageSize: 100
        }
      });

      const models = [];
      for await (const model of pager) {
        const name = model?.name?.replace('models/', '');
        if (name && name.includes('gemini')) {
          models.push(name);
        }
      }

      return models;
    } catch (error) {
      console.warn('Failed to fetch models from Google Gen AI API', error);
      return [];
    }
  }
}
