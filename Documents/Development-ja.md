# 開発ガイド

## 前提条件

- Node.js 22以上
- npm または yarn 4
- Chrome または Edge ブラウザ

## セットアップ

1. リポジトリをクローン：
```bash
git clone https://github.com/yourusername/multi-ai-translator.git
cd multi-ai-translator
```

2. 依存関係をインストール：
```bash
npm install
# または
yarn install
```

3. アイコンを生成：
```bash
npm run icons
```

## 開発ワークフロー

### 開発用ビルド

自動リビルド付きのウォッチモード：
```bash
npm run dev
```

これにより：
- 開発モードで拡張機能をビルド
- ファイル変更を監視
- 変更時に自動的にリビルド

### ブラウザで拡張機能を読み込む

#### Chrome
1. `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `dist` フォルダを選択

#### Edge
1. `edge://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「展開して読み込み」をクリック
4. `dist` フォルダを選択

### 変更をテスト

1. ソースファイルに変更を加える
2. webpack のリビルドを待つ（ウォッチモード）
3. ブラウザの拡張機能ページでリロードアイコンをクリック
4. 変更をテスト

## プロジェクト構造

```
multi-ai-translator/
├── src/
│   ├── background/         # バックグラウンドサービスワーカー
│   ├── content/           # コンテンツスクリプト
│   ├── options/           # オプションページ
│   ├── popup/             # ポップアップ UI
│   ├── providers/         # AI プロバイダー実装
│   ├── utils/             # ユーティリティ関数
│   └── locales/           # 翻訳
├── icons/                 # 拡張機能アイコン
├── scripts/               # ビルドスクリプト
├── Documents/             # ドキュメンテーション
└── dist/                  # ビルド出力
```

## 新しいプロバイダーの追加

1. `src/providers/your-provider.js` にプロバイダークラスを作成：
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
    // 実装
  }

  async getModels() {
    // 実装
  }
}
```

2. `src/providers/index.js` に登録
3. `src/options/options.html` に UI を追加
4. `src/utils/storage.js` にデフォルト設定を追加

## デバッグ

### バックグラウンドサービスワーカー
- `chrome://extensions/` を開く
- Multi-AI Translator を見つける
- 「Service Worker」リンクをクリック
- DevTools が開く

### コンテンツスクリプト
- 任意のウェブページを開く
- F12 キーを押して DevTools を開く
- コンソールタブでログを確認
- コンテンツスクリプトのエラーがここに表示される

### ポップアップ/オプション
- ポップアップまたはオプションページを右クリック
- 「検証」を選択

## コードスタイル

ESLint と Prettier を使用：

```bash
# コードスタイルをチェック
npm run lint

# コードをフォーマット
npm run format
```

## よくある問題

### 拡張機能が読み込まれない
- manifest.json の構文をチェック
- webpack.config.js のすべてのパスを確認
- ブラウザコンソールでエラーを確認

### API 呼び出しが失敗する
- CORS 設定を確認
- API キーの設定を確認
- バックグラウンドサービスワーカーのコンソールを確認

### 翻訳が動作しない
- プロバイダーの設定を確認
- API キーが有効であることを確認
- DevTools のネットワークタブを確認

## パフォーマンスのヒント

1. **大きなテキストを分割**：小さな断片に分割
2. **翻訳をキャッシュ**：重複した API 呼び出しを避ける
3. **レート制限**：リクエスト間に遅延を追加
4. **DOM 操作を最小化**：バッチ更新

## コントリビューション

1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更を加える
4. 徹底的にテスト
5. プルリクエストを送信

## リソース

- [Chrome 拡張機能ドキュメント](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 移行](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Service Workers](https://developer.chrome.com/docs/extensions/mv3/service_workers/)
