# Migrate away from deprecated `baseUrl` in tsconfig.json

## Background

TypeScript 6.0 is deprecating `baseUrl` for non-relative module resolution. The project currently
uses `"baseUrl": "."` so that 26 component files can import via bare `src/...` paths, e.g.:

```ts
import { withStyles, createStyles } from "src/muiCompat";
```

The warning shown:
```
Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.
Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
```

## Plan

### Step 1 — Update `tsconfig.json`

Remove `"baseUrl": "."` and replace it with an explicit `paths` mapping:

```json
"paths": {
  "src/*": ["./src/*"]
}
```

`paths` without `baseUrl` is supported from TypeScript 5.0 onwards, so no version bump is needed.

### Step 2 — Verify Vite resolution (no change needed)

`vite.config.ts` already uses the `vite-tsconfig-paths` plugin, which reads `paths` from
`tsconfig.json` and creates the corresponding Vite aliases automatically. No manual
`resolve.alias` entry is required.

### Step 3 — Verify

Run `npm run build` (runs `tsc --noEmit` + Vite build) and confirm:
- The deprecation warning is gone
- All 26 files that import via `src/...` still compile cleanly
- The build output is unchanged
