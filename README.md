# Development setup (TypeScript CLI)
## Requirements
* Node >= 20 (this project uses ESM: `"type": "module"`)

## Install
```bash
npm install
```

## Build (tsup)
```bash
npm run build
```
watch build (rebuild on changes):
```bash
npm run dev
```

## CLI entrypoint
The CLI command is wired via:
* `package.json` `"bin": { "lazystarforge": "bin/lazystarforge" }`
* `bin/lazystarforge` should start with a Node shebang and load the built code, e.g.
```js
#! /usr/bin/env node
import(new URL("../dist/index.js", import.meta.url))
```

## Test locally as a global CLI
```bash
npm link
lazystarforge
```
Unlink:
```bash
npm unlink -g lazystarforge
```

# Tests (vitest)
Run once:
```bash
npm test
```
Watch mode (TDD):
```bash
npm run test:watch
```
Coverage:
```bash
npm run test:cov
```
# Publishing
`prepublishOnly` runs the build automatically, and only `dist/` + `bin/` are included in the published package via `"file": ["dist", "bin"]`

