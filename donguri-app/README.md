# 🌰 どんぐり - ポイ活Webアプリ

提携店舗に来店するとデジタルトークン「どんぐり」がもらえるWebアプリです。

## 機能

- 📍 **位置情報チェックイン** - 店舗の近くにいることを確認してどんぐりを獲得
- 📷 **QRコードスキャン** - 店舗のQRコードを読み取ってどんぐりを獲得
- 🌰 **ウォレット** - どんぐりの残高を管理
- 🫕 **ゆでる** - どんぐりをゆでることで有効期限を7日延長
- 🍃 **葉っぱ交換** - 葉っぱ10枚をどんぐり1個に交換
- ✨ **金のどんぐり** - 低確率で金のどんぐりが当たる
- 🗺️ **地図** - 近くの提携店舗をマップで確認

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **認証**: NextAuth.js v5 (メール + Google)
- **地図**: Google Maps JavaScript API
- **QRスキャン**: jsQR
- **デプロイ**: Vercel

---

## ローカル起動手順

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd donguri-app
```

### 2. 依存関係をインストール

```bash
npm install
```

### 3. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を開いて以下の値を設定してください：

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL接続URL | [Supabase](https://supabase.com) でプロジェクト作成 |
| `NEXTAUTH_SECRET` | 認証用シークレット | `openssl rand -base64 32` で生成 |
| `NEXTAUTH_URL` | アプリのURL | ローカルは `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | 同上 |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps APIキー | [Google Cloud Console](https://console.cloud.google.com/) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push 公開鍵 | `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Web Push 秘密鍵 | 同上 |

### 4. データベースをセットアップ

```bash
# Prismaクライアントを生成
npm run db:generate

# マイグレーションを実行（テーブルを作成）
npm run db:migrate

# サンプルデータを投入（任意）
npm run db:seed
```

### 5. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## ディレクトリ構成

```
donguri-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証ページ（ログイン・登録）
│   ├── (main)/            # メインアプリ（ナビ付き）
│   ├── shops/             # 加盟店ページ
│   ├── merchant/          # 加盟店オーナー管理
│   ├── admin/             # 運営管理画面
│   └── api/               # APIエンドポイント
├── components/             # Reactコンポーネント
├── lib/                   # ユーティリティ・設定
├── prisma/                # データベーススキーマ
└── types/                 # TypeScript型定義
```

## 主要APIエンドポイント

| メソッド | パス | 説明 |
|--------|------|------|
| POST | `/api/auth/register` | 新規ユーザー登録 |
| GET/PUT | `/api/users/me` | 自分のプロフィール |
| GET | `/api/users/me/wallet` | ウォレット残高 |
| POST | `/api/checkin/verify-location` | 位置情報チェックイン |
| POST | `/api/checkin/scan-qr` | QRスキャンでどんぐり獲得 |
| POST | `/api/tokens/boil` | どんぐりをゆでる |
| POST | `/api/tokens/exchange-leaves` | 葉っぱ→どんぐり交換 |
| GET | `/api/shops` | 近くの加盟店一覧 |

## Vercelへのデプロイ

1. [Vercel](https://vercel.com) にアカウントを作成
2. GitHubリポジトリをインポート
3. 環境変数を設定（`.env.local` の内容と同じ）
4. デプロイ実行

cronジョブ（毎日深夜0時にどんぐりの期限切れ処理）は `vercel.json` で設定済みです。

---

## ライセンス

MIT
