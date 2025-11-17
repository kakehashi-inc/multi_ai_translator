# Multi-AI Translator

[English README](README.md)

複数のAIプロバイダを使用してWebページを翻訳する強力なブラウザ拡張機能です。

## 機能

- 🌐 **複数のAIプロバイダ対応**: Gemini、Anthropic（Claude）、Anthropic互換API、OpenAI、OpenAI互換API、Ollamaから選択可能
- 🦊 **マルチブラウザ対応**: Chrome、Edge、Firefoxでシームレスに動作
- 📄 **ページ翻訳**: ワンクリックでWebページ全体を翻訳
- ✨ **選択範囲翻訳**: 選択したテキストをポップアップで翻訳
- 🔄 **元に戻す**: 簡単に元のコンテンツに戻せます
- 🎨 **モダンなUI**: クリーンで直感的なインターフェース
- 🌍 **多言語対応**: 日本語と英語のUIに対応
- ⚙️ **高度な設定**: プロバイダ、モデル、翻訳設定をカスタマイズ可能
- ⚡ **高速ビルド**: Viteによる超高速な開発環境

## 対応AIプロバイダ

| プロバイダ | モデル | APIキー必須 |
|----------|--------|------------|
| Gemini | Gemini Pro, Ultra | ✅ 必要 |
| Anthropic（Claude） | Claude 3 (Opus, Sonnet, Haiku) | ✅ 必要 |
| Anthropic互換 | 互換API | 状況による |
| OpenAI | GPT-4, GPT-3.5-turbo | ✅ 必要 |
| OpenAI互換 | LM Studio, LocalAI等 | 状況による |
| Ollama | ローカルモデル | ❌ 不要（ローカル） |

## インストール

### ソースから

1. リポジトリをクローン:
```bash
git clone https://github.com/yourusername/multi-ai-translator.git
cd multi-ai-translator
```

2. 依存関係をインストール:
```bash
yarn install
```

3. 拡張機能をビルド:
```bash
# Chrome / Edge（dist/に出力）
yarn build:chromium

# Firefox（Manifest V2、dist-firefox/に出力）
yarn build:firefox
```

4. ブラウザに読み込み:

   **Chrome/Edge:**
   - `chrome://extensions/`（Chrome）または`edge://extensions/`（Edge）を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `dist`フォルダを選択

   **Firefox（`yarn build:firefox` 実行後）:**
   - `about:debugging#/runtime/this-firefox`を開く
   - 「一時的なアドオンを読み込む」をクリック
   - `dist-firefox`フォルダ内の`manifest.json`ファイルを選択

## クイックスタート

1. **プロバイダを設定**:
   - 拡張機能アイコンをクリック
   - 「設定」をクリック
   - プロバイダを有効化してAPIキーを追加
   - モデルを選択

2. **ページを翻訳**:
   - 任意のWebページを開く
   - 拡張機能アイコンをクリック
   - 「ページを翻訳」をクリック

3. **選択範囲を翻訳**:
   - ページ上のテキストを選択
   - 右クリック → 「選択範囲を翻訳」
   - またはキーボードショートカット: `Ctrl+Shift+S`

## キーボードショートカット

| 操作 | Windows/Linux | Mac |
|-----|--------------|-----|
| ページ翻訳 | `Ctrl+Shift+T` | `Cmd+Shift+T` |
| 選択範囲翻訳 | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| 元に戻す | `Ctrl+Shift+R` | `Cmd+Shift+R` |

## 設定

### Gemini (Google)
- [Google AI Studio](https://makersuite.google.com/)からAPIキーを取得
- 推奨モデル: `gemini-pro`

### Anthropic（Claude）
- [Anthropic Console](https://console.anthropic.com/)からAPIキーを取得
- 推奨モデル: `claude-3-sonnet-20240229`

### Anthropic互換
- Claude互換API（Bedrockや社内プロキシなど）で利用可能
- それぞれのベースURLと必要に応じたAPIキーを設定してください

### OpenAI
- [OpenAI Platform](https://platform.openai.com/)からAPIキーを取得
- 推奨モデル: `gpt-3.5-turbo`（高速でコスト効率が良い）

### OpenAI互換
- LM Studio、LocalAI、またはOpenAI互換APIで動作
- ベースURLとモデル名を設定

### Ollama (ローカル)
- [Ollama](https://ollama.ai/)をインストール
- モデルをプル: `ollama pull llama2`
- デフォルトホスト: `http://127.0.0.1:11434`

## 開発

詳細は[開発ガイド](Documents/Development.md)を参照してください。

```bash
# 依存関係のインストール
yarn install

# 開発モード（ウォッチ、Chromium向け）
yarn dev

# Firefox用ウォッチ
yarn dev:firefox

# 本番ビルド
yarn build         # = yarn build:chromium
yarn build:firefox
yarn build:all

# distディレクトリとパッケージのクリーン
yarn clean

# コードチェック
yarn lint

# コード整形
yarn format

# lintとビルドの実行
yarn check

# 配布パッケージの作成（Chrome/EdgeとFirefox）
yarn package

# 完全なビルドパイプライン（clean、lint、build、package）
yarn dist
```

## プロジェクト構造

```
multi-ai-translator/
├── src/
│   ├── background/      # バックグラウンドサービスワーカー
│   ├── content/         # コンテンツスクリプト
│   ├── options/         # 設定ページ
│   ├── popup/           # ポップアップUI
│   ├── providers/       # AIプロバイダ実装
│   ├── utils/           # ユーティリティ関数
│   └── locales/         # 翻訳（日本語、英語）
├── icons/               # 拡張機能アイコン
├── Documents/           # ドキュメント
└── dist/                # ビルド出力
```

## プライバシー

この拡張機能は:
- ✅ 個人情報を収集しません
- ✅ すべての設定をブラウザのローカルに保存します
- ✅ 翻訳リクエストを選択したAIプロバイダに直接送信します
- ✅ トラッキングやアナリティクスを使用しません
- ✅ 完全にオープンソースです

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 謝辞

- ビルドツール: [Gulp](https://gulpjs.com/) + [Vite](https://vitejs.dev/) + [CRXJS](https://crxjs.dev/)
- 公式SDKを使用: [OpenAI](https://github.com/openai/openai-node)、[Anthropic](https://github.com/anthropics/anthropic-sdk-typescript)、[Google Generative AI](https://github.com/google/generative-ai-js)、[Ollama](https://github.com/ollama/ollama-js)

## サポート

- 🐛 [バグ報告](https://github.com/yourusername/multi-ai-translator/issues)
- 💡 [機能リクエスト](https://github.com/yourusername/multi-ai-translator/issues)
- 📖 [ドキュメント](Documents/)
- ❓ [質問](https://github.com/yourusername/multi-ai-translator/discussions)
