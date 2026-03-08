// ============================================================
// どんぐりアプリ 共通型定義
// ============================================================

// ユーザー情報
export interface User {
  id: string;
  email: string;
  displayName: string;
  acornBalance: number;
  leafBalance: number;
  goldenAcornBalance: number;
  lastBoiledAt: Date | null;
  createdAt: Date;
}

// 加盟店情報
export interface Shop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isPremium: boolean;
  acornAmount: number;
  goldenProbability: number;
  qrCodeToken: string;
  qrExpiresAt: Date;
  createdAt: Date;
  // 距離（検索時に付与）
  distance?: number;
}

// 来店履歴
export interface VisitLog {
  id: string;
  userId: string;
  shopId: string;
  visitedAt: Date;
  acornEarned: number;
  isGolden: boolean;
  shop?: Pick<Shop, "id" | "name" | "address">;
}

// トークン取引種別
export type TransactionType = "earn" | "spend" | "expire" | "boil" | "exchange";

// トークン種別
export type TokenType = "acorn" | "leaf" | "golden_acorn";

// トークン取引履歴
export interface TokenTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  tokenType: TokenType;
  note?: string | null;
  createdAt: Date;
}

// どんぐり有効期限
export interface AcornExpiry {
  id: string;
  userId: string;
  amount: number;
  earnedAt: Date;
  expiresAt: Date;
  isExpired: boolean;
}

// ============================================================
// APIレスポンス型
// ============================================================

// 共通APIレスポンス
export interface ApiResponse<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

// 位置情報チェックインレスポンス
export interface VerifyLocationResponse {
  ok: boolean;
  message: string;
}

// QRスキャンレスポンス
export interface ScanQrResponse {
  ok: boolean;
  acornEarned: number;
  isGolden: boolean;
  newBalance: number;
  message: string;
}

// どんぐりをゆでるレスポンス
export interface BoilResponse {
  ok: boolean;
  resetCount: number;
  newExpiresAt: string;
  message: string;
}

// 葉っぱ→どんぐり交換レスポンス
export interface ExchangeLeavesResponse {
  ok: boolean;
  leafSpent: number;
  acornGained: number;
  newLeafBalance: number;
  newAcornBalance: number;
  message: string;
}

// ウォレット情報
export interface WalletInfo {
  acornBalance: number;
  leafBalance: number;
  goldenAcornBalance: number;
  lastBoiledAt: string | null;
  expiringAcorns: AcornExpiry[];
}

// ============================================================
// リクエスト型
// ============================================================

// 位置情報チェックインリクエスト
export interface VerifyLocationRequest {
  shopId: string;
  latitude: number;
  longitude: number;
}

// QRスキャンリクエスト
export interface ScanQrRequest {
  shopId: string;
  qrToken: string;
}

// 葉っぱ→どんぐり交換リクエスト
export interface ExchangeLeavesRequest {
  leafAmount: number;
}

// 加盟店登録申請リクエスト
export interface RegisterShopRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// ============================================================
// 地図関連
// ============================================================

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface ShopMarker extends Shop {
  position: MapPosition;
}
