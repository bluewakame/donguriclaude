"use client";
// 履歴タブ切り替えコンポーネント
import { useState } from "react";

interface VisitLog {
  id: string;
  visitedAt: Date;
  acornEarned: number;
  isGolden: boolean;
  shop: { name: string; address: string };
}

interface TokenTransaction {
  id: string;
  type: string;
  amount: number;
  tokenType: string;
  note: string | null;
  createdAt: Date;
}

interface HistoryTabsProps {
  visitLogs: VisitLog[];
  tokenTransactions: TokenTransaction[];
}

function getTransactionMeta(type: string, tokenType: string) {
  const tokenEmoji =
    tokenType === "acorn" ? "🌰" : tokenType === "leaf" ? "🍃" : "✨";
  switch (type) {
    case "earn":
      return { label: "獲得", color: "text-green-600", prefix: "+", tokenEmoji };
    case "spend":
      return { label: "利用", color: "text-red-500", prefix: "-", tokenEmoji };
    case "expire":
      return { label: "消滅", color: "text-gray-400", prefix: "-", tokenEmoji };
    case "boil":
      return { label: "ゆでた", color: "text-orange-500", prefix: "", tokenEmoji: "🫕" };
    case "exchange":
      return {
        label: "交換",
        color: "text-blue-500",
        prefix: tokenType === "acorn" ? "+" : "-",
        tokenEmoji,
      };
    default:
      return { label: type, color: "text-gray-600", prefix: "", tokenEmoji };
  }
}

export default function HistoryTabs({
  visitLogs,
  tokenTransactions,
}: HistoryTabsProps) {
  const [activeTab, setActiveTab] = useState<"visit" | "token">("visit");

  return (
    <div>
      {/* タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("visit")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "visit"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📍 来店履歴
        </button>
        <button
          onClick={() => setActiveTab("token")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "token"
              ? "bg-white text-green-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          💰 取引履歴
        </button>
      </div>

      {/* 来店履歴 */}
      {activeTab === "visit" && (
        <div>
          {visitLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🏪</div>
              <p className="font-medium">まだ来店履歴がありません</p>
              <p className="text-sm mt-1">お店のQRをスキャンしてどんぐりをゲット！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visitLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {log.shop.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.shop.address}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.visitedAt).toLocaleDateString("ja-JP", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-none">
                      {log.isGolden ? (
                        <span className="text-yellow-500 font-bold">
                          ✨ 金のどんぐり！
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold">
                          +🌰 {log.acornEarned}個
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 取引履歴 */}
      {activeTab === "token" && (
        <div>
          {tokenTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">📋</div>
              <p className="font-medium">まだ取引履歴がありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokenTransactions.map((tx) => {
                const { label, color, prefix, tokenEmoji } =
                  getTransactionMeta(tx.type, tx.tokenType);
                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-xl border border-gray-200 p-3 flex justify-between items-center gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 ${color}`}
                        >
                          {label}
                        </span>
                        {tx.note && (
                          <p className="text-sm text-gray-600 truncate">
                            {tx.note}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(tx.createdAt).toLocaleDateString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`font-bold flex-none ${color}`}>
                      {prefix}
                      {tokenEmoji}
                      {tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
