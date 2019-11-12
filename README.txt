# ObsTool

A web app for recording and keeping track of astronomical observations. Built as a SPA frontend written in React/TypeScript, with a .NET Core/C# REST API backend.

## How to run it

### DEVELOPMENT

#### Frontend

```
cd <git root>\ObsTool\ObsToolClient
npm start
```

#### Backend

```
Run the project from Visual Studio in Debug mode.
```

### Production locally

#### Build
```
cd <git root>\ObsTool
dotnet publish -c Release
```

#### Run
```
cd <git root>\ObsTool\bin\Release\netcoreapp3.0\publish
.\ObsTool.exe
```

### Production locally


## License
[MIT](https://choosealicense.com/licenses/mit/)