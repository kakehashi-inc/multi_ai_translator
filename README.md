# Multi-AI Translator

[日本語版 README](README-ja.md)

A powerful browser extension that translates web pages using multiple AI providers.

## Features

- 🌐 **Multiple AI Providers**: Choose from OpenAI, Claude, Gemini, Ollama, or OpenAI-compatible APIs
- 📄 **Page Translation**: Translate entire web pages with a single click
- ✨ **Selection Translation**: Translate selected text with popup display
- 🔄 **Restore Original**: Easily revert to original content
- 🎨 **Modern UI**: Clean and intuitive interface
- 🌍 **Multi-language**: UI available in English and Japanese
- ⚙️ **Highly Configurable**: Customize providers, models, and translation settings

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
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in browser:
   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

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

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Production build
npm run build

# Create package
npm run package
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by the Multi-AI Translator team