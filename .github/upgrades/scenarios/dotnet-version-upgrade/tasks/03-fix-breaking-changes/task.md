# 03-fix-breaking-changes: Fix Breaking Changes

Address API breaking changes and deprecations. Key issues from assessment:
- ConfigurationBinder.Get() — 2 binary incompatible usages
- SpaServices API changes — CompatibilityVersion, SpaOptions, SpaApplicationBuilderExtensions (15 source incompatible usages)
- TimeSpan.FromMinutes() — 1 source incompatible usage

These are contained in the main ObsTool.csproj.

**Done when**: All source incompatibilities resolved, solution builds with 0 compilation errors
