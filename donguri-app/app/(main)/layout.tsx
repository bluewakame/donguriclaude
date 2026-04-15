// メインページの共通レイアウト（ナビゲーションバー付き）
export const dynamic = "force-dynamic";
import BottomNav from "@/components/BottomNav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      {/* メインコンテンツ */}
      <main className="flex-1 min-h-0 overflow-y-auto pb-20">{children}</main>

      <BottomNav />

    </div>
  );
}
