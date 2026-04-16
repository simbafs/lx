---
title: Design Philosophy
description: Core concepts and design principles of LX
---

## Design Philosophy

LX is a **declarative layout syntax** that describes geometric relationships between HTML elements, rather than specifying concrete rendering methods.

### Core Principles

1. **Geometry First**: Describe "how far this element is from that element" instead of "this element is at 100px"
2. **Auto-inference**: The system automatically calculates missing information based on known constraints
3. **Static Transformation**: All sugar syntax is transformed to canonical form during setup

## Coordinate System

- **X-axis**: Positive to the right
- **Y-axis**: Positive downward

Each element has four edges:

| Edge | Description |
|------|-------------|
| `left` | Left boundary |
| `right` | Right boundary |
| `top` | Top boundary |
| `bottom` | Bottom boundary |

## Canonical vs Sugar

LX syntax has two levels:

### Canonical (Standard Syntax)

The only formal syntax. All other forms are eventually transformed into Canonical.

```html
<div id="parent" lx-left="body.left+0" lx-top="body.top+0">
  <div id="child" lx-left="#parent.left+10" lx-top="#parent.top+10" lx-width="100" lx-height="100"></div>
</div>
```

### Sugar (Syntax Sugar)

Simplified syntax for better readability:

```html
<div id="parent" lx>
  <div id="child" lx-l="10" lx-t="10" lx-w="100" lx-h="100"></div>
</div>
```

Both are equivalent. Sugar is automatically transformed to Canonical internally.

## Differences from CSS

| Feature | CSS | LX |
|---------|-----|-----|
| Positioning | Position or size | Geometric relationship |
| Responsive | Media Query | Variables + expressions |
| Dependency | Manual | Automatic topological sort |
| Updates | Manual | Call `lx.update()` |

## Constraint Combinations

LX supports three valid constraint combinations:

### Combination A: Standard Independent Constraints

- **Horizontal**: Choose 2 from `lx-left`, `lx-right`, `lx-width`
- **Vertical**: Choose 2 from `lx-top`, `lx-bottom`, `lx-height`

### Combination B: Width Derives Height

- **Horizontal**: Choose 2 (determines width)
- **Vertical**: Choose 1 (determines starting point)
- **Ratio**: `lx-aspect`

### Combination C: Height Derives Width

- **Vertical**: Choose 2 (determines height)
- **Horizontal**: Choose 1 (determines starting point)
- **Ratio**: `lx-aspect`
