---
title: Getting Started
description: Quick start with LX declarative layout syntax
---

## Installation

### CDN (Recommended for prototyping)

```html
<script src="https://cdn.jsdelivr.net/npm/@simbafs/lx/dist/lx.min.js"></script>
```

### npm

```bash
pnpm add @simbafs/lx
```

```javascript
import 'lx' from '@simbafs/lx';
```

## Basic Usage

Add `lx-*` attributes to HTML elements to describe layout:

```html
<body>
  <div id="header" lx-t="0" lx-l="0" lx-r="0" lx-h="60">Header</div>
  <div id="sidebar" lx-l="0" lx-t="previous.bottom+20" lx-b="0" lx-w="200">Sidebar</div>
  <div id="main" lx-l="previous.right+20" lx-t="previous.top" lx-r="0" lx-b="0">Main Content</div>
</body>
```

LX automatically calculates and applies styles when the page loads.

## Requirements

- All elements using `lx-*` attributes **must have an `id`**
- If an element should serve as a reference container for children, add the `lx` attribute

## Debug Mode

Add `?lx-debug` to the URL to see debug information:

```html
<script src="lx.min.js"></script>
<!-- Open http://example.com/?lx-debug -->
```
