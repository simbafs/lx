---
title: Common Shorthands
description: LX attribute aliases and shorthand syntax
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

## Attribute Aliases

All `lx-*` attributes have short aliases:

<Tabs>
  <TabItem label="Sugar">
    ```html
    <div id="box" lx-l="10" lx-r="10" lx-t="10" lx-b="10"></div>
    ```
  </TabItem>
  <TabItem label="Canonical">
    ```html
    <div id="box" lx-left="..." lx-right="..." lx-top="..." lx-bottom="..."></div>
    ```
  </TabItem>
</Tabs>

### Alias Reference

| Sugar | Canonical | Description |
|-------|-----------|-------------|
| `lx-l` | `lx-left` | Left position |
| `lx-r` | `lx-right` | Right position |
| `lx-t` | `lx-top` | Top position |
| `lx-b` | `lx-bottom` | Bottom position |
| `lx-w` | `lx-width` | Width |
| `lx-h` | `lx-height` | Height |
| `lx-a` | `lx-aspect` | Aspect ratio |

---

## Numeric Position Shorthand

When the position value is a plain number, the system automatically fills in the reference:

<Tabs>
  <TabItem label="Sugar">
    ```html
    <div id="box" lx-l="10" lx-t="20"></div>
    ```
  </TabItem>
  <TabItem label="Canonical">
    ```html
    <div id="box" lx-left="<container>.left+10" lx-top="<container>.top+20"></div>
    ```
  </TabItem>
</Tabs>

`<container>` will be the nearest `lx` ancestor, or `body` if none exists.

---

## Fixed Size Shorthand

Fixed sizes can be written as plain numbers:

<Tabs>
  <TabItem label="Sugar">
    ```html
    <div id="box" lx-w="300" lx-h="200"></div>
    ```
  </TabItem>
  <TabItem label="Canonical">
    ```html
    <div id="box" lx-width="300" lx-height="200"></div>
    ```
  </TabItem>
</Tabs>

---

## Aspect Ratio Shorthand

<Tabs>
  <TabItem label="Sugar">
    ```html
    <div id="box" lx-a="16:9"></div>
    ```
  </TabItem>
  <TabItem label="Canonical">
    ```html
    <div id="box" lx-aspect="16:9"></div>
    ```
  </TabItem>
</Tabs>
