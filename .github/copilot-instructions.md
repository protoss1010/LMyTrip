# 旅遊行程頁面生成規範（Trip Page Generator Skill）

本專案是一個旅遊行程規劃網站，每個行程都是一個**獨立的單檔 HTML**，使用 React 18 + Babel 即時編譯，不需要任何建置步驟。

---

## 一、技術架構（不可變更）

```
單檔 HTML → <head> 載入 CDN → <body> 內 <script type="text/babel"> → React SPA
```

### 必要 CDN（寫在 `<head>` 中，順序固定）

```html
<!-- 1. Leaflet 地圖 CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<!-- 2. Leaflet 地圖 JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<!-- 3. React -->
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<!-- 4. ReactDOM -->
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<!-- 5. Babel -->
<script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js"></script>
```

### React Hooks

```javascript
const { useState, useRef, useEffect } = React;
```

---

## 二、頁面結構（必備區塊，順序固定）

每個行程頁面必須包含以下區塊：

| 順序 | 區塊 | Tab ID | 說明 |
|------|------|--------|------|
| 1 | Hero Banner | — | 漸層背景＋標題＋人數/交通/亮點快覽 |
| 2 | Sticky Nav | — | 固定在頂部的分頁按鈕列 |
| 3 | 行程時間軸 | `itinerary` | 路線摘要卡片 + TimelineCard 元件列表 |
| 4 | 路線地圖 | `maps` | **Leaflet + OpenStreetMap** 互動地圖面板 + 交通資訊 |
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

### ✅ 唯一允許的地圖方案：Leaflet + OpenStreetMap

```
❌ 禁止使用 Google Maps iframe embed（output=embed 已廢棄，返回 404）
❌ 禁止使用 maps.google.com/maps?...&output=embed
✅ 必須使用 Leaflet.js + OpenStreetMap tiles
```

### MapPanel 元件模板

```jsx
function MapPanel({ data, color }) {
    const [activeStop, setActiveStop] = useState(null);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;
        const bounds = data.markers.map(m => [m.lat, m.lng]);
        const map = L.map(mapRef.current, {
            scrollWheelZoom: false,
            attributionControl: true,
            zoomControl: true
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 18
        }).addTo(map);

        const routeCoords = [];
        data.markers.forEach((m, i) => {
            routeCoords.push([m.lat, m.lng]);
            const icon = L.divIcon({
                className: '',
                html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${m.e}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
            marker.bindPopup(`<div style="font-size:13px"><b>${m.t} ${m.l}</b><br/><span style="color:#666">${m.addr || ''}</span><br/><a href="${m.gm}" target="_blank" style="color:${color}">↗ Google Maps</a></div>`);
            markersRef.current.push(marker);
        });

        L.polyline(routeCoords, { color, weight: 3, opacity: 0.7, dashArray: '8,8' }).addTo(map);
        map.fitBounds(bounds, { padding: [30, 30] });
        mapInstance.current = map;
        return () => { map.remove(); mapInstance.current = null; markersRef.current = []; };
    }, []);

    useEffect(() => {
        if (!mapInstance.current) return;
        if (activeStop !== null) {
            const m = data.markers[activeStop];
            mapInstance.current.setView([m.lat, m.lng], 15, { animate: true });
            markersRef.current[activeStop]?.openPopup();
        } else {
            const bounds = data.markers.map(m => [m.lat, m.lng]);
            mapInstance.current.fitBounds(bounds, { padding: [30, 30], animate: true });
            markersRef.current.forEach(mk => mk.closePopup());
        }
    }, [activeStop]);

    // ... 右側側邊欄 UI 同樣式模板（見下方完整範例）
}
```

### MAP_DATA 資料結構

```javascript
const MAP_DATA = {
    title: "路線標題",
    desc: "路線描述",
    // ❌ 不要有 embed 欄位
    markers: [
        {
            gm: "https://maps.google.com/?q=景點名稱",  // Google Maps 連結（用於外開導航）
            l: "站名",
            e: "🎯",        // emoji 圖示
            t: "09:00",     // 時間
            lat: 24.6801,   // ⚠️ 必填！緯度
            lng: 121.6165,  // ⚠️ 必填！經度
            addr: "完整地址",
            hrs: "營業時間",
            tk: "門票/費用",
            trs: "交通方式",
            hl: ["重點1", "重點2"],
            kt: "家長/注意事項"
        },
        // ...更多站點
    ],
    url: "https://maps.google.com/maps/dir/起點/站1/站2/..."  // Google Maps 完整路線連結
};
```

**每個 marker 必須包含 `lat` 和 `lng`！** 這是 Leaflet 地圖定位的必要資料。

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
- 左側：Leaflet 互動地圖（emoji marker、虛線路線）
- 右側：站點側邊欄（可點擊切換地圖焦點）
- 底部：「↗ 導航清單」按鈕開啟 Google Maps 完整路線
- attribution 文字：`© OpenStreetMap contributors`

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
- [ ] 使用 Leaflet + OpenStreetMap（不是 Google Maps iframe）
- [ ] `<head>` 中包含 Leaflet CSS 和 JS
- [ ] 所有 MAP_DATA markers 都有 `lat` 和 `lng`
- [ ] 不存在任何 `output=embed` 字串

### 連結檢查
- [ ] Google Maps 連結使用 `maps.google.com/?q=` 格式（外開導航，不是 embed）
- [ ] 地圖路線連結使用 `maps.google.com/maps/dir/` 格式
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
