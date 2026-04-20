# 02-update-nuget-packages: Update NuGet Packages

Update NuGet package references to versions compatible with .NET 10.0. Priority updates:
- AutoMapper: 9.0.0 → 16.1.1 (includes security fix)
- Microsoft.AspNetCore.SpaServices.Extensions: 3.0.0 → 10.0.6
- Microsoft.EntityFrameworkCore.Sqlite: 3.0.0 → 10.0.6
- Microsoft.VisualStudio.Web.CodeGeneration.Design: 3.0.0 → 10.0.2

Other packages (NLog, Moq, NUnit, Test.Sdk) are already compatible with .NET 10.0.

**Done when**: All package versions updated in project files, dependency tree resolves, no conflicts
