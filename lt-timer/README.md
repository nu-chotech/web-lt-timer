# LT Timer — リアルタイム同期タイマー + 弾幕チャット

Next.js (App Router) と WebSocket を用いた、LT（ライトニングトーク）向けのリアルタイム同期タイマーです。
複数クライアント間でタイマー状態と弾幕メッセージを共有できます。プレゼンや勉強会、ハッカソンのタイムキーパーとして使いやすい設計です。

## 使い方（簡易クイックスタート）

依存をインストールして、WSサーバーとNext開発サーバーを起動します。

```powershell
npm install
npm run ws-server    # WebSocket / broadcast HTTP サーバー (ポート: 4001)
npm run dev          # Next.js 開発サーバー (ポート: 3000)
```

ブラウザで `http://localhost:3000` を開くと LT Timer の UI が表示されます。

注意: `http://0.0.0.0:4001` を直接ブラウザで開いても通常の HTML は返りません。WSサーバーは WebSocket 接続と `/broadcast` の POST を受け付ける API サーバーです。

## 環境変数

ローカルで別ホストにWSサーバーを立てる場合:

```env
NEXT_PUBLIC_WS_URL=ws://your-websocket-server-address:4001
NEXT_PUBLIC_BROADCAST_URL=http://your-websocket-server-address:4001/broadcast
```

## 改善したプロジェクト構成

関心ごと (routing / domain / presentation) を分離する構成にしています。主要ファイルは以下のとおりです。

```text
.
├── app/                          # Next App Router のルート (画面エントリ)
│   ├── globals.css               # グローバルスタイル（弾幕アニメーション含む）
│   ├── layout.tsx                # ルートレイアウト（フォントなど）
│   └── page.tsx                  # エントリーポイント（TimerClient をマウント）
├── app/features/timer/           # タイマー機能に関するコードを集約
│   ├── TimerClient.tsx           # 機能の親コンポーネント（フックを合成、UIを組み立て）
│   ├── components/               # 表示用の小さなコンポーネント群
│   │   ├── TimerDisplay.tsx      # メインの時計表示
│   │   ├── Controls.tsx          # 設定パネル / 操作ボタン / チャットフォーム
│   │   └── Overlay.tsx           # 弾幕（Marquee）表示レイヤー
│   └── hooks/                    # ドメインロジック（UIから独立）
│       ├── useTimer.tsx          # カウントダウンとオーディオ通知
│       └── useChat.tsx           # WebSocket / broadcast の管理
└── server/
    └── ws-server.js              # シンプルな WebSocket + POST ブロードキャストサーバー
```

この構成により「ある機能に関するコード」を1フォルダ内で追えるため、将来的な拡張やテストがしやすくなっています。

## よくある確認ポイント / トラブルシュート

- ブラウザで何も表示されない: `npm run dev` が起動しているか確認し、`http://localhost:3000` を開いてください。
- WS 接続がつながらない: `npm run ws-server` を実行して `HTTP/WebSocket server listening on http://0.0.0.0:4001` が出ているか確認してください。コンソールで `curl -X POST http://localhost:4001/broadcast -H "Content-Type: application/json" -d '{"text":"hello"}'` を試すと簡易テストできます。
- ハイドレーションエラー: JSX に意図しないテキストノード（例: `//`）が混入しているとエラーになります。`app/layout.tsx` にあった余計な `//` を今回削除しています。

## 追加でやること（提案）

- `Controls` と `Overlay` をさらに小さなテスト可能なユニットに分割し、ユニットテストを追加する。 
- CI ワークフロー（lint / typecheck / test）を追加する。

----

不明点やこの構成でさらに分割したい箇所があれば教えてください。README の追加修正や、さらに細かいコンポーネント分割も行います。

## スクリーンショット

実際の UI イメージ（プレースホルダ）:

![Timer UI](/screenshots/timer-ui.svg)

![Controls & Overlay](/screenshots/controls-overlay.svg)

> 画像は `public/screenshots/` に置いています。実機のスクリーンショットを撮って差し替えてください。

## 使い方の例

- WebSocket コンソールでの簡易テスト（ブラウザの開発者ツールで実行）:

```javascript
// ブラウザのコンソールで実行
const ws = new WebSocket('ws://localhost:4001');
ws.onmessage = (e) => console.log('recv', e.data);
ws.onopen = () => ws.send(JSON.stringify({ text: 'こんにちは' }));
```

- サーバーの `/broadcast` に対して curl でテスト送信:

```bash
curl -X POST http://localhost:4001/broadcast -H "Content-Type: application/json" -d '{"text":"hello from curl"}'
```

上記は動作確認に便利な「最小限の例」です。スクリーンショットを差し替えたい場合、`public/screenshots/` に新しい画像を置き、READMEのパスをそのまま使ってください。