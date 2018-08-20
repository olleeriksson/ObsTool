import * as React from "react";
import "./App.css";
import ObsSessionListAndForm from "./components/ObsSessionListAndForm";
import Layout from "./components/Layout";
import Home from "./components/Home";
import { BrowserRouter, Route } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faHome, faPlus, faSearch, faTable } from "@fortawesome/free-solid-svg-icons";
import CssBaseline from "@material-ui/core/CssBaseline";

class App extends React.Component<{}, {}> {
  constructor(props: any) {
    super(props);

    library.add(faHome, faPlus, faSearch, faTable);
  }

  public render() {

    const routes = (
      <Layout>
        <Route exact={true} path="/" component={Home} />
        <Route path="/sessions" component={ObsSessionListAndForm} />
      </Layout>
    );

    // basename={baseUrl}
    return (
      <div className="App">
        <CssBaseline />
        <BrowserRouter children={routes} />
      </div>
    );
  }
}

export default App;
