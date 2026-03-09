// QRスキャンページ
import QRScanner from "@/components/QRScanner";

export default function ScanPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800">QRスキャン</h1>
        <p className="text-gray-500 text-sm mt-1">
          店舗のQRコードを読み取って
          <br />
          どんぐりをゲットしよう！
        </p>
      </header>

      {/* QRスキャナー */}
      <QRScanner />

      {/* 使い方 */}
      <div className="mt-6 bg-green-50 rounded-xl p-4">
        <h3 className="font-medium text-green-800 mb-2">📖 使い方</h3>
        <ol className="text-sm text-green-700 space-y-1.5 list-decimal list-inside">
          <li>提携店舗に来店する</li>
          <li>「スキャン開始」ボタンを押す</li>
          <li>店舗に設置されたQRコードにカメラを向ける</li>
          <li>どんぐりが自動で付与されます！</li>
        </ol>
        <p className="text-xs text-green-600 mt-2">
          ※ 同じ店舗は1日1回まで
        </p>
      </div>
    </div>
  );
}
