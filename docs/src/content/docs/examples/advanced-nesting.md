---
title: Advanced Nesting Examples
description: Demonstrating LX simplifications in complex nesting scenarios
---

## Nested Layout

LX's container system makes nested layouts intuitive:

```html
<body lx data-lx-gap="20" data-lx-padding="20">
  <div id="app" lx lx-t="0" lx-l="0" lx-r="0" lx-b="0">
    
    <div id="header" lx-t="0" lx-l="0" lx-r="0" lx-h="50">
      Header
    </div>

    <div id="main-area" lx lx-t="previous.bottom+({gap})" lx-l="0" lx-r="0" lx-b="0">
      
      <div id="sidebar" lx lx-l="0" lx-t="0" lx-b="0" lx-w="200">
        <div id="menu-item1" lx-t="0" lx-l="0" lx-r="0" lx-h="40">Menu 1</div>
        <div id="menu-item2" lx-t="previous.bottom+10" lx-l="0" lx-r="0" lx-h="40">Menu 2</div>
        <div id="menu-item3" lx-t="previous.bottom+10" lx-l="0" lx-r="0" lx-h="40">Menu 3</div>
      </div>

      <div id="content" lx lx-l="previous.right+({gap})" lx-t="0" lx-r="0" lx-b="0">
        <div id="card1" lx-t="0" lx-l="0" lx-w="200" lx-h="150">Card 1</div>
        <div id="card2" lx-t="previous.bottom+({gap})" lx-l="0" lx-w="200" lx-h="150">Card 2</div>
        <div id="card3" lx-t="previous.bottom+({gap})" lx-l="0" lx-w="200" lx-h="150">Card 3</div>
      </div>
    </div>
  </div>
</body>
```

---

## Using next for Adjacent Elements

When element order is known, using `next` can simplify code significantly:

```html
<div id="container" lx data-lx-gap="10">
  <div id="item1" lx-t="0" lx-l="0" lx-w="100" lx-h="50">Item 1</div>
  <div id="item2" lx-t="next.top-({gap})" lx-l="previous.right+({gap})" lx-w="100" lx-h="50">Item 2</div>
  <div id="item3" lx-t="next.top-({gap})" lx-l="previous.right+({gap})" lx-w="100" lx-h="50">Item 3</div>
  <div id="item4" lx-t="next.top-({gap})" lx-l="previous.right+({gap})" lx-w="100" lx-h="50">Item 4</div>
</div>
```

---

## Grid System

Build grids using nested containers:

```html
<body lx data-lx-gap="20" data-lx-padding="20">
  <div id="grid" lx lx-t="0" lx-l="0" lx-r="0" lx-b="0">
    
    <div id="row1" lx lx-t="0" lx-l="0" lx-r="0" lx-h="100">
      <div id="cell1-1" lx lx-l="0" lx-t="0" lx-b="0" lx-w="calc(33.33%-({gap}*2/3))">Cell 1-1</div>
      <div id="cell1-2" lx lx-l="previous.right+({gap})" lx-t="0" lx-b="0" lx-w="calc(33.33%-({gap}*2/3))">Cell 1-2</div>
      <div id="cell1-3" lx lx-l="previous.right+({gap})" lx-t="0" lx-b="0" lx-w="calc(33.33%-({gap}*2/3))">Cell 1-3</div>
    </div>

    <div id="row2" lx lx-t="previous.bottom+({gap})" lx-l="0" lx-r="0" lx-h="100">
      <div id="cell2-1" lx lx-l="0" lx-t="0" lx-b="0" lx-w="calc(50%-({gap}/2))">Cell 2-1</div>
      <div id="cell2-2" lx lx-l="previous.right+({gap})" lx-t="0" lx-b="0" lx-w="calc(50%-({gap}/2))">Cell 2-2</div>
    </div>
  </div>
</body>
```

---

## Dynamic Updates

LX supports dynamic updates, suitable for scenarios that respond to data changes:

```javascript
// Change gap
document.body.dataset.lxGap = '40';

// Notify LX to recalculate
lx.update();
```

```html
<body data-lx-gap="20" data-lx-scale="1">
  <div id="card" lx-t="0" lx-l="0" lx-w="({scale}*200)" lx-h="({scale}*100)">
    <button onclick="document.body.dataset.lxScale = '1.5'; lx.update();">
      Scale Up
    </button>
  </div>
</body>
```

---

## Form Layout

Use the grid system to create aligned forms:

```html
<div id="form" lx data-lx-gap="15" data-lx-padding="20">
  <div id="form-row1" lx lx-t="0" lx-l="0" lx-r="0" lx-h="40">
    <div id="label1" lx-l="0" lx-t="0" lx-b="0" lx-w="100">Name:</div>
    <div id="input1" lx lx-l="previous.right+10" lx-t="0" lx-b="0" lx-r="0">Input</div>
  </div>
  
  <div id="form-row2" lx lx-t="previous.bottom+({gap})" lx-l="0" lx-r="0" lx-h="40">
    <div id="label2" lx-l="0" lx-t="0" lx-b="0" lx-w="100">Email:</div>
    <div id="input2" lx lx-l="previous.right+10" lx-t="0" lx-b="0" lx-r="0">Input</div>
  </div>
  
  <div id="form-row3" lx lx-t="previous.bottom+({gap})" lx-l="0" lx-r="0" lx-h="40">
    <div id="label3" lx-l="0" lx-t="0" lx-b="0" lx-w="100">Message:</div>
    <div id="input3" lx lx-l="previous.right+10" lx-t="0" lx-b="0" lx-r="0">Input</div>
  </div>
</div>
```
