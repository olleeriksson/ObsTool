import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import Grid from "@material-ui/core/Grid";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import classNames from "classnames";
import logo from "./../obstool-logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Layout.css";
import { Link } from "react-router-dom";
import SearchInput from "./SearchInput";
import Api from "src/api/Api";
import LoginDialog from "./LoginDialog";
import { IAppState, IDataState } from "src/types/Types";
import * as authenticationAction from "../actions/AuthenticationActions";
import { bindActionCreators, Dispatch } from "redux";
import { connect } from "react-redux";

const styles = (theme: Theme) => createStyles({
    appBar: {
        position: "relative",
    },
    toolbar: {
        flex: 1,
        alignContent: "center",
    },
    toolbarTitle: {
        flex: 1,
        alignContent: "center",
    },
    layout: {
        width: "auto",
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
        [theme.breakpoints.up(1300 + theme.spacing(6))]: {
            width: 1300,
            marginLeft: "auto",
            marginRight: "auto",
        },
    },
    footer: {
        marginTop: theme.spacing(8),
        borderTop: `1px solid ${theme.palette.divider}`,
        padding: `${theme.spacing(6)}px 0`,
    },
    appbarButton: {
        margin: 10
    }
});

export interface ILayoutState {
    //isLoggedIn: boolean;  // in global state now
    isShowingLoginDialog: boolean;
}

export interface ILayoutProps extends WithStyles<typeof styles> {
    children?: React.ReactNode;
    location?: any;
    actions: any;
    store: IDataState;
}

class Layout extends React.Component<ILayoutProps, ILayoutState> {
    constructor(props: ILayoutProps) {
        super(props);

        this.state = {
            //isLoggedIn: false,  // in global state now
            isShowingLoginDialog: false
        };
    }

    public componentDidMount() {
        this.checkLoggedInStatus();
    }

    private checkLoggedInStatus = () => {
        // Only check if you're logged in when you're not. Whenever you change route, the component
        // gets remounted (because of push history) and this check is executed.
        //if (!this.props.store.isLoggedIn) {
        Api.isLoggedIn().then(
            () => {
                //this.setState({ isLoggedIn: true });  // in global state now
                this.props.actions.setLoggedIn();
            },
            () => {
                //this.setState({ isLoggedIn: false });  // in global state now
                this.props.actions.setLoggedOut();
            }
        );
        //}
    }

    private handleLoginSuccess = () => {
        this.setState({
            //isLoggedIn: true,  // in global state now
            isShowingLoginDialog: false
        });
        this.props.actions.setLoggedIn();
    }

    private handleLoginCancelled = () => {
        this.setState({ isShowingLoginDialog: false });
    }

    private handleOnClickLogin = () => {
        this.setState({ isShowingLoginDialog: true });
    }

    private handleClickLogout = () => {
        Api.logout().then(
            () => {
                //this.setState({ isLoggedIn: false });  // in global state now
                this.props.actions.setLoggedOut();
            },
            () => {
                alert("Logout failed!");
            }
        );
    }

    public render() {
        const { classes } = this.props;

        //console.log("Location found in Layout");
        //console.log(this.props.location);

        const LinkToHome = (props: any) => <Link to="/" {...props} />;
        const LinkToObservedDsos = (props: any) => <Link to="/observations" {...props} />;
        const LinkToSessions = (props: any) => <Link to="/sessions" {...props} />;
        const LinkToNewSession = (props: any) => <Link to="/newsession" {...props} />;
        const LinkToLocations = (props: any) => <Link to="/locations" {...props} />;
        const LinkToSearch = (props: any) => <Link to="/search" {...props} />;

        let loginLogoutComponent;
        //if (this.state.isLoggedIn) {  // in global state now
        if (this.props.store.isLoggedIn) {
            loginLogoutComponent = (
                <Button color="primary" onClick={this.handleClickLogout} className="appbarButton">
                    <FontAwesomeIcon icon="key" className="faSpaceAfter" /> Logout
                </Button>
            );
        } else {
            loginLogoutComponent = (
                <Button color="primary" onClick={this.handleOnClickLogin} className="appbarButton">
                    <FontAwesomeIcon icon="key" className="faSpaceAfter" /> Login
                </Button>
            );
        }

        // Hack because I couldn't get withRouter() to work with Typescript
        const weAreOnSearchView = this.props.location.pathname === "/search";

        const loginDialog = (
            <LoginDialog isOpen={this.state.isShowingLoginDialog} onLogin={this.handleLoginSuccess} onCancel={this.handleLoginCancelled} />
        );

        return <div>
            <CssBaseline />
            {loginDialog}
            <AppBar position="static" color="default" className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                    <Typography variant="h4" color="inherit" noWrap={false} className={classes.toolbarTitle}>
                        <span style={{ whiteSpace: "nowrap" }}><img src={logo} className="logo-appbar" alt="logo" /> ObsTool</span>
                    </Typography>
                    <Grid container={true} spacing={4} direction="row" wrap="wrap" justify="flex-end">
                        <div style={{ width: 300, marginLeft: 20, marginRight: 15 }}>
                            <SearchInput onSearchView={weAreOnSearchView} />
                        </div>
                        <Button component={LinkToHome} className="appbarButton">
                            <FontAwesomeIcon icon="home" className="faSpaceAfter" />Home
                        </Button>
                        <Button component={LinkToObservedDsos} className="appbarButton">
                            <FontAwesomeIcon icon="table" className="faSpaceAfter" /> Observations
                        </Button>
                        <Button component={LinkToSessions} className="appbarButton">
                            <FontAwesomeIcon icon="table" className="faSpaceAfter" /> List sessions
                        </Button>
                        <Button component={LinkToNewSession} className="appbarButton">
                            <FontAwesomeIcon icon="plus" className="faSpaceAfter" /> New session
                        </Button>
                        <Button component={LinkToLocations} className="appbarButton">
                            <FontAwesomeIcon icon="map-marked" className="faSpaceAfter" /> Locations
                        </Button>
                        <Button component={LinkToSearch} className="appbarButton">
                            <FontAwesomeIcon icon="search" className="faSpaceAfter" /> Search
                        </Button>
                        {loginLogoutComponent}
                    </Grid>
                </Toolbar>
            </AppBar>
            <main className={classes.layout}>
                {this.props.children}
            </main>
            {/* Footer */}
            <footer className={classNames(classes.footer, classes.layout)}>
                <Grid container={true} spacing={4} direction="column" justify="space-evenly">
                    <Grid item={true} xs={true}>
                        <Typography variant="subtitle1" align="center" color="textSecondary">
                            Copyright Olle Eriksson
                        </Typography>
                    </Grid>
                </Grid>
            </footer>
        </div>;
    }
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

const mapDispatchToProps = (dispatch: Dispatch<authenticationAction.ILoggedInAction | authenticationAction.ILoggedOutAction>) => {
    return {
        actions: bindActionCreators(
            { ...authenticationAction },
            dispatch
        )
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Layout));
