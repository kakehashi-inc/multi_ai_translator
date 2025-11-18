# アーキテクチャドキュメント

## 概要

Multi-AI Translatorは、Chromium（Chrome / Edge）向けには Manifest V3、Firefox 向けには Manifest V2 で動作するクロスブラウザ拡張機能です。実装は TypeScript + Vite を用い、共通のコードベースを `webextension-polyfill` で抽象化しています。このドキュメントでは、拡張機能のアーキテクチャ、コンポーネント構成、データフローについて説明します。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│                     Browser Extension                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Popup UI   │  │  Options UI  │  │  Content     │  │
│  │              │  │              │  │  Scripts     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │           │
│         └─────────────────┼──────────────────┘           │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │   Background    │                     │
│                  │  Service Worker │                     │
│                  └────────┬────────┘                     │
│                           │                              │
│                  ┌────────▼────────┐                     │
│                  │   Providers     │                     │
│                  │   Layer         │                     │
│                  └────────┬────────┘                     │
│                           │                              │
└───────────────────────────┼──────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
         ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
         │ OpenAI  │  │ Claude  │  │ Gemini  │
         │   API   │  │   API   │  │   API   │
         └─────────┘  └─────────┘  └─────────┘
```

## コンポーネント構成

### 1. Background Service Worker

**ファイル**：`src/background/service-worker.ts`

**役割**：
- 拡張機能の中核となる永続的なバックグラウンドプロセス
- メッセージングのハブとして機能
- API呼び出しの調整
- 状態管理

**主な責務**：
```ts
// メッセージハンドリング
browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  handleMessage(request)
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));
  return true;
});
```

**特徴**：
- Manifest V3のService Workerとして実装
- イベント駆動型
- 必要に応じてアクティブ化/非アクティブ化

### 2. Content Scripts

**ファイル**：`src/content/content-script.ts`、`src/content/translator.ts`

**役割**：
- ウェブページのDOMにアクセス
- ページコンテンツの抽出と操作
- 翻訳結果のページへの適用

**主な機能**：
```ts
// 翻訳フロー
const translator = new Translator();
await translator.initialize();

browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  translator
    .handleMessage(request)
    .then(sendResponse)
    .catch((error) => sendResponse({ error: error.message }));
  return true;
});
```

**注入モード**：
- `matches`: `<all_urls>` - すべてのページで実行可能
- `run_at`: `document_idle` - DOMが完全に読み込まれた後に実行

### 3. Popup UI

**ファイル**：`src/popup/popup.ts`

**役割**：
- ユーザーインターフェース
- 翻訳操作のトリガー
- 現在の状態表示

**主な機能**：
- ページ翻訳ボタン
- 元に戻すボタン
- 設定ページへのリンク
- 現在のプロバイダー表示

**通信**：
```ts
await browser.runtime.sendMessage({
  action: 'translate-page',
  provider,
  language: targetLanguage
});
```

### 4. Options UI

**ファイル**：`src/options/options.ts`

**役割**：
- 拡張機能の設定管理
- プロバイダー設定
- APIキー管理
- UI言語設定

**設定項目**：
- プロバイダー選択（OpenAI、Claude、Gemini、Ollama）
- APIキー
- モデル選択
- ターゲット言語
- 詳細設定（チャンクサイズ、タイムアウトなど）

### 5. Providers Layer

**ファイル**：`src/providers/`

**役割**：
- 各AIプロバイダーとの通信を抽象化
- 統一されたインターフェース提供
- エラーハンドリング

**クラス構造**：
```javascript
// ベースプロバイダー
class BaseProvider {
  constructor(config) {
    this.config = config;
  }

  async translate(text, targetLanguage, sourceLanguage) {
    throw new Error('Must be implemented by subclass');
  }

  validateConfig() {
    throw new Error('Must be implemented by subclass');
  }
}

// OpenAIプロバイダー
class OpenAIProvider extends BaseProvider {
  async translate(text, targetLanguage, sourceLanguage) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{
          role: 'user',
          content: `Translate to ${targetLanguage}: ${text}`
        }]
      })
    });
    // ...
  }
}
```

**サポートされているプロバイダー**：
- `OpenAIProvider`
- `ClaudeProvider`
- `GeminiProvider`
- `OllamaProvider`
- `OpenAICompatibleProvider`

### 6. Utils

**ファイル**：`src/utils/`

**役割**：
- 共通ユーティリティ関数
- ストレージ管理
- i18n（国際化）

**主要モジュール**：

#### Storage Utils
```typescript
import browser from 'webextension-polyfill';

export async function saveSettings(settings: Settings) {
  await browser.storage.local.set({ settings });
}

export async function loadSettings(): Promise<Settings> {
  const { settings } = await browser.storage.local.get('settings');
  return normalizeSettings(settings);
}
```

#### i18n Utils
```typescript
import browser from 'webextension-polyfill';

export function getMessage(key: string, substitutions?: string[]) {
  return browser.i18n.getMessage(key, substitutions);
}
```

#### Text Processing Utils
```javascript
// テキストのチャンク分割
function chunkText(text, maxChunkSize) {
  const chunks = [];
  let currentChunk = '';

  const sentences = text.split(/[.!?。！？]\s*/);

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
```

## データフロー

### ページ翻訳フロー

```
1. User clicks "Translate Page" in Popup
   │
   ▼
2. Popup sends message to Background Script
   {
     type: 'TRANSLATE_PAGE',
     targetLanguage: 'ja'
   }
   │
   ▼
3. Background Script sends message to Content Script
   {
     type: 'EXTRACT_TEXT'
   }
   │
   ▼
4. Content Script extracts text nodes
   │
   ▼
5. Content Script sends text to Background Script
   {
     type: 'TEXT_EXTRACTED',
     textNodes: [...]
   }
   │
   ▼
6. Background Script chunks text
   │
   ▼
7. Background Script calls Provider
   provider.translate(chunk, 'ja', 'auto')
   │
   ▼
8. Provider makes API request
   │
   ▼
9. API returns translation
   │
   ▼
10. Background Script sends translation to Content Script
    {
      type: 'APPLY_TRANSLATION',
      translations: [...]
    }
    │
    ▼
11. Content Script applies translation to DOM
    │
    ▼
12. Translation complete
```

### 選択テキスト翻訳フロー

```
1. User selects text and uses context menu/shortcut
   │
   ▼
2. Content Script captures selected text
   │
   ▼
3. Content Script sends to Background Script
   {
     type: 'TRANSLATE_SELECTION',
     text: 'selected text',
     targetLanguage: 'ja'
   }
   │
   ▼
4. Background Script calls Provider
   │
   ▼
5. Provider returns translation
   │
   ▼
6. Background Script sends to Content Script
   {
     type: 'SHOW_TRANSLATION_POPUP',
     translation: '翻訳されたテキスト'
   }
   │
   ▼
7. Content Script shows popup with translation
```

## ストレージ戦略

### WebExtension Storage API

**使用するストレージタイプ**：
- `browser.storage.local`: 設定、プロバイダー情報、翻訳履歴

**ストレージ構造**（抜粋）：
```ts
{
  settings: {
    common: {
      defaultProvider: 'openai',
      defaultSourceLanguage: 'auto',
      defaultTargetLanguage: 'ja',
      uiLanguage: 'ja',
      batchMaxChars: 64000,
      batchMaxItems: 20
    },
    providers: {
      openai: { enabled: true, apiKey: 'sk-...', model: 'gpt-4o-mini' },
      anthropic: { enabled: false, apiKey: '', model: '' },
      // ...
    },
    ui: {
      theme: 'auto',
      fontSize: 14,
      showOriginalText: true,
      highlightTranslated: true
    }
  },
  translationHistory: [
    {
      original: 'Hello',
      translated: 'こんにちは',
      provider: 'openai',
      timestamp: 1710000000000
    }
  ]
}
```

※ 現状、翻訳キャッシュは導入しておらず、最新 100 件の翻訳履歴のみを保持します。

## セキュリティ考慮事項

### APIキーの保護

1. **ローカルストレージ**：
   - APIキーは `browser.storage.local` に保存
   - 他の拡張機能からアクセス不可

2. **通信の暗号化**：
   - すべてのAPI通信はHTTPS経由
   - TLS 1.2以上を使用

3. **XSS対策**：
   - コンテンツスクリプトでのユーザー入力サニタイズ
   - `textContent`の使用（`innerHTML`を避ける）

### Content Security Policy

**manifest.json**：
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 権限の最小化

**必要な権限のみを要求**：
```json
{
  "permissions": [
    "storage",
    "activeTab",
    "contextMenus"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

## パフォーマンス最適化

### 1. 遅延読み込み

- Service Workerは必要時のみアクティブ化
- コンテンツスクリプトの条件付き実行

### 2. バッチ処理

```javascript
// 複数のテキストチャンクを効率的に処理
async function batchTranslate(chunks, provider) {
  const results = [];
  const batchSize = 3; // 並列リクエスト数

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const promises = batch.map(chunk => provider.translate(chunk));
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);

    // レート制限対策
    if (i + batchSize < chunks.length) {
      await sleep(500);
    }
  }

  return results;
}
```

### 3. DOM操作の最適化

```javascript
// 一括DOM更新
function applyTranslationsBatch(translations) {
  // DocumentFragmentを使用して再描画を最小化
  const fragment = document.createDocumentFragment();

  for (const { node, translation } of translations) {
    const clone = node.cloneNode(true);
    clone.textContent = translation;
    fragment.appendChild(clone);
  }

  // 一度にDOMに適用
  container.appendChild(fragment);
}
```

### 4. メモリ管理

- 大きなキャッシュの定期的なクリーンアップ
- 未使用データの削除
- WeakMapの使用（適用可能な場合）

## エラーハンドリング

### 階層的エラーハンドリング

```javascript
// Provider層
class OpenAIProvider {
  async translate(text, targetLanguage) {
    try {
      const response = await fetch(API_URL, options);
      if (!response.ok) {
        throw new ProviderError(response.status, await response.text());
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ProviderError) {
        throw error;
      }
      throw new NetworkError('Failed to connect to OpenAI', error);
    }
  }
}

// Background Script層
async function handleTranslateRequest(message) {
  try {
    const translation = await provider.translate(message.text);
    return { success: true, translation };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      error: error.message,
      errorType: error.constructor.name
    };
  }
}

// UI層
async function translatePage() {
  const response = await browser.runtime.sendMessage({
    action: 'translate-page'
  });

  if (!response.success) {
    showError(response.error);
    return;
  }

  showSuccess('Translation completed');
}
```

## テスト戦略

### ユニットテスト

```javascript
// Providers
describe('OpenAIProvider', () => {
  it('should translate text', async () => {
    const provider = new OpenAIProvider(config);
    const result = await provider.translate('Hello', 'ja');
    expect(result).toBe('こんにちは');
  });
});

// Utils
describe('chunkText', () => {
  it('should split text into chunks', () => {
    const text = 'Lorem ipsum...';
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(100);
    });
  });
});
```

### インテグレーションテスト

- E2Eテスト（Puppeteer使用）
- 実際のブラウザでの動作確認

## 拡張性

### 新しいプロバイダーの追加

1. `BaseProvider` を継承
2. 必要なメソッドを実装
3. `src/providers/index.ts` に登録
4. UI設定を追加

```typescript
// 1. プロバイダークラス作成
export class NewProvider extends BaseProvider {
  async translate(text, targetLang, sourceLang) {
    // 実装
  }

  validateConfig() {
    return !!this.config.apiKey;
  }

  async getModels() {
    // 利用可能なモデルのリストを返す
  }
}

// 2. 登録
import { NewProvider } from './new-provider';
export const providers = {
  openai: OpenAIProvider,
  claude: ClaudeProvider,
  newProvider: NewProvider
};
```

## 参考資料

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Service Workers in Extensions](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)
