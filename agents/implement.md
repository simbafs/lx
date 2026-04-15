# LX Implementation Notes

## Overview

本文件記錄 lx runtime 的實作細節。
與 spec 不同，這裡描述「實際怎麼做」。

目前實作為：
- Canonical + Sugar 支援
- CSS 為主、JS 為輔
- 一次性 layout（非 reactive）

---

## 1. Execution Flow

### 初始化流程（`index.ts`）

```
1.  collectNodes()
2.  validateNodes()
3.  detectCycles()
4.  topologicalSort()
5.  applyBaseSizeCSS()
6.  resolveNode()（依序）
7.  applyResolvedBox()
```

### lx-auto.ts 自動監控

```
1.  window.resize → update()
2.  Range Size Change → update()
3.  DOM Mutation → setup() 或 update()
4.  Variable Change → setup()
```

---

## 2. Data Model

### CanonicalNode

```typescript
{
  id: string
  el: HTMLElement

  left/right/top/bottom: PositionExpr | null
  width/height: SizeExpr | null
  aspect: AspectExpr | null

  refs: Set<string>
  resolved: ResolvedBox | null
  canonicalAttrs: CanonicalAttrMap
}
```

### PositionExpr

```typescript
{ type: 'body-ref', edge, offset, raw }
{ type: 'element-ref', targetId, edge, offset, raw }
```

### SizeExpr

```typescript
{ type: 'fixed', value: number, raw }
{ type: 'range', min: number, max: number, raw }
```

### AspectExpr

```typescript
{ type: 'aspect', width: number, height: number, ratio: number, raw }
```

---

## 3. Parsing

### Regex Patterns (`types.ts`)

| 名稱 | Pattern |
|------|---------|
| `POSITION_RE` | `/^(body\|#(...))\\.(left\|right\|top\|bottom)([+-]\\d+(?:\\.\\d+)?)?$/` |
| `RELATIVE_POSITION_RE` | `/^(previous\|next)\\.(left\|right\|top\|bottom)([+-]\\d+(?:\\.\\d+)?)?$/` |
| `POSITION_EXPR_RE` | `/^(body\|#(...))\\.(...)([+-])(\\(.+\\))$/` |
| `FIXED_SIZE_RE` | `/^-?\\d+(?:\\.\\d+)?$/` |
| `RANGE_SIZE_RE` | `/^(-?\\d+(?:\\.\\d+)?)\\/(-?\\d+(?:\\.\\d+)?)$/` |
| `ASPECT_RE` | `/^(\\d+(?:\\.\\d+)?):(\\d+(?:\\.\\d+)?)$/` |
| `EXPRESSION_RE` | `/^\\(([^()]+)\\)$/` |
| `VARIABLE_RE` | `/^\\{([A-Za-z_][\\w]*)\\}$/` |
| `MATH_TOKEN_RE` | `/(-?\\d+(?:\\.\\d+)?\|\\{[^}]+\}\|[+\\-*/])/` |

### Sugar Expansion (`expandSugarToCanonical`)

在 `setup` 階段，`expandSugarToCanonical` 會：

1. 識別 `previous` / `next` 關鍵字
2. 查詢 `containerOrderedIds` 取得當前元素在容器中的索引
3. 計算目標索引（previous = index-1, next = index+1）
4. 將關鍵字替換為具體的 `#id.edge` 格式
5. 若邊界條件不符，拋出解析錯誤
6. 解析並求值表達式

### Variable & Expression System

#### `getVariable(el, name)`

- 從當前元素向上冒泡到 `<body>`
- 查找 `data-lx-[name]` 屬性
- 若值非數字，拋出錯誤（Hard Fail）
- 若未找到，拋出 `Undefined variable` 錯誤

#### `evaluateMath(expr, el)`

- **不使用 eval()**，使用安全 token 解析
- Tokenize：數字、變數（解析為數值）、運算子
- 兩輪求值：先處理 `*` `/`，再處理 `+` `-`
- 除以零拋出錯誤
- 巢狀括號拋出錯誤

#### `resolveValue(input, el)`

1. 嘗試解析為變數引用 `{name}`
2. 嘗試解析為表達式 `(expr)`
3. 最後嘗試解析為純數字
4. 都失敗則拋出錯誤

---

## 4. Validation

### Constraint 檢查

每個元素支援兩種約束組合：

**標準組合（無 aspect）**：
- 水平：left/right/width 必須 2 個
- 垂直：top/bottom/height 必須 2 個

**Aspect 組合**：
- 水平主動（Horizontal Dominant）：水平 2 個 + 垂直 1 個 + aspect
- 垂直主動（Vertical Dominant）：垂直 2 個 + 水平 1 個 + aspect

### 其他檢查

- id 必須存在
- ref 必須存在
- 不可循環依賴
- 不允許 width + height 同時為 range
- aspect 不可與 range size 共存

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

### Position

- body → 直接數值
- #id → 讀 target.resolved

### Range Size

流程：
1. 先套 CSS min/max
2. 先 partial layout
3. getBoundingClientRect()
4. clamp(min, max)
5. 寫回 width/height

### Solve

每個軸：
- left + right → width
- left + width → right
- right + width → left

### Aspect Ratio

當存在 `aspect` 時：
1. 計算主動維度（具有 2 個約束的軸）
2. 由主動維度計算被動維度：
   - 水平主動：`height = width / aspect.ratio`
   - 垂直主動：`width = height * aspect.ratio`
3. 由計算出的尺寸與現有的 1 個位置約束，計算另一個座標點

---

## 8. Coordinate System

### 內部

- 所有 resolved box 為「viewport 絕對座標」

### 套用 CSS

- 轉換為「相對 containing block」

```
cssLeft = box.left - parent.left
```

---

## 9. Containing Block

- 最近的 lx element（有被解析的 node）
- 若沒有 → body

---

## 10. CSS Output

每個元素：

```css
position: absolute;
left: px;
top: px;
width: px;
height: px;
```

---

## 11. Debug Mode

啟用：`?lx-debug`

輸出：
- Canonical nodes table
- Parsed nodes table
- Dependency order
- Resolved boxes
- Applied CSS

---

## 12. lx-auto API

```typescript
window.lx = { setup, update }
window.lxAuto = { requestRelayout, scanForRangeSizeElements, destroy }
```

### 觸發情境

| 情境 | 動作 |
|------|------|
| window.resize | update() |
| Range Size 變化 | update() |
| DOM 新增/刪除 lx 元素 | setup() |
| 文字內容變化 | update() |
| data-lx-* 變化 | setup() |
| lx-* 屬性變化 | setup() |
| id 變化 | setup() |

---

## 13. Limitations

目前未支援：
- partial update
- scroll / transform 修正
- 非 absolute layout

---

## 14. Known Issues

- getBoundingClientRect() 依賴 layout timing
- nested transform 會影響座標
- scroll container 未處理

---

## 15. Future Work

- incremental layout
- debug overlay UI
- constraint solver（可選）
