---
paths:
  - "donguri-app/**/*.{ts,tsx,js,jsx}"
---

# Code Style Rules

- 型安全性を優先し、`any` の導入は最小限にする。
- 共通ロジックは `donguri-app/lib` に寄せ、重複実装を避ける。
- UI文言は日本語として自然か確認し、未翻訳英語の混在を避ける。
