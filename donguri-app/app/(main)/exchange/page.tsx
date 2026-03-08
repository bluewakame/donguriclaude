"use client";
// 葉っぱ→どんぐり交換ページ
import { useState, useEffect } from "react";

export default function ExchangePage() {
  const [leafBalance, setLeafBalance] = useState(0);
  const [acornBalance, setAcornBalance] = useState(0);
  const [leafAmount, setLeafAmount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 残高を取得
  useEffect(() => {
    fetch("/api/users/me/wallet")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setLeafBalance(data.data.leafBalance);
          setAcornBalance(data.data.acornBalance);
        }
      });
  }, []);

  const acornPreview = Math.floor(leafAmount / 10);

  const handleExchange = async () => {
    if (leafAmount < 10 || leafAmount % 10 !== 0) {
      setMessage({ type: "error", text: "葉っぱは10枚単位で交換できます" });
      return;
    }
    if (leafAmount > leafBalance) {
      setMessage({ type: "error", text: "葉っぱが足りません" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/tokens/exchange-leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leafAmount }),
      });
      const data = await res.json();

      if (data.ok) {
        setLeafBalance(data.newLeafBalance);
        setAcornBalance(data.newAcornBalance);
        setMessage({ type: "success", text: data.message });
        setLeafAmount(10);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-6 text-center">
        <div className="text-6xl mb-3">🍃</div>
        <h1 className="text-2xl font-bold text-gray-800">葉っぱを交換</h1>
        <p className="text-gray-500 text-sm mt-1">葉っぱ10枚 = どんぐり1個</p>
      </header>

      {/* 現在の残高 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">葉っぱ</p>
          <div className="text-3xl font-bold text-green-700">🍃 {leafBalance}</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">どんぐり</p>
          <div className="text-3xl font-bold text-amber-700">🌰 {acornBalance}</div>
        </div>
      </div>

      {/* 交換フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-bold text-gray-700 mb-4">交換する枚数</h2>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setLeafAmount(Math.max(10, leafAmount - 10))}
            className="w-10 h-10 rounded-full border-2 border-gray-300 font-bold text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-bold text-gray-800">🍃 {leafAmount}</span>
          </div>
          <button
            onClick={() => setLeafAmount(Math.min(leafBalance, leafAmount + 10))}
            className="w-10 h-10 rounded-full border-2 border-gray-300 font-bold text-gray-600 hover:border-green-500 hover:text-green-600 transition-colors"
          >
            ＋
          </button>
        </div>

        {/* 交換後のプレビュー */}
        <div className="bg-gray-50 rounded-lg p-3 text-center mb-4">
          <p className="text-sm text-gray-500">交換後に獲得できるどんぐり</p>
          <p className="text-2xl font-bold text-green-700">🌰 {acornPreview}個</p>
        </div>

        {/* メッセージ */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* 交換ボタン */}
        <button
          onClick={handleExchange}
          disabled={isLoading || leafAmount > leafBalance || acornPreview === 0}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "交換中..." : `葉っぱ${leafAmount}枚をどんぐり${acornPreview}個に交換`}
        </button>
      </div>

      {/* 説明 */}
      <div className="mt-4 bg-blue-50 rounded-xl p-4">
        <h3 className="font-medium text-blue-800 mb-2">🍃 葉っぱって何？</h3>
        <p className="text-sm text-blue-700">
          葉っぱはキャンペーンや特別なアクションでもらえます。
          10枚集めるとどんぐり1個と交換できます。
        </p>
      </div>
    </div>
  );
}
