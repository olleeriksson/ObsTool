import * as React from "react";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Paper from "@mui/material/Paper";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { Theme } from "@mui/material/styles";
import { Link } from "react-router-dom";
import logo from "../assets/images/obstool-logo-navbar-55px.png";
import { createStyles, withStyles } from "src/muiCompat";
import type { WithStyles } from "src/muiCompat";
import "./Layout.css";

const styles = (theme: Theme) => createStyles({
    toolbar: {
        paddingLeft: `${theme.spacing(1)} !important`
    },
    root: {
        margin: `${theme.spacing(6)} auto 0`,
        maxWidth: 520,
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3)
    },
    panel: {
        padding: theme.spacing(3)
    }
});

interface IAuthenticationPageFrameProps extends WithStyles<typeof styles> {
    children: React.ReactNode;
    title: string;
}

function AuthenticationPageFrame(props: IAuthenticationPageFrameProps) {
    const { classes } = props;

    return (
        <div>
            <CssBaseline />
            <AppBar position="static" color="default">
                <Toolbar className={classes.toolbar}>
                    <Typography variant="h4" color="inherit" noWrap={false}>
                        <Link to="/login" className="appbar-brand">
                            <img src={logo} className="logo-appbar" alt="logo" /><span className="appbar-title">ObsTool</span>
                        </Link>
                    </Typography>
                </Toolbar>
            </AppBar>
            <main className={classes.root}>
                <Paper className={classes.panel} elevation={1}>
                    <Typography variant="h5">{props.title}</Typography>
                    {props.children}
                </Paper>
            </main>
        </div>
    );
}

export default withStyles(styles)(AuthenticationPageFrame);
