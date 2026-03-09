"use client";
// Google Maps コンポーネント（葉っぱスポーン機能付き）
import { useEffect, useRef, useState, useCallback } from "react";

interface Shop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isPremium: boolean;
  acornAmount: number;
  distance?: number;
}

interface LeafMarker {
  id: string;
  lat: number;
  lng: number;
  emoji: string;
}

// 葉っぱの絵文字ランダム選択（重み付き）
const LEAF_EMOJIS = [
  { emoji: "🌿", weight: 75 },
  { emoji: "🍂", weight: 20 },
  { emoji: "🌸", weight: 5 },
];

function pickLeafEmoji(): string {
  const total = LEAF_EMOJIS.reduce((s, l) => s + l.weight, 0);
  let r = Math.random() * total;
  for (const l of LEAF_EMOJIS) {
    r -= l.weight;
    if (r <= 0) return l.emoji;
  }
  return "🌿";
}

// 2点間のハバーサイン距離（メートル）
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 指定座標の周囲~110m以内のランダムな位置を返す
function randomNearby(lat: number, lng: number): { lat: number; lng: number } {
  const radius = 0.001; // 約110m
  return {
    lat: lat + (Math.random() - 0.5) * radius * 2,
    lng: lng + (Math.random() - 0.5) * radius * 2,
  };
}

const SPAWN_DISTANCE_M = 30;    // 30m移動で葉っぱ出現
const SPAWN_COOLDOWN_MS = 60000; // 最低60秒間隔
const INITIAL_LEAF_COUNT = 5;    // 最初の位置情報取得時に出現する葉っぱ数

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafMarkers, setLeafMarkers] = useState<LeafMarker[]>([]);
  const [collectMessage, setCollectMessage] = useState<string | null>(null);

  // スポーン追跡（Ref: 再レンダリングせずに持つ）
  const lastSpawnLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const hasInitialSpawnRef = useRef(false);
  const mapInstanceRef = useRef<unknown>(null);

  // 近くの店舗を取得
  const fetchNearbyShops = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/shops?latitude=${lat}&longitude=${lng}&radius=10000`);
      const data = await res.json();
      if (data.ok) setShops(data.data);
    } catch (err) {
      console.error("店舗データ取得エラー:", err);
    }
  };

  // 葉っぱをスポーンする
  const spawnLeaves = useCallback((lat: number, lng: number, count: number) => {
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < SPAWN_COOLDOWN_MS && count === 1) return;

    const newLeaves: LeafMarker[] = Array.from({ length: count }).map(() => ({
      id: crypto.randomUUID(),
      ...randomNearby(lat, lng),
      emoji: pickLeafEmoji(),
    }));

    setLeafMarkers((prev) => [...prev, ...newLeaves]);
    lastSpawnLocationRef.current = { lat, lng };
    lastSpawnTimeRef.current = now;
  }, []);

  // 葉っぱを収集する
  const collectLeaf = useCallback(async (leafId: string, lat: number, lng: number) => {
    // 即座にUIから削除
    setLeafMarkers((prev) => prev.filter((l) => l.id !== leafId));

    try {
      const res = await fetch("/api/leaves/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leafId, latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (data.ok) {
        setCollectMessage(data.message);
        setTimeout(() => setCollectMessage(null), 3000);
      }
    } catch {
      // サイレントエラー
    }
  }, []);

  // ユーザーの現在地を取得・追跡
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);

        // 最初の位置情報取得時に葉っぱをスポーン
        if (!hasInitialSpawnRef.current) {
          hasInitialSpawnRef.current = true;
          fetchNearbyShops(loc.lat, loc.lng);
          spawnLeaves(loc.lat, loc.lng, INITIAL_LEAF_COUNT);
          return;
        }

        // 移動距離を確認して葉っぱをスポーン
        if (lastSpawnLocationRef.current) {
          const dist = haversineDistance(
            lastSpawnLocationRef.current.lat,
            lastSpawnLocationRef.current.lng,
            loc.lat,
            loc.lng
          );
          if (dist >= SPAWN_DISTANCE_M) {
            spawnLeaves(loc.lat, loc.lng, 1);
          }
        }
      },
      () => {
        // 位置情報取得失敗時は東京駅をデフォルト
        fetchNearbyShops(35.6812, 139.7671);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [spawnLeaves]);

  // Google Maps を初期化
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || mapLoaded) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;

    (window as unknown as Record<string, unknown>).initMap = () => {
      setMapLoaded(true);
    };

    document.head.appendChild(script);
  }, [mapLoaded]);

  // 地図にマーカーを表示（店舗・ユーザー位置）
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const center = userLocation ?? { lat: 35.6812, lng: 139.7671 };
    const google = (window as unknown as {
      google: {
        maps: {
          Map: new (el: HTMLElement, opts: object) => object;
          Marker: new (opts: object) => { addListener: (event: string, cb: () => void) => void };
          InfoWindow: new (opts: object) => { open: (map: object, marker: object) => void };
        };
      };
    }).google;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    mapInstanceRef.current = map;

    // ユーザー位置マーカー
    if (userLocation) {
      new google.maps.Marker({
        position: userLocation,
        map,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#4CAF82" stroke="white" stroke-width="2"/></svg>'
            ),
          scaledSize: { width: 24, height: 24 },
        },
        title: "現在地",
      });
    }

    // 店舗マーカー
    shops.forEach((shop) => {
      const marker = new google.maps.Marker({
        position: { lat: shop.latitude, lng: shop.longitude },
        map,
        title: shop.name,
        label: "🌰",
      });
      marker.addListener("click", () => setSelectedShop(shop));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, shops, userLocation]);

  return (
    <div className="relative w-full h-full">
      {/* 地図 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* APIキーがない場合のフォールバック */}
      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 bg-green-50 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-gray-500 text-sm">Google Maps APIキーを設定してください</p>
          <p className="text-gray-400 text-xs mt-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        </div>
      )}

      {/* 葉っぱマーカー（クリックして収集） */}
      {leafMarkers.map((leaf) => (
        <button
          key={leaf.id}
          onClick={() => collectLeaf(leaf.id, leaf.lat, leaf.lng)}
          className="absolute text-2xl hover:scale-125 transition-transform cursor-pointer z-20 animate-bounce"
          style={{
            // 地図上の擬似的な位置表示（実際はGPSではなく画面内ランダム）
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 50}%`,
          }}
          title="葉っぱを拾う"
          aria-label="葉っぱを拾う"
        >
          {leaf.emoji}
        </button>
      ))}

      {/* 収集メッセージ */}
      {collectMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-30 animate-bounce">
          {collectMessage}
        </div>
      )}

      {/* 店舗情報ポップアップ */}
      {selectedShop && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-10">
          <button
            onClick={() => setSelectedShop(null)}
            className="absolute top-2 right-3 text-gray-400 text-xl"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <div className="bg-green-100 rounded-xl p-3 text-2xl">🏪</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-800">{selectedShop.name}</h3>
                {selectedShop.isPremium && (
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                    ✨
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{selectedShop.address}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-medium text-green-600">
                  🌰 +{selectedShop.acornAmount}個
                </span>
                {selectedShop.distance && (
                  <span className="text-sm text-gray-400">
                    {Math.round(selectedShop.distance)}m
                  </span>
                )}
              </div>
            </div>
          </div>
          <a
            href="/scan"
            className="mt-3 block bg-green-600 text-white text-center py-2.5 rounded-xl text-sm font-bold"
          >
            📷 QRをスキャンしてどんぐりをゲット
          </a>
        </div>
      )}

      {/* 現在地ボタン */}
      <button
        onClick={() => {
          if (userLocation && mapLoaded) {
            // 地図を現在地に移動（再初期化で対応）
          }
        }}
        className="absolute top-4 right-4 bg-white rounded-full shadow-md p-3 text-xl z-10"
        title="現在地に戻る"
      >
        📍
      </button>

      {/* 葉っぱ収集ヒント */}
      {leafMarkers.length > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-xl px-3 py-2 shadow z-10 text-sm">
          <span className="text-green-700 font-medium">
            🌿 葉っぱ{leafMarkers.length}枚が近くに！タップして拾おう
          </span>
        </div>
      )}
    </div>
  );
}
