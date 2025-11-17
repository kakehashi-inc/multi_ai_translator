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
import { ConstVariables } from '../utils/const-variables.js';

export const PROVIDERS = {
  gemini: GeminiProvider,
  anthropic: AnthropicProvider,
  'anthropic-compatible': AnthropicCompatibleProvider,
  openai: OpenAIProvider,
  'openai-compatible': OpenAICompatibleProvider,
  ollama: OllamaProvider
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
  return [...ConstVariables.PROVIDER_ORDER];
}

export {
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  OllamaProvider,
  OpenAICompatibleProvider,
  AnthropicCompatibleProvider
};
