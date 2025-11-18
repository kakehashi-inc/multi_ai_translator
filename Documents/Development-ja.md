# 開発ガイド

## 前提条件

- Node.js 22 以上
- Yarn 4
- Chrome / Edge / Firefox

## セットアップ

```bash
git clone https://github.com/yourusername/multi-ai-translator.git
cd multi-ai-translator
yarn install
```

## よく使うコマンド

| コマンド | 用途 |
| --- | --- |
| `yarn dev` | Chromium 用ウォッチビルド（`dist/`） |
| `yarn build:chromium` | Chrome / Edge への配布用ビルド |
| `yarn build:firefox` | Firefox (MV2) 用ビルド（`dist-firefox/`） |
| `yarn lint` / `yarn format` | ESLint / Prettier |
| `yarn clean` | `dist/`, `dist-firefox/`, `packages/` を削除 |

## ブラウザへの読み込み

### Chrome / Edge
1. `yarn dev` で開発用ウォッチ、または `yarn build:chromium` で本番ビルド
2. `chrome://extensions/` もしくは `edge://extensions/` を開く
3. 右上で「デベロッパーモード」を ON
4. 「パッケージ化されていない拡張機能を読み込む」で `dist/` を指定
5. コード変更後は Vite の再ビルド完了を待ち、拡張機能カードの更新アイコンでリロード

### Firefox
1. `yarn build:firefox` を実行して `dist-firefox/` を生成
2. `about:debugging#/runtime/this-firefox` を開く
3. 「一時的なアドオンを読み込む」→ `dist-firefox/manifest.json`
4. 変更後は再ビルドし、「再読み込み」で反映
5. 背景スクリプトのログは「検査」ボタンから確認

> 永続的にインストールしたい場合
> - **Developer Edition / Nightly**: `about:config` で `xpinstall.signatures.required` を `false` にすると署名なしでも読み込めます。
> - **AMO の「非公開（Unlisted）」署名**: `yarn build:firefox` で作成したパッケージを [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/) にアップロードし、署名付き XPI をダウンロードして `about:addons` からインストールします。
> - **企業ポリシー**: 管理ポリシーで署名チェックを無効化する方法もありますが、一般利用では非推奨です。

## 変更のテスト

1. ソースコードを編集
2. ウォッチビルドの完了、または手動ビルドを待つ
3. 読み込んでいるブラウザで拡張機能を更新
4. ポップアップ／オプション／翻訳動作を確認

## プロジェクト構造

```
multi-ai-translator/
├── src/
│   ├── background/         # バックグラウンドサービスワーカー
│   ├── content/            # コンテンツスクリプト
│   ├── options/            # オプションページ
│   ├── popup/              # ポップアップ UI
│   ├── providers/          # AI プロバイダー実装
│   ├── utils/              # ユーティリティ
│   └── locales/            # 翻訳リソース
├── icons/                  # アイコン
├── scripts/                # ビルドスクリプト
├── Documents/              # ドキュメント
├── dist/                   # Chromium 向け出力
└── dist-firefox/           # Firefox 向け出力
```

## プロバイダーの追加

1. `src/providers/your-provider.ts` を作成
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
    // 実装
  }

  async getModels() {
    // 実装
  }
}
```
2. `src/providers/index.ts` に登録
3. `src/options/options.html` / `options.ts` に UI とロジックを追加
4. `src/utils/storage.ts` にデフォルト値を追加

## デバッグ

### バックグラウンド
- `chrome://extensions/` → 対象拡張機能の「Service Worker」をクリック
- Firefox の場合は `about:debugging` の「検査」からログ確認

### コンテンツスクリプト
- 任意のページで DevTools (F12) を開き Console を確認

### ポップアップ / オプション
- 対象 UI 上で右クリック → 「検証」
