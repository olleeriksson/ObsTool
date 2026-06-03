import * as React from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faHome, faPlus, faSearch, faTable, faBinoculars, faEye, faEyeSlash, faMapMarked, faThumbsUp, faThumbsDown, faStar, faStarHalfAlt, faUndoAlt, faTimes, faExclamationTriangle, faKey } from "@fortawesome/free-solid-svg-icons";
import { faCalendarAlt, faEdit } from "@fortawesome/free-regular-svg-icons";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@mui/material/styles";
import * as Routes from "./components/Routes";
import { Provider } from "react-redux";
import initStore from "./store/AppStore";
import { ThemeModeContext, themePreferenceStorageKey, ThemePreference, ResolvedThemeMode } from "./theme/ThemeModeContext";
import { darkThemeSecondaryColor, lightThemeAppBarBackgroundColor, lightThemeSecondaryColor } from "./theme/ThemeColors";

interface IAppState {
  themePreference: ThemePreference;
}

// Reads the persisted theme preference, falling back to the light theme for first-time visitors.
function getInitialThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedPreference = window.localStorage.getItem(themePreferenceStorageKey);
  if (storedPreference === "dark") {
    return "dark";
  }

  // Treat legacy "blue" values as the current light theme so existing users keep their visual mode.
  return "light";
}

// Resolves app-level theme choices to the two MUI palette modes.
function resolveThemeMode(themePreference: ThemePreference): ResolvedThemeMode {
  return themePreference === "dark" ? "dark" : "light";
}

// Creates the shared MUI theme so MUI components and tss-react styles use the same color mode.
function createAppTheme(themePreference: ThemePreference) {
  const mode = resolveThemeMode(themePreference);
  const primaryMain = mode === "dark"
    ? "#7db7f0"
    : lightThemeAppBarBackgroundColor;
  const secondaryMain = mode === "dark"
    ? darkThemeSecondaryColor
    : lightThemeSecondaryColor;

  return createTheme({
    palette: {
      mode,
      background: {
        default: mode === "dark" ? "#0d1117" : "#F7F7F7",
        paper: mode === "dark" ? "#161b22" : "#ffffff",
      },
      primary: {
        main: primaryMain,
      },
      secondary: {
        main: secondaryMain,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            "--obstool-inline-annotation-bg": mode === "dark" ? "#263444" : "#f3f3f3",
          },
        },
      },
    },
  });
}

class App extends React.Component<{}, IAppState> {
  private store = initStore();

  constructor(props: any) {
    super(props);

    this.state = {
      themePreference: getInitialThemePreference(),
    };

    // Font awesome
    library.add(
      faHome, faPlus, faSearch, faTable, faCalendarAlt, faBinoculars, faEye, faEdit, faEyeSlash, faMapMarked, faThumbsUp, faThumbsDown, faStar,
      faStarHalfAlt, faUndoAlt, faTimes, faExclamationTriangle, faKey);
  }

  // Persists the user's explicit theme choice.
  private handleSetThemePreference = (themePreference: ThemePreference) => {
    window.localStorage.setItem(themePreferenceStorageKey, themePreference);
    this.setState({ themePreference });
  };

  public render() {
    const store = this.store;
    // Keep React Router aligned with Vite's base path for subdirectory deployments.
    const baseName = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");
    const resolvedMode = resolveThemeMode(this.state.themePreference);
    const theme = createAppTheme(this.state.themePreference);

    return (
      <ThemeProvider theme={theme}>
        <ThemeModeContext.Provider value={{
          preference: this.state.themePreference,
          resolvedMode,
          setPreference: this.handleSetThemePreference,
        }}>
          <Provider store={store}>
            <div className="App">
              <CssBaseline />
              <BrowserRouter basename={baseName}>{Routes.routes}</BrowserRouter>
            </div>
          </Provider>
        </ThemeModeContext.Provider>
      </ThemeProvider>
    );
  }
}

export default App;
