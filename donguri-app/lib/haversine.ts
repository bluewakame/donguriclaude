// Haversine公式を使って2点間の距離をメートルで計算する

/**
 * 2点間の距離をメートルで返す
 * @param lat1 地点1の緯度
 * @param lon1 地点1の経度
 * @param lat2 地点2の緯度
 * @param lon2 地点2の経度
 * @returns 距離（メートル）
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // 地球の半径（メートル）

  // 度をラジアンに変換
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  // Haversine公式
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // 距離をメートルで返す
  return R * c;
}

/**
 * ユーザーが店舗の範囲内にいるか確認する
 * @param userLat ユーザーの緯度
 * @param userLon ユーザーの経度
 * @param shopLat 店舗の緯度
 * @param shopLon 店舗の経度
 * @param radiusMeters 判定半径（メートル）
 * @returns 範囲内かどうか
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  shopLat: number,
  shopLon: number,
  radiusMeters: number
): boolean {
  const distance = haversineDistance(userLat, userLon, shopLat, shopLon);
  return distance <= radiusMeters;
}
