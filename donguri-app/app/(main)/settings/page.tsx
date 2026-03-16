"use client";
// プロフィール・設定ページ
import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setDisplayName(data.data.displayName);
          setEmail(data.data.email);
        }
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const data = await res.json();

      if (data.ok) {
        setMessage({ type: "success", text: "プロフィールを更新しました" });
        setIsEditing(false);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">設定</h1>
        <p className="text-gray-500 text-sm">プロフィールの管理</p>
      </header>

      {/* アバター */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mb-3">
          🌰
        </div>
        <p className="font-bold text-lg text-gray-800">{displayName}</p>
        <p className="text-gray-500 text-sm">{email}</p>
      </div>

      {/* プロフィール編集 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <h2 className="font-bold text-gray-700 mb-4">プロフィール</h2>

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

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              表示名
            </label>
            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-800 py-2">{displayName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              メールアドレス
            </label>
            <p className="text-gray-500 py-2 text-sm">{email}</p>
          </div>
        </div>

        {isEditing ? (
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || !displayName.trim()}
              className="flex-1 bg-green-600 text-white py-2 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? "保存中..." : "保存する"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="mt-4 w-full border border-green-600 text-green-600 py-2 rounded-xl font-medium hover:bg-green-50 transition-colors"
          >
            編集する
          </button>
        )}
      </div>

      {/* メニューリスト */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        <a
          href="/history"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span>📋</span>
            <span className="text-gray-700">来店・取引履歴</span>
          </span>
          <span className="text-gray-400">›</span>
        </a>
        <a
          href="/shops"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span>🏪</span>
            <span className="text-gray-700">加盟店一覧</span>
          </span>
          <span className="text-gray-400">›</span>
        </a>
        <a
          href="/merchant/dashboard"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 border-b border-gray-100 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span>🏷️</span>
            <span className="text-gray-700">加盟店として登録</span>
          </span>
          <span className="text-gray-400">›</span>
        </a>
        <a
          href="/merchant/dashboard#registered-shops"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <span className="flex items-center gap-3">
            <span>📌</span>
            <span className="text-gray-700">登録した店舗</span>
          </span>
          <span className="text-gray-400">›</span>
        </a>
      </div>

      {/* ログアウト */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors"
      >
        ログアウト
      </button>
    </div>
  );
}
