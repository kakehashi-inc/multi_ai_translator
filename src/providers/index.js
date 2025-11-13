/**
 * Provider Factory
 * Creates and manages AI provider instances
 */
import { OpenAIProvider } from './openai-provider.js';
import { AnthropicProvider } from './anthropic-provider.js';
import { GeminiProvider } from './gemini-provider.js';
import { OllamaProvider } from './ollama-provider.js';
import { OpenAICompatibleProvider } from './openai-compatible-provider.js';
import { AnthropicCompatibleProvider } from './anthropic-compatible-provider.js';

export const PROVIDERS = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider,
  ollama: OllamaProvider,
  'openai-compatible': OpenAICompatibleProvider,
  'anthropic-compatible': AnthropicCompatibleProvider
};

/**
 * Create a provider instance
 * @param {string} providerName - Name of the provider
 * @param {object} config - Provider configuration
 * @returns {BaseProvider} Provider instance
 */
export function createProvider(providerName, config) {
  const ProviderClass = PROVIDERS[providerName];

  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerName}`);
  }

  return new ProviderClass(config);
}

/**
 * Get list of available providers
 * @returns {string[]} Array of provider names
 */
export function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

export {
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  OllamaProvider,
  OpenAICompatibleProvider,
  AnthropicCompatibleProvider
};
