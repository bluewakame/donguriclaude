"use client";
// 加盟店オーナー向けQRコード表示ページ

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface ShopData {
  id: string;
  name: string;
  address: string;
  status: string;
  qrCodeToken: string;
  qrExpiresAt: string;
  acornAmount: number;
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "期限切れ";
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}分${seconds}秒`;
}

export default function ShopQrPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;

  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQrCanvas = useCallback(async (qrData: string) => {
    if (!canvasRef.current) return;
    const QRCode = (await import("qrcode")).default;
    await QRCode.toCanvas(canvasRef.current, qrData, {
      width: 280,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
  }, []);

  const fetchShop = useCallback(async () => {
    try {
      const res = await fetch(`/api/merchant/shops/${shopId}`);
      const data = await res.json();
      if (!data.ok) {
        setError(data.message ?? "店舗の取得に失敗しました");
        return;
      }
      setShop(data.data);
      const qrPayload = JSON.stringify({ shopId: data.data.id, qrToken: data.data.qrCodeToken });
      await generateQrCanvas(qrPayload);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, [shopId, generateQrCanvas]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  // カウントダウン更新 & 期限切れ時に自動リフレッシュ
  useEffect(() => {
    if (!shop) return;

    const interval = setInterval(async () => {
      const diff = new Date(shop.qrExpiresAt).getTime() - Date.now();
      setCountdown(formatCountdown(shop.qrExpiresAt));

      if (diff <= 0) {
        // 期限切れなら自動更新
        clearInterval(interval);
        await handleRefresh();
      }
    }, 1000);

    setCountdown(formatCountdown(shop.qrExpiresAt));

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.qrExpiresAt]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/merchant/shops/${shopId}/refresh-qr`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setShop((prev) => prev ? { ...prev, qrCodeToken: data.data.qrCodeToken, qrExpiresAt: data.data.qrExpiresAt } : prev);
        const qrPayload = JSON.stringify({ shopId, qrToken: data.data.qrCodeToken });
        await generateQrCanvas(qrPayload);
      }
    } catch {
      // エラーは無視して再試行可能に
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error ?? "店舗が見つかりません"}</p>
          <button onClick={() => router.push("/merchant/dashboard")} className="text-green-600 underline text-sm">
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  if (shop.status !== "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">審査中です</h2>
          <p className="text-sm text-gray-500 mb-6">
            店舗が承認されるとQRコードが発行されます。承認までしばらくお待ちください。
          </p>
          <button onClick={() => router.push("/merchant/dashboard")} className="text-green-600 underline text-sm">
            ダッシュボードに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/merchant/dashboard")} className="text-gray-500 hover:text-gray-700">
          ← 戻る
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-800">{shop.name}</h1>
          <p className="text-xs text-gray-500">どんぐり取得QRコード</p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-8">
        {/* QRコードカード */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">お客様にこのQRコードを読み取ってもらってください</p>
          <p className="text-xs text-green-700 font-medium mb-4">
            🌰 読み取ると {shop.acornAmount} どんぐりが獲得できます
          </p>

          {/* QRコードキャンバス */}
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white border-2 border-gray-200 rounded-xl inline-block">
              <canvas ref={canvasRef} />
            </div>
          </div>

          {/* 有効期限カウントダウン */}
          <div className="bg-amber-50 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-amber-600 mb-0.5">有効期限まで</p>
            <p className="text-2xl font-mono font-bold text-amber-700">{countdown}</p>
            <p className="text-xs text-amber-500 mt-0.5">
              {new Date(shop.qrExpiresAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} まで有効
            </p>
          </div>

          {/* 更新ボタン */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
          >
            {refreshing ? "更新中..." : "🔄 QRコードを今すぐ更新"}
          </button>
          <p className="text-xs text-gray-400 mt-2">QRコードは期限切れになると自動的に更新されます</p>
        </div>

        {/* 使い方説明 */}
        <div className="mt-4 bg-blue-50 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 text-sm mb-2">📋 使い方</h3>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
            <li>このQRコードを店舗のレジ付近などに表示する</li>
            <li>お客様がどんぐりアプリのスキャン機能で読み取る</li>
            <li>お客様のアプリにどんぐりが付与されます</li>
            <li>QRコードは1時間ごとに更新されます（セキュリティのため）</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
