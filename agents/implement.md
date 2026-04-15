# LX Implementation Notes (impl.md)

## Overview

本文件記錄目前 lx runtime 的實作細節。\
與 spec 不同，這裡描述「實際怎麼做」。

目前實作為： - Canonical-only（已移除 sugar） - CSS 為主、JS 為輔 -
一次性 layout（非 reactive）

---

## 1. Execution Flow

初始化流程：

1.  collectNodes()
2.  validateNodes()
3.  detectCycles()
4.  topologicalSort()
5.  applyBaseSizeCSS()
6.  resolveNode()（依序）
7.  applyResolvedBox()

---

## 2. Data Model

### CanonicalNode

    {
      id: string
      el: HTMLElement

      left/right/top/bottom: PositionExpr | null
      width/height: SizeExpr | null

      refs: Set<string>
      resolved: ResolvedBox | null
    }

---

## 3. Parsing

### PositionExpr

支援：

- body.left+10
- #id.right-20
- previous.bottom+10
- next.top-20
- #id.edge+({gap}*2) （表達式）

使用 regex：

    /^(body|#([A-Za-z_][\w\-:.]*))\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/

Relative position regex：

    /^(previous|next)\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/

Position with expression regex：

    /^(body|#([A-Za-z_][\w\-:.]*))\.(left|right|top|bottom)([+-])(\(.+\))$/

### Sugar Expansion (`expandSugarToCanonical`)

在 `setup` 階段，`expandSugarToCanonical` 會：

1. 識別 `previous` / `next` 關鍵字
2. 查詢 `containerOrderedIds` 取得當前元素在容器中的索引
3. 計算目標索引（previous = index-1, next = index+1）
4. 將關鍵字替換為具體的 `#id.edge` 格式
5. 若邊界條件不符（第一個元素用 previous、最後一個用 next），拋出解析錯誤
6. 解析並求值表達式（`({variable}*2)` 等）

### Variable & Expression System

#### getVariable(el, name)

- 從當前元素向上冒泡到 `<body>`
- 查找 `data-lx-[name]` 屬性
- 若值非數字，拋出錯誤（Hard Fail）
- 若未找到，拋出 `Undefined variable` 錯誤

#### evaluateMath(expr, el)

- **不使用 eval()**，使用安全 token 解析
- 先檢查是否有巢狀括號
- Tokenize：數字、變數（解析為數值）、運算子
- 兩輪求值：先處理 `*` `/`，再處理 `+` `-`
- 除以零拋出錯誤

#### resolveValue(input, el)

- 嘗試解析為變數引用 `{name}`
- 嘗試解析為表達式 `(expr)`
- 最後嘗試解析為純數字
- 都失敗則拋出錯誤

---

### SizeExpr

支援：

- 固定：300
- 表達式：({base}*2)
- 範圍：200/500

---

## 4. Validation

### Constraint 檢查

每個元素：

- 水平：left/right/width 必須 2 個
- 垂直：top/bottom/height 必須 2 個

---

### 其他檢查

- id 必須存在
- ref 必須存在
- 不可循環依賴
- 不允許 width + height 同時為 range

---

## 5. Container Ordered IDs

在 `collectNodes` 過程中，會建立 `containerOrderedIds: Map<string, string[]>` 結構：

- Key：容器 ID（`body` 或元素 `#id`）
- Value：該容器內所有 `lx` 元素的 ID 列表，按 DOM Tree Order 排列

用於翻譯 `previous` / `next` 語法糖。

---

## 6. Dependency Graph

- 每個 node 建立 refs
- 使用 DFS 做 cycle detection
- 使用 DFS 做 topological sort

---

## 7. Resolution

### 7.1 Position

- body → 直接數值
- #id → 讀 target.resolved

---

### 7.2 Range Size

流程：

1.  先套 CSS min/max
2.  先 partial layout
3.  getBoundingClientRect()
4.  clamp(min, max)
5.  寫回 width/height

---

### 7.3 Solve

每個軸：

- left + right → width
- left + width → right
- right + width → left

---

## 8. Coordinate System

### 內部

- 所有 resolved box 為「viewport 絕對座標」

---

### 套用 CSS

- 轉換為「相對 containing block」
- using:

```{=html}
<!-- -->
```

    cssLeft = box.left - parent.left

---

## 9. Containing Block

目前策略：

- 最近的 lx element（有被解析的 node）
- 若沒有 → body

---

## 10. CSS Output

每個元素：

    position: absolute;
    left: px;
    top: px;
    width: px;
    height: px;

---

## 11. Debug Mode

啟用：

- ?lx-debug

輸出：

- parsed nodes (table)
- dependency order
- resolved boxes
- applied css

---

## 12. Limitations

目前未支援：

- reflow / resize（由 lx-auto.js 處理）
- partial update
- scroll / transform 修正
- 非 absolute layout

---

## 13. Known Issues

- getBoundingClientRect() 依賴 layout timing
- range size 可能需多次 reflow（目前只有一輪）
- nested transform 會影響座標
- scroll container 未處理

---

## 14. Future Work

- ResizeObserver（已由 lx-auto.js 實現）
- incremental layout
- debug overlay UI
- constraint solver（可選）
