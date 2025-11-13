# GitHub Copilot Instructions

## Context Gathering Strategy

### Goal
Get enough context fast. Parallelize discovery and stop as soon as you can act.

### Method
- **Start broad, then fan out**: Begin with high-level searches, then drill down to specific areas
- **Parallel queries**: Launch varied queries simultaneously; read top hits per query
- **Deduplicate and cache**: Avoid repeating the same queries
- **Avoid over-searching**: If you need more context, run targeted searches in one parallel batch

### Early Stop Criteria
Stop gathering context when:
- You can name the exact content to change
- Top hits converge (~70%) on one area/path

### Escalation
- If signals conflict or scope is fuzzy, run one refined parallel batch, then proceed
- Trace only symbols you'll modify or whose contracts you rely on
- Avoid transitive expansion unless necessary

### Loop Pattern
```
Batch search → minimal plan → complete task
```
Search again only if validation fails or new unknowns appear. **Prefer acting over more searching.**

## Agent Behavior

### Persistence
- You are an agent - keep going until the user's query is completely resolved
- Only terminate when you are sure the problem is solved
- Never stop or hand back when encountering uncertainty
- Research or deduce the most reasonable approach and continue
- Do not ask to confirm or clarify assumptions - proceed with the most reasonable assumption and document it

### Self-Reflection
Before implementing:
1. Think deeply about what makes a world-class solution
2. Create an internal rubric with 5-7 categories
3. Iterate internally until your solution hits top marks across all categories
4. Do not show this rubric to the user - it's for your evaluation only

## Code Quality Guidelines

### Guiding Principles

1. **Readability**
   - Avoid environment-dependent characters, emojis, or non-standard strings in code and comments
   - Write clear, self-documenting code
   - Use meaningful variable and function names

2. **Maintainability**
   - Follow proper directory structure
   - Maintain consistent naming conventions
   - Organize shared logic appropriately
   - Keep functions small and focused

3. **Consistency**
   - UI must adhere to a consistent design system
   - Unified color tokens, typography, spacing, and components
   - Follow established patterns in the codebase

4. **Visual Quality**
   - Follow OSS guidelines for visual quality
   - Pay attention to spacing, padding, hover states
   - Ensure responsive design where applicable

## Project-Specific Context

**Multi-AI Translator** is a cross-browser extension (Chrome, Edge, Firefox) that translates web pages using multiple AI providers.

### Technology Stack
- Runtime: Node.js 22+
- Package Manager: yarn 4 (yarn only, do not use npm)
- Module System: ES Modules
- Build Tool: Vite
- Target: Browser Extension (Manifest V3)
- Languages: JavaScript (ES2022)

### Key Constraints
1. **No eval()**: CSP restrictions
2. **ES Modules only**: All imports must use `.js` extension
3. **No inline scripts**: Manifest V3 requirement
4. **Browser compatibility**: Chrome, Edge, Firefox
5. **API keys**: All keys stored client-side

### Architecture Patterns
- **Provider Pattern**: All AI providers extend `BaseProvider`
- **Message Passing**: Chrome extension messaging API
- **Storage**: Chrome Storage API for settings

### Code Style
- ESLint with recommended rules
- Prettier for formatting
- 2-space indentation
- Single quotes for strings
- Semicolons required

## Common Tasks

### Adding a New Provider
1. Create `src/providers/your-provider.js` extending `BaseProvider`
2. Register in `src/providers/index.js`
3. Add UI in `src/options/options.html`
4. Add default config in `src/utils/storage.js`

### Adding Translations
1. Add to `src/locales/en/messages.json`
2. Add to `src/locales/ja/messages.json`
3. Use with `data-i18n` attribute or `getMessage()`

### Development Workflow
1. Make changes in `src/`
2. Run `yarn dev` (watch mode)
3. Load unpacked extension in browser
4. Test changes
5. Run `yarn lint` and `yarn format` before committing

## Documentation
- `AGENTS.md`: Comprehensive agent development guide
- `Documents/Development.md`: Development guide
- `Documents/Deployment.md`: Deployment guide
- `README.md`: User documentation

## Important Notes

- Always check existing patterns before implementing new features
- Test in actual browser environment
- Update relevant documentation when making changes
- Verify all imports use correct paths with `.js` extensions
- Never log or expose API keys
- Follow the persistence principle - complete tasks fully before yielding
