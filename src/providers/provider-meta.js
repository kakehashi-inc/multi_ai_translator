export const PROVIDER_ORDER = [
  'gemini',
  'anthropic',
  'anthropic-compatible',
  'openai',
  'openai-compatible',
  'ollama'
];

export const PROVIDER_LABELS = {
  gemini: 'Gemini',
  anthropic: 'Anthropic (Claude)',
  'anthropic-compatible': 'Anthropic Compatible',
  openai: 'OpenAI',
  'openai-compatible': 'OpenAI Compatible',
  ollama: 'Ollama'
};

export function formatProviderName(name) {
  return PROVIDER_LABELS[name] || name;
}
