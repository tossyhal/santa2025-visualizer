# Santa 2025 Visualizer

Kaggle Santa 2025 Christmas Tree Placement Competition用のビジュアライザーです。

## 機能

- **CSV読み込み**: 単一または複数のCSVファイルをドラッグ&ドロップで読み込み
- **Nセレクター**: スライダーでN=1〜200を選択して配置を表示
- **スコア計算**: 各Nでのs_N（一辺長）と寄与スコア（s_N²/N）を表示
- **衝突検証**: ツリー同士の重なりを検出し赤くハイライト
- **境界チェック**: 座標が[-100, 100]範囲内かを検証
- **比較機能**: 2つのCSVを並べて比較表示
- **画像エクスポート**: SVG/PNG形式でダウンロード

## 開発

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にログイン
2. 新しいプロジェクトをインポート
3. GitHubリポジトリを選択
4. ルートディレクトリを`visualizer`に設定
5. デプロイ

または、Vercel CLIを使用:

```bash
npm i -g vercel
cd visualizer
vercel
```

## 技術スタック

- **フレームワーク**: SvelteKit (Static Adapter)
- **言語**: TypeScript
- **描画**: SVG
- **スタイリング**: CSS (カスタム)

## CSVフォーマット

```csv
id,x,y,deg
001_0,s0,s0,s90.000000
002_0,s1.5,s0.5,s45.000000
002_1,s-1.5,s0.5,s135.000000
...
```

- `id`: `{N:03d}_{idx}` 形式（例: `001_0`, `050_24`）
- `x`, `y`: `s`プレフィックス付き座標（範囲: -100〜100）
- `deg`: `s`プレフィックス付き角度（度数法）
