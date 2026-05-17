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

const theme = createTheme({
  palette: {
    background: {
      default: "#fafafa",
    },
  },
});

class App extends React.Component<{}, {}> {
  private store = initStore();

  constructor(props: any) {
    super(props);

    // Font awesome
    library.add(
      faHome, faPlus, faSearch, faTable, faCalendarAlt, faBinoculars, faEye, faEdit, faEyeSlash, faMapMarked, faThumbsUp, faThumbsDown, faStar,
      faStarHalfAlt, faUndoAlt, faTimes, faExclamationTriangle, faKey);
  }

  public render() {
    const store = this.store;
    // Keep React Router aligned with Vite's base path for subdirectory deployments.
    const baseName = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

    return (
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <div className="App">
            <CssBaseline />
            <BrowserRouter basename={baseName}>{Routes.routes}</BrowserRouter>
          </div>
        </Provider>
      </ThemeProvider>
    );
  }
}

export default App;
