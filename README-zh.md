# lx

`lx` 是一個輕量級、無相依性的 JavaScript 佈局引擎，旨在透過 HTML 屬性宣告幾何關係，並將其轉換為網頁上的絕對定位座標。它特別適合需要精確控制位置、具備複雜依賴關係，或是需要根據內容動態調整排版的網頁應用。

- [en](./README.md)

## 核心特色

- **宣告式幾何語法**：直接在 HTML 中描述「我的右邊距離 A 元素左邊 10px」等邏輯。
- **效能最佳化**：將排版拆分為「初始化（Setup）」與「數值更新（Update）」，最小化視窗縮放或內容變動時的運算負擔。
- **自動化重繪**：內建 `lx-auto.js`，自動監控視窗大小、DOM 結構及內容變動並觸發排版。
- **解決標準佈局痛點**：能處理 CSS Flexbox 或 Grid 難以達成跨容器元素對齊的需求。

## 快速上手

在 HTML 中依序引入核心引擎與自動化模組：

```html
<script src="lx.js"></script>
<script src="lx-auto.js"></script>
```

### 基礎範例

```html
<div id="screen" lx lx-l="0" lx-t="0" lx-w="1920" lx-h="1080">
	<div id="sidebar" lx-r="body.right-20" lx-t="50" lx-w="300" lx-h="200/500">
		內容改變時，下方的元素會自動跟著移動
	</div>

	<div id="content" lx-l="#sidebar.left" lx-r="#sidebar.right" lx-t="#sidebar.bottom+20" lx-h="100">跟隨者</div>
</div>
```

## 語法規格

### 1. 位置屬性 (Position)

支援 `lx-left` (`lx-l`), `lx-right` (`lx-r`), `lx-top` (`lx-t`), `lx-bottom` (`lx-b`)。

- **參考模式**：`#id.edge[+/-offset]` 或 `body.edge[+/-offset]`。
- **簡寫數值**：若僅填寫數字（如 `lx-l="10"`），預設參考最近的 `lx` 容器邊界。
- **相對選取器**：使用 `previous.edge[+/-offset]` 或 `next.edge[+/-offset]` 來參考同一容器內邏輯上的前一個或下一個元素。這是語法糖，在 setup 階段會被翻譯為具體的 `#id` 參考。

### 2. 尺寸屬性 (Size)

支援 `lx-width` (`lx-w`), `lx-height` (`lx-h`)。

- **固定尺寸**：直接填寫數字（如 `300`）。
- **範圍尺寸**：使用 `min/max` 語法（如 `200/500`），元素會根據內容自動增長並受到限制。
- **表達式**：使用 `(expression)` 語法（如 `({base}*2)`）。

### 3. 變數與運算 (Variables & Math)

透過 `data-lx-*` 屬性定義可重複使用的數值，並在表達式中使用：

```html
<body data-lx-gap="20" data-lx-scale="0.8">
  <div id="container" lx>
    <div id="sidebar" lx-l="#main.right+({gap}*2)" lx-t="50" lx-w="300" lx-h="500">
      帶間距的側邊欄
    </div>
    <div id="content" lx-l="0" lx-t="#sidebar.bottom+({gap})" lx-w="100" lx-h="200">
      使用變數間距定位的內容
    </div>
  </div>
</body>
```

**支援運算子**：`+`, `-`, `*`, `/`

**變數查找**：變數會從當前元素向上冒泡到 `<body>`。子元素可以覆蓋父元素的值。

**位置表達式**：可結合參考與表達式，如 `#id.edge+({gap}*2)` 或 `body.top-({offset}/2)`。

**動態更新**：任何 `data-lx-*` 屬性變動時，會自動觸發 `lx.setup()` 重新求值所有表達式。

**注意**：所有表達式在 `setup()` 階段求值。巢狀括號不支援。

### 4. 約束規則 (Constraint Rules)

為了確保唯一解，每個元素在每個維度（水平與垂直）必須剛好提供 **2 個** 約束：

- **水平**：從 `left`, `right`, `width` 中三選二。
- **垂直**：從 `top`, `bottom`, `height` 中三選二。

## 運行機制

### lx.js (核心引擎)

1.  **setup()**：掃描 DOM、解析屬性、建立相依圖（Dependency Graph）並偵測循環依賴。
2.  **update()**：當結構未改變但數值需要變動時（如 resize），直接利用快取的相依圖進行純幾何運算，跳過 DOM 掃描以提升效能。

### lx-auto.js (自動化監控)

負責在以下情況觸發更新：

- **視窗縮放**：監聽 `window.resize`。
- **內容變動**：使用 `ResizeObserver` 監控 `range` 元素的物理尺寸變化。
- **結構/文字變動**：使用 `MutationObserver` 監控 DOM 增刪、文字內容修改或 `lx-*` 屬性變動。它會自動過濾由引擎產生的樣式變動，防止無限迴圈。
- **變數變動**：任何 `data-lx-*` 屬性變動時，會自動觸發 `lx.setup()` 重新求值所有表達式。

## 偵錯模式

在 URL 後方加入 `?lx-debug` 即可開啟開發者偵錯日誌：

- 檢視解析後的 Canonical 節點。
- 查看計算後的相依排序（Dependency Order）。
- 監控每一次自動觸發的重繪原因（如 `resize`, `text-content-change`）。

## 授權

MIT
