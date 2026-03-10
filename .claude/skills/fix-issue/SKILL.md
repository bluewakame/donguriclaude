---
name: fix-issue
description: GitHub Issueを調査し、修正実装からコミットまでを支援する
disable-model-invocation: true
argument-hint: "[Issue番号]"
allowed-tools: Bash(git *), Bash(gh *), Bash(npm run *), Bash(npm test *)
---

Issue #$ARGUMENTS を修正する。

1. `gh issue view $ARGUMENTS` で再現条件と受け入れ基準を確認
2. 関連コードを特定して最小差分で修正
3. 関連するlint/testを実行
4. `git commit -m "fix: close #$ARGUMENTS"` でコミット
