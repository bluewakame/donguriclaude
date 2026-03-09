"use client";
// Leaflet地図コンポーネント（OpenStreetMap使用）
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

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

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const playerMarkerRef = useRef<LeafletMarker | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let watchId: number | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [35.6895, 139.6917],
        zoom: 15,
        tap: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      // モバイルで地図サイズを正確に再計算
      setTimeout(() => map.invalidateSize(), 300);

      mapInstanceRef.current = map;

      // 店舗マーカーを配置する関数
      const placeShops = async (lat: number, lng: number) => {
        try {
          const res = await fetch(`/api/shops?latitude=${lat}&longitude=${lng}&radius=10000`);
          const data = await res.json();
          if (!data.ok) return;

          const shopIcon = L.divIcon({
            html: '<span style="font-size:36px;line-height:1;display:block">🌰</span>',
            className: "",
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          });

          (data.data as Shop[]).forEach((shop) => {
            L.marker([shop.latitude, shop.longitude], { icon: shopIcon })
              .addTo(map)
              .on("click", () => setSelectedShop(shop));
          });
        } catch (e) {
          console.error("店舗データ取得エラー:", e);
        }
      };

      // 位置情報取得
      if (navigator.geolocation) {
        let initialLocSet = false;

        const playerIcon = L.divIcon({
          html: '<span style="font-size:36px;line-height:1;display:block">🧍</span>',
          className: "",
          iconSize: [36, 44],
          iconAnchor: [18, 44],
        });

        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;

            if (!playerMarkerRef.current) {
              playerMarkerRef.current = L.marker([lat, lng], { icon: playerIcon })
                .addTo(map)
                .bindPopup("現在地");

              if (!initialLocSet) {
                initialLocSet = true;
                map.setView([lat, lng], 17);
                placeShops(lat, lng);
              }
            } else {
              playerMarkerRef.current.setLatLng([lat, lng]);
            }
          },
          (err) => {
            const msg =
              err.code === 1
                ? "位置情報の許可が必要です"
                : "現在地を取得できませんでした";
            setLocationError(msg);
            placeShops(35.6812, 139.7671);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      } else {
        placeShops(35.6812, 139.7671);
      }
    })();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        playerMarkerRef.current = null;
      }
    };
  }, []);

  // 現在地ボタン
  const handleLocateMe = () => {
    if (!mapInstanceRef.current || !playerMarkerRef.current) return;
    mapInstanceRef.current.setView(playerMarkerRef.current.getLatLng(), 17);
  };

  return (
    <div className="relative w-full h-full">
      {/* Leaflet地図 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 位置情報エラー */}
      {locationError && (
        <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg shadow px-3 py-2 z-[1000] text-sm text-gray-600 text-center">
          📍 {locationError}
        </div>
      )}

      {/* 現在地ボタン */}
      <button
        onClick={handleLocateMe}
        className="absolute top-4 right-4 bg-white rounded-full shadow-md p-3 text-xl z-[1000] active:bg-gray-100 touch-manipulation"
        title="現在地に戻る"
        aria-label="現在地に戻る"
      >
        📍
      </button>

      {/* 店舗情報ポップアップ */}
      {selectedShop && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg p-4 z-[1000]">
          <button
            onClick={() => setSelectedShop(null)}
            className="absolute top-2 right-3 text-gray-400 text-2xl leading-none p-1 touch-manipulation"
            aria-label="閉じる"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <div className="bg-green-100 rounded-xl p-3 text-2xl flex-shrink-0">🏪</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-800 truncate">{selectedShop.name}</h3>
                {selectedShop.isPremium && (
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full flex-shrink-0">
                    ✨ プレミアム
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{selectedShop.address}</p>
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
            className="mt-3 block bg-green-600 text-white text-center py-3 rounded-xl text-sm font-bold active:bg-green-700 touch-manipulation"
          >
            📷 QRをスキャンしてどんぐりをゲット
          </a>
        </div>
      )}
    </div>
  );
}
