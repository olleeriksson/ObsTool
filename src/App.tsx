import * as React from "react";
import "./App.css";
import ObsSessionListAndForm from "./components/ObsSessionListAndForm";
import logo from "./obstool-logo.png";

class App extends React.Component {
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div className="App-intro">
          <ObsSessionListAndForm />
        </div>
      </div>
    );
  }
}

export default App;
