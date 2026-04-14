# 旅遊行程網站 — AI 開發指引

本專案的完整開發規範（含頁面架構、元件模板、地圖規範、圖片規範、品質檢查清單等）請參閱：

👉 [.github/copilot-instructions.md](.github/copilot-instructions.md)

該文件是 **唯一的規範來源 (Single Source of Truth)**，GitHub Copilot 與 Claude Code 共用同一份。

## 快速重點摘要

### 技術架構
- 單檔 HTML + React 18 + Babel（CDN 載入，無建置步驟）
- 所有資料與元件都 inline 在 `<script type="text/babel">` 區塊

---

### ⚠️ 圖片來源（最高優先級！嚴格執行！）

**核心原則：TIMELINE 每個站點的圖片必須是「該地點的真實照片」，嚴禁用不相關的 Unsplash 示意圖充數！**

#### 圖片搜尋流程（每個 TIMELINE 站點必須逐一執行）

1. **先搜 Wikipedia Commons**（中文＋英文關鍵字都試）：
   ```
   https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search&srsearch=景點名&srnamespace=6&srlimit=10
   ```
2. **取得 thumb URL**：
   ```
   https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=960&titles=File:檔名
   ```
3. **用 `curl -sL -o /dev/null -w "%{http_code}"` 驗證回 200**
4. **只有在 Commons 完全找不到時**，才用 Unsplash — 且 Unsplash 圖片必須與該地點主題相關（蛋糕工廠→蛋糕/工廠，釀造廠→釀造/發酵，烤雞→烤雞）

#### ❌ 絕對禁止的行為
- **禁止隨便拿一張 Unsplash 圖就塞進去**（例如：藥品照片放蛋糕工廠、試管照片放釀造廠）
- **禁止用同一張 Unsplash 圖用在多個不同地點**
- 禁止使用任何旅遊局（`travel.xxx.tw`）、部落格的圖片

#### ✅ 允許的圖片來源
- ✅ Wikipedia Commons：`upload.wikimedia.org/wikipedia/commons/thumb/...`（優先！）
- ✅ Unsplash CDN：`images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=640&q=80`（次選，且內容必須與地點主題匹配）

#### 圖片自查：生成後必須逐一檢查
生成頁面後，**逐一列出每個 TIMELINE 站點的圖片來源**，確認：
- [ ] 是否來自 Commons（優先）或主題相關的 Unsplash
- [ ] 用 curl 驗證 HTTP 200
- [ ] 圖片內容是否真的對應該景點（不是風馬牛不相及的圖）

---

### ⚠️ URL 介紹連結（每個地點必填！嚴格執行！）

**核心原則：TIMELINE 和 NEARBY 的每個地點都必須有 `url` 欄位，且必須是「景點介紹網站」，禁止用 Google Maps 連結充數！**

#### URL 搜尋流程（每個地點必須逐一執行）

1. **搜景點官方網站**（品牌官網、場館官網）→ 驗證回 200
2. **搜 Wikipedia 條目**（`zh.wikipedia.org/wiki/景點名`）→ 驗證回 200
3. **搜 Facebook 粉專**（`facebook.com/景點英文名`）→ 驗證回 200
4. **搜 `.gov.tw` 觀光導覽頁** → 驗證回 200
5. **以上都找不到**時，才可以用 Google Maps 連結（`maps.google.com/?q=景點名`）

#### ❌ 絕對禁止的行為
- **禁止 TIMELINE / NEARBY 的 `url` 欄位使用 Google Maps 連結**（`maps.google.com/?q=...`）— Google Maps 連結只能用在 MAP_DATA.markers 的 `gm` 欄位
- **禁止把不相關的網站 URL 塞給景點**（例如：龍潭湖的 url 填成蘭陽博物館的 `lym.gov.tw`）
- **禁止省略 `url` 欄位**：除了「出發」和「返程」站點外，每個地點都必須有 url
- **禁止捏造 URL**：所有 URL 必須用 curl 驗證回 200

#### URL 欄位用途區分
| 欄位 | 用途 | 允許的連結 |
|------|------|-----------|
| `TIMELINE[i].url` | 延伸閱讀（景點介紹） | 官網、Wikipedia、Facebook、.gov.tw |
| `NEARBY[i].url` | 延伸閱讀（景點介紹） | 官網、Wikipedia、Facebook、.gov.tw |
| `MAP_DATA.markers[i].gm` | 地圖導航（Google Maps 外開） | `maps.google.com/?q=景點名` |
| `MAP_DATA.url` | 完整路線導航 | `maps.google.com/maps/dir/A/B/C` |

---

### 地圖 embed（關鍵！）
- 使用 Google Maps iframe embed（`output=embed`）
- **embed URL 必須使用經緯度座標**，不要用中文地名（中文可能導致路線不顯示）
- 座標查詢：`https://nominatim.openstreetmap.org/search?q=景點名&format=json&limit=1&countrycodes=tw`
- 格式：`https://maps.google.com/maps?saddr=LAT,LNG&daddr=LAT,LNG+to:LAT,LNG&dirflg=d&hl=zh-TW&output=embed`
- 不要用 curl 測試 Google Maps embed URL（會回 404，但在瀏覽器 iframe 中正常）

### 部落格連結（關鍵！）
- **禁止捏造 URL**：bobowin.blog 使用日期 slug（如 `2017-03-04-11`），不是主題 slug
- 必須先用 `web_fetch` 搜尋部落格找真實文章 URL
- 找不到時改用官方網站、Wikipedia 或 Facebook 粉專
- 所有 URL 必須用 `curl -sL -o /dev/null -w "%{http_code}"` 驗證回 200

---

### 生成後品質自查流程（必做！）
完成頁面生成後，必須依序執行以下自查：

1. **圖片逐一檢查**：列出每個 TIMELINE 站點 → 圖片來源 → curl 驗證 200 → 圖片內容是否符合景點
2. **URL 逐一檢查**：列出每個 TIMELINE/NEARBY 站點 → url 欄位 → curl 驗證 200 → 是否為介紹網站（非 Google Maps）
3. **Google Maps 連結檢查**：確認 url 欄位中沒有任何 `maps.google.com` 連結
4. **重複使用檢查**：確認沒有同一張圖片用在多個不同地點

---

### 現有行程頁面
- `index.html` — 首頁（行程卡片列表）
- `cruise-okinawa.html` — 郵輪沖繩行程
- `hanshin-day-trip.html` — 漢神一日遊
- `miaoli-2day-trip.html` — 苗栗兩日遊
- `yilan-day-trip.html` — 宜蘭清水地熱一日遊
- `yilan-chicken-trip.html` — 宜蘭大仁哥甕窯雞一日遊（8大5小）
- `pingzhen-day-trip.html` — 平鎮一日遊
