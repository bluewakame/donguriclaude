"use client";
// ユーザー管理ページ（ロール変更）
import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  acornBalance: number;
  createdAt: string;
};

const ROLE_LABEL: Record<string, string> = {
  user: "一般ユーザー",
  merchant: "加盟店",
  admin: "管理者",
};

const ROLE_COLOR: Record<string, string> = {
  user: "bg-gray-100 text-gray-800",
  merchant: "bg-blue-100 text-blue-800",
  admin: "bg-purple-100 text-purple-800",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ userId: string; newRole: string } | null>(null);

  const fetchUsers = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      const q = searchQuery ?? search;
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.ok) {
        setUsers(data.data);
        if (data.currentUserId) {
          setCurrentUserId(data.currentUserId);
        }
      } else {
        setMessage({ type: "error", text: data.message ?? "データの取得に失敗しました" });
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setProcessing(userId);
    setMessage(null);
    setConfirmTarget(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: data.message });
        fetchUsers();
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
        <h1 className="text-2xl font-bold text-gray-800">ユーザー管理</h1>
        <p className="text-gray-500 text-sm">ユーザーのロールを変更できます</p>
      </header>

      {/* 検索・フィルター */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="名前またはメールで検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            検索
          </button>
        </form>
        <div className="flex gap-2">
          {[
            { value: "", label: "全員" },
            { value: "user", label: "一般" },
            { value: "merchant", label: "加盟店" },
            { value: "admin", label: "管理者" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                roleFilter === opt.value
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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

      {/* 確認ダイアログ */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">ロール変更の確認</h3>
            <p className="text-sm text-gray-600 mb-4">
              このユーザーのロールを
              <span className="font-bold"> {ROLE_LABEL[confirmTarget.newRole]} </span>
              に変更しますか？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleRoleChange(confirmTarget.userId, confirmTarget.newRole)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                変更する
              </button>
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg text-sm transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ユーザーリスト */}
      {loading ? (
        <p className="text-gray-400 text-center py-12">読み込み中...</p>
      ) : users.length === 0 ? (
        <p className="text-gray-400 text-center py-12">該当するユーザーはいません</p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <div key={user.id} className={`bg-white rounded-xl border p-4 ${isSelf ? "border-purple-300 ring-1 ring-purple-200" : "border-gray-200"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-800 truncate">
                        {user.displayName ?? "（未設定）"}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[user.role]}`}>
                        {ROLE_LABEL[user.role] ?? user.role}
                      </span>
                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          自分
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">
                      残高: {user.acornBalance} どんぐり / 登録: {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isSelf ? (
                      <span className="text-xs text-gray-400">変更不可</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          setConfirmTarget({ userId: user.id, newRole: e.target.value })
                        }
                        disabled={processing === user.id}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
                      >
                        <option value="user">一般ユーザー</option>
                        <option value="merchant">加盟店</option>
                        <option value="admin">管理者</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
