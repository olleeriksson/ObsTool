# .NET Version Upgrade Plan

## Overview

**Target**: Upgrade ObsTool solution from .NET Core 3.0 to .NET 10.0 LTS  
**Scope**: 2 projects (1 ASP.NET Core app + 1 test project), ~4,096 LOC

**Strategy**: All-At-Once — All projects upgraded simultaneously in a single operation.

**Rationale**: Small solution (2 projects), simple linear dependency structure (Test depends on ObsTool), low complexity upgrade with clear package version paths and predictable ASP.NET Core API fixes (~17 LOC changes expected).

---

## Tasks

### 01-update-project-files

Update project target frameworks from netcoreapp3.0 to net10.0 across both ObsTool.csproj and ObsTool.Test.csproj.

**Done when**: Both project files target net10.0, any imports or conditional build logic updated for .NET 10.0

### 02-update-nuget-packages

Update NuGet package references to versions compatible with .NET 10.0. Priority updates:
- AutoMapper: 9.0.0 → 16.1.1 (includes security fix)
- Microsoft.AspNetCore.SpaServices.Extensions: 3.0.0 → 10.0.6
- Microsoft.EntityFrameworkCore.Sqlite: 3.0.0 → 10.0.6
- Microsoft.VisualStudio.Web.CodeGeneration.Design: 3.0.0 → 10.0.2

Other packages (NLog, Moq, NUnit, Test.Sdk) are already compatible with .NET 10.0.

**Done when**: All package versions updated in project files, dependency tree resolves, no conflicts

### 03-fix-breaking-changes

Address API breaking changes and deprecations. Key issues from assessment:
- ConfigurationBinder.Get() — 2 binary incompatible usages
- SpaServices API changes — CompatibilityVersion, SpaOptions, SpaApplicationBuilderExtensions (15 source incompatible usages)
- TimeSpan.FromMinutes() — 1 source incompatible usage

These are contained in the main ObsTool.csproj.

**Done when**: All source incompatibilities resolved, solution builds with 0 compilation errors

### 04-verify-solution

Build the entire solution, run unit tests, and confirm no runtime issues.

**Done when**: Solution builds successfully, all unit tests pass, no compilation warnings related to upgrade
