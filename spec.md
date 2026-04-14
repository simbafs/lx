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

---

### 範例

```html
lx-width="300" lx-height="200/500"
```

---

# 3. Constraint Rules

## 3.1 每個維度必須有 2 個 constraint

### 水平（X）

- lx-left
- lx-right
- lx-width

→ 必須剛好 2 個

### 垂直（Y）

- lx-top
- lx-bottom
- lx-height

→ 必須剛好 2 個

---

## 3.2 限制

- width 與 height 不能同時為 range
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

Sugar Canonical

---

lx-l lx-left
lx-r lx-right
lx-t lx-top
lx-b lx-bottom
lx-w lx-width
lx-h lx-height

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

## 5.4 Override Container

```html
<span lx="body"></span>
```

語意：

- 將 reference 強制設為 body

---

## 5.5 Implicit Reference

若 position 未指定 ref：

    lx-left="10"

則轉換為：

    lx-left="<nearest lx ancestor>.left+10"

若不存在 lx ancestor：

    lx-left="body.left+10"

---

## 5.6 Relative Selectors (previous / next)

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
