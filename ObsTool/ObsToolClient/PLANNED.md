# Plan: Per-DSO non-detection support

## Context

Currently `NonDetection` lives on `Observation` (the section/group). The user wants to also mark individual DSOs within a section as non-detections — useful when a session reports "saw M 31 but couldn't find NGC 206 in it" and only NGC 206 is the non-detection.

The DB already has the column (`DsoObservations.NonDetection BIT NOT NULL DEFAULT 0`); nothing else is wired. Both flags must coexist (section-level and per-DSO) — picking one or the other for any given non-detection. Statistics must change to count *DSOs*, not sections.

The hard constraint: minimize changes to the report-text regexes in `ReportTextManager.cs` because they're hand-tuned and only manually validated.

## Proposed syntax

`!NGC 635!` — wrap a single DSO designation in single bangs.

This is what the user proposed and it's the right pick:
- Visually mirrors the existing `!!` (section non-detection) so the language stays consistent.
- Cannot collide with `!!`: the existing `!!` regex requires the bangs be **adjacent**, while a wrapped DSO has the catalog name between them.
- Cannot collide with the parenthesis filter — they're independent characters.

## Backend design

### 1. Entity / DTO / mapping

`ObsTool/Entities/DsoObservation.cs`
- Add `public bool NonDetection { get; set; } = false;` (mirrors `Observation.NonDetection`).
- No change needed to `Equals`/`GetHashCode` — those use `(ObservationId, DsoId, CustomObjectName)` and we don't want NonDetection participating in identity.
- No change to `MainDbContext` composite-key config.

`ObsTool/Models/DsoObservationDto.cs`
- Add `public bool NonDetection { get; set; }`.

`ObsTool/MappingProfiles.cs`
- The existing `CreateMap<Entities.DsoObservation, Models.DsoObservationDto>()` (line 14) auto-maps the new property — no change.

### 2. Parser change in `ReportTextManager.cs` — minimal regex surface

The DSO regex (lines 212–223) currently is:
```
intro:    (?:\s|\G)
startP:   (\()?              ← group 1
catalog:  (M|Tr|…|Sh2)       ← group 2
sep+num:  [\ |-]?([0-9]…)    ← group 3
endP:     (\))?              ← group 4
outro:    [\s\.,]
```

**Change**: extend the optional bracket character classes to also match `!`:
```
startMarker: ([(!])?         ← group 1
endMarker:   ([)!])?         ← group 4
```

That's the entire regex change — two character classes widened. No new captures, no new groups, no other patterns touched.

In the existing match loop (around lines 269–281):
```csharp
string startMarker = dsoNameMatch.Groups[1].Value;
string endMarker   = dsoNameMatch.Groups[4].Value;

bool startIsBang = startMarker == "!";
bool endIsBang   = endMarker   == "!";

// Unbalanced or mixed bang/paren — surface as a parse error so typos don't silently
// change meaning. Covers: `!NGC 635 `, ` NGC 635!`, `(NGC 635!`, `!NGC 635)`.
if (startIsBang != endIsBang)
{
    throw new ObsToolException(
        "DSO " + dso.ToString() + " has unmatched non-detection markers — wrap it on both sides: !NGC 635!");
}

// Existing parenthesis skip (now only reachable when no bangs are involved,
// so backward compat for `(NGC 635)` and lone-paren typos is preserved)
if (startMarker == "(" || endMarker == ")")
    continue;

bool isNonDetectionDso = startIsBang && endIsBang;
```

The order matters: the mismatch check runs before the parenthesis skip so that `(NGC 635!` and `!NGC 635)` reach the user as errors rather than being silently swallowed by the existing skip path. Pure parenthesis cases (`(NGC 635)`, `(NGC 635 ` with missing close) keep their current "skip silently" behavior — we don't want to break existing reports.

When constructing the `DsoObservation` in the per-section loop (around lines 400–414), set `NonDetection = isNonDetectionDso`.

The `!!` section regex (`@"!!" + flagOutro` at line 242) is **untouched**. Because `!!` requires adjacent bangs and our `!NGC 635!` always has the catalog between them, the two patterns can never collide.

### 3. Conflict detection

Just before the section's `Observation` is built (after the `!!` scan at line 331 and after the per-DSO loop), add:
```csharp
if (nonDetection && observation.DsoObservations.Any(d => d.NonDetection))
{
    throw new ObsToolException(
        "Section is marked as a non-detection (!!) and also contains a DSO marked as a non-detection (!…!). Use one or the other.");
}
```

This rides the existing `ObsToolException` → `ExceptionMiddleware` → 400 path that the SPA already shows to users (same flow as the "DSO found in more than one section" error at line 297–299).

### 4. Statistics — count DSOs, not sections

`ObsTool/Services/ObservationsRepo.cs:68-73` — `GetNumNonDetections()`:
```csharp
return _context.DsoObservations
    .Where(d => d.NonDetection || d.Observation.NonDetection)
    .Count();
```

This single expression covers both: a section-level non-detection counts each of its DSOs (via the `d.Observation.NonDetection` half), and per-DSO non-detections count themselves. The conflict-detection rule above guarantees the two halves don't double-count.

No DTO or controller change needed — `StatisticsDto.NumNonDetections` is already the right shape; we're just changing how it's computed.

### 5. Tests in `ObsTool.Test/ReportTextManagerTest.cs`

Keep the additions tight — 5 new tests, in the existing fixture style:

1. **`testSingleDsoNonDetection`** — section text `"Found M 31. Did not find !NGC 206!."` → 1 Observation, 2 DsoObservations, NGC 206's NonDetection=true, M 31's NonDetection=false, Observation.NonDetection=false.
2. **`testSectionAndDsoNonDetectionConflict`** — section text `"!! Looked for !NGC 206!"` → throws `ObsToolException`.
3. **`testUnmatchedNonDetectionMarker`** — section text `"Looked for !NGC 206 hard."` (single opening bang) → throws `ObsToolException`. Same with `"Looked for NGC 206! hard."` (single closing bang).
4. **`testParenthesisStillSkipped`** — regression guard for the regex change. Section `"M 31 (NGC 224) was bright."` → 1 DsoObservation for M 31 only (NGC 224 still skipped after we widened the bracket character class).
5. **`testSectionLevelNonDetectionStillWorks`** — regression guard. Section `"!! Could not find NGC 206."` → Observation.NonDetection=true, NGC 206 DsoObservation.NonDetection=false.

That's it. Existing tests cover the rest of the parser; the regex change is small enough that the existing test suite is the main safety net for unrelated regressions.

## Frontend design

### 1. Types

`src/types/Types.ts:19-25` — add `nonDetection: boolean;` to `IDsoObservation`.

### 2. Strikethrough on DSO name

`src/components/DsoExtended.tsx:88` — the DSO name is rendered inside a `<Typography>`. Add a `nonDetection?: boolean` prop and apply `style={{ textDecoration: 'line-through' }}` to the name span when true. (Don't strike through the icon, the `otherNames`, or the `commonName` — only the catalog name itself, to match how a user would mentally cross out "NGC 206".)

`src/components/Observation.tsx:121-124` — pass `nonDetection={o.nonDetection}` when mapping `dsoObservations` to `DsoExtended`:
```tsx
dsoObjects = this.props.observation.dsoObservations.map(o =>
  <DsoExtended key={o.dso.id} dso={o.dso} customObjectName={o.customObjectName}
               nonDetection={o.nonDetection} />
);
```

### 3. Eye-slash icon scope

No change. The icon in `Observation.tsx:126` and `ObservationSecondary.tsx:169` already keys off `observation.nonDetection` (section-level), which is exactly what the user wants. Per-DSO non-detection is conveyed only by the strikethrough.

### 4. Statistics page

No frontend change. `StatisticsTable.tsx:99` reads `statistics.numNonDetections` — that label and value stay; only the backend math changes.

## Files touched

Backend:
- `ObsTool/Entities/DsoObservation.cs` — add `NonDetection` property
- `ObsTool/Models/DsoObservationDto.cs` — add `NonDetection` property
- `ObsTool/Services/ReportTextManager.cs` — widen two character classes in DSO regex; flag DsoObservation; conflict check
- `ObsTool/Services/ObservationsRepo.cs` — rewrite `GetNumNonDetections()`
- `ObsTool.Test/ReportTextManagerTest.cs` — 4 new tests

Frontend:
- `ObsTool/ObsToolClient/src/types/Types.ts` — add `nonDetection` to `IDsoObservation`
- `ObsTool/ObsToolClient/src/components/DsoExtended.tsx` — accept `nonDetection` prop, strike through name
- `ObsTool/ObsToolClient/src/components/Observation.tsx` — pass `nonDetection` through

## Verification

1. `dotnet test` — all existing tests + 4 new ones pass.
2. `dotnet build` — clean.
3. `npm run build` (in `ObsToolClient`) — clean (`tsc --noEmit` then `vite build`).
4. Manual end-to-end:
   a. Run backend (`dotnet run --project ObsTool`) and frontend (`npm run dev -- --port 3001`).
   b. Edit a session's report text to include `Found M 31. !NGC 206! could not be located.` Save. Reload the session — confirm:
      - The "Observed Objects" tab shows two DSOs; **NGC 206 has its name struck through**, M 31 does not.
      - The eye-slash icon is **not** shown on this observation (section-level NonDetection is false).
   c. Add a different session with `!! could not find NGC 206`. Save. Confirm the eye-slash icon is shown and NGC 206 is *not* struck through.
   d. Try saving `!! and !NGC 206!` — confirm a 400 error with the conflict message surfaces in the SPA the same way other parse errors do.
   e. Open the Statistics page — confirm `numNonDetections` reflects per-DSO counts (a session with `!! M 1 and M 2` now contributes 2, not 1; previously contributed 1).

## Decisions

- **Syntax**: `!NGC 635!`, confirmed.
- **Mismatched delimiters**: any unbalanced bang (lone `!` on one side, or bang mixed with paren) throws `ObsToolException` so typos surface to the user immediately. Pure parenthesis cases keep the existing silent-skip behavior — no behavior change for already-saved reports.
- **Scope creep avoided**: no data migration / backfill, no rename of `Observation.NonDetection`, and no change to how the eye-slash icon is keyed (it stays section-level). Each would be a separate task.
