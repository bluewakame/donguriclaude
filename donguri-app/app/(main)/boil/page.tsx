// ゆでるページは廃止。ウォレットページに統合しました。
import { redirect } from "next/navigation";

export default function BoilPage() {
  redirect("/wallet");
}
