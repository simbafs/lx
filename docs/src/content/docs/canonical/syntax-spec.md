---
title: Syntax Specification
description: Complete definition of LX canonical syntax
---

## Position Attributes

### Syntax

```
<ref>.<edge>[+|-offset]
```

### Reference (`ref`)

| Value | Description |
|-------|-------------|
| `body` | Viewport |
| `#id` | Element with specified ID |

### Edge

| Value | Description |
|-------|-------------|
| `left` | Left boundary |
| `right` | Right boundary |
| `top` | Top boundary |
| `bottom` | Bottom boundary |

### Offset

- Integer or floating point number
- Can be omitted (default is 0)
- Use `+` for positive, write `-` directly for negative

### Example

```html
<div id="main" lx-left="body.left+0" lx-top="body.top+0">
  <div id="box" lx-left="#main.left+20" lx-top="#main.top+30" lx-right="#main.right-20" lx-bottom="#main.bottom-30"></div>
</div>
```

---

## Size Attributes

### Fixed Size

```html
<div id="box" lx-width="300" lx-height="200"></div>
```

### Range Size

Syntax: `min/max`

```html
<div id="box" lx-width="200/500" lx-height="100/300"></div>
```

### Expression Size

```html
<div id="box" lx-width="({container}/2)" lx-height="({width}*0.75)"></div>
```

---

## Aspect Ratio Attribute

### Syntax

```
<width>:<height>
```

### Rules

- `width` and `height` must be positive numbers
- Cannot be zero

### Example

```html
<div id="box" lx-aspect="16:9"></div>
<div id="square" lx-aspect="1:1"></div>
<div id="photo" lx-aspect="4:3"></div>
```

---

## Standard Attribute Names

| Standard Attribute | Description |
|--------------------|-------------|
| `lx-left` | Left position |
| `lx-right` | Right position |
| `lx-top` | Top position |
| `lx-bottom` | Bottom position |
| `lx-width` | Width |
| `lx-height` | Height |
| `lx-aspect` | Aspect ratio |

---

## Container Elements

Elements with the `lx` attribute become "containers". Child elements will reference this container by default:

```html
<div id="container" lx>
  <div id="child" lx-t="0" lx-l="0" lx-w="100" lx-h="100"></div>
</div>
```

In this case, `child`'s position will reference the parent element, not `body`.
