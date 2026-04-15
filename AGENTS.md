# lx - Agent Guide

## Project Overview

`lx` is a vanilla JS runtime that parses `lx-*` HTML attributes and converts them to CSS absolute positioning. No build step, no dependencies.

## Quick Commands

```bash
pnpm build     # Build dist files
pnpm test      # Run all tests (unit + e2e)
pnpm test:unit # Run unit tests only
pnpm test:e2e # Run e2e tests only
```

## Key Files

- `src/` - TypeScript source code
- `dist/` - Built JavaScript files
- `test.html` - Demo page (open directly in browser)
- `tests/` - Automated test suite

## Documentation

- [Syntax Specification](./agents/spec.md) - Complete lx syntax and semantics
- [Implementation Notes](./agents/implement.md) - Internal architecture and algorithms

## Architecture

```
src/
├── index.ts      # Core setup/update
├── parser.ts     # Attribute parsing, sugar expansion
├── resolver.ts   # Constraint solving, dependency graph
├── dom.ts        # CSS application, measurement
├── auto.ts       # MutationObserver + ResizeObserver
└── types.ts      # TypeScript interfaces
```

## Debug Mode

Add `?lx-debug` to the URL to enable debug output showing parsed nodes, dependency order, and resolved coordinates.
