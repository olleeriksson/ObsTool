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
import Typography from "@mui/material/Typography";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import LightModeIcon from "@mui/icons-material/LightMode";
import LockResetIcon from "@mui/icons-material/LockReset";
import LogoutIcon from "@mui/icons-material/Logout";
import PaletteIcon from "@mui/icons-material/Palette";
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
import { lightThemeAppBarBackgroundColor } from "src/theme/ThemeColors";

const themeMenuOptions: Array<{ preference: ThemePreference; label: string }> = [
    { preference: "light", label: "Light theme" },
    { preference: "dark", label: "Dark theme" },
];

const styles = (theme: Theme) => createStyles({
    appBar: {
        position: "relative",
    },
    appBarLightTheme: {
        backgroundColor: lightThemeAppBarBackgroundColor,
        color: theme.palette.common.white,
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
        [theme.breakpoints.down("lg")]: {
            flexBasis: "100%",
            marginRight: 0,
        },
    },
    navControls: {
        alignItems: "center",
        flex: "1 1 640px",
        display: "flex",
        flexDirection: "row-reverse",
        flexWrap: "nowrap",
        gap: theme.spacing(1),
        minWidth: 0,
        [theme.breakpoints.down("md")]: {
            flexBasis: "100%",
            flexWrap: "wrap",
        },
    },
    navButtonGroup: {
        alignItems: "center",
        display: "flex",
        flex: "1 1 auto",
        gap: theme.spacing(1),
        flexWrap: "wrap",
        justifyContent: "flex-end",
        minWidth: 0,
        [theme.breakpoints.down("sm")]: {
            flexBasis: "auto",
            justifyContent: "flex-start",
        },
    },
    searchContainer: {
        flex: "0 0 340px",
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(1),
        maxWidth: 420,
        minWidth: 260,
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
    appbarButtonLightTheme: {
        color: theme.palette.common.white,
        "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
        },
    },
    navButtonIcon: {
        color: theme.palette.text.primary,
        fontSize: "1.35em",
        verticalAlign: "baseline",
        transformOrigin: "bottom center",
        transform: "translateY(-4px)",
        marginRight: theme.spacing(1)
    },
    navButtonIconLightTheme: {
        color: "inherit",
    },
    instrumentsNavButton: {
        overflow: "visible",
    },
    navTelescopeIcon: {
        transform: "translateY(-8px)",
    },
    navTelescopeIconLightTheme: {
        filter: "invert(1) brightness(2)",
    },
    userMenuIcon: {
        color: theme.palette.text.primary,
    },
    userMenuIconLightTheme: {
        color: "inherit",
    },
    submenuChevron: {
        marginLeft: theme.spacing(2),
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

// Returns the icon shown next to each selectable theme in the user menu.
function getThemeMenuIcon(preference: ThemePreference): React.ReactNode {
    switch (preference) {
        case "dark":
            return <DarkModeIcon fontSize="small" />;
        default:
            return <LightModeIcon fontSize="small" />;
    }
}

export interface ILayoutState {
    userMenuAnchorEl: HTMLElement | null;
    themeMenuAnchorEl: HTMLElement | null;
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
    private themeMenuCloseTimer: number | null = null;

    constructor(props: ILayoutProps) {
        super(props);

        this.state = {
            userMenuAnchorEl: null,
            themeMenuAnchorEl: null,
            exportDialogOpen: false
        };
    }

    public componentWillUnmount() {
        this.clearThemeMenuCloseTimer();
    }

    private handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({ userMenuAnchorEl: event.currentTarget });
    }

    private handleCloseUserMenu = () => {
        this.clearThemeMenuCloseTimer();
        this.setState({
            userMenuAnchorEl: null,
            themeMenuAnchorEl: null,
        });
    }

    // Opens the theme submenu from the authenticated user's top-nav menu.
    private handleOpenThemeMenu = (event: React.MouseEvent<HTMLElement>) => {
        this.clearThemeMenuCloseTimer();
        this.setState({ themeMenuAnchorEl: event.currentTarget });
    }

    // Closes only the theme submenu while keeping the parent user menu available.
    private handleCloseThemeMenu = () => {
        this.clearThemeMenuCloseTimer();
        this.setState({ themeMenuAnchorEl: null });
    }

    // Cancels a pending theme-submenu close while the pointer is still in the submenu area.
    private clearThemeMenuCloseTimer = () => {
        if (this.themeMenuCloseTimer !== null) {
            window.clearTimeout(this.themeMenuCloseTimer);
            this.themeMenuCloseTimer = null;
        }
    }

    // Delays submenu closing briefly so the pointer can travel from the parent item into the submenu.
    private handleScheduleThemeMenuClose = () => {
        this.clearThemeMenuCloseTimer();
        this.themeMenuCloseTimer = window.setTimeout(() => {
            this.setState({ themeMenuAnchorEl: null });
            this.themeMenuCloseTimer = null;
        }, 250);
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

    // Persists the selected app theme and closes the user menu.
    private handleSetThemePreference = (themePreference: ThemePreference) => {
        this.context.setPreference(themePreference);
        this.handleCloseThemeMenu();
        this.handleCloseUserMenu();
    }

    public render() {
        const { classes } = this.props;

        //console.log("Location found in Layout");
        //console.log(this.props.location);

        const isUserMenuOpen = Boolean(this.state.userMenuAnchorEl);
        const isThemeMenuOpen = Boolean(this.state.themeMenuAnchorEl);
        const isLightTheme = this.context.preference === "light";
        const selectedThemeLabel = themeMenuOptions.find(option => option.preference === this.context.preference)?.label ?? "Light theme";
        const appBarClassName = classNames(classes.appBar, isLightTheme && classes.appBarLightTheme);
        const appbarButtonClassName = classNames(classes.appbarButton, isLightTheme && classes.appbarButtonLightTheme);
        const navButtonIconClassName = classNames("faSpaceAfter", classes.navButtonIcon, isLightTheme && classes.navButtonIconLightTheme);
        const userMenuIconClassName = classNames(classes.userMenuIcon, isLightTheme && classes.userMenuIconLightTheme);
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
                        className={appbarButtonClassName}
                        onClick={this.handleOpenUserMenu}
                        aria-controls={isUserMenuOpen ? "user-menu" : undefined}
                        aria-haspopup="true"
                        aria-expanded={isUserMenuOpen ? "true" : undefined}
                        startIcon={<AccountCircleIcon className={userMenuIconClassName} />}
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
                        <MenuItem
                            aria-controls={isThemeMenuOpen ? "theme-menu" : undefined}
                            aria-haspopup="menu"
                            aria-expanded={isThemeMenuOpen ? "true" : undefined}
                            onClick={this.handleOpenThemeMenu}
                            onMouseEnter={this.handleOpenThemeMenu}
                            onMouseLeave={this.handleScheduleThemeMenuClose}
                        >
                            <ListItemIcon>
                                <PaletteIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Theme" secondary={selectedThemeLabel} />
                            <ChevronRightIcon className={classes.submenuChevron} fontSize="small" />
                        </MenuItem>
                        <Menu
                            id="theme-menu"
                            anchorEl={this.state.themeMenuAnchorEl}
                            open={isUserMenuOpen && isThemeMenuOpen}
                            onClose={this.handleCloseThemeMenu}
                            hideBackdrop
                            anchorOrigin={{
                                vertical: "top",
                                horizontal: "left"
                            }}
                            transformOrigin={{
                                vertical: "top",
                                horizontal: "right"
                            }}
                            slotProps={{
                                root: {
                                    style: { pointerEvents: "none" }
                                },
                                paper: {
                                    onMouseEnter: this.clearThemeMenuCloseTimer,
                                    onMouseLeave: this.handleScheduleThemeMenuClose,
                                    style: { pointerEvents: "auto" }
                                }
                            }}
                        >
                            {themeMenuOptions.map(option => (
                                <MenuItem
                                    key={option.preference}
                                    selected={this.context.preference === option.preference}
                                    onClick={() => this.handleSetThemePreference(option.preference)}
                                >
                                    <ListItemIcon>
                                        {getThemeMenuIcon(option.preference)}
                                    </ListItemIcon>
                                    <ListItemText>{option.label}</ListItemText>
                                </MenuItem>
                            ))}
                        </Menu>
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
                <Button component={LinkToLogin} color="primary" className={appbarButtonClassName}>
                    <FontAwesomeIcon icon="key" className={navButtonIconClassName} /> Login
                </Button>
            );
        }

        const weAreOnSearchView = this.props.onSearchView ?? false;

        return <div>
            <CssBaseline />
            <AppBar position="static" color="default" className={appBarClassName}>
                <Toolbar className={classes.toolbar}>
                    <Typography variant="h4" color="inherit" noWrap={false} className={classes.toolbarTitle}>
                        <a href={import.meta.env.BASE_URL} className="appbar-brand">
                            <img src={logo} className="logo-appbar" alt="logo" /><span className="appbar-title">ObsTool</span>
                        </a>
                    </Typography>
                    <div className={classes.navControls}>
                        <div className={classes.navButtonGroup}>
                            <Button component={LinkToHome} className={appbarButtonClassName}>
                                <FontAwesomeIcon icon="home" className={navButtonIconClassName} />Home
                            </Button>
                            <Button component={LinkToObservedDsos} className={appbarButtonClassName}>
                                <FontAwesomeIcon icon="table" className={navButtonIconClassName} /> Observations
                            </Button>
                            <Button component={LinkToSessions} className={appbarButtonClassName} onClick={this.handleClickSessions}>
                                <FontAwesomeIcon icon="table" className={navButtonIconClassName} /> Sessions
                            </Button>
                            <Button component={LinkToNewSession} className={appbarButtonClassName}>
                                <FontAwesomeIcon icon="plus" className={navButtonIconClassName} /> New session
                            </Button>
                            <Button component={LinkToObjects} className={appbarButtonClassName}>
                                <FontAwesomeIcon icon="star" className={navButtonIconClassName} /> Objects
                            </Button>
                            <Button component={LinkToLocations} className={appbarButtonClassName}>
                                <FontAwesomeIcon icon="map-marked" className={navButtonIconClassName} /> Locations
                            </Button>
                            <Button component={LinkToInstruments} className={classNames(appbarButtonClassName, classes.instrumentsNavButton)}>
                                <TelescopeIcon variant="tableTop" size={24} className={classNames(navButtonIconClassName, classes.navTelescopeIcon, isLightTheme && classes.navTelescopeIconLightTheme)} /> Instruments
                            </Button>
                            <Button component={LinkToEyepieces} className={appbarButtonClassName}>
                                <FontAwesomeIcon icon="eye" className={navButtonIconClassName} /> Eyepieces
                            </Button>
                            {userMenuComponent}
                        </div>
                        <div className={classes.searchContainer}>
                            <SearchInput navBarContrast={isLightTheme} onSearchView={weAreOnSearchView} />
                        </div>
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
