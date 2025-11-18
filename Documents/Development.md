# Development Guide

## Prerequisites

- Node.js 22+
- Yarn 4
- Chrome / Edge / Firefox

## Setup

```bash
git clone https://github.com/yourusername/multi-ai-translator.git
cd multi-ai-translator
yarn install
```

## Common Scripts

| Command | Purpose |
| --- | --- |
| `yarn dev` | Watch build for Chrome (outputs to `dist/`) |
| `yarn build:chrome` | Production build for Chrome / Edge |
| `yarn build:firefox` | Firefox (MV2) build → `dist-firefox/` |
| `yarn lint` / `yarn format` | Run ESLint / Prettier |
| `yarn clean` | Remove `dist/`, `dist-firefox/`, `packages/` |

## Loading the Extension

### Chrome / Edge
1. Run `yarn dev` (watch) or `yarn build:chrome`
2. Open `chrome://extensions/` or `edge://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select `dist/`
5. After changes, wait for Vite to rebuild and click the refresh icon on the extension card

### Firefox
1. Run `yarn build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** and pick `dist-firefox/manifest.json`
4. Rebuild and press **Reload** after each change
5. Use the **Inspect** button to view background logs

> Need a persistent install?
> - **Developer Edition / Nightly**: set `xpinstall.signatures.required = false` in `about:config` to load unsigned builds.
> - **AMO “Unlisted” signing**: upload the `dist-firefox/` package to the [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/), download the signed XPI, and install it via `about:addons`.
> - **Enterprise policy**: organizations can disable signature requirements through managed policies, though this is uncommon outside corporate environments.

## Testing Changes

1. Edit the source
2. Wait for the watcher/build to finish
3. Reload the extension in the browser
4. Exercise popup, options, and translation flows

## Project Structure

```
multi-ai-translator/
├── src/
│   ├── background/         # Service worker
│   ├── content/            # Content scripts
│   ├── options/            # Options page
│   ├── popup/              # Popup UI
│   ├── providers/          # AI providers
│   ├── utils/              # Shared utilities
│   └── locales/            # i18n resources
├── icons/                  # Extension icons
├── scripts/                # Packaging scripts
├── Documents/              # Documentation
├── dist/                   # Chrome build output
└── dist-firefox/           # Firefox build output
```

## Adding a Provider

1. Create `src/providers/your-provider.ts`
```ts
import { BaseProvider } from './base-provider';

export class YourProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'your-provider';
  }

  validateConfig() {
    return !!this.config.apiKey;
  }

  async translate(text: string, targetLanguage: string, sourceLanguage = 'auto') {
    // Implementation
  }

  async getModels() {
    // Implementation
  }
}
```
2. Register it in `src/providers/index.ts`
3. Add UI + logic in `src/options/options.html` / `options.ts`
4. Provide defaults in `src/utils/storage.ts`

## Debugging

### Background
- Chrome/Edge: `chrome://extensions/` → extension card → **Service Worker**
- Firefox: `about:debugging` → **Inspect**

### Content Scripts
- Open any page, press F12, check the Console tab

### Popup / Options
- Right-click the UI → **Inspect**
