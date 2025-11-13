# Multi-AI Translator

[日本語版 README](README-ja.md)

A powerful browser extension that translates web pages using multiple AI providers.

**Multi-Browser Support**: Chrome, Edge, and Firefox

## Features

- 🌐 **Multiple AI Providers**: Choose from OpenAI, Claude, Gemini, Ollama, or OpenAI-compatible APIs
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
| OpenAI | GPT-4, GPT-3.5-turbo | ✅ Yes |
| Claude | Claude 3 (Opus, Sonnet, Haiku) | ✅ Yes |
| Gemini | Gemini Pro, Ultra | ✅ Yes |
| Ollama | Any local model | ❌ No (local) |
| OpenAI-compatible | LM Studio, LocalAI, etc. | Depends |

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
# or
npm install
```

3. Build the extension:
```bash
yarn run build
# or
npm run build
```

4. Load in browser:

   **Chrome/Edge:**
   - Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

   **Firefox:**
   - Navigate to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file in the `dist` folder

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

## Development

See [Development Guide](Documents/Development.md) for detailed information.

### Available Commands

All commands can be run with either `yarn run` or `npm run`:

```bash
# Install dependencies
yarn install

# Development mode (watch) - auto-rebuild on changes
yarn run dev

# Production build
yarn run build

# Clean dist directory and packages
yarn run clean

# Run ESLint
yarn run lint

# Format code with Prettier
yarn run format

# Run lint and build
yarn run check

# Create distribution packages (Chrome/Edge and Firefox)
yarn run package

# Full build pipeline (clean, lint, build, package)
yarn run dist
```

**Distribution Packages:**
- `multi-ai-translator-chrome.zip` - For Chrome and Edge
- `multi-ai-translator-firefox.zip` - For Firefox

## Tech Stack

- **Task Runner**: Gulp for streamlined development workflow
- **Build Tool**: Vite + CRXJS - Lightning-fast development and build
- **Cross-Browser**: webextension-polyfill for unified API across browsers
- **AI SDKs**: OpenAI, Anthropic (Claude), Google AI (Gemini), Ollama
- **Latest Packages**: All dependencies updated to latest major versions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by the Multi-AI Translator team