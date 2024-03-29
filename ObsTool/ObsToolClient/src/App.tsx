import * as React from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faHome, faPlus, faSearch, faTable, faBinoculars, faEyeSlash, faMapMarked, faThumbsUp, faThumbsDown, faStar, faStarHalfAlt, faUndoAlt, faTimes, faExclamationTriangle, faKey } from "@fortawesome/free-solid-svg-icons";
import { faCalendarAlt, faEdit } from "@fortawesome/free-regular-svg-icons";
import CssBaseline from "@material-ui/core/CssBaseline";
import "typeface-roboto";
//import "typeface-open-sans";
import * as Routes from "./components/Routes";
import { Provider } from "react-redux";
import initStore from "./store/AppStore";

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
      <Provider store={store}>
        <div className="App">
          <CssBaseline />
          <BrowserRouter children={Routes.routes} />
        </div>
      </Provider>
    );
  }
}

export default App;
