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

使用 regex：

    /^(body|#id).(edge)(+offset)?/

---

### SizeExpr

支援：

- 固定：300
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

## 5. Dependency Graph

- 每個 node 建立 refs
- 使用 DFS 做 cycle detection
- 使用 DFS 做 topological sort

---

## 6. Resolution

### 6.1 Position

- body → 直接數值
- #id → 讀 target.resolved

---

### 6.2 Range Size

流程：

1.  先套 CSS min/max
2.  先 partial layout
3.  getBoundingClientRect()
4.  clamp(min, max)
5.  寫回 width/height

---

### 6.3 Solve

每個軸：

- left + right → width
- left + width → right
- right + width → left

---

## 7. Coordinate System

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

## 8. Containing Block

目前策略：

- 最近的 lx element（有被解析的 node）
- 若沒有 → body

---

## 9. CSS Output

每個元素：

    position: absolute;
    left: px;
    top: px;
    width: px;
    height: px;

---

## 10. Debug Mode

啟用：

- ?lx-debug

輸出：

- parsed nodes (table)
- dependency order
- resolved boxes
- applied css

---

## 11. Limitations

目前未支援：

- sugar（lx, shorthand）
- reflow / resize
- partial update
- scroll / transform 修正
- 非 absolute layout

---

## 12. Known Issues

- getBoundingClientRect() 依賴 layout timing
- range size 可能需多次 reflow（目前只有一輪）
- nested transform 會影響座標
- scroll container 未處理

---

## 13. Future Work

- sugar compiler
- ResizeObserver
- incremental layout
- debug overlay UI
- constraint solver（可選）
