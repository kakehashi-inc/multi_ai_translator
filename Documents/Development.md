# Development Guide

## Prerequisites

- Node.js 22 or higher
- yarn 4
- Chrome or Edge browser

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/multi-ai-translator.git
cd multi-ai-translator
```

2. Install dependencies:
```bash
yarn install
```

## Development Workflow

### Build for Development

Watch mode with automatic rebuild:
```bash
yarn dev
```

This will:
- Build the extension in development mode
- Watch for file changes
- Automatically rebuild on changes

### Load Extension in Browser

#### Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

#### Edge
1. Open `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

### Testing Changes

1. Make changes to source files
2. Wait for Vite to rebuild (watch mode)
3. Click reload icon in browser extensions page
4. Test your changes

## Project Structure

```
multi-ai-translator/
├── src/
│   ├── background/         # Background service worker
│   ├── content/           # Content scripts
│   ├── options/           # Options page
│   ├── popup/             # Popup UI
│   ├── providers/         # AI provider implementations
│   ├── utils/             # Utility functions
│   └── locales/           # Translations
├── icons/                 # Extension icons
├── scripts/               # Build scripts
├── Documents/             # Documentation
└── dist/                  # Build output
```

## Adding a New Provider

1. Create provider class in `src/providers/your-provider.js`:
```javascript
import { BaseProvider } from './base-provider.js';

export class YourProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'your-provider';
  }

  validateConfig() {
    return !!(this.config.apiKey);
  }

  async translate(text, targetLanguage, sourceLanguage) {
    // Implementation
  }

  async getModels() {
    // Implementation
  }
}
```

2. Register in `src/providers/index.js`
3. Add UI in `src/options/options.html`
4. Add default config in `src/utils/storage.js`

## Debugging

### Background Service Worker
- Open `chrome://extensions/`
- Find Multi-AI Translator
- Click "Service Worker" link
- DevTools will open

### Content Scripts
- Open any web page
- Press F12 for DevTools
- Check Console tab for logs
- Content script errors appear here

### Popup/Options
- Right-click popup or options page
- Select "Inspect"

## Code Style

We use ESLint and Prettier:

```bash
# Check code style
yarn lint

# Format code
yarn format
```

## Common Issues

### Extension not loading
- Check manifest.json syntax
- Check build configuration in vite.config.js
- Check browser console for errors

### API calls failing
- Verify CORS settings
- Check API key configuration
- Review background service worker console

### Translation not working
- Check provider configuration
- Verify API key is valid
- Check network tab in DevTools

## Performance Tips

1. **Chunk large texts**: Split into smaller pieces
2. **Cache translations**: Avoid duplicate API calls
3. **Rate limiting**: Add delays between requests
4. **Minimize DOM operations**: Batch updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Resources

- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
