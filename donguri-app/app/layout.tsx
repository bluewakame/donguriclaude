// 全体レイアウト
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "どんぐり - ポイ活アプリ",
  description: "提携店舗に来店してデジタルトークン「どんぐり」をためよう！",
  manifest: "/manifest.json",
  themeColor: "#4CAF82",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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
