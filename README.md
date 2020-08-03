# ObsTool

A web app for recording and keeping track of astronomical observations. Built as a SPA frontend written in React/TypeScript, with a .NET Core/C# REST API backend.

The background for creating this app was that I own a telescope and sometimes spend the night observing objects and making notes of what I'm seeing. I always felt a need for a more structured way of organizing the observation notes. That's how this app came to be.

## Demo

There's a 6 minute video demonstration of the app in action at https://youtu.be/W_0VxkZPXjw

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

### PRODUCTION

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

## License
[MIT](https://choosealicense.com/licenses/mit/)