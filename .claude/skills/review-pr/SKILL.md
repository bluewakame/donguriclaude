---
name: review-pr
description: Pull Requestの差分を確認し、品質・セキュリティ・テスト観点でレビューを行う
disable-model-invocation: true
argument-hint: "[PR番号]"
allowed-tools: Bash(git *), Bash(gh *)
---

PR #$ARGUMENTS をレビューする。

1. `gh pr view $ARGUMENTS --comments` で背景と既存議論を確認
2. `gh pr diff $ARGUMENTS` で差分を確認
3. 型安全性・エラー処理・認可漏れ・競合更新リスクを重点確認
4. テスト不足や運用リスクがあれば重要度付きで列挙
