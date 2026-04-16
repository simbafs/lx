---
title: Basic Layout Examples
description: Simple page structures demonstrating LX core features
---

## Typical Page Structure

A basic page with Header, Sidebar, and Main Content:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/@simbafs/lx/dist/lx.min.js"></script>
</head>
<body style="margin: 0; padding: 20px;">
  <div id="header" 
       lx-t="0" 
       lx-l="0" 
       lx-r="0" 
       lx-h="60"
       style="background: #3498db; color: white; padding: 10px;">
    Header
  </div>

  <div id="sidebar" 
       lx-l="0" 
       lx-t="previous.bottom+20" 
       lx-b="0" 
       lx-w="200"
       style="background: #2ecc71; color: white; padding: 10px;">
    Sidebar
  </div>

  <div id="main" 
       lx-l="previous.right+20" 
       lx-t="header.bottom+20" 
       lx-r="0" 
       lx-b="0"
       style="background: #e74c3c; color: white; padding: 10px;">
    Main Content
  </div>
</body>
</html>
```

---

## Using Containers

Adding the `lx` attribute creates a new reference container:

```html
<body lx style="margin: 0;">
  <div id="header" lx-t="0" lx-l="0" lx-r="0" lx-h="60"
       style="background: #3498db; color: white;">
    Header
  </div>

  <div id="layout" lx lx-t="previous.bottom+20" lx-l="0" lx-r="0" lx-b="0"
       style="background: #ecf0f1;">
    
    <div id="sidebar" lx-l="0" lx-t="0" lx-b="0" lx-w="200"
         style="background: #2ecc71; color: white;">
      Sidebar
    </div>

    <div id="content" lx-l="previous.right+20" lx-t="0" lx-r="0" lx-b="0"
         style="background: #fff;">
      Content
    </div>
  </div>
</body>
```

---

## Using Variables for Spacing

```html
<body lx data-lx-gap="20" data-lx-padding="20">
  <div id="header" 
       lx-t="0" 
       lx-l="({padding})" 
       lx-r="({padding})" 
       lx-h="60">
    Header
  </div>

  <div id="sidebar" 
       lx-l="({padding})" 
       lx-t="previous.bottom+({gap})" 
       lx-w="200"
       lx-b="({padding})">
    Sidebar
  </div>

  <div id="main" 
       lx-l="previous.right+({gap})" 
       lx-t="header.bottom+({gap})" 
       lx-r="({padding})"
       lx-b="({padding})">
    Main Content
  </div>
</body>
```

---

## Responsive Aspect Ratio Cards

Create fixed-ratio elements using `lx-aspect`:

```html
<body lx data-lx-padding="20">
  <div id="card1" lx-t="0" lx-l="0" lx-a="16:9" lx-w="300">16:9 Card</div>
  <div id="card2" lx-t="previous.bottom+20" lx-l="0" lx-a="1:1" lx-w="200">1:1 Card</div>
  <div id="card3" lx-t="previous.bottom+20" lx-l="0" lx-a="4:3" lx-w="400">4:3 Card</div>
</body>
```
