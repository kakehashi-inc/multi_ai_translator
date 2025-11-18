/**
 * Provider Factory
 * Creates and manages AI provider instances
 */
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { GeminiProvider } from './gemini-provider';
import { OllamaProvider } from './ollama-provider';
import { OpenAICompatibleProvider } from './openai-compatible-provider';
import { AnthropicCompatibleProvider } from './anthropic-compatible-provider';
import { ConstVariables } from '../utils/const-variables';
import type { ProviderSettings } from '../types/settings';
import type { BaseProvider } from './base-provider';

type ProviderConstructor = new (config: ProviderSettings) => BaseProvider;

export const PROVIDERS: Record<string, ProviderConstructor> = {
  gemini: GeminiProvider,
  anthropic: AnthropicProvider,
  'anthropic-compatible': AnthropicCompatibleProvider,
  openai: OpenAIProvider,
  'openai-compatible': OpenAICompatibleProvider,
  ollama: OllamaProvider
};

export function createProvider(providerName: string, config?: ProviderSettings): BaseProvider {
  const ProviderClass = PROVIDERS[providerName];

  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerName}`);
  }

  return new ProviderClass(config || { enabled: false });
}

export function getAvailableProviders(): string[] {
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
