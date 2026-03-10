---
paths:
  - "donguri-app/app/**/*.tsx"
  - "donguri-app/components/**/*.tsx"
---

# React Rules

- App RouterではServer Componentを優先し、`use client` は必要最小限にする。
- 取得中UI/エラーUIを明示し、無限ローディングを避ける。
- リスト描画にindexをkeyとして使わない。
