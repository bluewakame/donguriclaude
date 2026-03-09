"use client";
// チュートリアルモーダル（新規ユーザー向け7ステップガイド）
import { useState, useEffect } from "react";

const TUTORIAL_STEPS = [
  {
    emoji: "🌰",
    title: "どんぐりへようこそ！",
    description:
      "「どんぐり」は、街を歩いて冒険するソーシャルゲームです。歩くほど、探索するほど、どんぐりが集まります。さあ、冒険を始めましょう！",
  },
  {
    emoji: "🗺️",
    title: "地図を探索して葉っぱを集めよう",
    description:
      "マップページでは、あなたの現在地周辺に葉っぱが出現します。30m以上歩くと新しい葉っぱが生えてくるので、街を歩いて集めましょう！葉っぱには🌿普通の葉、🍂紅葉の葉、🌸花びら（レア）の3種類があります。",
  },
  {
    emoji: "🔄",
    title: "葉っぱをどんぐりに交換しよう",
    description:
      "集めた葉っぱは、どんぐりと交換できます。葉っぱ10枚でどんぐり1個になります。ウォレットページから「葉っぱをどんぐりに交換」を使いましょう。",
  },
  {
    emoji: "📷",
    title: "お店のQRコードをスキャンしよう",
    description:
      "加盟店のQRコードをスキャンすると、どんぐりがもらえます！まれに✨金のどんぐりが当たることも。お店に1日1回スキャンできます。",
  },
  {
    emoji: "✨",
    title: "金のどんぐりショップ",
    description:
      "金のどんぐりは特別なアイテムと交換できます。「どんぐりブースト」（+5個）、「葉っぱ袋」（+10枚）、「シールド」（有効期限延長）の3種類があります。",
  },
  {
    emoji: "⏳",
    title: "どんぐりをゆでて長持ちさせよう",
    description:
      "どんぐりには有効期限があります！期限が切れる前にウォレットの「ゆでる」ボタンを押すと、7日間延長できます。大切などんぐりを守りましょう。",
  },
  {
    emoji: "🌳",
    title: "森を育てよう！",
    description:
      "どんぐりを10個集めるたびに、あなたの森に木が1本育ちます。どんぐりを集め続けて、大きな森を作りましょう。さあ、冒険の始まりです！",
  },
] as const;

const STORAGE_KEY = "donguri_tutorial_done";

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // チュートリアル未完了のユーザーにのみ表示
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[700] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-green-600 px-6 pt-6 pb-4 text-white text-center">
          <div className="text-5xl mb-3">{current.emoji}</div>
          <h2 className="text-xl font-bold">{current.title}</h2>
        </div>

        {/* 本文 */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* 進捗ドット */}
        <div className="flex justify-center gap-1.5 pb-3">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? "bg-green-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* ステップ表示 */}
        <div className="text-center text-xs text-gray-400 pb-2">
          {step + 1} / {TUTORIAL_STEPS.length}
        </div>

        {/* ボタン */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 ? (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← 前へ
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-400 text-sm hover:bg-gray-50 transition-colors"
            >
              スキップ
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-green-600 rounded-xl text-white text-sm font-bold hover:bg-green-700 transition-colors"
          >
            {isLast ? "🌳 はじめる！" : "次へ →"}
          </button>
        </div>
      </div>
    </div>
  );
}
