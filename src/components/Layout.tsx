import * as React from "react";
import NavMenu from "./NavMenu";
import logo from "../obstool-logo.png";

export interface ILayoutProps {
    children?: React.ReactNode;
}

export default class Layout extends React.Component<ILayoutProps, {}> {
    public render() {
        return <div>
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <h1 className="App-title">ObsTool</h1>
            </header>
            <div>
                <div>
                    <NavMenu />
                </div>
                <div>
                    {this.props.children}
                </div>
            </div>
        </div>;
    }
}
