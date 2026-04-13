# 旅遊行程頁面生成規範（Trip Page Generator Skill）

本專案是一個旅遊行程規劃網站，每個行程都是一個**獨立的單檔 HTML**，使用 React 18 + Babel 即時編譯，不需要任何建置步驟。

---

## 一、技術架構（不可變更）

```
單檔 HTML → <head> 載入 CDN → <body> 內 <script type="text/babel"> → React SPA
```

### 必要 CDN（寫在 `<head>` 中，順序固定）

```html
<!-- 1. React -->
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<!-- 2. ReactDOM -->
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<!-- 3. Babel -->
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js"></script>
```

> **注意：不需要 Leaflet 等額外地圖 CDN。地圖使用 Google Maps iframe embed。**

### React Hooks

```javascript
const { useState, useRef } = React;
```

---

## 二、頁面結構（必備區塊，順序固定）

每個行程頁面必須包含以下區塊：

| 順序 | 區塊 | Tab ID | 說明 |
|------|------|--------|------|
| 1 | Hero Banner | — | 漸層背景＋標題＋人數/交通/亮點快覽 |
| 2 | Sticky Nav | — | 固定在頂部的分頁按鈕列 |
| 3 | 行程時間軸 | `itinerary` | 路線摘要卡片 + TimelineCard 元件列表 |
| 4 | 路線地圖 | `maps` | **Google Maps iframe embed** 互動地圖面板 + 交通資訊 |
| 5 | 美食推薦 | `food` | 至少 6~8 項在地美食卡片 |
| 6 | 周邊景點 | `nearby` | 至少 6~8 項可加碼景點 |
| 7 | 實用須知 | — | 至少 5~6 類分類提示 |
| 8 | 打包清單 | `checklist` | 互動勾選清單，按分類分組 |
| 9 | Footer | — | 行程摘要一句話 |

---

## 三、色系設計規則

每個行程頁必須定義專屬的 `COLORS` 物件，至少包含：

```javascript
const COLORS = {
    primary: "#XXXXXX",    // 主色（代表行程主題）
    secondary: "#XXXXXX",  // 輔色
    accent: "#XXXXXX",     // 強調色
    green: "#22c55e",      // 自然綠（固定）
    coral: "#ef4444",       // 火山紅（固定）
    bg1: "#0a1628",         // 深色背景（固定）
    bg2: "#0d2847",         // 次深背景（固定）
};
```

### 標籤類型色（固定）
```javascript
const ts = {
    free: { b: "rgba(34,197,94,0.15)", c: "#22c55e" },
    must: { b: "rgba(PRIMARY,0.15)", c: "PRIMARY" },
    food: { b: "rgba(239,68,68,0.15)", c: "#ef4444" }
};
```

### 全站固定的暗色主題
- 背景色：`#0a1628`
- 次背景：`#0d2847`
- 文字色：`#fff`（標題）、`rgba(255,255,255,0.5)`（內文）、`rgba(255,255,255,0.3)`（次要）
- 打包清單區塊例外：使用淺色暖色系背景

---

## 四、圖片來源規範（⚠️ 絕對不可違反）

### ✅ 允許的圖片來源（只能用這些）

| 來源 | 格式 | 說明 |
|------|------|------|
| **Unsplash** | `https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=640&q=80` | 最推薦、最穩定。用描述性關鍵字在 Unsplash 搜尋合適照片 |
| **Wikipedia Commons** | `https://upload.wikimedia.org/wikipedia/commons/thumb/X/XX/檔名.jpg/960px-檔名.jpg` | 適合知名景點有條目的情況 |

### ❌ 絕對禁止的圖片來源

- `travel.yilan.tw`、`travel.xxx.tw`（政府觀光網站，會封鎖外連）
- 任何部落格圖片（隨時會搬遷或刪除）
- Google Maps 截圖
- 任何非 CDN 的第三方圖片

### 圖片驗證流程

**每張圖片都必須用 `web_fetch` 工具驗證能返回 JPEG/PNG 二進位資料（`JFIF` 或 `PNG` 標頭），確認後才能使用。**

---

## 五、地圖規範（⚠️ 絕對不可違反）

### ✅ 唯一允許的地圖方案：Google Maps iframe embed

```
✅ 使用 Google Maps iframe embed（`output=embed`）— 所有現有頁面都用此方案且正常運作
✅ 路線概覽：maps.google.com/maps?saddr=起點&daddr=站1+to:站2+to:站3&dirflg=d&hl=zh-TW&output=embed
✅ 單點查看：maps.google.com/maps?q=景點名稱&hl=zh-TW&output=embed
❌ 不要使用 Leaflet 或其他第三方地圖庫（增加不必要的 CDN 依賴）
```

> **重要提示：** Google Maps embed URL 在瀏覽器 iframe 中正常運作。不要用 curl 測試（會返回假的 404），要在瀏覽器中驗證。

### 路線 embed URL 組合規則

```
https://maps.google.com/maps?saddr={起點名稱}&daddr={站1}+to:{站2}+to:{站3}&dirflg=d&hl=zh-TW&output=embed
```

- `saddr` = 起點（中文地名即可）
- `daddr` = 目的地，多站用 `+to:` 串聯
- `dirflg=d` = 開車路線
- `hl=zh-TW` = 繁體中文介面
- `output=embed` = iframe 嵌入模式

### 單點 embed URL

```
https://maps.google.com/maps?q={景點名稱}&hl=zh-TW&output=embed
```

### MapPanel 元件模板（Google Maps iframe 版）

```jsx
function MapPanel({ data, color }) {
    const [activeStop, setActiveStop] = useState(null);
    const currentEmbed = activeStop !== null
        ? `https://maps.google.com/maps?q=${data.markers[activeStop].gm.split('?q=')[1]}&hl=zh-TW&output=embed`
        : data.embed;

    return (
        <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: '#1d2733' }}>
            <div style={{ display: 'flex', minHeight: 400, flexDirection: window.innerWidth < 700 ? 'column' : 'row' }}>
                {/* 左側：Google Maps iframe */}
                <div style={{ flex: '1 1 60%', minHeight: 320, borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                    <iframe src={currentEmbed} width="100%" height="100%" style={{ border: 0, display: "block", minHeight: window.innerWidth < 700 ? 280 : '100%' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                    {activeStop !== null && (
                        <button onClick={() => setActiveStop(null)} style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(32,33,36,0.95)', color: color, border: '1px solid #5f6368', borderRadius: 20, padding: '8px 16px', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 2px 6px rgba(0,0,0,0.5)', cursor: 'pointer', zIndex: 1000 }}>
                            ← 完整路線
                        </button>
                    )}
                </div>
                {/* 右側：站點側邊欄 */}
                <div style={{ flex: '1 1 40%', maxWidth: window.innerWidth < 700 ? '100%' : 300, background: '#202124', overflowY: 'auto', maxHeight: window.innerWidth < 700 ? 'none' : 400 }}>
                    <div style={{ padding: '1rem 1rem 0.7rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e8eaed', margin: 0, lineHeight: 1.3 }}>{data.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: '#9aa0a6', lineHeight: 1.5, margin: '0.4rem 0 0.7rem' }}>{data.desc}</p>
                        <a href={data.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 24, background: color, color: '#fff', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>↗</span> 導航清單
                        </a>
                    </div>
                    {data.markers.map((m, i) => (
                        <div key={i} onClick={() => setActiveStop(i === activeStop ? null : i)}
                            style={{ display: 'flex', gap: '0.6rem', padding: '0.55rem 1rem', cursor: 'pointer', transition: 'background 0.2s', borderTop: '1px solid #3c4043', background: activeStop === i ? `${color}1a` : 'transparent', alignItems: 'center' }}
                            onMouseEnter={e => { if (activeStop !== i) e.currentTarget.style.background = '#303134'; }}
                            onMouseLeave={e => { if (activeStop !== i) e.currentTarget.style.background = 'transparent'; }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg,${color}44,${color}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', flexShrink: 0, border: activeStop === i ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.08)' }}>{m.e}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <span style={{ fontSize: '0.72rem', color: color, fontWeight: 600, flexShrink: 0 }}>{m.t}</span>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#e8eaed', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.l}</span>
                                </div>
                                {m.addr && <div style={{ fontSize: '0.75rem', color: '#9aa0a6', marginTop: 2 }}>📍 {m.addr}</div>}
                            </div>
                            <a href={m.gm} target="_blank" onClick={(e) => e.stopPropagation()} rel="noopener noreferrer"
                                style={{ fontSize: '0.85rem', color: color, textDecoration: 'none', flexShrink: 0, padding: '3px 6px', borderRadius: 8, background: `${color}14` }}>↗</a>
                        </div>
                    ))}
                    <div style={{ padding: '0.6rem 1rem', fontSize: '0.68rem', color: '#9aa0a6' }}>
                        <span>地圖資料 ©2026 Google</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
```

### MAP_DATA 資料結構

```javascript
const MAP_DATA = {
    title: "路線標題",
    desc: "路線描述",
    embed: "https://maps.google.com/maps?saddr=起點&daddr=站1+to:站2+to:站3&dirflg=d&hl=zh-TW&output=embed",
    markers: [
        {
            gm: "https://maps.google.com/?q=景點名稱",  // Google Maps 連結（用於外開導航 + embed 單點切換）
            l: "站名",
            e: "🎯",        // emoji 圖示
            t: "09:00",     // 時間
            addr: "完整地址",
            hrs: "營業時間",
            tk: "門票/費用",
            trs: "交通方式",
            hl: ["重點1", "重點2"],
            kt: "家長/注意事項"
        },
        // ...更多站點
    ],
    url: "https://maps.google.com/maps/dir/起點/站1/站2/..."  // Google Maps 完整路線連結（外開導航用）
};
```

> **不需要 `lat`/`lng` 欄位！** Google Maps iframe 用地名自動定位，marker 的 `gm` 欄位提供 `?q=景點名` 即可切換單點顯示。

### 多日行程的地圖

多日行程（如苗栗二日遊）每天一個 MAP_DAY 物件：

```javascript
const MAP_DAY1 = { title: "Day 1：...", desc: "...", embed: "...", markers: [...], url: "..." };
const MAP_DAY2 = { title: "Day 2：...", desc: "...", embed: "...", markers: [...], url: "..." };

// 在地圖區段用 Tab 切換
<MapPanel data={MAP_DAY1} color={COLORS.primary} />
<MapPanel data={MAP_DAY2} color={COLORS.accent} />
```

---

## 六、超連結規範

### Google Maps 連結（導航用）
```
✅ https://maps.google.com/?q=景點名稱          （單點查詢）
✅ https://maps.google.com/maps/dir/A/B/C/D      （多點路線）
```
這些是「開新分頁到 Google Maps」的連結，不是 iframe embed，永遠有效。

### 外部參考連結
- 優先使用**官方網站**（如 `.gov.tw`、品牌官網）
- 次選**知名部落格**（如 bobowin.blog 等大型旅遊部落格）
- 連結只作為「延伸閱讀」參考，頁面本身的資訊必須完整獨立

---

## 七、資料陣列模板

### TIMELINE（行程時間軸）
```javascript
const TIMELINE = [
    {
        time: "07:00",
        dur: "1.5小時",        // 停留時間（可選）
        trv: "🚗車行2hr",     // 交通耗時（可選）
        icon: "♨️",
        title: "景點名稱（副標）",
        img: "Unsplash或WikiCommons圖片URL",
        desc: "詳細描述...",
        tag: "⭐ 標籤文字",
        tt: "must|free|food",
        url: "參考連結（可選）",
        tips: ["提示1", "提示2", ...]
    },
    // ...
];
```

### FOODS（美食推薦）
```javascript
const FOODS = [
    { e: "🥚", n: "店名", j: "約NT$XXX", d: "描述...", w: "地點", k: "🔥 特色標籤" },
    // ... 至少 6~8 項
];
```

### TRANSPORT（交通資訊）
```javascript
const TRANSPORT = [
    { i: "🚗", t: "分類標題", its: ["項目1", "項目2", ...] },
    // ... 至少 3~4 類
];
```

### TIPS（實用須知）
```javascript
const TIPS = [
    { i: "♨️", t: "分類標題", its: ["項目1", "項目2", ...] },
    // ... 至少 5~6 類
];
```

### NEARBY（周邊景點）
```javascript
const NEARBY = [
    { e: "♨️", n: "景點名", d: "描述...", dist: "車程X分鐘", url: "官方連結" },
    // ... 至少 6~8 項
];
```

### CHECKLIST（打包清單）
```javascript
const CHECKLIST = {
    "📱 分類名稱": ["項目1", "項目2", ...],
    // ... 至少 4~5 個分類
};
```

---

## 八、元件模板（不可大幅修改結構）

### TimelineCard
- 可展開/收合的時間軸卡片
- 包含：時間、停留時間、交通時間、圖片、描述、標籤、參考連結、展開後的提示區
- 展開區用 `💡 小提醒` 標題

### MapPanel
- 左側：Google Maps iframe embed（預設顯示完整路線，點擊站點切換到單點）
- 右側：站點側邊欄（可點擊切換地圖焦點）
- 「← 完整路線」按鈕返回路線概覽
- 底部：「↗ 導航清單」按鈕開啟 Google Maps 完整路線
- attribution 文字：`地圖資料 ©2026 Google`

### 打包清單
- 互動 checkbox，點擊可勾選/取消
- 勾選後文字加刪除線

---

## 九、index.html 整合

新增行程頁後，必須在 `index.html` 中加入對應的行程卡片：

```html
<a class="trip-card" href="新頁面.html"
    style="--accent-from: #主色; --accent-to: #輔色;">
    <div class="card-header">
        <div class="card-emoji">🎯</div>
        <div>
            <h2 class="card-title">行程標題</h2>
            <div class="card-meta">👨‍👩‍👦 2大1小 · 🚗 交通方式 · ⏱ X天</div>
        </div>
    </div>
    <p class="card-desc">行程簡述...</p>
    <div class="card-tags">
        <span class="tag">🎯 標籤1</span>
        <span class="tag">🎯 標籤2</span>
    </div>
    <div class="card-arrow">→</div>
</a>
```

---

## 十、品質檢查清單（每次生成後必做）

### 圖片檢查
- [ ] 所有圖片來源只使用 Unsplash 或 Wikipedia Commons
- [ ] 每張圖片都用 `web_fetch` 驗證能返回影像二進位資料
- [ ] 不存在任何 `travel.xxx.tw` 或部落格的圖片 URL

### 地圖檢查
- [ ] 使用 Google Maps iframe embed（`output=embed`）
- [ ] MAP_DATA 包含 `embed` 欄位（完整路線 embed URL）
- [ ] 所有 MAP_DATA markers 的 `gm` 欄位使用 `maps.google.com/?q=景點名` 格式
- [ ] iframe 包含 `allowFullScreen`、`loading="lazy"`、`referrerPolicy="no-referrer-when-downgrade"`
- [ ] `<head>` 中不包含 Leaflet 或其他地圖庫 CDN

### 連結檢查
- [ ] Google Maps 外開連結使用 `maps.google.com/?q=` 格式（外開導航）
- [ ] 地圖路線連結使用 `maps.google.com/maps/dir/` 格式
- [ ] 地圖 embed 使用 `maps.google.com/maps?saddr=...&output=embed` 格式
- [ ] 參考部落格連結僅作延伸閱讀，頁面資訊本身完整

### 完整性檢查
- [ ] 包含所有 9 個區塊（Hero, Nav, Timeline, Map, Food, Nearby, Tips, Checklist, Footer）
- [ ] TIMELINE 至少 6 個時間點
- [ ] FOODS 至少 6 項
- [ ] NEARBY 至少 6 項
- [ ] TIPS 至少 5 類
- [ ] CHECKLIST 至少 4 個分類
- [ ] index.html 已加入新行程卡片

### 風格檢查
- [ ] 暗色主題 `#0a1628` 背景
- [ ] 定義了專屬 COLORS 色系
- [ ] 打包清單使用淺色暖色背景
- [ ] Sticky nav 有 backdrop-filter blur
- [ ] Hero 有漸層背景和快覽指標

---

## 十一、CSS 基礎樣式（固定模板）

```css
* { margin: 0; padding: 0; box-sizing: border-box }
html { scroll-behavior: smooth }
body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: #0a1628; overflow-x: hidden }
::-webkit-scrollbar { height: 4px; width: 4px }
::-webkit-scrollbar-thumb { background: rgba(PRIMARY_COLOR, 0.3); border-radius: 4px }
a { -webkit-tap-highlight-color: transparent }

@keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
}
@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
}
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(PRIMARY_COLOR, 0.2); }
    50% { box-shadow: 0 0 40px rgba(PRIMARY_COLOR, 0.4); }
}
@media (max-width: 600px) { html { font-size: 18px } }
@media (max-width: 400px) { html { font-size: 19px } }
```

---

## 十二、完整檔案骨架

```
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <title>行程標題</title>
    <meta name="description" content="SEO描述">
    <meta property="og:title" content="OG標題">
    <meta property="og:description" content="OG描述">
    <link rel="icon" href="data:image/svg+xml,...">
    <!-- CDN (順序固定) -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js"></script>
    <style>/* 基礎 CSS */</style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useRef, useEffect } = React;

        // ─── 色系 ───
        const COLORS = { ... };

        // ─── 資料 ───
        const TIMELINE = [ ... ];
        const FOODS = [ ... ];
        const TRANSPORT = [ ... ];
        const TIPS = [ ... ];
        const NEARBY = [ ... ];
        const MAP_DATA = { ... };
        const CHECKLIST = { ... };

        const ts = { ... };

        // ─── 元件 ───
        function TimelineCard({ ev, index, color }) { ... }
        function MapPanel({ data, color }) { ... }

        // ─── 主應用程式 ───
        function App() { ... }

        ReactDOM.render(<App />, document.getElementById("root"));
    </script>
</body>
</html>
```
