"use client";
// Google Maps コンポーネント
import { useEffect, useRef, useState } from "react";

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
  const [shops, setShops] = useState<Shop[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // ユーザーの現在地を取得
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(location);
          // 近くの店舗を取得
          fetchNearbyShops(location.lat, location.lng);
        },
        () => {
          // 位置情報が取得できない場合は東京駅をデフォルト
          fetchNearbyShops(35.6812, 139.7671);
        }
      );
    }
  }, []);

  // 近くの店舗を取得
  const fetchNearbyShops = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/shops?latitude=${lat}&longitude=${lng}&radius=10000`);
      const data = await res.json();
      if (data.ok) {
        setShops(data.data);
      }
    } catch (err) {
      console.error("店舗データ取得エラー:", err);
    }
  };

  // Google Maps を初期化
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || mapLoaded) return;

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;

    // コールバック関数を定義
    (window as unknown as Record<string, unknown>).initMap = () => {
      setMapLoaded(true);
    };

    document.head.appendChild(script);
  }, [mapLoaded]);

  // 地図にマーカーを表示
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const center = userLocation ?? { lat: 35.6812, lng: 139.7671 };
    const google = (window as unknown as { google: { maps: { Map: new (el: HTMLElement, opts: object) => object; Marker: new (opts: object) => { addListener: (event: string, cb: () => void) => void }; InfoWindow: new (opts: object) => { open: (map: object, marker: object) => void }; ControlPosition: { TOP_RIGHT: string } } } }).google;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    // ユーザー位置マーカー
    if (userLocation) {
      new google.maps.Marker({
        position: userLocation,
        map,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
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

      marker.addListener("click", () => {
        setSelectedShop(shop);
      });
    });
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
                  <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">✨</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{selectedShop.address}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-medium text-green-600">🌰 +{selectedShop.acornAmount}個</span>
                {selectedShop.distance && (
                  <span className="text-sm text-gray-400">{Math.round(selectedShop.distance)}m</span>
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
    </div>
  );
}
