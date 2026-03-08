"use client";
// 加盟店オーナー管理画面
import { useState } from "react";

export default function MerchantDashboard() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 現在地を取得
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toString());
          setLongitude(pos.coords.longitude.toString());
        },
        () => {
          setMessage({ type: "error", text: "位置情報の取得に失敗しました" });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/merchant/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setMessage({ type: "success", text: "加盟店の登録申請が完了しました！審査後に有効化されます。" });
        setName("");
        setAddress("");
        setLatitude("");
        setLongitude("");
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">加盟店登録</h1>
        <p className="text-gray-500 text-sm">あなたの店舗をどんぐりに登録しよう</p>
      </header>

      {/* 登録フォーム */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 ${
              message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">店舗名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="どんぐりカフェ 〇〇店"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="東京都渋谷区〇〇1-1-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">位置情報</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                step="any"
                className="px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="緯度 (例: 35.6812)"
              />
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                step="any"
                className="px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="経度 (例: 139.7671)"
              />
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="text-sm text-green-600 hover:underline flex items-center gap-1"
            >
              📍 現在地を自動入力
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "申請中..." : "加盟店として申請する"}
          </button>
        </form>
      </div>

      {/* 説明 */}
      <div className="mt-4 bg-blue-50 rounded-xl p-4">
        <h3 className="font-medium text-blue-800 mb-2">📋 加盟店になるには</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>上のフォームに店舗情報を入力して申請</li>
          <li>運営による審査（数日以内）</li>
          <li>審査後、QRコードが発行されます</li>
          <li>店舗にQRコードを設置してスタート！</li>
        </ol>
      </div>
    </div>
  );
}
