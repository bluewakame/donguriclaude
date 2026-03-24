// GET: 近くの加盟店一覧を取得
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance } from "@/lib/haversine";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get("latitude");
    const lngParam = searchParams.get("longitude");
    const radiusParam = searchParams.get("radius") ?? "5000"; // デフォルト5km

    const latitude = latParam ? parseFloat(latParam) : null;
    const longitude = lngParam ? parseFloat(lngParam) : null;
    const radius = parseFloat(radiusParam);

    // 承認済みの加盟店のみ取得
    const shops = await prisma.shop.findMany({
      where: { status: "approved" },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        isPremium: true,
        acornAmount: true,
        // radiusMeters は意図的に除外（位置偽装に利用されるリスクがあるため）
      },
      orderBy: { isPremium: "desc" },
    });

    // 位置情報が提供された場合、距離でフィルタリングしてソート
    // 店舗データは頻繁に変わらないため60秒キャッシュ（CDN・ブラウザ共通）
    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    };

    if (latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude)) {
      const shopsWithDistance = shops
        .map((shop) => ({
          ...shop,
          distance: haversineDistance(latitude, longitude, shop.latitude, shop.longitude),
        }))
        .filter((shop) => shop.distance <= radius)
        .sort((a, b) => a.distance - b.distance);

      return NextResponse.json({ ok: true, data: shopsWithDistance }, { headers: cacheHeaders });
    }

    return NextResponse.json({ ok: true, data: shops }, { headers: cacheHeaders });
  } catch (error) {
    console.error("加盟店一覧取得エラー:", error);
    return NextResponse.json({ ok: false, message: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
