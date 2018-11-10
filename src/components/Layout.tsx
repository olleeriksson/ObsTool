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
        marginLeft: theme.spacing.unit * 3,
        marginRight: theme.spacing.unit * 3,
        [theme.breakpoints.up(1300 + theme.spacing.unit * 3 * 2)]: {
            width: 1300,
            marginLeft: "auto",
            marginRight: "auto",
        },
    },
    footer: {
        marginTop: theme.spacing.unit * 8,
        borderTop: `1px solid ${theme.palette.divider}`,
        padding: `${theme.spacing.unit * 6}px 0`,
    },
});

export interface ILayoutProps extends WithStyles<typeof styles> {
    children?: React.ReactNode;
    location?: any;
}

class Layout extends React.Component<ILayoutProps> {
    constructor(props: ILayoutProps) {
        super(props);
    }

    public render() {
        const { classes } = this.props;

        console.log("Location found in Layout");
        console.log(this.props.location);

        const LinkToHome = (props: any) => <Link to="/" {...props} />;
        const LinkToSessions = (props: any) => <Link to="/sessions" {...props} />;
        const LinkToNewSession = (props: any) => <Link to="/newsession" {...props} />;
        const LinkToSearch = (props: any) => <Link to="/search" {...props} />;

        // const loginButton = (
        //     <Button color="primary" variant="outlined">
        //         Login
        //     </Button>;
        // );

        // Hack because I couldn't get withRouter() to work with Typescript
        const weAreOnSearchView = this.props.location.pathname === "/search";

        return <div>
            <CssBaseline />
            <AppBar position="static" color="default" className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                    <Typography variant="display1" color="inherit" noWrap={false} className={classes.toolbarTitle}>
                        <img src={logo} className="logo-appbar" alt="logo" /> ObsTool
                    </Typography>
                    <div style={{ width: 300, marginLeft: 20, marginRight: 15 }}>
                        <SearchInput onSearchView={weAreOnSearchView} />
                    </div>
                    <Button component={LinkToHome}><FontAwesomeIcon icon="home" className="faSpaceAfter" />Home</Button>
                    <Button component={LinkToSessions}><FontAwesomeIcon icon="table" className="faSpaceAfter" /> List sessions</Button>
                    <Button component={LinkToNewSession}><FontAwesomeIcon icon="plus" className="faSpaceAfter" /> New session</Button>
                    <Button component={LinkToSearch}><FontAwesomeIcon icon="search" className="faSpaceAfter" /> Search</Button>
                </Toolbar>
            </AppBar>
            <main className={classes.layout}>
                {this.props.children}
            </main>
            {/* Footer */}
            <footer className={classNames(classes.footer, classes.layout)}>
                <Grid container={true} spacing={32} direction="column" justify="space-evenly">
                    <Grid item={true} xs={true}>
                        <Typography variant="title" align="center" color="textPrimary">
                            Created with React + TypeScript and ASP.NET Core
                        </Typography>
                        <Typography variant="caption" align="center" color="textSecondary" gutterBottom={true}>
                            2018-11-10
                        </Typography>
                        <Typography variant="subheading" align="center" color="textSecondary">
                            Copyright Olle Eriksson
                        </Typography>
                    </Grid>
                </Grid>
            </footer>
        </div>;
    }
}

export default withStyles(styles)(Layout);
