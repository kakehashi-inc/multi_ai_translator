# アーキテクチャドキュメント

## 概要

Multi-AI Translatorは、Manifest V3に準拠したChrome拡張機能として設計されています。このドキュメントでは、拡張機能のアーキテクチャ、コンポーネント構成、データフローについて説明します。

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

**ファイル**：`src/background/`

**役割**：
- 拡張機能の中核となる永続的なバックグラウンドプロセス
- メッセージングのハブとして機能
- API呼び出しの調整
- 状態管理

**主な責務**：
```javascript
// メッセージハンドリング
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.type) {
    case 'TRANSLATE_PAGE':
      // ページ翻訳の処理
      break;
    case 'TRANSLATE_SELECTION':
      // 選択テキスト翻訳の処理
      break;
    case 'GET_SETTINGS':
      // 設定の取得
      break;
  }
});
```

**特徴**：
- Manifest V3のService Workerとして実装
- イベント駆動型
- 必要に応じてアクティブ化/非アクティブ化

### 2. Content Scripts

**ファイル**：`src/content/`

**役割**：
- ウェブページのDOMにアクセス
- ページコンテンツの抽出と操作
- 翻訳結果のページへの適用

**主な機能**：
```javascript
// テキストノードの抽出
function extractTextNodes(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        return node.nodeValue.trim()
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );
  // ...
}

// 翻訳の適用
function applyTranslation(node, translatedText) {
  node.nodeValue = translatedText;
}
```

**注入モード**：
- `matches`: `<all_urls>` - すべてのページで実行可能
- `run_at`: `document_idle` - DOMが完全に読み込まれた後に実行

### 3. Popup UI

**ファイル**：`src/popup/`

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
```javascript
// Background Scriptへのメッセージ送信
chrome.runtime.sendMessage({
  type: 'TRANSLATE_PAGE',
  targetLanguage: 'ja'
}, (response) => {
  // レスポンス処理
});
```

### 4. Options UI

**ファイル**：`src/options/`

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
```javascript
// 設定の保存
async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}

// 設定の読み込み
async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return settings || getDefaultSettings();
}
```

#### i18n Utils
```javascript
// メッセージの取得
function getMessage(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions);
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

### Chrome Storage API

**使用するストレージタイプ**：
- `chrome.storage.local`: 設定、APIキー、キャッシュ
- `chrome.storage.sync`: UI言語（デバイス間同期）

**ストレージ構造**：
```javascript
{
  settings: {
    provider: 'openai',
    targetLanguage: 'ja',
    sourceLanguage: 'auto',
    providers: {
      openai: {
        enabled: true,
        apiKey: 'sk-...',
        model: 'gpt-3.5-turbo',
        temperature: 0.3
      },
      claude: {
        enabled: false,
        apiKey: '',
        model: 'claude-3-sonnet'
      },
      // ...
    },
    advanced: {
      chunkSize: 5000,
      timeout: 30000,
      requestDelay: 500,
      maxConcurrentRequests: 3
    }
  },
  translationCache: {
    'hash1': '翻訳1',
    'hash2': '翻訳2',
    // ...
  },
  uiLanguage: 'ja'
}
```

### キャッシュ戦略

**目的**：
- 同じテキストの再翻訳を避ける
- API使用量を削減
- レスポンス速度向上

**実装**：
```javascript
// ハッシュ生成
function generateHash(text, targetLanguage, provider) {
  return btoa(`${text}:${targetLanguage}:${provider}`);
}

// キャッシュから取得
async function getCachedTranslation(text, targetLanguage, provider) {
  const hash = generateHash(text, targetLanguage, provider);
  const { translationCache } = await chrome.storage.local.get('translationCache');
  return translationCache?.[hash];
}

// キャッシュに保存
async function cacheTranslation(text, targetLanguage, provider, translation) {
  const hash = generateHash(text, targetLanguage, provider);
  const { translationCache = {} } = await chrome.storage.local.get('translationCache');
  translationCache[hash] = translation;
  await chrome.storage.local.set({ translationCache });
}
```

## セキュリティ考慮事項

### APIキーの保護

1. **ローカルストレージ**：
   - APIキーは `chrome.storage.local` に保存
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
  const response = await chrome.runtime.sendMessage({
    type: 'TRANSLATE_PAGE'
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
3. `src/providers/index.js` に登録
4. UI設定を追加

```javascript
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
import { NewProvider } from './new-provider.js';
export const providers = {
  openai: OpenAIProvider,
  claude: ClaudeProvider,
  newProvider: NewProvider
};
```

## 将来の改善案

1. **オフラインサポート**：
   - Service Workerキャッシュの活用
   - 翻訳履歴のオフライン保存

2. **バックグラウンド翻訳**：
   - ページ読み込み時の自動翻訳
   - ユーザー設定に基づく自動検出

3. **カスタム辞書**：
   - ユーザー定義の用語集
   - 専門用語の一貫した翻訳

4. **翻訳履歴**：
   - 過去の翻訳履歴
   - お気に入り機能

5. **コラボレーション機能**：
   - 翻訳の共有
   - チーム設定

## 参考資料

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Service Workers in Extensions](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Message Passing](https://developer.chrome.com/docs/extensions/mv3/messaging/)
