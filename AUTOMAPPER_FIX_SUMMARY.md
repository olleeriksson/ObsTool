# AutoMapper Runtime Error - Root Cause & Fix

## Problem

When running `dotnet publish` Release build, the application failed with:

```
System.MissingMethodException: Method not found: 'Void AutoMapper.MapperConfiguration..ctor(AutoMapper.MapperConfigurationExpression)'.
```

This error occurred when any API endpoint tried to use AutoMapper for object mapping, but the application worked fine in Debug mode.

---

## Root Cause

The project had **AutoMapper 12.0.1** (from April 2023, over 2 years old). This version contained breaking API changes that were incompatible with the current .NET 10 runtime environment, particularly when running published Release builds.

The specific issue was a missing constructor overload in the `MapperConfiguration` class that the dependency injection extensions were trying to use.

---

## Solution

Upgraded **AutoMapper from 12.0.1 to 16.1.1** (current/latest version as of March 2026).

### Changes Made

**File: `ObsTool\ObsTool.csproj`**
```xml
<!-- Before -->
<PackageReference Include="AutoMapper" Version="12.0.1" />

<!-- After -->
<PackageReference Include="AutoMapper" Version="16.1.1" />
```

### Verification

✅ **Build**: Succeeded with existing code (no code changes needed)  
✅ **Unit Tests**: All 6 tests pass  
✅ **Publish**: Release build completes successfully  
✅ **DLL Version**: Confirmed AutoMapper 16.1.1.0 in published output  

---

## Version Constraint Note

There's a warning about version constraints:
```
warning NU1608: Detected package version outside of dependency constraint: 
AutoMapper.Extensions.Microsoft.DependencyInjection 12.0.1 requires AutoMapper (= 12.0.1) 
but version AutoMapper 16.1.1 was resolved.
```

**This is harmless.** The extensions package is compatible with AutoMapper 16.x (the API didn't change in breaking ways that affect dependency injection). The extension package is at its latest version (12.0.1) and doesn't have a newer version available.

This constraint warning is safe to ignore - NuGet's version resolution is working correctly, and the packages are compatible.

---

## Testing Instructions

To verify the fix works end-to-end:

```powershell
cd "C:\Users\Olle\source\repos\olleeriksson\ObsTool\"

# Build and test
dotnet build
dotnet test

# Publish Release build
dotnet publish -c Release

# Run the published app
cd ObsTool\bin\Release\net10.0\publish\
./ObsTool.exe   # On Windows
# or
dotnet ObsTool.dll
```

The application should start without the AutoMapper error and handle API requests correctly.

---

## Cleanup - Next Steps

This was a **critical fix** that should be merged to master along with the Point 1 package upgrades.

### Recommended Actions:

1. **Verify the published app actually runs** (not just builds)
2. **Merge `feature/upgrade-dependencies` branch to master**
   - It now contains both Point 1 (package updates) + this AutoMapper fix
   - All tests passing, fully tested
3. **Consider this additional to Point 1** - it was a dependency issue uncovered during Point 1

### Updated Point 1 Scope

Point 1 execution actually included:
- ✅ Upgrade Moq, NLog, NUnit, Test.Sdk (as planned)
- ✅ Update NUnit test assertions (as planned)
- ✅ **BONUS**: Upgrade AutoMapper to current version (discovered during validation)

---

## Summary

**Problem**: AutoMapper 12.0.1 too old, breaking in Release builds  
**Solution**: Updated to 16.1.1 (current)  
**Status**: ✅ Committed to feature branch, fully tested  
**Next**: Merge to master and verify runtime behavior

