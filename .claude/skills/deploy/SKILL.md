---
name: deploy
description: ステージング向けの事前検証（テスト・ビルド）を実行してデプロイ準備を行う
disable-model-invocation: true
context: fork
argument-hint: "[target]"
allowed-tools: Bash(npm run *), Bash(npm test *), Bash(git *)
---

$ARGUMENTS へのデプロイ準備を行う。

1. `npm test` またはプロジェクト定義のテストを実行
2. `npm run build` を実行
3. 失敗時は原因と再試行手順をまとめる
4. 成功時はデプロイコマンドとロールバック手順を提示
