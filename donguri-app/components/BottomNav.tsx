"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  icon: string;
  label: string;
  /** このタブをアクティブとみなす追加パスの一覧 */
  also?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/home", icon: "🗺️", label: "探す" },
  {
    href: "/wallet",
    icon: "🌰",
    label: "ウォレット",
    also: ["/exchange", "/shop", "/boil"],
  },
  // スキャンは中央 FAB として別途描画
  { href: "/shops", icon: "🏪", label: "お店" },
  {
    href: "/settings",
    icon: "👤",
    label: "わたし",
    also: ["/history", "/merchant"],
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = ({ href, also = [] }: NavItem) =>
    [href, ...also].some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

  const linkClass = (item: NavItem) =>
    `flex-1 flex flex-col items-center gap-0.5 pb-1 pt-0.5 transition-colors ${
      isActive(item)
        ? "text-green-600"
        : "text-gray-400 hover:text-green-500"
    }`;

  const labelClass = (item: NavItem) =>
    `text-xs ${isActive(item) ? "font-medium" : ""}`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[1000] overflow-visible"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto flex items-end pb-2 pt-1 overflow-visible">
        {/* 探す */}
        <Link href={NAV_ITEMS[0].href} className={linkClass(NAV_ITEMS[0])}>
          <span className="text-xl">{NAV_ITEMS[0].icon}</span>
          <span className={labelClass(NAV_ITEMS[0])}>{NAV_ITEMS[0].label}</span>
        </Link>

        {/* ウォレット */}
        <Link href={NAV_ITEMS[1].href} className={linkClass(NAV_ITEMS[1])}>
          <span className="text-xl">{NAV_ITEMS[1].icon}</span>
          <span className={labelClass(NAV_ITEMS[1])}>{NAV_ITEMS[1].label}</span>
        </Link>

        {/* スキャン（中央 FAB） */}
        <Link href="/scan" className="flex-1 flex flex-col items-center pb-1">
          <div className="bg-green-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg -mt-7 border-4 border-white">
            <span className="text-2xl">📷</span>
          </div>
          <span className="text-xs text-green-600 font-medium mt-1">スキャン</span>
        </Link>

        {/* お店 */}
        <Link href={NAV_ITEMS[2].href} className={linkClass(NAV_ITEMS[2])}>
          <span className="text-xl">{NAV_ITEMS[2].icon}</span>
          <span className={labelClass(NAV_ITEMS[2])}>{NAV_ITEMS[2].label}</span>
        </Link>

        {/* わたし */}
        <Link href={NAV_ITEMS[3].href} className={linkClass(NAV_ITEMS[3])}>
          <span className="text-xl">{NAV_ITEMS[3].icon}</span>
          <span className={labelClass(NAV_ITEMS[3])}>{NAV_ITEMS[3].label}</span>
        </Link>
      </div>
    </nav>
  );
}
