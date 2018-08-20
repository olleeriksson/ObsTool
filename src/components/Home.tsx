import * as React from "react";
import { RouteComponentProps } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Statistics from "./Statistics";

export default class Home extends React.Component<RouteComponentProps<{}>, {}> {
    public render() {
        return <div>
            <h1><FontAwesomeIcon icon="home" /> Welcome</h1>
            <p>Welcome to your new single-page application...</p>
            <Statistics />
        </div>;
    }
}
