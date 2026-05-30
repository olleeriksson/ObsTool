import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid2";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import IconButton from "@mui/material/IconButton";
import LightModeIcon from "@mui/icons-material/LightMode";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import classNames from "classnames";
import logo from "../assets/images/obstool-logo-navbar-55px.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Layout.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ExportDataDialog from "./ExportDataDialog";
import SearchInput from "./SearchInput";
import Api from "src/api/Api";
import { IAppState, IDataState } from "src/types/Types";
import * as authenticationAction from "../actions/AuthenticationActions";
import * as obsSessionAction from "../actions/ObsSessionActions";
import { bindActionCreators, Dispatch } from "redux";
import { connect } from "react-redux";
import TelescopeIcon from "./icons/TelescopeIcon";
import { ThemeModeContext, ThemePreference } from "src/theme/ThemeModeContext";

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
        overflow: "visible",
    },
    navButtonIcon: {
        color: theme.palette.text.primary,
        fontSize: "1.35em",
        verticalAlign: "baseline",
        transformOrigin: "bottom center",
        transform: "translateY(-4px)",
        marginRight: theme.spacing(1)
    },
    instrumentsNavButton: {
        overflow: "visible",
    },
    navTelescopeIcon: {
        color: theme.palette.text.primary,
        transform: "translateY(-8px)",
    },
    userMenuIcon: {
        color: theme.palette.text.primary,
    },
    themeButton: {
        color: theme.palette.text.primary,
        margin: theme.spacing(0.25),
    },
    themeButtonIcon: {
        fontSize: "1.2rem",
    },
});

// Defined at module level so React sees a stable component identity across renders.
// MUI v6 ButtonBase requires the `component` prop to be a forwardRef-capable element.
const LinkToHome = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/" ref={ref} {...props} />);
const LinkToObservedDsos = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/observations" ref={ref} {...props} />);
const LinkToSessions = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/sessions" ref={ref} {...props} />);
const LinkToNewSession = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/newsession" ref={ref} {...props} />);
const LinkToObjects = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/objects" ref={ref} {...props} />);
const LinkToLocations = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/locations" ref={ref} {...props} />);
const LinkToInstruments = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/instruments" ref={ref} {...props} />);
const LinkToEyepieces = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/eyepieces" ref={ref} {...props} />);
const LinkToLogin = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/login" ref={ref} {...props} />);

// Cycles through the available color-theme preferences from the navbar button.
function getNextThemePreference(preference: ThemePreference): ThemePreference {
    if (preference === "system") {
        return "dark";
    }

    return preference === "dark" ? "light" : "system";
}

export interface ILayoutState {
    userMenuAnchorEl: HTMLElement | null;
    exportDialogOpen: boolean;
}

export interface ILayoutProps extends WithStyles<typeof styles> {
    children?: React.ReactNode;
    onSearchView?: boolean;
    actions: any;
    store: IDataState;
    navigate: (path: string, options?: { replace?: boolean }) => void;
}

class Layout extends React.Component<ILayoutProps, ILayoutState> {
    public static contextType = ThemeModeContext;
    declare context: React.ContextType<typeof ThemeModeContext>;

    constructor(props: ILayoutProps) {
        super(props);

        this.state = {
            userMenuAnchorEl: null,
            exportDialogOpen: false
        };
    }

    private handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({ userMenuAnchorEl: event.currentTarget });
    }

    private handleCloseUserMenu = () => {
        this.setState({ userMenuAnchorEl: null });
    }

    private handleClickLogout = () => {
        this.handleCloseUserMenu();
        Api.logout().then(
            () => {
                this.props.actions.setLoggedOut();
                this.props.navigate("/login", { replace: true });
            },
            () => {
                alert("Logout failed!");
            }
        );
    }

    private handleClickChangePassword = () => {
        this.handleCloseUserMenu();
        this.props.navigate("/change-password");
    }

    private handleClickUserAdmin = () => {
        this.handleCloseUserMenu();
        this.props.navigate("/user-admin");
    }

    private handleClickSystemEvents = () => {
        this.handleCloseUserMenu();
        this.props.navigate("/system-events");
    }

    // Opens the neutral sessions list from the top nav without keeping a previous split-view selection active.
    private handleClickSessions = () => {
        this.props.actions.clearSelectedObsSession();
    }

    // Opens the data export dialog from the authenticated user's top-nav menu.
    private handleClickExportData = () => {
        this.handleCloseUserMenu();
        this.setState({
            exportDialogOpen: true
        });
    }

    // Closes the export dialog after the dialog component permits closing.
    private handleCloseExportDialog = () => {
        this.setState({
            exportDialogOpen: false
        });
    }

    // Advances the persisted app theme preference between system, dark, and light modes.
    private handleToggleTheme = () => {
        this.context.setPreference(getNextThemePreference(this.context.preference));
    }

    public render() {
        const { classes } = this.props;

        //console.log("Location found in Layout");
        //console.log(this.props.location);

        const isUserMenuOpen = Boolean(this.state.userMenuAnchorEl);
        let userMenuComponent;
        if (this.props.store.isLoggedIn) {
            const userMenuLabel = this.props.store.loggedInUsername
                ?? this.props.store.loggedInFullName
                ?? this.props.store.loggedInEmail
                ?? "User";
            userMenuComponent = (
                <>
                    <Button
                        color="primary"
                        className={classes.appbarButton}
                        onClick={this.handleOpenUserMenu}
                        aria-controls={isUserMenuOpen ? "user-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={isUserMenuOpen ? "true" : undefined}
                        startIcon={<AccountCircleIcon className={classes.userMenuIcon} />}
                    >
                        {userMenuLabel}
                    </Button>
                    <Menu
                        id="user-menu"
                        anchorEl={this.state.userMenuAnchorEl}
                        open={isUserMenuOpen}
                        onClose={this.handleCloseUserMenu}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right"
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "right"
                        }}
                    >
                        <MenuItem onClick={this.handleClickChangePassword}>
                            <ListItemIcon>
                                <LockResetIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Change password</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={this.handleClickExportData}>
                            <ListItemIcon>
                                <FileDownloadIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Export data</ListItemText>
                        </MenuItem>
                        {this.props.store.canManageUsers && (
                            <>
                                <MenuItem onClick={this.handleClickUserAdmin}>
                                    <ListItemIcon>
                                        <AdminPanelSettingsIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>User Management</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={this.handleClickSystemEvents}>
                                    <ListItemIcon>
                                        <EventNoteIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>System Event Log</ListItemText>
                                </MenuItem>
                            </>
                        )}
                        <MenuItem onClick={this.handleClickLogout}>
                            <ListItemIcon>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Logout</ListItemText>
                        </MenuItem>
                    </Menu>
                </>
            );
        } else {
            userMenuComponent = (
                <Button component={LinkToLogin} color="primary" className={classes.appbarButton}>
                    <FontAwesomeIcon icon="key" className={classNames("faSpaceAfter", classes.navButtonIcon)} /> Login
                </Button>
            );
        }

        const weAreOnSearchView = this.props.onSearchView ?? false;
        const themePreference = this.context.preference;
        const themeButtonLabel = `Theme: ${themePreference}`;
        const themeButtonIcon = themePreference === "system"
            ? <BrightnessAutoIcon className={classes.themeButtonIcon} />
            : themePreference === "dark"
                ? <DarkModeIcon className={classes.themeButtonIcon} />
                : <LightModeIcon className={classes.themeButtonIcon} />;

        return <div>
            <CssBaseline />
            <AppBar position="static" color="default" className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                    <Typography variant="h4" color="inherit" noWrap={false} className={classes.toolbarTitle}>
                        <a href={import.meta.env.BASE_URL} className="appbar-brand">
                            <img src={logo} className="logo-appbar" alt="logo" /><span className="appbar-title">ObsTool</span>
                        </a>
                    </Typography>
                    <div className={classes.navControls}>
                        <div className={classes.searchContainer}>
                            <SearchInput onSearchView={weAreOnSearchView} />
                        </div>
                        <Button component={LinkToHome} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="home" className={classNames("faSpaceAfter", classes.navButtonIcon)} />Home
                        </Button>
                        <Button component={LinkToObservedDsos} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="table" className={classNames("faSpaceAfter", classes.navButtonIcon)} /> Observations
                        </Button>
                        <Button component={LinkToSessions} className={classes.appbarButton} onClick={this.handleClickSessions}>
                            <FontAwesomeIcon icon="table" className={classNames("faSpaceAfter", classes.navButtonIcon)} /> Sessions
                        </Button>
                        <Button component={LinkToNewSession} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="plus" className={classNames("faSpaceAfter", classes.navButtonIcon)} /> New session
                        </Button>
                        <Button component={LinkToObjects} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="star" className={classNames("faSpaceAfter", classes.navButtonIcon)} /> Objects
                        </Button>
                        <Button component={LinkToLocations} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="map-marked" className={classNames("faSpaceAfter", classes.navButtonIcon)} /> Locations
                        </Button>
                        <Button component={LinkToInstruments} className={classNames(classes.appbarButton, classes.instrumentsNavButton)}>
                            <TelescopeIcon variant="tableTop" size={24} className={classNames("faSpaceAfter", classes.navButtonIcon, classes.navTelescopeIcon)} /> Instruments
                        </Button>
                        <Button component={LinkToEyepieces} className={classes.appbarButton}>
                            <FontAwesomeIcon icon="eye" className={classNames("faSpaceAfter", classes.navButtonIcon)} /> Eyepieces
                        </Button>
                        <Tooltip title={themeButtonLabel}>
                            <IconButton
                                aria-label={themeButtonLabel}
                                className={classes.themeButton}
                                onClick={this.handleToggleTheme}
                                size="small"
                            >
                                {themeButtonIcon}
                            </IconButton>
                        </Tooltip>
                        {userMenuComponent}
                    </div>
                </Toolbar>
            </AppBar>
            <ExportDataDialog
                open={this.state.exportDialogOpen}
                onClose={this.handleCloseExportDialog}
            />
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

const mapDispatchToProps = (dispatch: Dispatch<authenticationAction.AuthenticationAction | obsSessionAction.ObsSessionAction>) => {
    return {
        actions: bindActionCreators(
            { ...authenticationAction, ...obsSessionAction },
            dispatch
        )
    };
};

const LayoutConnected = connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Layout));

export default function LayoutWithRouter({ children }: { children?: React.ReactNode }) {
    const location = useLocation();
    const navigate = useNavigate();
    return (
        <LayoutConnected onSearchView={location.pathname === "/search"} navigate={navigate}>
            {children}
        </LayoutConnected>
    );
}
