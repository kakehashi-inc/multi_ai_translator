# AGENTS.md

## AI Agent Development Information

This document provides comprehensive guidance for AI coding agents (like Claude Code, GitHub Copilot, Cursor, etc.) working on this project.

## Agent Behavior Principles

### Persistence
**You are an agent - keep going until the task is complete.**
- Continue until the user's query is completely resolved before yielding back
- Only terminate when you are sure the problem is solved
- Never stop or hand back when encountering uncertainty
- Research or deduce the most reasonable approach and continue
- Do not ask to confirm or clarify assumptions - proceed with the most reasonable assumption and document it for user reference after acting

### Context Gathering Strategy

**Goal**: Get enough context fast. Parallelize discovery and stop as soon as you can act.

**Method**:
- Start broad, then fan out to focused subqueries
- In parallel, launch varied queries; read top hits per query
- Deduplicate paths and cache; don't repeat queries
- Avoid over-searching for context - if needed, run targeted searches in one parallel batch

**Early Stop Criteria**:
- You can name exact content to change
- Top hits converge (~70%) on one area/path

**Escalation**:
- If signals conflict or scope is fuzzy, run one refined parallel batch, then proceed
- Trace only symbols you'll modify or whose contracts you rely on
- Avoid transitive expansion unless necessary

**Loop Pattern**: Batch search → minimal plan → complete task
- Search again only if validation fails or new unknowns appear
- **Prefer acting over more searching**

### Self-Reflection Process
Before implementing solutions:
1. Think deeply about what makes a world-class solution for the specific task
2. Create an internal rubric with 5-7 categories to evaluate quality
3. Iterate internally until your solution hits top marks across all categories
4. Do not show this rubric to the user - it's for your internal evaluation only

## Code Quality Guidelines

### Guiding Principles

1. **Readability**
   - For programming language code including comments, avoid using environment-dependent characters, emojis, or other non-standard character strings
   - Write clear, self-documenting code
   - Use meaningful variable and function names

2. **Maintainability**
   - Follow proper directory structure
   - Maintain consistent naming conventions
   - Organize shared logic appropriately
   - Keep functions small and focused

3. **Consistency**
   - The user interface must adhere to a consistent design system
   - Color tokens, typography, spacing, and components must be unified
   - Follow established patterns in the codebase

4. **Visual Quality**
   - Follow high visual quality bar as outlined in OSS guidelines
   - Pay attention to spacing, padding, hover states, etc.
   - Ensure responsive design where applicable

## Project Overview

**Multi-AI Translator** is a cross-browser extension (Chrome, Edge, Firefox) that translates web pages using multiple AI providers.

**Multi-AI Translator** is a browser extension that enables translation of web pages using multiple AI providers (OpenAI, Claude, Gemini, Ollama, and OpenAI-compatible APIs).

## Technology Stack

- **Runtime**: Node.js 22+
- **Package Manager**: yarn 4 (yarn only, do not use npm)
- **Module System**: ES Modules
- **Build Tool**: Vite
- **Target**: Browser Extension (Manifest V3)
- **Languages**: JavaScript (ES2022)

## Architecture

### Core Components

1. **Background Service Worker** (`src/background/service-worker.js`)
   - Manifest V3 service worker
   - Handles extension lifecycle
   - Manages context menus and keyboard commands
   - Routes messages between components

2. **Content Scripts** (`src/content/`)
   - Injected into web pages
   - Handles DOM manipulation
   - Translates page content
   - Displays translation popups

3. **Popup UI** (`src/popup/`)
   - Extension popup interface
   - Quick translation controls
   - Provider and language selection

4. **Options Page** (`src/options/`)
   - Full settings interface
   - Provider configuration
   - API key management

5. **Providers** (`src/providers/`)
   - Abstract base class pattern
   - Individual provider implementations
   - API integration logic

6. **Utilities** (`src/utils/`)
   - `i18n.js`: Internationalization
   - `storage.js`: Settings management
   - `dom-manager.js`: DOM manipulation helpers

## Development Commands

```bash
yarn install         # Install dependencies
yarn dev             # Development mode with watch
yarn build           # Production build
yarn package         # Create distribution ZIP
yarn lint            # Check code style
yarn format          # Format code
```

## Key Design Patterns

### Provider Pattern

All AI providers extend `BaseProvider` and implement:

- `validateConfig()`: Check configuration validity
- `translate()`: Perform translation
- `getModels()`: Fetch available models

### Message Passing

Uses Chrome extension messaging API:

```javascript
chrome.runtime.sendMessage({ action: 'translate', data: {...} })
```

### Storage

Settings stored using Chrome Storage API:

```javascript
chrome.storage.local.get/set({ settings: {...} })
```

## Common Tasks

### Adding a New Provider

1. Create `src/providers/your-provider.js`:

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

<!-- markdownlint-disable MD029 -->
2. Register in `src/providers/index.js`
3. Add UI in `src/options/options.html`
4. Add default config in `src/utils/storage.js`
<!-- markdownlint-enable MD029 -->

### Adding a Translation

1. Add to `src/locales/en/messages.json`
2. Add to `src/locales/ja/messages.json`
3. Use with `data-i18n` attribute or `getMessage()`

### Modifying UI

- HTML files include inline data-i18n attributes
- CSS uses BEM-like naming
- JavaScript uses vanilla JS (no framework)

## Important Constraints

1. **No eval()**: CSP restrictions
2. **ES Modules only**: Configured in package.json
3. **No inline scripts**: Manifest V3 requirement
4. **Browser compatibility**: Chrome, Edge, and Firefox
5. **API keys in browser**: All keys stored client-side

## Testing Workflow

1. Make changes in `src/`
2. Run `yarn dev` (watch mode)
3. Load unpacked extension in browser
4. Test changes
5. Reload extension if needed

## File Watching

Vite watch mode monitors:

- All `src/**/*.js` files
- All `src/**/*.css` files
- HTML files

## Debugging

- **Background**: Chrome → Extensions → Service Worker
- **Content Scripts**: F12 on web page
- **Popup**: Right-click popup → Inspect
- **Options**: Right-click options → Inspect

## Code Style

- ESLint with recommended rules
- Prettier for formatting
- 2-space indentation
- Single quotes for strings
- Semicolons required

## Security Considerations

1. **API Keys**: Never log or expose API keys
2. **XSS**: Sanitize all user input
3. **CSP**: Follow strict CSP policies
4. **Permissions**: Request minimal permissions

## Performance Tips

1. Batch DOM operations
2. Debounce translation requests
3. Cache translations when possible
4. Use async/await for API calls
5. Split large texts into chunks

## Common Pitfalls

1. **Module imports**: Use `.js` extension in imports
2. **Chrome API**: Must check for chrome.runtime.lastError
3. **Service Worker**: Can be terminated anytime (stateless)
4. **Content Scripts**: Isolated world (separate context)
5. **Manifest V3**: No background.html, use service worker

## Documentation

- `Documents/Development.md`: Development guide
- `Documents/Deployment.md`: Deployment guide
- `README.md`: User documentation
- `README-ja.md`: Japanese documentation

## Version Management

Follow semantic versioning in `manifest.json`:

```json
{
  "version": "MAJOR.MINOR.PATCH"
}
```

## Build Output

The `dist/` directory contains:

- Transpiled JavaScript
- Copied HTML/CSS
- Manifest
- Icons
- Locales (as `_locales/`)

## Extension Points

Easy areas to extend:

1. Add new provider → Implement BaseProvider
2. Add UI language → Add to `src/locales/`
3. Add keyboard shortcut → Update manifest commands
4. Add context menu → Update service-worker.js

## Known Limitations

1. API keys stored unencrypted (browser storage limitation)
2. Large pages may be slow to translate
3. Dynamic content not re-translated automatically
4. Some websites block content script injection

## Future Considerations

- Translation caching
- Offline support
- Firefox/Safari ports
- Translation history
- Custom prompts
- Batch translation

---

**For AI Agents**: When making changes, always:

1. Check existing patterns and follow them
2. Test in actual browser environment
3. Update relevant documentation
4. Run lint/format before committing
5. Verify all imports use correct paths
6. Ensure ES module syntax throughout
