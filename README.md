# Multi-AI Translator

[日本語版 README](README-ja.md)

A powerful browser extension that translates web pages using multiple AI providers.

**Multi-Browser Support**: Chrome, Edge, and Firefox

## Features

- 🌐 **Multiple AI Providers**: Choose from Gemini, Anthropic (Claude), Anthropic-compatible APIs, OpenAI, OpenAI-compatible APIs, or Ollama
- 🦊 **Multi-Browser Support**: Works on Chrome, Edge, and Firefox
- 📄 **Page Translation**: Translate entire web pages with one click
- ✨ **Selection Translation**: Translate highlighted text whenever you need it
- 🔄 **Restore Original**: Easily switch back to the original page content
- 🌍 **Multi-language**: Interface available in English and Japanese

## Supported AI Providers

| Provider | Notes | API Key |
|----------|-------|---------|
| Gemini | Google AI Studio / Generative Language API endpoints | ✅ Required |
| Anthropic (Claude) | Claude API and compatible gateways | ✅ Required |
| Anthropic-compatible | Custom Claude-compatible APIs (e.g., AWS Bedrock) | Depends |
| OpenAI | Official OpenAI API | ✅ Required |
| OpenAI-compatible | Any OpenAI-compatible REST endpoint (LM Studio, LocalAI, etc.) | Depends |
| Ollama | Local models served via Ollama | ❌ Local only |

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/yourusername/multi-ai-translator.git
cd multi-ai-translator
```

2. Install dependencies:
```bash
yarn install
```

3. Build the extension:
```bash
# Chrome / Edge (outputs to dist/)
yarn build:chrome

# Firefox (outputs to dist-firefox/)
yarn build:firefox
```

4. Load in browser:

   **Chrome/Edge:**
   - Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

   **Firefox (after `yarn build:firefox`):**
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file in the `dist-firefox` folder

## Quick Start

1. **Configure Provider**:
   - Click the extension icon
   - Open **Settings**
   - Enable a provider, add your API key, and pick a model

2. **Translate Page**:
   - Open any webpage
   - Click the extension icon
   - Choose **Translate Page**

3. **Translate Selection**:
   - Highlight any text on the page
   - Open the extension popup
   - Click **Translate Selection** to see the translated text inside the popup

## Development

Build and release instructions are collected in [Documents/Development.md](Documents/Development.md).

## Privacy

This extension:

- ✅ Does not collect personal information
- ✅ Stores all settings locally in your browser
- ✅ Sends translation requests only to the provider you selected
- ✅ Does not use tracking or analytics
- ✅ Is fully open source

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
