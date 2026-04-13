# ✅ lx 語法規格

---

# 1. 目標

`lx` 是一組 HTML attribute DSL，用來描述固定座標系下的絕對排版。

runtime 將：

* 解析 `lx-*`
* 計算必要的依賴
* 轉譯為 CSS

設計原則：

* 不模仿 CSS `right/bottom` 語意
* 使用一致數學座標系
* 盡量直接轉 CSS，必要時才做 runtime 計算
* 無需手寫 JS

---

# 2. 座標系

所有位置值遵循：

* x 向右為正
* y 向下為正

---

# 3. 邊界定義

每個元素有四條邊：

* left
* right
* top
* bottom

所有 `lx-*` 位置屬性表示：

👉 **該邊在參考座標系中的座標值**

---

# 4. 屬性總覽

## 4.1 參考系控制

* `lx`
* `lx="<target>"`

## 4.2 位置

* `lx-left`
* `lx-right`
* `lx-top`
* `lx-bottom`

## 4.3 尺寸

* `lx-width`
* `lx-height`

---

# 5. 參考系規則（修正版）

---

## 5.1 預設參考

所有元素預設參考：

```txt
document.body
```

---

## 5.2 元素自身的參考來源（重要）

👉 元素「定位自己」時的 reference 決定規則：

1. 若元素有 `lx="<target>"` → 使用 target
2. 否則：

   * 找最近的祖先中「提供 container 的元素」
3. 若不存在 → 使用 `body`

---

## 5.3 container 提供規則（修正重點）

👉 一個元素若有：

```html
<div lx>
```

則：

* **該元素成為 container（提供給子元素用）**
* **但不影響它自己的 reference**

---

### ❗ 關鍵結論

```html
<div lx lx-left="100">
```

* `div.left` 仍然相對於 body
* `div` 只是「提供 container 給子元素」

---

## 5.4 `lx="target"`

```html
<span lx="body">
```

語意：

* 設定「自身 + 子樹」的參考來源為 target

target 可為：

* `body`
* `#id`

---

## 5.5 container 傳遞（inheritance）

對任一元素：

👉 它的 reference container 來源如下：

1. 若元素有 `lx="..."` → 使用該 target
2. 否則：

   * 往上找最近有 `lx` 的祖先
3. 若沒有 → 使用 `body`

---

## 5.6 總結（最重要一句）

👉

**元素的定位參考 ≠ container 宣告本身**

* `lx` → 提供 container（給子元素）
* `lx="..."` → 改變參考來源（自己 + 子孫）

---

# 6. 位置語法

---

## 6.1 數值

```html
lx-left="10"
```

表示：

```txt
self.left = 10
```

（相對於參考座標系）

---

## 6.2 引用表達式

```html
lx-left="#logo.right+10"
```

表示：

```txt
self.left = logo.right + 10
```

---

## 6.3 語法

```txt
value     = number | refexpr
refexpr   = "#" id "." edge [offset]
offset    = ("+" | "-") number
edge      = left | right | top | bottom
```

---

## 6.4 範例

```html
lx-left="#logo.right+10"
lx-top="#title.bottom+20"
lx-right="#panel.right"
lx-bottom="#box.top-10"
```

---

# 7. 尺寸語法

---

## 7.1 固定尺寸

```html
lx-width="300"
lx-height="100"
```

---

## 7.2 內容尺寸（range）

```html
lx-width="100/400"
```

表示：

```txt
width = clamp(contentWidth, 100, 400)
```

---

## 7.3 限制

* 不可同時：

  * `lx-width="a/b"`
  * `lx-height="c/d"`

---

# 8. 約束規則

---

## 8.1 每維度最多 2 個 constraint

---

### 水平

合法：

* left + width
* right + width
* left + right

非法：

```html
lx-left + lx-right + lx-width
```

---

### 垂直

合法：

* top + height
* bottom + height
* top + bottom

---

## 8.2 不完整 constraint

以下皆非法：

```html
lx-left="10"
lx-top="20"
lx-width="100"
```

---

# 9. 引用規則

---

## 9.1 僅支援 id

```html
#id.edge
```

---

## 9.2 必須存在

否則報錯

---

## 9.3 禁止循環

```html
A → B → A
```

必須報錯

---

# 10. content size 處理

---

## 10.1 流程

對 `lx-width="min/max"`：

1. 先 render
2. 讀 content size
3. clamp
4. 回填 CSS

---

## 10.2 不做

* 不使用 `minmax()`
* 不依賴 CSS 解算

---

# 11. runtime 行為

---

## 11.1 掃描

從：

```txt
document.body
```

掃描所有帶 `lx-*` 的元素

---

## 11.2 CSS 轉譯

### container

帶 `lx` 的元素：

```css
position: relative;
```

---

### 被定位元素

```css
position: absolute;
```

---

## 11.3 輸出

最終建議輸出：

```css
left
top
width
height
```

---

# 12. 完整範例

---

## 12.1 container 不影響自身

```html
<body>
  <div lx lx-left="100" lx-top="50" lx-width="800" lx-height="400">
    <img lx-left="10" lx-top="20" lx-width="100" lx-height="100">
  </div>
</body>
```

語意：

* div 相對 body
* img 相對 div

---

## 12.2 覆寫參考

```html
<body>
  <div lx lx-left="100" lx-top="100" lx-width="500" lx-height="300">
    <span lx="body" lx-left="10" lx-top="10"></span>
  </div>
</body>
```

語意：

* span 相對 body
* 而非 div

---

## 12.3 相依定位

```html
<body>
  <img id="logo" lx-left="10" lx-top="10" lx-width="100" lx-height="100">

  <h1 lx-left="#logo.right+20" lx-top="10" lx-width="200" lx-height="80">
    Title
  </h1>
</body>
```

---

## 12.4 stretch

```html
<div lx-left="100" lx-right="500" lx-top="50" lx-height="80">
```

---

# 13. 錯誤條件

必須報錯：

* id 不存在
* 循環依賴
* constraint > 2
* constraint < 2
* width/height 同時 range
* min > max
* 語法錯誤

---

# 14. 核心設計總結（最重要）

👉

**`lx` = 建立子元素用的座標系（container）
`lx="..."` = 改變自身與子樹的參考來源
`lx-*` = 在該座標系中定義邊界與尺寸**

---

# 🚀 一句話總結

你現在這套已經變成：

> **一個用 DOM attribute 描述座標約束，並在 runtime 編譯成 absolute layout 的系統。**
