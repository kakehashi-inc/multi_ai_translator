function escapeXml(text = '') {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(text = '') {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeForMatch(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

export class PromptBuilder {
  static buildPrompt(requestPayload, targetLanguage, sourceLanguage) {
    const sourceLangText =
      sourceLanguage === 'auto' ? 'the detected source language' : sourceLanguage;

    return `You are a precise translation engine.
Instructions:
- Task: Translate each <item> in the XML request from ${sourceLangText} to ${targetLanguage}.
- Format: Respond ONLY with XML and nothing else (no explanations, no comments, no extra text).
- Mapping: For every <item> in <request>, return one <item> in <response> where <original> is the original text and <translated> is the translated text.
- Preservation: Keep all HTML tags, attributes, whitespace, and line breaks exactly as in the original.
- Code: Do not translate programming code, API calls, configuration samples, stack traces, or other technical snippets. Copy these parts exactly.

Response schema:

<response>
<item>
<original>...</original>
<translated>...</translated>
</item>
</response>

Request:
${requestPayload}`;
  }

  static buildRequestPayload(texts = []) {
    const items = texts.map((text) => `<item>${escapeXml(text)}</item>`).join('\n');
    return `<request>\n${items}\n</request>`;
  }

  static parseResponsePayload(response, originals = []) {
    try {
      if (!response?.includes('<item')) {
        return [];
      }

      const normalizedMap = new Map();
      originals.forEach((text, index) => {
        const key = normalizeForMatch(text);
        if (!normalizedMap.has(key)) {
          normalizedMap.set(key, []);
        }
        normalizedMap.get(key).push(index);
      });

      const translations = new Array(originals.length).fill('');
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;

      while ((match = itemRegex.exec(response)) !== null) {
        const block = match[1];
        const originalMatch = block.match(/<original>([\s\S]*?)<\/original>/i);
        const translatedMatch = block.match(/<translated>([\s\S]*?)<\/translated>/i);
        if (!originalMatch || !translatedMatch) continue;

        const originalText = unescapeXml(originalMatch[1]?.trim() ?? '');
        const translatedText = unescapeXml(translatedMatch[1]?.trim() ?? '');
        if (!originalText) continue;

        const key = normalizeForMatch(originalText);
        const targets = normalizedMap.get(key);
        if (!targets || !targets.length) continue;

        const targetIndex = targets.shift();
        if (targetIndex !== undefined && translatedText) {
          translations[targetIndex] = translatedText;
        }
      }

      return translations;
    } catch (error) {
      console.warn('Failed to parse structured translation response', error);
      return [];
    }
  }
}
