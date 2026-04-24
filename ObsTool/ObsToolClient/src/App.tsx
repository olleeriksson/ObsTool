import * as React from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faHome, faPlus, faSearch, faTable, faBinoculars, faEyeSlash, faMapMarked, faThumbsUp, faThumbsDown, faStar, faStarHalfAlt, faUndoAlt, faTimes, faExclamationTriangle, faKey } from "@fortawesome/free-solid-svg-icons";
import { faCalendarAlt, faEdit } from "@fortawesome/free-regular-svg-icons";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme } from "@mui/material/styles";
import { ThemeProvider } from "@mui/styles";
import "typeface-roboto";
//import "typeface-open-sans";
import * as Routes from "./components/Routes";
import { Provider } from "react-redux";
import initStore from "./store/AppStore";

const theme = createTheme();

class App extends React.Component<{}, {}> {
  constructor(props: any) {
    super(props);

    // Fone awesome
    library.add(
      faHome, faPlus, faSearch, faTable, faCalendarAlt, faBinoculars, faEdit, faEyeSlash, faMapMarked, faThumbsUp, faThumbsDown, faStar,
      faStarHalfAlt, faUndoAlt, faTimes, faExclamationTriangle, faKey);
  }

  public render() {
    // basename={baseUrl}
    const store = initStore();

    return (
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <div className="App">
            <CssBaseline />
            <BrowserRouter>{Routes.routes}</BrowserRouter>
          </div>
        </Provider>
      </ThemeProvider>
    );
  }
}

export default App;
