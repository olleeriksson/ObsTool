# Planned fixes

## Empty space inside the dashed observation box on search results

**Where it shows up:** Search for an object (e.g. M42) in the top navbar. The result is a list of observations rendered inside dashed-bordered boxes. Each box has noticeable empty vertical space below the observation text/date, even when the observation has no resources attached.

**Component chain:**

- `SearchView.tsx` → `DsoBadgedWithObservations` → `ObservationSecondary.tsx` (the dashed box) → `ImageList.tsx`

**Root cause:**

`ObservationSecondary.tsx` initialises `isExpanded: true` (line 70) and unconditionally renders the `ImageList` whenever `isExpanded` is true (lines 132-139), regardless of whether `obsResources` is empty. The expand/collapse toggle is only shown when resources exist (line 94), so the user can't collapse the empty area away.

`ImageList.tsx` (lines 380-401) always renders its full container chrome even when there are zero resources:

1. `<MuiImageList cols={4}>` with no children — MUI's `ImageList` is a CSS grid that still applies gap/min-height layout from `cols={4}`.
2. `<Grid>{linkElements}</Grid>` — empty Grid item, but the parent's `spacing={1}` still adds a gap row.
3. `<Typography variant="body1">` containing `compareTheseTwo` (only shown for exactly 2 images) and `addButton` (hidden because `SearchView` passes `showAddButton={false}`). With no children, the Typography still occupies one body1 line-height (~24px).

**Suggested fix:**

In `ObservationSecondary.tsx`, gate the `expandedGridItem` block (lines 132-139) on `obsResources && obsResources.length > 0`, so the `ImageList` is not rendered at all when the observation has no resources. The expand button is already gated this way, so the two will stay consistent.

**Files to touch:**

- `ObsTool/ObsToolClient/src/components/ObservationSecondary.tsx` (primary fix)
- Optionally `ObsTool/ObsToolClient/src/components/ImageList.tsx` if we also want the standalone use of `ImageList` to stop reserving space when empty.

**Verification:**

- Run `npm run dev` from `ObsTool/ObsToolClient`, search for an object with no attached images/sketches/links, and confirm the dashed box wraps tightly around the date + text with no extra empty space below.
- Confirm an observation with resources still renders the `ImageList` and the expand toggle works.
