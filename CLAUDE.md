# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ObsTool is a web app for recording and tracking amateur astronomical observations. The user observes deep-sky objects through a telescope, then writes up the night as free-form prose; the backend parses that prose into structured observation records linked to a catalog of known objects.

It is a single deployable ASP.NET Core app that hosts a React/TypeScript SPA alongside its REST API.

## Repository layout

Two projects under one solution (`ObsTool.sln`):

- **`ObsTool/`** — ASP.NET Core 10 backend. The SPA lives inside it at `ObsTool/ObsToolClient/` and is referenced as `SpaRoot` in `ObsTool.csproj`.
- **`ObsTool.Test/`** — NUnit test project for the backend.

The frontend has its own dedicated guidance at **`ObsTool/ObsToolClient/CLAUDE.md`** — read it before doing any frontend work. It covers the MUI v6 / tss-react styling shim, dev-server port rules, and testing setup. Do not duplicate that content here.

## Important rules

- **Never commit to git.** This applies to both backend and frontend changes. (Repeated from the frontend CLAUDE.md so it isn't missed when working server-side.)
- **Preserve the user's staged changes.** Do not run broad staging or unstaging commands such as `git add .`, `git restore --staged .`, or `git reset` unless the user explicitly asks for that exact git operation. Leave any files that were already staged in the index exactly as they are. Put new or modified work in the working tree only, unstaged, and report the status clearly.

## Commands

### Backend (.NET 10)

Run from the repo root:

```bash
dotnet build                              # build whole solution
dotnet run --project ObsTool              # run API (Development env)
dotnet test                               # run all NUnit tests
dotnet test --filter "FullyQualifiedName~ReportTextManagerTest"   # single test class
dotnet test --filter "Name=SomeTestMethod"                         # single test
dotnet publish ObsTool -c Release         # production build (also runs `npm run build` for the SPA via the csproj's PublishRunWebpack target)
```

Visual Studio: open `ObsTool.sln` and F5 the `ObsTool` project (default launch URL `http://localhost:50996/`, IIS Express on `50995`).

### Frontend (Vite / React 18)

```bash
cd ObsTool/ObsToolClient
npm run dev        # Vite dev server (see ObsToolClient/CLAUDE.md for port rules)
npm run build      # tsc --noEmit + vite build → outputs to ObsToolClient/build
npm run lint       # eslint src
npm test           # vitest run (single pass)
npm run test:watch # vitest interactive
```

The SPA reads the API base URL from `import.meta.env.VITE_API_URL` (axios calls in `src/api/Api.ts`). In dev the backend allows CORS for `localhost:3000–3007` (see `appsettings.Development.json`).

### Production (single integrated binary)

`dotnet publish -c Release` builds the SPA into `ObsTool/ObsToolClient/build` and copies it into the publish output. Then:

```bash
cd ObsTool/bin/Release/net10.0/publish
./ObsTool.exe
```

In non-development environments, `Startup.Configure` mounts the SPA via `UseSpaStaticFiles` / `UseSpa` so the same process serves both the API and the static React bundle. In Development, the SPA is **not** auto-launched — run `npm run dev` separately.

## Architecture

Classic ASP.NET Core layered structure (`Startup.cs` does service registration the old-style way, not minimal hosting):

- **Controllers** (`Controllers/`) — thin REST controllers under `api/...`: `ObsSessions`, `Observations`, `Dso`, `Locations`, `ObsResources`, `Statistics`, `Authentication`, `Admin`.
- **Services / Repos** (`Services/`) — repo-per-aggregate (`ObsSessionsRepo`, `LocationsRepo`, `DsoRepo`, `ObservationsRepo`, `DsoObservationsRepo`, `ObsResourcesRepo`) plus two thicker services: `ObservationsService` and `ReportTextManager`. All registered as scoped in `Startup.ConfigureServices`.
- **Entities** (`Entities/`) — EF Core entities; key relationships configured in `Database/MainDbContext.OnModelCreating` (composite keys for join entities; one-to-one `Dso` ↔ `DsoExtra`).
- **Models** (`Models/`) — DTOs (`*Dto`, plus `*DtoForCreation` / `*DtoForUpdate` variants). Mapping is via AutoMapper, configured in `MappingProfiles.cs`.
- **Database** — SQLite via EF Core. Connection string in `appsettings.{Environment}.json` under `Db:ConnectionString`. Set `Db:Migrate=true` to auto-run migrations on startup (`MainDbContext` checks this in its constructor).
- **Auth** — cookie auth. Toggled by `EnableAuthentication` in config: when true, an `AuthorizeFilter` is added globally and endpoints opt out with `[AllowAnonymous]`. `OnRedirectToLogin` returns 401 instead of redirecting, so the SPA handles auth itself.
- **Errors** — custom `ExceptionMiddleware`, wired via `ConfigureCustomExceptionMiddleware()`.
- **Logging** — NLog via `UseNLog()` in `Program.cs`; config in `nlog.config`.

Frontend is a React 18 SPA: global Redux state (`src/store/AppStore.ts` → reducers in `src/reducers/`, thunks in `src/actions/`), all API calls through the static `Api` class in `src/api/Api.ts` (axios with cookie credentials), React Router v6 in `src/components/Routes.tsx`, MUI v6 with the tss-react `withStyles` shim — see the frontend CLAUDE.md.

## Domain model — the four core entities

Understanding these and how they're produced is the single most important thing for working on this codebase. The user's primary edit target is **`ObsSession.ReportText`** (free-form prose); everything else is derived from it.

### `Dso` — read-only reference catalog

Mapped to table `SacDeepSkyObjects` (note the table-name attribute in `Entities/Dso.cs`). Sourced from the Saguaro Astronomy Club deep-sky database — this is **catalog data, treated as effectively read-only at runtime** (populated/curated via the SQL in `Database/README.txt`, not by the API).

A `Dso` represents a single deep-sky object (galaxy, nebula, cluster, …). Key columns: `Catalog` (`"M"`, `"NGC"`, `"IC"`, `"Sh2"`, …), `CatalogNumber`, `Name` (`"M 31"`), `OtherNames`, `CommonName`, `Type`, `Con` (constellation), coordinates `RA`/`DEC`, `Mag` (visual magnitude), `SB` (surface brightness), `SizeMax`/`SizeMin`, etc. Most string columns are stored as strings even when numeric, because they come straight from the SAC database that way.

Two navigation collections back to user data: `DsoObservations` (every time it has been observed) and `DsoExtra` (user-added metadata — see below).

### `ObsSession` — one observing night

A single session at the telescope. Owns: `Date`, `Location`, `Title`, free-form `Summary` and `Conditions`, numeric `Seeing` / `Transparency` / `LimitingMagnitude` ratings, a list of `Observations`, a collection of `DsoExtras`, and crucially a free-form **`ReportText`** in which the user describes the night, naming objects by catalog designation (e.g. `"M 31"`, `"NGC 869"`).

`ReportText` is the source of truth for what was observed; `Observations` and `DsoObservations` are derived from it by parsing.

### `Observation` — one prose section, one or more DSOs

One discrete observation within a session. Holds the `Text` (the section of the report that talks about it), an `Identifier` (a stable `#sessionId-dsoId-dsoId-…` tag injected back into the report so re-parses can match it to the persisted row), a `DisplayOrder`, a `NonDetection` flag, plus its `DsoObservations` (which DSOs the section is about) and `ObsResources` (attached photos/sketches/links).

Note: `Observation` deliberately does **not** have direct `ObsSession` or `Dso` navigation properties — only `ObsSessionId`. The comment in `Entities/Observation.cs` explains why: removing them avoids self-referencing loops in EF Core and AutoMapper. Code that needs the parent session has to fetch it separately, which `ObservationsService` does and stitches into the DTO manually.

### `DsoObservation` — join with payload

A pure many-to-many join between `Observation` and `Dso` (one observation section can mention several DSOs; one DSO can be observed across many sessions). Carries extra payload: `DisplayOrder` (so the UI shows DSOs in the order they appeared in the report) and `CustomObjectName` (used when the user observes something that isn't in the catalog).

Composite PK is `(ObservationId, DsoId, CustomObjectName)` — configured in `MainDbContext.OnModelCreating`. Equality and hash code are overridden in the entity so list comparisons in `ReportTextManager` work as set membership rather than reference equality.

### Supporting entities

- **`DsoExtra`** — user-added metadata layered onto the read-only `Dso` (one-to-one). Holds a `Rating` (parsed from `+1`/`+2`/`-1`/`*`/`**` markers in the report) and a `FollowUp` flag (parsed from words like "revisit", "come back", "telescope"). Also references the `ObsSession` it was last updated from; `ReportTextManager` only overwrites it if the current session is newer.
- **`ObsResource`** — photo / sketch / link / jot attached to an `Observation`. Carries display metadata: `Rotation`, `ZoomLevel`, `Inverted`, `BackgroundColor`. Resources of type `Sketch` and `Jot` are assumed to be Google Drive URLs and have the file ID extracted at parse time.
- **`Location`** — where a session happened. Name, latitude/longitude, optional Google Maps address.

## The report-text parsing pipeline

`Services/ReportTextManager.ParseAndStoreObservations(ObsSession)` is the heart of the app. When a session is saved, it:

1. **Sections the report** by blank lines (regex with `Singleline` so a section can include trailing `Photo:` / `Sketch:` lines).
2. **Per section**, regex-extracts:
   - DSO designations matching any catalog known to `DsoRepo.GetAllCatalogs()` (e.g. `M 31`, `NGC 7000`, `Sh2-101`). Each is resolved against `Dso`; unknown names are silently skipped. Parenthesised mentions like `(M 31)` are deliberately ignored. The same DSO appearing in two different sections is treated as an error.
   - Resource lines: `Photo:`, `Image:`, `Sketch:`, `Link:`, `Jot:` followed by a URL → `ObsResource` rows. `Photo` is normalised to `image`. `Sketch` and `Jot` URLs are run through Google Drive ID extraction.
   - `!!` → `NonDetection = true`.
   - `+1` / `+2` / `-1` / `*` / `**` → numeric `Rating`.
   - "revisit" / "come back" / "telescope" → `FollowUp = true`.
3. **Reconciles** with what's already persisted: matches by stable `Identifier`. Sections that no longer parse to anything become deletes; matching sections are updated in place; new sections are inserted. For new sections it injects a freshly-minted `#sessionId-dsoId-…` identifier back into the report text so the next save round-trips stably.
4. **Strips** parsed resource lines from the persisted `ReportText` (so they don't appear twice — once as parsed `ObsResource`, once as raw text).
5. **Updates `DsoExtra`** for each DSO in the section, but only if the current session is newer than whichever session previously wrote it (so the most recent rating/follow-up wins per DSO).

Test coverage for this pipeline lives in `ObsTool.Test/ReportTextManagerTest.cs` — that's the file to extend when changing parsing rules.

## Cross-cutting conventions

- **DTO/Entity boundary**: controllers accept and return only `*Dto` types; AutoMapper handles entity ↔ DTO. When adding a field, update the entity, the DTOs, **and** `MappingProfiles.cs` together. Bear in mind the manual `ObsSessionDto` stitching in `ObservationsService.GetAllObservationDtosForObservations` — AutoMapper can't do it because of the recursion cycle noted on `Observation`.
- **CORS**: allowed origins are space-separated in `CorsAllowedOrigins`. Add new dev ports there if changing the Vite port.
- **API base URL**: backend routes live under `/api/...` (route attributes on each controller); SPA reads `VITE_API_URL` for the base.
- **Catalog list is dynamic**: `ReportTextManager` builds its DSO regex from `DsoRepo.GetAllCatalogs()`, with `Sh2` added explicitly. New catalog prefixes generally need no code change beyond seeding rows in `SacDeepSkyObjects`.


### Non-detection semantics

There are two non-detection flags, and they are not interchangeable:

- `Observation.NonDetection` is section-level / group-level.
- `DsoObservation.NonDetection` is per-object within a section.

The report parser sets them from two different report-text patterns:

- `!!` marks the whole observation section as a non-detection.
- `!NGC 206!` marks that individual DSO as a non-detection inside an otherwise normal section.

If a whole section is marked with `!!`, every `DsoObservation` in that section is also treated as a non-detection. If every DSO in a section is individually marked as non-detected, the parent `Observation.NonDetection` is also set to true. A mixed section can therefore have `Observation.NonDetection = false` while one or more child `DsoObservation.NonDetection` rows are true.

The app's non-detection count logic treats a DSO observation as a non-detection when either flag is true:

```csharp
d.NonDetection || d.Observation.NonDetection
```

For H2500/H400 progress reporting, use the inverse as the clean-detection rule:

```sql
Observations.NonDetection = 0
AND DsoObservations.NonDetection = 0
```

An H2500/H400 object should count as detected if it has at least one clean linked row. It should count as a cross-referenced non-detection only if it has linked observation rows but no clean detection row. If an object has both non-detection rows and clean detection rows, count it as detected for progress reporting.

Relevant code and tests:

- Services/ReportTextManager.cs contains the parser logic.
- Services/ObservationsRepo.cs contains GetNumNonDetections().
- ObsTool.Test/ReportTextManagerTest.cs covers parser behavior.
- ObsTool.Test/ObservationsRepoTest.cs covers non-detection counting.
