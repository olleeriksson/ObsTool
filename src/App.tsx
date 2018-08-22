import * as React from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faHome, faPlus, faSearch, faTable, faBinoculars } from "@fortawesome/free-solid-svg-icons";
import { faCalendarAlt, faEdit } from "@fortawesome/free-regular-svg-icons";
import CssBaseline from "@material-ui/core/CssBaseline";
import "typeface-roboto";
import * as Routes from "./components/Routes";

class App extends React.Component<{}, {}> {
  constructor(props: any) {
    super(props);

    library.add(faHome, faPlus, faSearch, faTable, faCalendarAlt, faBinoculars, faEdit);
  }

  public render() {
    // basename={baseUrl}
    return (
      <div className="App">
        <CssBaseline />
        <BrowserRouter children={Routes.routes} />
      </div>
    );
  }
}

export default App;
