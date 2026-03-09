"use client";
// Leaflet + OpenStreetMap コンポーネント（葉っぱスポーン機能付き）
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
  screenX: number; // 画面上のX位置（%）
  screenY: number; // 画面上のY位置（%）
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
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [leafMarkers, setLeafMarkers] = useState<LeafMarker[]>([]);
  const [collectMessage, setCollectMessage] = useState<string | null>(null);

  // スポーン追跡（Ref: 再レンダリングせずに持つ）
  const lastSpawnLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const hasInitialSpawnRef = useRef(false);
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const shopMarkersRef = useRef<import("leaflet").Marker[]>([]);

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

  // 葉っぱをスポーンする（位置は生成時に1回だけ決める）
  const spawnLeaves = useCallback((lat: number, lng: number, count: number) => {
    const now = Date.now();
    if (now - lastSpawnTimeRef.current < SPAWN_COOLDOWN_MS && count === 1) return;

    const newLeaves: LeafMarker[] = Array.from({ length: count }).map(() => ({
      id: crypto.randomUUID(),
      ...randomNearby(lat, lng),
      emoji: pickLeafEmoji(),
      screenX: 20 + Math.random() * 60, // 生成時に1回だけ計算
      screenY: 20 + Math.random() * 50,
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

  // Leaflet マップを初期化
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let L: typeof import("leaflet");

    const initMap = async () => {
      L = (await import("leaflet")).default;

      // Leaflet のデフォルトアイコン修正
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center = userLocation ?? { lat: 35.6812, lng: 139.7671 };
      const map = L.map(mapRef.current!, {
        center: [center.lat, center.lng],
        zoom: 15,
        zoomControl: true,
      });

      // OpenStreetMap タイルレイヤー（無料・APIキー不要）
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ユーザー位置マーカーを更新
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    const updateMarker = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current!;

      // ユーザー位置マーカーを更新
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          html: '<div style="width:16px;height:16px;background:#4CAF82;border:2px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(76,175,130,0.3)"></div>',
          className: "",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          title: "現在地",
          zIndexOffset: 1000,
        }).addTo(map);
      }

      map.setView([userLocation.lat, userLocation.lng], map.getZoom());
    };

    updateMarker();
  }, [userLocation]);

  // 店舗マーカーを更新
  useEffect(() => {
    if (!mapInstanceRef.current || shops.length === 0) return;

    const updateShopMarkers = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current!;

      // 既存の店舗マーカーを削除
      shopMarkersRef.current.forEach((m) => m.remove());
      shopMarkersRef.current = [];

      shops.forEach((shop) => {
        const shopIcon = L.divIcon({
          html: '<div style="font-size:24px;line-height:1;">🌰</div>',
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        const marker = L.marker([shop.latitude, shop.longitude], {
          icon: shopIcon,
          title: shop.name,
        }).addTo(map);

        marker.on("click", () => setSelectedShop(shop));
        shopMarkersRef.current.push(marker);
      });
    };

    updateShopMarkers();
  }, [shops]);

  return (
    <div className="relative w-full h-full">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      {/* 地図 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 葉っぱマーカー（クリックして収集） */}
      {leafMarkers.map((leaf) => (
        <button
          key={leaf.id}
          onClick={() => collectLeaf(leaf.id, leaf.lat, leaf.lng)}
          className="absolute text-2xl hover:scale-125 transition-transform cursor-pointer z-20 animate-bounce"
          style={{
            left: `${leaf.screenX}%`,
            top: `${leaf.screenY}%`,
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
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-[1000]">
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
          if (userLocation && mapInstanceRef.current) {
            mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
          }
        }}
        className="absolute top-4 right-4 bg-white rounded-full shadow-md p-3 text-xl z-[1000]"
        title="現在地に戻る"
      >
        📍
      </button>

      {/* 葉っぱ収集ヒント */}
      {leafMarkers.length > 0 && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-xl px-3 py-2 shadow z-[1000] text-sm">
          <span className="text-green-700 font-medium">
            🌿 葉っぱ{leafMarkers.length}枚が近くに！タップして拾おう
          </span>
        </div>
      )}
    </div>
  );
}
