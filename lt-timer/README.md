# LT Timer

LT（Lightning Talk）向けのタイマーアプリです。発表用のカウントダウン、設定パネル、弾幕コメント送信をひとつの画面で扱えます。

現在の実装は Next.js + React のフロントエンドと、WebSocket / HTTP broadcast を扱う Node.js サーバーの組み合わせです。

## 主な機能

- 発表用タイマーの開始 / 一時停止 / リセット
- 30秒、60秒、300秒などのプリセット設定
- 任意秒数のカスタム入力
- 10秒以下と 60秒以下で視認性を高める警告表示
- 発表者画面と観客画面の分離
- WebSocket による弾幕コメント送信と再接続対応
- 送信先の外部 HTTP endpoint への POST fallback

## 画面構成

- ルート: 発表者向けタイマー画面
- /audience: 観客向けコメント送信画面

ブラウザで次のように開きます。

- 発表者画面: http://localhost:3000
- 観客画面: http://localhost:3000/audience

## 必要環境

- Node.js 20 以上を推奨
- npm

## クイックスタート

依存関係をインストールして、WebSocket サーバーと Next.js 開発サーバーを起動します。

```bash
npm install
npm run ws-server
npm run dev
```

その後、ブラウザで http://localhost:3000 を開いてください。

> 注: WebSocket サーバーは 4001 番ポートで起動します。コメント送信や弾幕表示を利用するには、このサーバーが必須です。

## 環境変数

ローカル環境で別ホストの WebSocket サーバーを使う場合は、次の環境変数を設定できます。

```env
NEXT_PUBLIC_WS_URL=ws://localhost:4001
NEXT_PUBLIC_BROADCAST_URL=http://localhost:4001/broadcast
```

変数を設定しない場合は、ブラウザ側が自動で localhost の 4001 番ポートを使用します。

## プロジェクト構成

```text
.
├── app/
│   ├── audience/
│   │   └── page.tsx              # 観客用コメント送信画面
│   ├── features/
│   │   └── timer/
│   │       ├── TimerClient.tsx    # タイマー画面の親コンポーネント
│   │       ├── components/
│   │       │   ├── Controls.tsx   # 設定 / 操作 / コメント入力
│   │       │   ├── Overlay.tsx    # 弾幕表示レイヤー
│   │       │   └── TimerDisplay.tsx
│   │       └── hooks/
│   │           ├── useTimer.tsx   # タイマーの状態管理
│   │           └── useChat.tsx    # WebSocket / POST broadcast 管理
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # 発表者用メイン画面
├── public/
├── server/
│   └── ws-server.js              # WebSocket + HTTP broadcast サーバー
├── package.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
└── README.md
```

## 動作の概要

- フロントエンドは App Router ベースの Next.js アプリです。
- 発表者側はタイマーと配置を制御し、コメントの流れを表示します。
- 観客側は WebSocket に接続してコメントを送信し、画面に流れます。
- WS サーバーは WebSocket 接続と POST /broadcast を受け取り、同一ネットワーク内のクライアントへメッセージを配信します。

> 実装上は「タイマーの長さ制御」と「弾幕コメントの配信」が主な役割であり、厳密な複数端末同期のタイマー制御までを主目的としているわけではありません。

## 開発時の確認方法

### WebSocket サーバーの確認

```bash
npm run ws-server
```

起動時に以下のようなログが出れば OK です。

```text
HTTP/WebSocket server listening on http://0.0.0.0:4001
```

### 投稿テスト

```bash
curl -X POST http://localhost:4001/broadcast \
  -H "Content-Type: application/json" \
  -d '{"text":"hello from curl"}'
```

### ブラウザ側の簡易確認

ブラウザの開発者ツールで次を実行すると、WS サーバーへメッセージを送れます。

```javascript
const ws = new WebSocket('ws://localhost:4001');
ws.onmessage = (event) => console.log(event.data);
ws.onopen = () => ws.send(JSON.stringify({ text: 'テストメッセージ' }));
```

## トラブルシュート

- コメントが流れない
  - ws-server が起動しているか確認してください。
  - 4001 番ポートが使用可能か確認してください。

- ページが表示されない
  - npm run dev の実行状態を確認してください。
  - http://localhost:3000 でアクセスできているか確認してください。

- 観客側から送信できない
  - NEXT_PUBLIC_WS_URL / NEXT_PUBLIC_BROADCAST_URL が適切か確認してください。

## 今後の改善候補

- タイマー状態の複数端末同期を本格実装する
- コメントの送信履歴や管理画面を追加する
- E2E テストや lint / typecheck の CI を整備する

## ライセンス

このプロジェクトのライセンスは未設定です。必要に応じて package.json や LICENSE の追加を行ってください。