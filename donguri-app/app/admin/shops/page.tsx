"use client";
// 加盟店審査ページ
import { useEffect, useState } from "react";

type Shop = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "審査中",
  approved: "承認済み",
  rejected: "却下",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filter, setFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchShops = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shops?status=${status}`);
      const data = await res.json();
      if (data.ok) {
        setShops(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops(filter);
  }, [filter]);

  const handleAction = async (shopId: string, action: "approve" | "reject") => {
    setProcessing(shopId);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNote: reviewNote[shopId] ?? "" }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: data.message });
        fetchShops(filter);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">加盟店 審査管理</h1>
        <p className="text-gray-500 text-sm">加盟店の申請を承認・却下できます</p>
      </header>

      {/* フィルタータブ */}
      <div className="flex gap-2 mb-6">
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* メッセージ */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 店舗リスト */}
      {loading ? (
        <p className="text-gray-400 text-center py-12">読み込み中...</p>
      ) : shops.length === 0 ? (
        <p className="text-gray-400 text-center py-12">該当する加盟店はありません</p>
      ) : (
        <div className="space-y-4">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-800 truncate">{shop.name}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[shop.status]}`}>
                      {STATUS_LABEL[shop.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{shop.address}</p>
                  <p className="text-xs text-gray-400">
                    申請日: {new Date(shop.createdAt).toLocaleString("ja-JP")}
                  </p>
                  {shop.reviewedAt && (
                    <p className="text-xs text-gray-400">
                      審査日: {new Date(shop.reviewedAt).toLocaleString("ja-JP")}
                    </p>
                  )}
                  {shop.reviewNote && (
                    <p className="text-xs text-gray-500 mt-1 italic">備考: {shop.reviewNote}</p>
                  )}
                </div>
              </div>

              {/* 審査中の場合のみ承認・却下ボタンを表示 */}
              {shop.status === "pending" && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <textarea
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                    rows={2}
                    placeholder="審査メモ（任意）"
                    value={reviewNote[shop.id] ?? ""}
                    onChange={(e) =>
                      setReviewNote((prev) => ({ ...prev, [shop.id]: e.target.value }))
                    }
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(shop.id, "approve")}
                      disabled={processing === shop.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      承認する
                    </button>
                    <button
                      onClick={() => handleAction(shop.id, "reject")}
                      disabled={processing === shop.id}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      却下する
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
