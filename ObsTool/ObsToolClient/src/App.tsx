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

interface IAppState {
  themePreference: ThemePreference;
  systemThemeMode: ResolvedThemeMode;
}

// Reads the persisted theme preference, falling back to system mode for first-time visitors.
function getInitialThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedPreference = window.localStorage.getItem(themePreferenceStorageKey);
  return storedPreference === "light" || storedPreference === "dark" || storedPreference === "system"
    ? storedPreference
    : "system";
}

// Resolves the operating system color preference when the app preference is set to system.
function getSystemThemeMode(): ResolvedThemeMode {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Creates the shared MUI theme so MUI components and tss-react styles use the same color mode.
function createAppTheme(mode: ResolvedThemeMode) {
  return createTheme({
    palette: {
      mode,
      background: {
        default: mode === "dark" ? "#0d1117" : "#fafafa",
        paper: mode === "dark" ? "#161b22" : "#ffffff",
      },
      primary: {
        main: mode === "dark" ? "#7db7f0" : "#1976d2",
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
  private systemThemeMediaQuery: MediaQueryList | null = null;

  constructor(props: any) {
    super(props);

    this.state = {
      themePreference: getInitialThemePreference(),
      systemThemeMode: getSystemThemeMode(),
    };

    // Font awesome
    library.add(
      faHome, faPlus, faSearch, faTable, faCalendarAlt, faBinoculars, faEye, faEdit, faEyeSlash, faMapMarked, faThumbsUp, faThumbsDown, faStar,
      faStarHalfAlt, faUndoAlt, faTimes, faExclamationTriangle, faKey);
  }

  public componentDidMount() {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    this.systemThemeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this.systemThemeMediaQuery.addEventListener("change", this.handleSystemThemeChange);
  }

  public componentWillUnmount() {
    this.systemThemeMediaQuery?.removeEventListener("change", this.handleSystemThemeChange);
  }

  // Keeps system mode live when the operating system switches between light and dark.
  private handleSystemThemeChange = (event: MediaQueryListEvent) => {
    this.setState({
      systemThemeMode: event.matches ? "dark" : "light",
    });
  };

  // Persists the user's explicit theme choice while leaving system as the default mode.
  private handleSetThemePreference = (themePreference: ThemePreference) => {
    window.localStorage.setItem(themePreferenceStorageKey, themePreference);
    this.setState({ themePreference });
  };

  public render() {
    const store = this.store;
    // Keep React Router aligned with Vite's base path for subdirectory deployments.
    const baseName = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");
    const resolvedMode = this.state.themePreference === "system"
      ? this.state.systemThemeMode
      : this.state.themePreference;
    const theme = createAppTheme(resolvedMode);

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
