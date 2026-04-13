# 旅遊行程網站 — AI 開發指引

本專案的完整開發規範（含頁面架構、元件模板、地圖規範、圖片規範、品質檢查清單等）請參閱：

👉 [.github/copilot-instructions.md](.github/copilot-instructions.md)

該文件是 **唯一的規範來源 (Single Source of Truth)**，GitHub Copilot 與 Claude Code 共用同一份。

## 快速重點摘要

### 技術架構
- 單檔 HTML + React 18 + Babel（CDN 載入，無建置步驟）
- 所有資料與元件都 inline 在 `<script type="text/babel">` 區塊

### 圖片來源（僅限以下）
- ✅ Unsplash CDN：`images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=640&q=80`
- ✅ Wikipedia Commons：`upload.wikimedia.org/wikipedia/commons/thumb/...`
- ❌ 禁止使用任何旅遊局、部落格的圖片（會被擋 hotlink）

### 地圖 embed（關鍵！）
- 使用 Google Maps iframe embed（`output=embed`）
- **embed URL 必須使用經緯度座標**，不要用中文地名（中文可能導致路線不顯示）
- 座標查詢：`https://nominatim.openstreetmap.org/search?q=景點名&format=json&limit=1&countrycodes=tw`
- 格式：`https://maps.google.com/maps?saddr=LAT,LNG&daddr=LAT,LNG+to:LAT,LNG&dirflg=d&hl=zh-TW&output=embed`
- 不要用 curl 測試 Google Maps embed URL（會回 404，但在瀏覽器 iframe 中正常）

### 部落格連結（關鍵！）
- **禁止捏造 URL**：bobowin.blog 使用日期 slug（如 `2017-03-04-11`），不是主題 slug
- 必須先用 `web_fetch` 搜尋部落格找真實文章 URL
- 找不到時改用 `https://maps.google.com/?q=景點名` 或官方網站
- 所有 URL 必須用 `curl -sL -o /dev/null -w "%{http_code}"` 驗證回 200

### 現有行程頁面
- `index.html` — 首頁（行程卡片列表）
- `cruise-okinawa.html` — 郵輪沖繩行程
- `hanshin-day-trip.html` — 漢神一日遊
- `miaoli-2day-trip.html` — 苗栗兩日遊
- `yilan-day-trip.html` — 宜蘭清水地熱一日遊
