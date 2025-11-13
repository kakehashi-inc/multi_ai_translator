# Deployment Guide

## Building for Production

1. Build the extension:
```bash
yarn build
```

This creates an optimized build in the `dist` directory.

2. Create distribution package:
```bash
yarn package
```

This creates `multi-ai-translator.zip` ready for upload.

## Chrome Web Store

### Prerequisites
- Google account
- $5 one-time developer registration fee
- Prepared assets (icons, screenshots, descriptions)

### Steps

1. **Register as Developer**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay registration fee ($5)
   - Accept terms

2. **Prepare Assets**

   Required icons:
   - 128x128 icon (required)
   - Screenshots: 1280x800 or 640x400 (at least 1, max 5)
   - Promotional images (optional):
     - Small: 440x280
     - Marquee: 1400x560

3. **Create New Item**
   - Click "New Item"
   - Upload `multi-ai-translator.zip`
   - Wait for automatic checks

4. **Fill Store Listing**

   Required fields:
   - **Name**: Multi-AI Translator
   - **Summary**: Translate web pages using multiple AI providers
   - **Description**: See template below
   - **Category**: Productivity
   - **Language**: English

   Description template:
   ```
   Multi-AI Translator is a powerful browser extension that allows you to translate
   web pages using multiple AI providers including OpenAI, Claude, Gemini, and Ollama.

   Key Features:
   • Support for multiple AI providers
   • Translate entire pages or selected text
   • Popup translation display
   • Restore original content
   • Customizable settings
   • Multi-language UI (English, Japanese)

   Supported Providers:
   • OpenAI (GPT-3.5, GPT-4)
   • Claude (Anthropic)
   • Gemini (Google)
   • Ollama (Local)
   • OpenAI-compatible APIs

   Privacy:
   This extension does not collect any personal data. All API keys are stored locally
   in your browser. Translation requests are sent directly to your chosen AI provider.
   ```

5. **Privacy Settings**
   - Add privacy policy (required if using network requests)
   - Explain data usage
   - Justify permissions

   Privacy policy template:
   ```
   Privacy Policy for Multi-AI Translator

   Data Collection:
   This extension does not collect, store, or transmit any personal information.

   API Keys:
   All API keys are stored locally in your browser using Chrome's storage API.
   Keys are never sent to our servers.

   Translation Data:
   Translation requests are sent directly to your chosen AI provider (OpenAI, Claude, etc.)
   We do not intercept or store translation content.

   Permissions:
   • storage: To save your settings locally
   • activeTab: To access page content for translation
   • <all_urls>: To translate any webpage
   ```

6. **Submit for Review**
   - Review all information
   - Click "Submit for Review"
   - Wait 1-3 days for approval

### After Approval

- Extension automatically goes live
- Monitor reviews and feedback
- Respond to user issues

## Microsoft Edge Add-ons

### Prerequisites
- Microsoft account
- No registration fee
- Prepared assets

### Steps

1. **Register**
   - Go to [Partner Center](https://partner.microsoft.com/dashboard)
   - Sign in with Microsoft account
   - Complete registration

2. **Submit Extension**
   - Click "New Extension"
   - Upload `multi-ai-translator.zip`
   - Fill required fields (similar to Chrome)

3. **Review Process**
   - Usually 1-7 days
   - More thorough than Chrome
   - May request changes

## Updating the Extension

1. **Update version** in `manifest.json`:
```json
{
  "version": "1.0.1"
}
```

2. **Build and package**:
```bash
yarn build
yarn package
```

3. **Upload new version**:
   - Chrome: Upload to existing item
   - Edge: Create new submission

4. **Add release notes**:
```
Version 1.0.1
- Fixed translation error handling
- Improved performance
- Updated dependencies
```

## Version Management

Follow semantic versioning:
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features
- **Patch** (0.0.1): Bug fixes

## Distribution Channels

### Official Stores
- ✅ Chrome Web Store (recommended)
- ✅ Edge Add-ons (recommended)
- 🚧 Firefox Add-ons (future)

### Alternative Distribution
- GitHub Releases
- Direct download from website
- Enterprise deployment

## Monitoring

### Metrics to Track
- Install count
- Active users
- Ratings and reviews
- Crash reports
- User feedback

### Tools
- Chrome Web Store Dashboard
- Edge Partner Center
- Google Analytics (if implemented)

## Support

Provide multiple support channels:
- GitHub Issues
- Email support
- Documentation wiki
- FAQ page

## Marketing

1. **Launch announcement**
   - Blog post
   - Social media
   - Product Hunt

2. **Documentation**
   - User guide
   - Video tutorials
   - FAQ

3. **Community**
   - Discord/Slack
   - Reddit posts
   - Forum participation

## Compliance

- GDPR compliance (if EU users)
- Privacy policy (required)
- Terms of service
- License (MIT recommended)

## Rollback Plan

If critical issues occur:

1. **Immediate**:
   - Remove extension from stores temporarily
   - Post status update

2. **Fix**:
   - Identify and fix issue
   - Test thoroughly
   - Fast-track review

3. **Recovery**:
   - Upload fixed version
   - Notify users
   - Post-mortem analysis
