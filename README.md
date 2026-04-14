# lx

HTML attribute DSL for absolute positioning.

## Usage

```html
<script src="lx.js"></script>
```

Auto-initializes on page load.

## Syntax

```html
<div lx lx-l="50" lx-t="50" lx-w="200" lx-h="100">
	<span lx-l="0" lx-t="0" lx-w="50" lx-h="50">nested</span>
</div>
```

### Attributes

| Attribute   | Alias  | Description          |
| ----------- | ------ | -------------------- |
| `lx-left`   | `lx-l` | Left edge position   |
| `lx-right`  | `lx-r` | Right edge position  |
| `lx-top`    | `lx-t` | Top edge position    |
| `lx-bottom` | `lx-b` | Bottom edge position |
| `lx-width`  | `lx-w` | Element width        |
| `lx-height` | `lx-h` | Element height       |

### Reference Expression

```html
lx-l="#logo.right+10" lx-t="#header.bottom+20"
```

## Debug Mode

Add `?lx-debug` to URL for debug output:

```html
test.html?lx-debug
```

## License

MIT
