import * as React from "react";
import { NavLink } from "react-router-dom";

export default class NavMenu extends React.Component<{}, {}> {
    public render() {
        return <div>
            <div>
                <NavLink to={"/"} exact={true} activeClassName="active">
                    <i className="fas fa-home" /> Home
                </NavLink>
                |
                <NavLink to={"/sessions"} activeClassName="active">
                    <span className="glyphicon glyphicon-education" /> Counter
                </NavLink>
            </div>
        </div>;
    }
}
