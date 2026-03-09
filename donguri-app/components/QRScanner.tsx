"use client";
// QRスキャンコンポーネント（jsQR使用）
// QRコードのJSON形式: {"shopId":"...","qrToken":"..."}
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
  // Refでスキャン中・処理中の状態を管理（クロージャの古い値参照を防ぐ）
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);

  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // スキャン停止
  const stopScanning = useCallback(() => {
    isScanningRef.current = false;
    setIsScanning(false);
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // QRコードのJSONをパースしてAPIに送信
  const processQRData = useCallback(
    async (qrData: string) => {
      let shopId: string;
      let qrToken: string;

      // JSON形式: {"shopId":"...","qrToken":"..."} をパース
      try {
        const parsed = JSON.parse(qrData);
        shopId = parsed.shopId;
        qrToken = parsed.qrToken;
      } catch {
        setError("QRコードの形式が正しくありません");
        isProcessingRef.current = false;
        setIsProcessing(false);
        return;
      }

      if (!shopId || !qrToken) {
        setError("QRコードに必要な情報が含まれていません");
        isProcessingRef.current = false;
        setIsProcessing(false);
        return;
      }

      try {
        const res = await fetch("/api/checkin/scan-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, qrToken }),
        });
        const data = await res.json();
        setResult(data);
      } catch {
        setResult({ ok: false, message: "通信エラーが発生しました" });
      } finally {
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    },
    []
  );

  // フレームごとにQRコードを検出するループ
  const startDecodeLoop = useCallback(() => {
    const loop = async () => {
      if (!isScanningRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (!isProcessingRef.current) {
        try {
          const jsQR = (await import("jsqr")).default;
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            isProcessingRef.current = true;
            setIsProcessing(true);
            stopScanning();
            processQRData(code.data);
            return;
          }
        } catch {
          // デコードエラー時はループ継続
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [stopScanning, processQRData]);

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

      isScanningRef.current = true;
      setIsScanning(true);
      startDecodeLoop();
    } catch {
      setError(
        "カメラへのアクセスが許可されていません。設定から許可してください。"
      );
    }
  };

  const handleReset = () => {
    setResult(null);
    setError("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* カメラ映像エリア */}
      <div className="relative bg-black rounded-xl overflow-hidden aspect-square">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${!isScanning ? "hidden" : ""}`}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* 待機中の表示 */}
        {!isScanning && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-6xl mb-3">📷</div>
            <p className="text-sm opacity-70">スキャン待機中</p>
          </div>
        )}

        {/* スキャンガイド枠 */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-52 h-52">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-green-400 opacity-60 animate-pulse" />
            </div>
          </div>
        )}

        {/* 処理中オーバーレイ */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-white gap-3">
            <div className="text-5xl animate-bounce">🌰</div>
            <p className="text-sm font-medium">どんぐり確認中...</p>
          </div>
        )}
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div
          className={`p-5 rounded-xl text-center ${
            result.ok
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.ok ? (
            <>
              <div className="text-5xl mb-3">
                {result.isGolden ? "✨" : "🌰"}
              </div>
              <p className="font-bold text-green-700 text-lg">
                {result.message}
              </p>
              <p className="text-green-600 text-sm mt-1">
                残高: 🌰 {result.newBalance}個
              </p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">😢</div>
              <p className="text-red-600">{result.message}</p>
            </>
          )}
        </div>
      )}

      {/* ボタン */}
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
        {result && (
          <button
            onClick={handleReset}
            className="flex-1 border border-gray-300 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            もう一度
          </button>
        )}
      </div>
    </div>
  );
}
