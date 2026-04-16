---
title: Auto Resolver
description: How LX automatically fills in missing constraints
---

## Implicit Reference

When a position value is a plain number, the system automatically infers the reference:

```html
<div id="container" lx>
  <div id="box" lx-l="10" lx-t="10" lx-w="100" lx-h="100"></div>
</div>
```

In this case:
- `lx-l="10"` → `lx-left="#container.left+10"`
- `lx-t="10"` → `lx-top="#container.top+10"`

If there's no `lx` ancestor, the reference is `body`:

```html
<body>
  <div id="box" lx-l="10" lx-t="10" lx-w="100" lx-h="100"></div>
</body>
```

In this case:
- `lx-l="10"` → `lx-left="body.left+10"`
- `lx-t="10"` → `lx-top="body.top+10"`

---

## Relative Position (previous / next)

Use `previous` or `next` to reference adjacent elements within the same container:

<Tabs>
  <TabItem label="Sugar">
    ```html
    <div id="container" lx>
      <div id="first" lx-l="0" lx-t="0" lx-w="100" lx-h="50">First</div>
      <div id="second" lx-t="previous.bottom+10" lx-w="100" lx-h="60">Second</div>
      <div id="third" lx-t="previous.bottom+10" lx-w="100" lx-h="70">Third</div>
    </div>
    ```
  </TabItem>
  <TabItem label="Canonical">
    ```html
    <div id="container" lx>
      <div id="first" lx-l="0" lx-t="0" lx-w="100" lx-h="50">First</div>
      <div id="second" lx-t="#first.bottom+10" lx-w="100" lx-h="60">Second</div>
      <div id="third" lx-t="#second.bottom+10" lx-w="100" lx-h="70">Third</div>
    </div>
    ```
  </TabItem>
</Tabs>

### Syntax

```
previous.<edge>[+|-offset]
next.<edge>[+|-offset]
```

### Edge Cases

- Using `previous` on the first element: throws a parse error
- Using `next` on the last element: throws a parse error

---

## Expression Evaluation

LX supports mathematical expressions in attribute values:

```html
<div id="box" lx-w="({base}*2)" lx-h="({base}*2)"></div>
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `+` | Addition | `({a}+{b})` |
| `-` | Subtraction | `({a}-10)` |
| `*` | Multiplication | `({width}*2)` |
| `/` | Division | `({total}/2)` |

### Limitations

- **Single-level parentheses**: Nested parentheses like `((1+2)*3)` are not supported
- **Division by zero**: Throws an error
- **Undefined variables**: Throws an error

---

## Constraint Auto-inference

When only partial constraints are specified, the system automatically infers the remaining values:

### Only width and left edge specified

<Tabs>
  <TabItem label="Input">
    ```html
    <div id="box" lx-l="10" lx-w="200"></div>
    ```
  </TabItem>
  <TabItem label="Resolved">
    ```html
    <div id="box" lx-l="10" lx-r="210"></div>
    ```
  </TabItem>
</Tabs>

### Only left and right edges specified

<Tabs>
  <TabItem label="Input">
    ```html
    <div id="box" lx-l="10" lx-r="10"></div>
    ```
  </TabItem>
  <TabItem label="Resolved">
    ```html
    <div id="box" lx-l="10" lx-r="10" lx-w="container.width-20"></div>
    ```
  </TabItem>
</Tabs>

---

## Variable Scope

Variables are defined in `data-lx-*` attributes with bubble-up lookup:

```html
<body data-lx-gap="20" data-lx-scale="0.8">
  <div id="container" lx data-lx-scale="1">
    <div id="box" lx-w="({base}*2)" lx-h="100"></div>
  </div>
</body>
```

In this case, `box`'s `scale` is `1` (overriding body's `0.8`).
