# Multi-AI Translator

[日本語版 README](README-ja.md)

A powerful browser extension that translates web pages using multiple AI providers.

**Multi-Browser Support**: Chrome, Edge, and Firefox

## Features

- 🌐 **Multiple AI Providers**: Choose from Gemini, Anthropic (Claude), Anthropic-compatible APIs, OpenAI, OpenAI-compatible APIs, or Ollama
- 🦊 **Multi-Browser Support**: Works seamlessly on Chrome, Edge, and Firefox
- 📄 **Page Translation**: Translate entire web pages with a single click
- ✨ **Selection Translation**: Translate selected text with popup display
- 🔄 **Restore Original**: Easily revert to original content
- 🎨 **Modern UI**: Clean and intuitive interface
- 🌍 **Multi-language**: UI available in English and Japanese
- ⚙️ **Highly Configurable**: Customize providers, models, and translation settings
- ⚡ **Fast Build**: Built with Vite for lightning-fast development

## Supported AI Providers

| Provider | Models | API Key Required |
|----------|--------|------------------|
| Gemini | Gemini Pro, Ultra | ✅ Yes |
| Anthropic (Claude) | Claude 3 (Opus, Sonnet, Haiku) | ✅ Yes |
| Anthropic-compatible | Compatible APIs | Depends |
| OpenAI | GPT-4, GPT-3.5-turbo | ✅ Yes |
| OpenAI-compatible | LM Studio, LocalAI, etc. | Depends |
| Ollama | Any local model | ❌ No (local) |

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
yarn build:chromium

# Firefox (Manifest V2 build, outputs to dist-firefox/)
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
   - Click "Settings"
   - Enable a provider and add your API key
   - Select a model

2. **Translate Page**:
   - Visit any webpage
   - Click the extension icon
   - Click "Translate Page"

3. **Translate Selection**:
   - Select text on any page
   - Right-click → "Translate selection"
   - Or use keyboard shortcut: `Ctrl+Shift+S`

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|--------------|-----|
| Translate Page | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| Translate Selection | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| Restore Original | `Ctrl+Shift+R` | `Cmd+Shift+R` |

## Configuration

### Gemini (Google)
- Get API key from [Google AI Studio](https://makersuite.google.com/)
- Recommended model: `gemini-pro`

### Anthropic (Claude)
- Get API key from [Anthropic Console](https://console.anthropic.com/)
- Recommended model: `claude-3-sonnet-20240229`

### Anthropic-compatible
- Works with Claude-compatible APIs (Bedrock, enterprise gateways, etc.)
- Configure the custom base URL and optional API key to match your deployment

### OpenAI
- Get API key from [OpenAI Platform](https://platform.openai.com/)
- Recommended model: `gpt-3.5-turbo` (fast and cost-effective)

### OpenAI-compatible
- Works with LM Studio, LocalAI, or any OpenAI-compatible API
- Configure base URL and model name

### Batch Settings (Common Tab)
- **Batch size (items per request)**: Number of text chunks combined into a single API call (default 20). Increase for fewer requests, decrease if providers return payload-size errors.
- **Batch size (max characters)**: Upper limit of total characters per request (default 100,000). The smaller of this limit or the item count triggers a new batch.

### Ollama (Local)
- Install [Ollama](https://ollama.ai/)
- Pull a model: `ollama pull llama2`
- Default host: `http://127.0.0.1:11434`

## Development

See [Development Guide](Documents/Development.md) for detailed information.

### Available Commands

All commands should be run with `yarn`:

```bash
# Install dependencies
yarn install

# Development mode (watch) - auto-rebuild on changes (Chromium build)
yarn dev

# Firefox development watch build
yarn dev:firefox

# Production build
yarn build        # Equivalent to yarn build:chromium
yarn build:firefox
yarn build:all    # Builds Chromium + Firefox outputs

# Clean dist directory and packages
yarn clean

# Run ESLint
yarn lint

# Format code with Prettier
yarn format

# Run lint and build
yarn check

# Create distribution packages (Chrome/Edge and Firefox)
yarn package

# Full build pipeline (clean, lint, build, package)
yarn dist
```

**Distribution Packages:**
- `multi-ai-translator-chrome.zip` - For Chrome and Edge
- `multi-ai-translator-firefox.zip` - For Firefox

## Project Structure

```
multi-ai-translator/
├── src/
│   ├── background/      # Background service worker
│   ├── content/         # Content scripts
│   ├── options/         # Options page
│   ├── popup/           # Popup UI
│   ├── providers/       # AI provider implementations
│   ├── utils/           # Utility functions
│   └── locales/         # Translations (English, Japanese)
├── icons/               # Extension icons
├── Documents/           # Documentation
└── dist/                # Build output
```

## Privacy

This extension:
- ✅ Does not collect any personal information
- ✅ Stores all settings locally in your browser
- ✅ Sends translation requests directly to your chosen AI provider
- ✅ Does not use any tracking or analytics
- ✅ Is completely open source

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Build tools: [Gulp](https://gulpjs.com/) + [Vite](https://vitejs.dev/) + [CRXJS](https://crxjs.dev/)
- Official SDKs: [OpenAI](https://github.com/openai/openai-node), [Anthropic](https://github.com/anthropics/anthropic-sdk-typescript), [Google Generative AI](https://github.com/google/generative-ai-js), [Ollama](https://github.com/ollama/ollama-js)

## Support

- 🐛 [Bug Reports](https://github.com/yourusername/multi-ai-translator/issues)
- 💡 [Feature Requests](https://github.com/yourusername/multi-ai-translator/issues)
- 📖 [Documentation](Documents/)
- ❓ [Questions](https://github.com/yourusername/multi-ai-translator/discussions)
