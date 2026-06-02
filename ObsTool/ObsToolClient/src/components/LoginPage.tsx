import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import AppBar from "@mui/material/AppBar";
import type { Theme } from "@mui/material/styles";
import { connect } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { bindActionCreators, Dispatch } from "redux";
import * as authenticationAction from "../actions/AuthenticationActions";
import logo from "../assets/images/obstool-logo-navbar-55px.png";
import Api from "src/api/Api";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import { IAppState, IDataState, ILoginInfo } from "src/types/Types";
import "./Layout.css";
import { lightThemeAppBarBackgroundColor } from "src/theme/ThemeColors";

const styles = (theme: Theme) => createStyles({
    appBar: {
        backgroundColor: lightThemeAppBarBackgroundColor,
        color: theme.palette.common.white,
    },
    toolbar: {
        paddingLeft: `${theme.spacing(1)} !important`,
    },
    root: {
        margin: `${theme.spacing(6)} auto 0`,
        maxWidth: 420,
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3)
    },
    panel: {
        padding: theme.spacing(3)
    },
    form: {
        display: "grid",
        gap: theme.spacing(2),
        marginTop: theme.spacing(2)
    },
    actions: {
        alignItems: "center",
        display: "flex",
        gap: theme.spacing(2)
    },
    error: {
        color: theme.palette.error.main
    }
});

interface ILoginPageProps extends WithStyles<typeof styles> {
    actions: any;
    store: IDataState;
}

interface ILocationState {
    from?: {
        pathname?: string;
        search?: string;
    };
}

function LoginPage(props: ILoginPageProps) {
    const { classes } = props;
    const location = useLocation();
    const navigate = useNavigate();
    const locationState = location.state as ILocationState | null;
    const emailFromQuery = new URLSearchParams(location.search).get("email") ?? "";
    const [formFields, setFormFields] = React.useState<ILoginInfo>({
        username: emailFromQuery,
        password: ""
    });
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | undefined>();

    const redirectPath = locationState?.from?.pathname
        ? `${locationState.from.pathname}${locationState.from.search ?? ""}`
        : "/";

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormFields({
            ...formFields,
            [event.currentTarget.name]: event.currentTarget.value
        });
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(undefined);

        Api.login(formFields).then(
            response => {
                props.actions.setLoggedIn(response.data);
                setIsLoading(false);
                navigate(redirectPath, { replace: true });
            },
            () => {
                setError("Login failed.");
                setIsLoading(false);
                props.actions.setLoggedOut();
            }
        );
    };

    if (props.store.isLoggedIn) {
        return <Navigate to={redirectPath} replace />;
    }

    return (
        <div>
            <CssBaseline />
            <AppBar position="static" color="default" className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                    <Typography variant="h4" color="inherit" noWrap={false}>
                        <a href={import.meta.env.BASE_URL} className="appbar-brand">
                            <img src={logo} className="logo-appbar" alt="logo" /><span className="appbar-title">ObsTool</span>
                        </a>
                    </Typography>
                </Toolbar>
            </AppBar>
            <main className={classes.root}>
                <Paper className={classes.panel} elevation={1}>
                    <Typography variant="h5">Login</Typography>
                    <form className={classes.form} onSubmit={handleSubmit}>
                        <TextField
                            name="username"
                            autoFocus={true}
                            label="Email or username"
                            value={formFields.username}
                            fullWidth={true}
                            autoComplete="username"
                            onChange={handleInputChange}
                        />
                        <TextField
                            name="password"
                            label="Password"
                            type="password"
                            value={formFields.password}
                            fullWidth={true}
                            autoComplete="current-password"
                            onChange={handleInputChange}
                        />
                        {error && <Typography className={classes.error}>{error}</Typography>}
                        <div className={classes.actions}>
                            <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
                                Login
                            </Button>
                            {isLoading && <CircularProgress size={24} />}
                        </div>
                        <div className={classes.actions}>
                            <Button component={Link} to="/signup" color="primary">
                                Sign up
                            </Button>
                            <Button component={Link} to="/forgot-password" color="primary">
                                Forgot password
                            </Button>
                        </div>
                    </form>
                </Paper>
            </main>
        </div>
    );
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

const mapDispatchToProps = (dispatch: Dispatch<authenticationAction.AuthenticationAction>) => {
    return {
        actions: bindActionCreators(
            { ...authenticationAction },
            dispatch
        )
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(LoginPage));
