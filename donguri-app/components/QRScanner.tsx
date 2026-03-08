"use client";
// QRスキャンコンポーネント（jsQR使用）
import { useState, useRef, useCallback } from "react";

interface ScanResult {
  ok: boolean;
  acornEarned?: number;
  isGolden?: boolean;
  newBalance?: number;
  message: string;
}

export default function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [shopId, setShopId] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // QRコードをデコード（jsQRを動的インポート）
  const decodeQR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(decodeQR);
      return;
    }

    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    try {
      // jsQRを動的インポート
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && !isProcessing) {
        setIsProcessing(true);
        stopScanning();
        await handleQRDetected(code.data);
        return;
      }
    } catch (err) {
      console.error("QRデコードエラー:", err);
    }

    if (isScanning) {
      animFrameRef.current = requestAnimationFrame(decodeQR);
    }
  }, [isScanning, isProcessing]);

  // QRコードが検出されたときの処理
  const handleQRDetected = async (qrData: string) => {
    if (!shopId.trim()) {
      setError("店舗IDを入力してください");
      setIsProcessing(false);
      return;
    }

    try {
      const res = await fetch("/api/checkin/scan-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shopId.trim(), qrToken: qrData }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, message: "通信エラーが発生しました" });
    } finally {
      setIsProcessing(false);
    }
  };

  // スキャン開始
  const startScanning = async () => {
    setError("");
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsScanning(true);
      animFrameRef.current = requestAnimationFrame(decodeQR);
    } catch {
      setError("カメラへのアクセスが許可されていません。設定から許可してください。");
    }
  };

  // スキャン停止
  const stopScanning = () => {
    setIsScanning(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 店舗ID入力（デバッグ用・本来はQRコードから取得） */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          店舗ID（店舗のQRコードに含まれています）
        </label>
        <input
          type="text"
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
          placeholder="店舗IDを入力..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* カメラ映像 */}
      <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!isScanning ? "hidden" : ""}`}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-6xl mb-3">📷</div>
            <p className="text-sm opacity-70">スキャン待機中</p>
          </div>
        )}

        {/* スキャンエリアのガイド */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-white rounded-lg opacity-70">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg -translate-x-px -translate-y-px" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg translate-x-px -translate-y-px" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg -translate-x-px translate-y-px" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg translate-x-px translate-y-px" />
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">⌛</div>
              <p className="text-sm">処理中...</p>
            </div>
          </div>
        )}
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div
          className={`p-4 rounded-xl text-center ${
            result.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          }`}
        >
          {result.ok ? (
            <>
              <div className="text-5xl mb-2">{result.isGolden ? "✨" : "🌰"}</div>
              <p className="font-bold text-green-700 text-lg">{result.message}</p>
              <p className="text-green-600 text-sm mt-1">残高: 🌰 {result.newBalance}個</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">😢</div>
              <p className="text-red-600">{result.message}</p>
            </>
          )}
        </div>
      )}

      {/* スキャンボタン */}
      <div className="flex gap-3">
        {!isScanning ? (
          <button
            onClick={startScanning}
            disabled={isProcessing}
            className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            📷 スキャン開始
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex-1 bg-red-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-600 transition-colors"
          >
            停止
          </button>
        )}
      </div>
    </div>
  );
}
