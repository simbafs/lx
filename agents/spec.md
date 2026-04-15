# LX Layout Spec (Syntax Only)

## Overview

LX 是一套宣告式 layout 語法，透過 HTML attribute
描述元素之間的幾何關係。

本文件**僅定義語法（syntax）與語意（semantics）**，不包含任何實作細節。

---

# 1. Core Concepts

## 1.1 Coordinate System

- x 軸：向右為正
- y 軸：向下為正

## 1.2 Edge

每個元素有四個邊：

- left
- right
- top
- bottom

---

# 2. Canonical Syntax

Canonical 是唯一正式語法，所有 sugar 必須可轉換成 canonical。

---

## 2.1 Position Attributes

### 屬性

- lx-left
- lx-right
- lx-top
- lx-bottom

### 語法

    <ref>.<edge>[+|-offset]

### ref

- body
- #id

### edge

- left
- right
- top
- bottom

### offset

- 整數或浮點數
- 可省略（預設為 0）

---

### 範例

```html
lx-left="body.left+0" lx-top="#main.bottom+20" lx-right="#screen.right-50"
```

---

## 2.2 Size Attributes

### 屬性

- lx-width
- lx-height

### 語法

#### 固定尺寸

    <number>

#### 範圍尺寸

    <min>/<max>

#### 表達式尺寸

    (<expression>)

---

### 範例

```html
lx-width="300" lx-height="200/500"
```

---

## 2.3 Aspect Ratio Attribute

### 屬性

- lx-aspect

### 語法

    <width>:<height>

### 語意

定義元素的寬高比 ($R = W/H$)。

- `width` 與 `height` 必須為正數
- 不可為零（如 `16:0` 為非法）

### 範例

```html
lx-aspect="16:9"
lx-aspect="1:1"
lx-aspect="4:3"
```

---

# 3. Constraint Rules

## 3.1 約束組合

引入 `lx-aspect` 後，系統支援三種合法約束組合：

### 組合 A：標準獨立約束（無 Aspect）

- **水平**：從 `lx-left`, `lx-right`, `lx-width` 中選 2 個
- **垂直**：從 `lx-top`, `lx-bottom`, `lx-height` 中選 2 個

### 組合 B：由寬推高（Aspect + Horizontal Dominant）

- **水平**：選 2 個（決定寬度）
- **垂直**：選 1 個（決定起始點，如 `lx-top` 或 `lx-bottom`）
- **比例**：`lx-aspect`（由寬度計算高度）

### 組合 C：由高推寬（Aspect + Vertical Dominant）

- **垂直**：選 2 個（決定高度）
- **水平**：選 1 個（決定起始點，如 `lx-left` 或 `lx-right`）
- **比例**：`lx-aspect`（由高度計算寬度）

---

## 3.2 限制

### 硬性限制（Hard Fail）

1. **禁止與 Range Size 共存**
   - `lx-aspect` 不可與任何範圍尺寸（如 `200/500`）同時出現在同一元素上
   - 原因：避免循環渲染震盪

2. **禁止過度約束**
   - 若同時擁有「水平 2 約束」與「垂直 2 約束」卻又標註 `lx-aspect`，拋出錯誤

3. **禁止約束不足**
   - 若使用 `lx-aspect` 但其中一個維度沒有任何位置參考，拋出錯誤

4. **格式錯誤**
   - `W:H` 中 `W` 或 `H` 必須為正數且不得為零

### 其他限制

- 當無 `lx-aspect` 時：width 與 height 不能同時為 range
- 所有元素必須有 id
- 不允許循環依賴

---

# 4. Reference Semantics

## 4.1 body

- 表示整個畫布（viewport）

## 4.2 #id

- 表示指定元素

---

# 5. Sugar Syntax

Sugar 是語法簡化，必須可轉換為 canonical。

---

## 5.1 Attribute Alias

| Sugar | Canonical  |
|-------|------------|
| lx-l  | lx-left    |
| lx-r  | lx-right   |
| lx-t  | lx-top     |
| lx-b  | lx-bottom  |
| lx-w  | lx-width   |
| lx-h  | lx-height  |
| lx-a  | lx-aspect  |

---

## 5.2 Numeric Position Sugar

當值為純數字時：

    lx-left="10"

等價於：

    lx-left="<container>.left+10"

---

## 5.3 Container (lx)

### 語法

```html
<div lx></div>
```

### 語意

- 定義新的 reference container
- 子元素若未指定 reference，預設使用此元素

---

## 5.4 Implicit Reference

若 position 未指定 ref：

    lx-left="10"

則轉換為：

    lx-left="<nearest lx ancestor>.left+10"

若不存在 lx ancestor：

    lx-left="body.left+10"

---

## 5.5 Relative Selectors (previous / next)

### 語法

    previous.<edge>[+|-offset]
    next.<edge>[+|-offset]

### 語意

- `previous`：參考同一容器內邏輯順序上的前一個 `lx` 元素
- `next`：參考同一容器內邏輯順序上的下一個 `lx` 元素
- 順序按照 DOM Tree Order（DFS 前序遍歷時首次遇到的順序）
- 為語法糖，會在 setup 階段翻譯為具體的 `#id.edge` 格式

### 邊界條件

- 第一個元素使用 `previous`：拋出解析錯誤
- 最後一個元素使用 `next`：拋出解析錯誤

---

### 範例

```html
<div id="container" lx>
  <div id="first" lx-l="0" lx-r="0" lx-t="0" lx-h="50">first</div>
  <div id="second" lx-l="0" lx-r="0" lx-t="previous.bottom+10" lx-h="80">second</div>
  <div id="third" lx-l="0" lx-r="0" lx-t="previous.bottom+10" lx-h="60">third</div>
</div>
```

翻譯後：

```html
<div id="container" lx>
  <div id="first" lx-l="0" lx-r="0" lx-t="0" lx-h="50">first</div>
  <div id="second" lx-l="0" lx-r="0" lx-t="#first.bottom+10" lx-h="80">second</div>
  <div id="third" lx-l="0" lx-r="0" lx-t="#second.bottom+10" lx-h="60">third</div>
</div>
```

---

## 5.6 Arithmetic Expressions

### 語法

#### 純表達式（作為數值）

    (expression)

#### 帶參考的表達式位移

    #id.edge+(expression)
    #id.edge-(expression)
    body.edge+(expression)

#### 表達式

| 格式           | 說明     |
|----------------|----------|
| `{variable}`   | 變數引用 |
| `100+50`       | 加法     |
| `{gap}*2`      | 乘法     |
| `({base}/2)`   | 除法     |
| `100-{offset}` | 減法     |

### 語意

- 表達式在 `setup` 階段求值，轉換為最終數值
- 支援四則運算：`+`, `-`, `*`, `/`
- **單層括號約束**：巢狀括號如 `((1+2)*3)` 不支援
- 表達式結果為純數字後，視為一般數值處理

### 錯誤處理

- 除以零：拋出錯誤
- 無效 token：拋出錯誤
- 表達式尾部為運算子：拋出錯誤

---

## 5.7 Variable Scope

### 語法

    data-lx-[name]="<number>"

### 語意

- 變數定義在元素的 `data-lx-*` 屬性中
- **冒泡查找**：從當前元素向上查找直到 `<body>`
- **就近覆蓋**：子元素優先使用祖先中最近定義的值
- **Hard Fail**：未定義的變數或非數字值會立即拋出錯誤

### 範例

```html
<body data-lx-gap="20" data-lx-scale="0.8">
  <div id="container" lx>
    <div id="a" lx-l="0" lx-t="0" lx-w="({base}*2)" lx-h="100">a</div>
    <div id="b" lx-l="0" lx-t="previous.bottom+({gap})" lx-w="100" lx-h="50">b</div>
  </div>
</body>
```

---

# 6. Canonical Transformation

所有 sugar 必須可轉換為：

- 顯式 ref（body 或 #id）
- 顯式 edge
- 顯式 offset
- 完整屬性名稱（lx-left 等）

---

# 7. Example

## Sugar

```html
<div lx>
	<div lx-l="10" lx-t="10" lx-w="100" lx-h="100"></div>
</div>
```

## Canonical

```html
<div lx-left="body.left+0" lx-top="body.top+0">
	<div lx-left="#parent.left+10" lx-top="#parent.top+10" lx-width="100" lx-height="100"></div>
</div>
```

---

# 8. Design Principles

- 所有語法必須可靜態轉換為 canonical
- canonical 不依賴隱式 container
- layout 描述為幾何關係，而非渲染方式
- CSS / JS 為實作細節，不屬於語法規格
