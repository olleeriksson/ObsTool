import * as React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default class NavMenu extends React.Component<{}, {}> {
    public render() {
        return <div>
            <div>
                <NavLink to={"/"} exact={true} activeClassName="active">
                    <FontAwesomeIcon icon="home" /> Home
                </NavLink>
                |
                <NavLink to={"/"} exact={true} activeClassName="active">
                    <FontAwesomeIcon icon="plus" className="" /> Add session
                </NavLink>
                |
                <NavLink to={"/sessions"} activeClassName="active">
                    <FontAwesomeIcon icon="table" /> Observation sessions
                </NavLink>
                |
                <NavLink to={"/sessions"} activeClassName="active">
                    <FontAwesomeIcon icon="search" /> Search observations
                </NavLink>
            </div>
        </div>;
    }
}
