"use client";
// 加盟店オーナー管理画面
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

interface Shop {
  id: string;
  name: string;
  address: string;
  status: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "審査中", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "承認済み", className: "bg-green-100 text-green-700" },
  rejected: { label: "却下", className: "bg-red-100 text-red-600" },
};

export default function MerchantDashboard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    try {
      const res = await fetch("/api/merchant/shops");
      const data = await res.json();
      if (data.ok) setShops(data.data);
    } catch {
      // 無視
    } finally {
      setShopsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

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
        fetchShops();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (shopId: string, shopName: string) => {
    if (!confirm(`「${shopName}」を削除しますか？この操作は取り消せません。`)) return;

    setDeletingId(shopId);
    try {
      const res = await fetch(`/api/merchant/shops/${shopId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.ok) {
        setShops((prev) => prev.filter((s) => s.id !== shopId));
      } else {
        alert(data.message ?? "削除に失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-20">
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

          {/* 自分の店舗一覧 */}
          <div className="mt-6">
            <h2 id="registered-shops" className="text-lg font-bold text-gray-800 mb-3">登録した店舗</h2>
            {shopsLoading ? (
              <p className="text-sm text-gray-500">読み込み中...</p>
            ) : shops.length === 0 ? (
              <p className="text-sm text-gray-500">まだ店舗を登録していません</p>
            ) : (
              <ul className="space-y-3">
                {shops.map((shop) => {
                  const statusInfo = STATUS_LABEL[shop.status] ?? { label: shop.status, className: "bg-gray-100 text-gray-600" };
                  return (
                    <li key={shop.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-gray-800 truncate">{shop.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{shop.address}</p>
                      </div>
                      <div className="shrink-0 flex flex-col gap-1.5">
                        {shop.status === "approved" && (
                          <button
                            onClick={() => router.push(`/merchant/shops/${shop.id}/qr`)}
                            className="text-sm text-green-600 hover:text-green-800 border border-green-300 hover:border-green-500 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            🌰 QRコード
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(shop.id, shop.name)}
                          disabled={deletingId === shop.id}
                          className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === shop.id ? "削除中..." : "削除"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
