# ObsToolClient

A React/TypeScript frontend for recording and tracking amateur astronomy observations (deep-sky objects). The backend is a separate ASP.NET Core project in the same repo.

## Rules / Restrictions

- Never commit anything to git.
- Preserve the user's staged changes. Do not run broad staging or unstaging commands such as `git add .`, `git restore --staged .`, or `git reset` unless the user explicitly asks for that exact git operation. Leave already staged files staged. Put new or modified work in the working tree only, unstaged, and report the status clearly.
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
npm run dev      # start dev server
npm run build    # tsc --noEmit + vite build
npm run lint     # eslint
```

## Dev server ports

**Port 3000** is always manually started by the user — never kill it, never start anything on it.

**Port 3001** is Claude's dedicated dev server port. When you need a dev server:
1. Check if port 3000 is already running — if so, use `http://localhost:3000` directly.
2. If port 3000 is not running, kill any servers on ports 3001–3020 (except 3000), then start your own with `npm run dev -- --port 3001` and use `http://localhost:3001`.
3. Always use port 3001 for your own server — no other port.

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

## Observation listing components

There are two distinct list patterns for observations, depending on entry point:

### Non-detection flags

Current saves propagate a section-level non-detection marker (`!!`) to all included `DsoObservation.NonDetection` rows. The parent `Observation.NonDetection` flag is still meaningful as a legacy fallback: older saved observations may have the section flag set without every joined `DsoObservation` having been backfilled. When filtering or counting detections, use `DsoObservation.NonDetection || Observation.NonDetection` unless all legacy sessions have explicitly been migrated or re-saved.

**Pattern A — DSO-centric** (one card per DSO, observations nested below):
- Renderer: `DsoBadgedWithObservations` → expands to a list of `ObservationSecondary` rows.
- `ObservationSecondary` shows the obs-session date/title/location as a link back to `/session/:id`, plus the observation text and an `ImageList`.

**Pattern B — Observation-centric** (one card per observation, DSO shown as the heading):
- Renderer: `ObservationList` → maps each `IObservation` to an `Observation` card.
- `Observation` renders `DsoExtended` for each DSO in `dsoObservations`, the observation text, an `ImageList`, and an expand button that reveals `ObservationSecondary` rows for the observation's `otherObservations`.

### Entry-point → component map

| Entry point | Route | Page component | List renderer | Item component |
|---|---|---|---|---|
| Navbar autocomplete (pick a DSO suggestion) | `/search` | `SearchView` (Redux query) | `DsoBadgedWithObservations` | `ObservationSecondary` |
| Search page text field | `/search` | `SearchView` | `DsoBadgedWithObservations` | `ObservationSecondary` |
| Navbar **Observations** button | `/observations` | `ObservedDsos` | `DsoBadgedWithObservations` | `ObservationSecondary` |
| Obs session → **Observed Objects** tab | `/session/:id` | `SingleObsSessionView` → `ObsSessionPage` (tab index 1) | `ObservationList` | `Observation` (with nested `ObservationSecondary` for other observations) |

### Wiring details

- The navbar autocomplete (`SearchInput` in `Layout.tsx`) does not list observations itself — selecting a suggestion dispatches `actions.search()` and navigates to `/search`. `SearchView` then reads `state.data.searchQuery` from Redux and renders results.
- `SearchView` uses `startWithObservationsExpanded={true}` only when there is exactly one match; otherwise the user must click the expand chevron on each `DsoBadgedWithObservations` to reveal the nested `ObservationSecondary` rows.
- `ObservedDsos` always renders with `startWithObservationsExpanded={false}` and loads via `Api.getAllDsosAndTheirObservations()`.
- `ObsSessionPage` derives the tab label `Observed Objects (N)` from `flatMap(observations, o => o.dsoObservations).length`. The tab panel is swiped/translated horizontally; the actual list is `ObservationList`.
- `DsoBadgedWithObservations` is the only component that toggles between the two display modes via its `showDsoExtra` / `showObservations` / `startWithObservationsExpanded` props. It is also reused (with `showObservations={false}`) for rendering each suggestion row in the navbar autocomplete dropdown.
