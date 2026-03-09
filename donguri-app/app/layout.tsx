// 全体レイアウト
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "どんぐり - ポイ活アプリ",
  description: "提携店舗に来店してデジタルトークン「どんぐり」をためよう！",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#4CAF82",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
