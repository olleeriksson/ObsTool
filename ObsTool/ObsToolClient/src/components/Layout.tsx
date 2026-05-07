import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid2";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import classNames from "classnames";
import logo from "../assets/images/obstool-logo-navbar-55px.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Layout.css";
import { Link, useLocation } from "react-router-dom";
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
        alignItems: "center",
        flexWrap: "wrap",
        gap: theme.spacing(1),
        paddingLeft: `${theme.spacing(1)} !important`,
        paddingTop: theme.spacing(0.75),
        paddingBottom: theme.spacing(0.75),
    },
    toolbarTitle: {
        flex: "0 0 auto",
        alignItems: "center",
        display: "flex",
        minWidth: 0,
        marginRight: theme.spacing(1),
        [theme.breakpoints.down("md")]: {
            flexBasis: "100%",
            marginRight: 0,
        },
    },
    navControls: {
        alignItems: "center",
        display: "flex",
        flex: "1 1 640px",
        flexWrap: "wrap",
        gap: theme.spacing(1),
        justifyContent: "flex-end",
        minWidth: 0,
        [theme.breakpoints.down("md")]: {
            flexBasis: "100%",
            justifyContent: "flex-start",
        },
    },
    searchContainer: {
        flex: "1 1 220px",
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        maxWidth: 300,
        minWidth: 180,
        [theme.breakpoints.down("sm")]: {
            flexBasis: "100%",
            marginLeft: 0,
            marginRight: 0,
            maxWidth: "none",
        },
    },
    layout: {
        width: "auto",
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
        [theme.breakpoints.up(1400)]: {
            width: 1400,
            marginLeft: "auto",
            marginRight: "auto",
        },
    },
    footer: {
        marginTop: theme.spacing(8),
        borderTop: `1px solid ${theme.palette.divider}`,
        padding: `${theme.spacing(6)} 0`,
    },
    appbarButton: {
        margin: theme.spacing(0.25),
        whiteSpace: "nowrap",
    }
});

// Defined at module level so React sees a stable component identity across renders.
// MUI v6 ButtonBase requires the `component` prop to be a forwardRef-capable element.
const LinkToHome = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/" ref={ref} {...props} />);
const LinkToObservedDsos = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/observations" ref={ref} {...props} />);
const LinkToSessions = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/sessions" ref={ref} {...props} />);
const LinkToNewSession = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/newsession" ref={ref} {...props} />);
const LinkToLocations = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/locations" ref={ref} {...props} />);
const LinkToInstruments = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/instruments" ref={ref} {...props} />);
const LinkToEyepieces = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/eyepieces" ref={ref} {...props} />);
const LinkToSearch = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/search" ref={ref} {...props} />);

export interface ILayoutState {
    //isLoggedIn: boolean;  // in global state now
    isShowingLoginDialog: boolean;
}

export interface ILayoutProps extends WithStyles<typeof styles> {
    children?: React.ReactNode;
    onSearchView?: boolean;
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

        let loginLogoutComponent;
        //if (this.state.isLoggedIn) {  // in global state now
        if (this.props.store.isLoggedIn) {
            loginLogoutComponent = (
                <Button color="primary" onClick={this.handleClickLogout} className={classes.appbarButton}>
                    <FontAwesomeIcon icon="key" className="faSpaceAfter" /> Logout
                </Button>
            );
        } else {
            loginLogoutComponent = (
                <Button color="primary" onClick={this.handleOnClickLogin} className={classes.appbarButton}>
                    <FontAwesomeIcon icon="key" className="faSpaceAfter" /> Login
                </Button>
            );
        }

        const weAreOnSearchView = this.props.onSearchView ?? false;

        const loginDialog = (
            <LoginDialog isOpen={this.state.isShowingLoginDialog} onLogin={this.handleLoginSuccess} onCancel={this.handleLoginCancelled} />
        );

        return <div>
            <CssBaseline />
            {loginDialog}
            <AppBar position="static" color="default" className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                    <Typography variant="h4" color="inherit" noWrap={false} className={classes.toolbarTitle}>
                        <Link to="/" className="appbar-brand">
                            <img src={logo} className="logo-appbar" alt="logo" /><span className="appbar-title">ObsTool</span>
                        </Link>
                    </Typography>
                    <div className={classes.navControls}>
                        <div className={classes.searchContainer}>
                            <SearchInput onSearchView={weAreOnSearchView} />
                        </div>
                        <Button component={LinkToHome} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="home" className="faSpaceAfter" />Home
                        </Button>
                        <Button component={LinkToObservedDsos} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="table" className="faSpaceAfter" /> Observations
                        </Button>
                        <Button component={LinkToSessions} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="table" className="faSpaceAfter" /> Sessions
                        </Button>
                        <Button component={LinkToNewSession} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="plus" className="faSpaceAfter" /> New session
                        </Button>
                        <Button component={LinkToLocations} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="map-marked" className="faSpaceAfter" /> Locations
                        </Button>
                        <Button component={LinkToInstruments} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="binoculars" className="faSpaceAfter" /> Instruments
                        </Button>
                        <Button component={LinkToEyepieces} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="eye" className="faSpaceAfter" /> Eyepieces
                        </Button>
                        <Button component={LinkToSearch} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="search" className="faSpaceAfter" /> Search
                        </Button>
                        {loginLogoutComponent}
                    </div>
                </Toolbar>
            </AppBar>
            <main className={classes.layout}>
                {this.props.children}
            </main>
            {/* Footer */}
            <footer className={classNames(classes.footer, classes.layout)}>
                <Grid container spacing={4} direction="column" justifyContent="space-evenly">
                    <Grid size="grow">
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

const LayoutConnected = connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Layout));

export default function LayoutWithRouter({ children }: { children?: React.ReactNode }) {
    const location = useLocation();
    return (
        <LayoutConnected onSearchView={location.pathname === "/search"}>
            {children}
        </LayoutConnected>
    );
}
