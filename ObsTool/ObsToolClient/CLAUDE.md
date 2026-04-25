# ObsToolClient

A React/TypeScript frontend for recording and tracking amateur astronomy observations (deep-sky objects). The backend is a separate ASP.NET Core project in the same repo.

## Rules / Restrictions

- Never commit anything to git.
- After making a change, as a last thing, always tell me what localhost address I can use to view the deployed change.

## Tech stack

- **React 18** + **TypeScript 5**
- **MUI v6** (`@mui/material`) for UI components
- **tss-react** (emotion) for component styling via `withStyles` HOC — see `src/muiCompat.ts`
- **Redux** + `react-redux` for global state
- **React Router v6**
- **Vite 5** as build tool

## Commands

```bash
npm run dev      # start dev server (check terminal for actual port, usually 3000–3003)
npm run build    # tsc --noEmit + vite build
npm run lint     # eslint
```

## Dev server ports

Vite picks an available port in the **30xx** range — always check the terminal output for the exact URL. If a dev server is running on any other 30xx port than 3000, then kill those servers so that the new one can start on 3000.

An old MUI v4 reference build runs separately on **http://localhost:5000** sometimes (useful for visual comparison). It's very important that you never click on any Save button there, or anywhere for that matter.

## Key architectural notes

**`src/muiCompat.ts`** — shim that adapts `tss-react/mui`'s `withStyles(Component, styles)` API to the curried `withStyles(styles)(Component)` HOC pattern. All 24+ class components import from here unchanged. Also exports a no-op `createStyles` and the `WithStyles` type.

**Styling pattern** — components use the `withStyles(styles)(Component)` HOC pattern throughout. Styles are emotion objects defined as `const styles = (theme: Theme) => createStyles({ ... })`. Do not switch individual components to `sx` or `styled()` without a deliberate refactor decision.

**ThemeProvider** — `App.tsx` wraps the tree in `<ThemeProvider theme={theme}>` from `@mui/material/styles` (emotion context). Required for both MUI v6 components and tss-react `withStyles` HOCs to access the custom theme.

**`.npmrc`** — contains `legacy-peer-deps=true`. This is intentional; some dependencies still declare `react@16` as a peer dep. Remove only after Phase 6 is complete.

## Testing

- **Vitest** + **React Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`)
- `npm test` — runs all tests once (`vitest run`)
- `npm run test:watch` — interactive watch mode
- Test environment: `jsdom` (configured in `vite.config.ts`)
- Setup file: `src/setupTests.ts` (imports jest-dom matchers)

## Search input selectors (for Playwright)

- Navbar autocomplete: `input[type=text]` (first input on page)
- Page search field: `input[type=search]`
