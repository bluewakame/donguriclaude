"use client";
// ゆでるボタンコンポーネント
import { useState } from "react";
import { useRouter } from "next/navigation";

interface BoilButtonProps {
  currentBalance: number;
}

export default function BoilButton({ currentBalance }: BoilButtonProps) {
  const router = useRouter();
  const [isBoiling, setIsBoiling] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    resetCount?: number;
    newExpiresAt?: string;
    message: string;
  } | null>(null);

  const handleBoil = async () => {
    if (currentBalance === 0) return;

    setIsBoiling(true);
    setResult(null);

    try {
      const res = await fetch("/api/tokens/boil", { method: "POST" });
      if (res.status === 401) {
        // セッション切れの場合はログインページへ
        router.push("/login");
        return;
      }
      const data = await res.json();
      setResult(data);
      // ゆで成功後にサーバーデータを再取得（有効期限・最終ゆで日時を更新）
      if (data.ok) {
        router.refresh();
      }
    } catch {
      setResult({ ok: false, message: "通信エラーが発生しました" });
    } finally {
      setIsBoiling(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 結果表示 */}
      {result && (
        <div
          className={`p-4 rounded-xl text-center ${
            result.ok
              ? "bg-orange-50 border border-orange-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.ok ? (
            <>
              <div className="text-4xl mb-2">🫕</div>
              <p className="font-bold text-orange-700">{result.message}</p>
              {result.newExpiresAt && (
                <p className="text-sm text-orange-500 mt-1">
                  新しい有効期限:{" "}
                  {new Date(result.newExpiresAt).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </p>
              )}
            </>
          ) : (
            <p className="text-red-600">{result.message}</p>
          )}
        </div>
      )}

      {/* ゆでるボタン */}
      <button
        onClick={handleBoil}
        disabled={isBoiling || currentBalance === 0}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all
          ${isBoiling ? "boil-animate" : ""}
          ${
            currentBalance === 0
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600 shadow-lg hover:shadow-xl"
          }
        `}
      >
        {isBoiling ? "🫕 ゆでています..." : "🫕 どんぐりをゆでる"}
      </button>

      {currentBalance === 0 && (
        <p className="text-center text-sm text-gray-400">
          ゆでるどんぐりがありません
        </p>
      )}
    </div>
  );
}
