"use client";
// 金のどんぐりショップページ
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ShopItem {
  key: "boost" | "leaves" | "shield";
  emoji: string;
  label: string;
  description: string;
  goldCost: number;
  detail: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    key: "boost",
    emoji: "🌰",
    label: "どんぐりブースト",
    description: "どんぐりを5個すぐにゲット！",
    goldCost: 1,
    detail: "金のどんぐり1個で、どんぐりを5個獲得できます。",
  },
  {
    key: "leaves",
    emoji: "🍃",
    label: "葉っぱ袋",
    description: "葉っぱを10枚まとめてゲット！",
    goldCost: 2,
    detail: "金のどんぐり2個で、葉っぱを10枚獲得できます。",
  },
  {
    key: "shield",
    emoji: "🛡️",
    label: "シールド",
    description: "どんぐりの有効期限を24時間延長！",
    goldCost: 3,
    detail: "金のどんぐり3個で、持っているすべてのどんぐりの有効期限を24時間延ばします。",
  },
];

export default function ShopPage() {
  const router = useRouter();
  const [goldenBalance, setGoldenBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // 残高を取得
  useEffect(() => {
    fetch("/api/users/me/wallet")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setGoldenBalance(data.data.goldenAcornBalance ?? 0);
      })
      .catch(() => setGoldenBalance(0));
  }, []);

  const handlePurchase = async (item: ShopItem) => {
    if (loading) return;
    if (goldenBalance !== null && goldenBalance < item.goldCost) {
      setMessage({ text: `金のどんぐりが足りません（必要: ${item.goldCost}個）`, ok: false });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/shop/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: item.key }),
      });
      const data = await res.json();

      if (data.ok) {
        setMessage({ text: data.message, ok: true });
        // 残高を更新
        setGoldenBalance((prev) => (prev !== null ? prev - item.goldCost : null));
      } else {
        setMessage({ text: data.error ?? "購入に失敗しました", ok: false });
      }
    } catch {
      setMessage({ text: "通信エラーが発生しました", ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-green-600 text-sm mb-3 flex items-center gap-1"
        >
          ← 戻る
        </button>
        <h1 className="text-2xl font-bold text-gray-800">✨ 金のどんぐりショップ</h1>
        <p className="text-gray-500 text-sm">金のどんぐりをアイテムと交換しよう</p>
      </header>

      {/* 残高表示 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✨</span>
          <span className="font-medium text-yellow-800">保有中の金のどんぐり</span>
        </div>
        <div className="text-2xl font-bold text-yellow-700">
          {goldenBalance !== null ? goldenBalance : "..."}個
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-xl text-sm font-medium ${
            message.ok
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* アイテム一覧 */}
      <div className="space-y-4">
        {SHOP_ITEMS.map((item) => {
          const canAfford = goldenBalance !== null && goldenBalance >= item.goldCost;
          return (
            <div
              key={item.key}
              className={`bg-white border rounded-2xl p-4 shadow-sm ${
                canAfford ? "border-green-200" : "border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="bg-green-100 rounded-xl p-3 text-3xl">{item.emoji}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{item.label}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.detail}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1 text-yellow-600 font-bold">
                  <span>✨</span>
                  <span>{item.goldCost}個</span>
                </div>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={!canAfford || loading}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
                    canAfford && !loading
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {loading ? "処理中..." : "交換する"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {goldenBalance === 0 && (
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>金のどんぐりはお店のQRスキャンでまれに獲得できます。</p>
          <p className="mt-1">冒険を続けてゲットしよう！</p>
        </div>
      )}
    </div>
  );
}
