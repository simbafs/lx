# lx - HTML Attribute DSL for Absolute Positioning

## Overview

`lx` is a vanilla JS runtime that parses `lx-*` HTML attributes and converts them to CSS absolute positioning. No build step, no dependencies.

## Usage

```html
<script src="lx.js"></script>
<!-- Auto-initializes on load -->

<!-- Debug mode -->
<script src="lx.js?lx-debug"></script>
```

## Debug Mode

- `?lx-debug` in URL enables debug output
- Prints two tables: `[lx] Parsed` (raw attributes) and `[lx] Resolved` (calculated values)
- Each container gets its own table, nested containers shown recursively

## Testing

Open `test.html` directly in browser. No test runner.

## Key Concepts

### Position Semantics
- `lx-l="50"` = 50px offset from container's left edge
- `lx-r="-50"` = 50px offset from container's right edge (inside)
- Negative values are relative to container edge, not absolute

### Container Elements
- Elements with `lx` attribute become containers
- `lx="target"` changes reference source for self + children
- Container with explicit positioning uses `position:absolute` (to respect calculated left/top)
- Container without positioning uses `position:relative`

### Attribute Aliases
- `lx-l` = `lx-left`
- `lx-r` = `lx-right`
- `lx-t` = `lx-top`
- `lx-b` = `lx-bottom`
- `lx-w` = `lx-width`
- `lx-h` = `lx-height`

## Important Design Decisions

### Container Position:absolute
See `applyCSS()` in lx.js line ~479. Container elements with explicit positioning (lx-left/top/right/bottom) use `position:absolute` instead of `relative` because the calculated left/top values are correct and should be respected. This was a bug fix - previously containers were forced to `relative`, ignoring their positioning.

### CSS Output Offset
All elements (including containers) have their left/top adjusted relative to their parent container in `generateCSS()`. This ensures elements position correctly within nested containers.

### Negative Values
Negative position values are NOT absolute coordinates. `lx-r="-50"` means "50px from container's right edge", not "right edge at -50px". This is converted to a ref expression internally.

## Code Structure

- `lx.js` - single file, ~900 lines
- `parseElement()` - parses `lx-*` attributes
- `solveConstraints()` - resolves ref expressions and calculates positions
- `generateCSS()` - adjusts positions relative to parent container
- `applyCSS()` - applies CSS to DOM
- `printDebug()` - debug table output
