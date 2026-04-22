# ObsTool Backend Modernization - Phase 1

## Overview
This document details the first two modernization steps for the ObsTool backend. These are foundational changes that should be completed before moving to other modernization tasks.

---

## Point 1: Upgrade Outdated Package Dependencies

### Current State
```
Moq: 4.13.1 (Released: 2019 - 5+ years old)
NLog: 4.6.8 (Released: 2018 - 6+ years old)
Nlog.Web.AspNetCore: 4.9.0 (Released: 2019 - 5+ years old)
NUnit: 3.12.0 (Released: 2018 - 6+ years old)
NUnit3TestAdapter: 3.15.1 (Released: 2019 - 5+ years old)
Microsoft.VisualStudio.Web.CodeGeneration.Design: 10.0.2 (Aligned with .NET 10 ✓)
Microsoft.AspNetCore.SpaServices.Extensions: 10.0.6 (Aligned with .NET 10 ✓)
Microsoft.EntityFrameworkCore.Sqlite: 10.0.6 (Aligned with .NET 10 ✓)
AutoMapper: 12.0.1 (Current ✓)
```

### Rationale
- **Security:** Old packages contain known vulnerabilities that have been patched
- **Compatibility:** Newer versions are optimized for .NET 10 and modern patterns
- **Performance:** Moq 4.13 has significant performance overhead compared to modern versions
- **Bug fixes:** Hundreds of bug fixes and improvements since 2019
- **Support:** Old versions are no longer supported by maintainers

### Implementation Plan

#### Step 1: Update Package References in `ObsTool.Test.csproj`

Edit the file: `ObsTool.Test\ObsTool.Test.csproj`

**Current:**
```xml
<ItemGroup>
  <PackageReference Include="Microsoft.NET.Test.Sdk" Version="16.4.0" />
  <PackageReference Include="NUnit" Version="3.12.0" />
  <PackageReference Include="NUnit3TestAdapter" Version="3.15.1" />
</ItemGroup>
```

**Updated to:**
```xml
<ItemGroup>
  <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
  <PackageReference Include="NUnit" Version="4.2.2" />
  <PackageReference Include="NUnit3TestAdapter" Version="4.6.1" />
</ItemGroup>
```

#### Step 2: Update Package References in `ObsTool.csproj`

Edit the file: `ObsTool\ObsTool.csproj`

**Current:**
```xml
<ItemGroup>
  <PackageReference Include="AutoMapper" Version="12.0.1" />
  <PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
  <PackageReference Include="Microsoft.AspNetCore.SpaServices.Extensions" Version="10.0.6" />
  <PackageReference Include="Microsoft.VisualStudio.Web.CodeGeneration.Design" Version="10.0.2" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="10.0.6" />
  <PackageReference Include="moq" Version="4.13.1" />
  <PackageReference Include="NLog" Version="4.6.8" />
  <PackageReference Include="Nlog.Web.AspNetCore" Version="4.9.0" />
</ItemGroup>
```

**Updated to:**
```xml
<ItemGroup>
  <PackageReference Include="AutoMapper" Version="12.0.1" />
  <PackageReference Include="AutoMapper.Extensions.Microsoft.DependencyInjection" Version="12.0.1" />
  <PackageReference Include="Microsoft.AspNetCore.SpaServices.Extensions" Version="10.0.6" />
  <PackageReference Include="Microsoft.VisualStudio.Web.CodeGeneration.Design" Version="10.0.2" />
  <PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="10.0.6" />
  <PackageReference Include="moq" Version="4.20.0" />
  <PackageReference Include="NLog" Version="5.3.4" />
  <PackageReference Include="Nlog.Web.AspNetCore" Version="5.3.4" />
</ItemGroup>
```

#### Step 3: Verification

After updating, run:
```powershell
dotnet restore
dotnet build
dotnet test
```

**Expected outcome:** All tests pass with no breaking changes needed. The new packages are backward compatible for our use case.

---

## Point 2: Migrate from Startup.cs to Program.cs Pattern (Minimal APIs)

### Current State
The application uses the classic ASP.NET Core pattern with:
- `Program.cs` - Minimal bootstrap code
- `Startup.cs` - Class with `ConfigureServices()` and `Configure()` methods
- Service registration scattered in ConfigureServices()
- Middleware configuration in Configure()

### Rationale for Modern Program.cs Pattern

#### Why This Change Matters

The "Startup.cs" pattern was designed for ASP.NET Core when it was first released (2016) as a transition pattern from older ASP.NET frameworks. The new **Program.cs-only pattern** with top-level statements (introduced in .NET 6) is now the **official Microsoft standard** and offers significant advantages:

**Key Benefits:**

1. **Reduced Boilerplate**
   - Eliminates entire Startup class (80+ lines)
   - Cleaner, more readable configuration
   - Less ceremony for simple applications

2. **Better for Modern Development**
   - Extension methods in Program.cs read like a declarative configuration
   - Matches patterns from Node.js/Express or Python/Django
   - Easier for new developers to understand the entire app startup in one file

3. **Improved Testability**
   - Easier to create test fixtures with different configurations
   - Can inject test middleware more naturally
   - Supports WebApplicationFactory patterns better

4. **Performance**
   - Tiny reduction in reflection overhead
   - Fewer intermediate objects created at startup

5. **Microsoft's Direction**
   - All new ASP.NET Core templates (since .NET 6) use only Program.cs
   - Startup.cs is considered obsolete in modern .NET
   - Official documentation shows Program.cs pattern only

#### Learning Resources

- **Official Microsoft Migration Guide**: https://learn.microsoft.com/en-us/aspnet/core/migration/50-to-60?view=aspnetcore-10.0&tabs=visual-studio#migrate-startup-to-minimal-hosting-apis
- **ASP.NET Core 6.0 Minimal Hosting Model**: https://devblogs.microsoft.com/dotnet/asp-net-core-updates-in-net-6-preview-1/#minimal-hosting-apis
- **Top-Level Statements in C#**: https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/program-structure/top-level-statements

### Implementation Plan

#### Current Startup.cs Structure (Simplified)
```csharp
public class Startup
{
    public static IConfiguration Configuration { get; set; }
    public static IHostEnvironment Env { get; set; }

    public Startup(IConfiguration configuration, IHostEnvironment env) { ... }

    public void ConfigureServices(IServiceCollection services)
    {
        // Controllers, CORS, Authentication, etc.
    }

    public void Configure(IApplicationBuilder app, IHostEnvironment env, ILoggerFactory loggerFactory)
    {
        // Middleware pipeline
    }
}
```

#### Target Program.cs Structure

```csharp
var builder = WebApplication.CreateBuilder(args);

// ===== Services =====
builder.Services.AddControllers(config => { ... });
builder.Services.AddCors(options => { ... });
builder.Services.AddAuthentication(...).AddCookie(...);
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));
builder.Services.AddDbContext<MainDbContext>(...);
builder.Services.AddScoped<ObsSessionsRepo>();
// ... other services

builder.Services.AddSpaStaticFiles(configuration => { ... });

// ===== Build =====
var app = builder.Build();

// ===== Middleware =====
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHsts();
}

app.UseStaticFiles();
app.UseRouting();
app.UseCors("MyCorsPolicy");
app.UseCookiePolicy();
app.UseAuthentication();
app.UseAuthorization();
app.ConfigureCustomExceptionMiddleware();

app.UseEndpoints(endpoints => endpoints.MapControllers());

if (!app.Environment.IsDevelopment())
{
    app.UseSpaStaticFiles();
    app.UseSpa(spa => spa.Options.SourcePath = "./ObsToolClient");
}

app.Run();
```

#### Step-by-Step Migration

**Phase 1: Create New Program.cs**
- Copy all service registration logic from Startup.ConfigureServices()
- Copy all middleware logic from Startup.Configure()
- Use static builder.Services and app

**Phase 2: Handle Shared Configuration**
- Move `IConfiguration` and `IHostEnvironment` access from static properties
- Access via `builder.Configuration` and `app.Environment`
- Update MainDbContext to accept configuration instead of static reference

**Phase 3: Create Helper Extensions** (optional but recommended)
For complex configurations, create extension methods:

```csharp
// Extensions/ServiceExtensions.cs
public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        services.AddControllers(config => { ... });
        services.AddCors(options => { ... });
        // ... other complex service setup
        return services;
    }
}

public static class MiddlewareExtensions
{
    public static WebApplication UseApplicationMiddleware(this WebApplication app)
    {
        app.UseStaticFiles();
        app.UseRouting();
        app.UseCors("MyCorsPolicy");
        // ... middleware
        return app;
    }
}

// Then in Program.cs:
builder.Services.AddApplicationServices(builder.Configuration);
app.UseApplicationMiddleware();
```

**Phase 4: Delete Startup.cs**
- Remove the file after all references are migrated
- Update project file if there are any explicit references

**Phase 5: Testing**
```powershell
dotnet build
dotnet run
# Test all endpoints
dotnet test
```

#### Files to Modify

| File | Changes |
|------|---------|
| `Program.cs` | Replace with new Program.cs using Program.cs pattern |
| `Startup.cs` | DELETE (after migration) |
| `Database/MainDbContext.cs` | Update to not use static `Startup.Configuration` |
| `Program.cs` (project file) | May need to remove `UseStartup<Startup>()` reference |

### Key Migration Considerations

1. **Static Configuration Access**
   - Current code uses `Startup.Configuration` globally
   - Need to pass configuration through dependency injection instead
   - Update `MainDbContext` constructor

2. **Environment Access**
   - Similar issue with `Startup.Env`
   - Use `IWebHostEnvironment` injected into services

3. **Extension Methods**
   - The `ConfigureCustomExceptionMiddleware()` extension method stays as-is
   - Add it to Program.cs just like before

### Estimated Time: 4-6 hours

- **1 hour:** Understanding the current Startup.cs structure
- **2 hours:** Creating new Program.cs with all configurations
- **1 hour:** Updating MainDbContext to remove static references
- **1-2 hours:** Testing and fixing issues
- **30 min:** Cleanup and verification

---

## Execution Checklist

- [ ] Back up current code (git commit)
- [ ] Update packages in both .csproj files
- [ ] Run `dotnet restore` and verify no errors
- [ ] Create new Program.cs based on Startup.cs
- [ ] Update MainDbContext to use injected IConfiguration
- [ ] Run `dotnet build` - should have no errors
- [ ] Run `dotnet run` - application should start
- [ ] Run `dotnet test` - all tests should pass
- [ ] Test API endpoints manually (at least a few key ones)
- [ ] Delete Startup.cs
- [ ] Final `dotnet build` and `dotnet test`
- [ ] Commit changes to git

---

## Troubleshooting

### Issue: "Could not find type name 'Startup'"
**Solution:** Remove any explicit `UseStartup<Startup>()` calls from Program.cs

### Issue: NLog not initializing properly
**Solution:** NLog 5.x may require configuration update. Check that `nlog.config` exists and is being loaded correctly.

### Issue: Tests failing after Moq upgrade
**Solution:** Moq 4.20+ changed some API behavior. Update mock setup syntax if needed. Usually backward compatible but check for `Callback` or `Returns` usage patterns.

### Issue: Configuration values not found
**Solution:** Ensure `appsettings.json` and environment-specific files are being copied to output directory (they already are in this project).

