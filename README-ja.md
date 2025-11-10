# Multi-AI Translator

[English README](README.md)

複数のAIプロバイダを使用してWebページを翻訳する強力なブラウザ拡張機能です。

## 機能

- 🌐 **複数のAIプロバイダ対応**: OpenAI、Claude、Gemini、Ollama、OpenAI互換APIから選択可能
- 📄 **ページ翻訳**: ワンクリックでWebページ全体を翻訳
- ✨ **選択範囲翻訳**: 選択したテキストをポップアップで翻訳
- 🔄 **元に戻す**: 簡単に元のコンテンツに戻せます
- 🎨 **モダンなUI**: クリーンで直感的なインターフェース
- 🌍 **多言語対応**: 日本語と英語のUIに対応
- ⚙️ **高度な設定**: プロバイダ、モデル、翻訳設定をカスタマイズ可能

## 対応AIプロバイダ

| プロバイダ | モデル | APIキー必須 |
|----------|--------|------------|
| OpenAI | GPT-4, GPT-3.5-turbo | ✅ 必要 |
| Claude | Claude 3 (Opus, Sonnet, Haiku) | ✅ 必要 |
| Gemini | Gemini Pro, Ultra | ✅ 必要 |
| Ollama | ローカルモデル | ❌ 不要（ローカル） |
| OpenAI互換 | LM Studio, LocalAI等 | 状況による |

## インストール

### ソースから

1. リポジトリをクローン:
```bash
git clone https://github.com/yourusername/multi-ai-translator.git
cd multi-ai-translator
```

2. 依存関係をインストール:
```bash
npm install
```

3. 拡張機能をビルド:
```bash
npm run build
```

4. ブラウザに読み込み:
   - Chrome: `chrome://extensions/`を開く
   - Edge: `edge://extensions/`を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `dist`フォルダを選択

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

### OpenAI
- [OpenAI Platform](https://platform.openai.com/)からAPIキーを取得
- 推奨モデル: `gpt-3.5-turbo`（高速でコスト効率が良い）

### Claude (Anthropic)
- [Anthropic Console](https://console.anthropic.com/)からAPIキーを取得
- 推奨モデル: `claude-3-sonnet-20240229`

### Gemini (Google)
- [Google AI Studio](https://makersuite.google.com/)からAPIキーを取得
- 推奨モデル: `gemini-pro`

### Ollama (ローカル)
- [Ollama](https://ollama.ai/)をインストール
- モデルをプル: `ollama pull llama2`
- デフォルトホスト: `http://127.0.0.1:11434`

### OpenAI互換
- LM Studio、LocalAI、またはOpenAI互換APIで動作
- ベースURLとモデル名を設定

## 開発

詳細は[開発ガイド](Documents/Development.md)を参照してください。

```bash
# 依存関係のインストール
npm install

# 開発モード（ウォッチ）
npm run dev

# 本番ビルド
npm run build

# パッケージ作成
npm run package

# コードチェック
npm run lint

# コード整形
npm run format
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

## コントリビュート

コントリビュートを歓迎します！プルリクエストを送信する前に[コントリビュートガイド](CONTRIBUTING.md)をお読みください。

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 謝辞

- [Webpack](https://webpack.js.org/)でビルド
- 公式SDKを使用: [OpenAI](https://github.com/openai/openai-node)、[Anthropic](https://github.com/anthropics/anthropic-sdk-typescript)、[Google Generative AI](https://github.com/google/generative-ai-js)、[Ollama](https://github.com/ollama/ollama-js)

## サポート

- 🐛 [バグ報告](https://github.com/yourusername/multi-ai-translator/issues)
- 💡 [機能リクエスト](https://github.com/yourusername/multi-ai-translator/issues)
- 📖 [ドキュメント](Documents/)
- ❓ [質問](https://github.com/yourusername/multi-ai-translator/discussions)

## ロードマップ

- [ ] Firefox対応
- [ ] Safari対応
- [ ] 翻訳履歴
- [ ] カスタムプロンプト
- [ ] バッチ翻訳
- [ ] 翻訳キャッシュ
- [ ] より多くのAIプロバイダ

---

Multi-AI Translatorチームが❤️を込めて作成
