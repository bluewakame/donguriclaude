// 森の可視化コンポーネント（どんぐり10個 = 木1本）
interface ForestViewProps {
  acornBalance: number;
}

function getForestLevel(treeCount: number): { label: string; description: string } {
  if (treeCount === 0) return { label: "森なし", description: "どんぐりを集めて森を育てよう！" };
  if (treeCount < 3) return { label: "小さな森", description: "小さな芽が育っています" };
  if (treeCount < 7) return { label: "若い森", description: "木々が生い茂っています" };
  return { label: "深い森", description: "立派な森に育ちました！" };
}

export default function ForestView({ acornBalance }: ForestViewProps) {
  const treeCount = Math.floor(acornBalance / 10);
  const nextTreeAcorns = 10 - (acornBalance % 10);
  const { label, description } = getForestLevel(treeCount);

  // 表示する木の最大数（UIに収まる上限）
  const displayTrees = Math.min(treeCount, 20);

  const progressPercent = treeCount === 0
    ? ((acornBalance % 10) / 10) * 100
    : 100;

  return (
    <div className="bg-gradient-to-b from-sky-100 to-green-100 rounded-2xl p-4 border border-green-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-green-800">🌳 あなたの森</h3>
          <p className="text-xs text-green-600">{label} — {description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-700">{treeCount}</div>
          <div className="text-xs text-green-500">本の木</div>
        </div>
      </div>

      {/* 木の絵文字表示 */}
      <div className="bg-white bg-opacity-60 rounded-xl p-3 min-h-[60px] flex flex-wrap gap-1 items-end justify-start">
        {treeCount === 0 ? (
          <p className="text-gray-400 text-xs w-full text-center py-2">
            どんぐり10個で木が1本育ちます
          </p>
        ) : (
          Array.from({ length: displayTrees }).map((_, i) => (
            <span key={i} className="text-2xl leading-none">🌳</span>
          ))
        )}
        {treeCount > 20 && (
          <span className="text-xs text-green-600 self-center ml-1">+{treeCount - 20}本</span>
        )}
      </div>

      {/* 次の木までの進捗 */}
      {acornBalance > 0 && nextTreeAcorns < 10 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-green-600 mb-1">
            <span>次の木まで</span>
            <span>あと{nextTreeAcorns}個</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-500 rounded-full h-2 transition-all"
              style={{ width: `${100 - (nextTreeAcorns / 10) * 100}%` }}
            />
          </div>
        </div>
      )}

      {acornBalance > 0 && nextTreeAcorns === 10 && (
        <div className="mt-2 text-xs text-green-600 text-center">
          🌟 どんぐり{10}個でまた木が育ちます！
        </div>
      )}
    </div>
  );
}
