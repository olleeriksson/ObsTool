import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatisticsTable from "./StatisticsTable";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import logo from "./../obstool-logo.png";
import "./Layout.css";
import { Link } from "react-router-dom";
import Search from "./Search";

const styles = (theme: Theme) => createStyles({
    header: {
        maxWidth: 600,
        margin: "0 auto",
        verticalAlign: "center",
        padding: `${theme.spacing.unit * 8}px 0 ${theme.spacing.unit * 6}px`,
    },
    cardGridItem: {
        maxWidth: 300,
    },
    cardContent: {
    },
    cardActions: {
        [theme.breakpoints.up("sm")]: {
            paddingBottom: theme.spacing.unit * 2,
        },
    },
});

export interface IHomeProps extends WithStyles<typeof styles> {
    children?: React.ReactNode;
}

class Home extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
    }

    public render() {
        const { classes } = this.props;

        const LinkToSessions = (props: any) => <Link to="/sessions" {...props} />;
        const LinkToNewSession = (props: any) => <Link to="/newsession" {...props} />;
        const LinkToSearch = (props: any) => <Link to="/search" {...props} />;

        return <div>
            {/* Header */}
            <Grid container={true} justify="center">
                <Grid item={true} md={12}>
                    <div className={classes.header}>
                        <Typography align="center" gutterBottom={true}>
                            <img src={logo} className="App-logo" alt="logo" />
                        </Typography>
                        <Typography variant="display1" align="center" color="textPrimary" gutterBottom={true}>
                            ObsTool
                        </Typography>
                        <Typography variant="title" align="center" color="textSecondary" component="p">
                            A tool for recording and keeping track of deepsky observations.
                        </Typography>
                    </div>
                </Grid>
            </Grid>
            <Grid container={true} alignItems="flex-start" justify="center">
                <Grid item={true} xs={12} sm={6} md={3}>
                    <div style={{ height: 70 }}>
                        <Search />
                    </div>
                </Grid>
            </Grid>
            {/* First/second row */}
            <Grid container={true} spacing={40} justify="center">
                <Grid item={true} xs={12} className={classes.cardGridItem}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="title" color="textSecondary" align="center">
                                <FontAwesomeIcon icon="table" className="faSpaceAfter" /> List sessions
                            </Typography>
                            <Typography variant="subheading" align="center">
                                List observation sessions
                            </Typography>
                        </CardContent>
                        <CardActions className={classes.cardActions}>
                            <Button fullWidth={true} variant="outlined" color="primary" component={LinkToSessions}>
                                List sessions
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item={true} xs={12} className={classes.cardGridItem}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="title" color="textSecondary" align="center">
                                <FontAwesomeIcon icon="plus" className="faSpaceAfter" /> New session
                            </Typography>
                            <Typography variant="subheading" align="center">
                                Add a new observation session
                            </Typography>
                        </CardContent>
                        <CardActions className={classes.cardActions}>
                            <Button fullWidth={true} variant="outlined" color="primary" component={LinkToNewSession}>
                                New session
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid item={true} xs={12} className={classes.cardGridItem}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="title" color="textSecondary" align="center">
                                <FontAwesomeIcon icon="search" className="faSpaceAfter" /> Search observations
                            </Typography>
                            <Typography variant="subheading" align="center">
                                Search existing observations or deepsky objects
                            </Typography>
                        </CardContent>
                        <CardActions className={classes.cardActions}>
                            <Button fullWidth={true} variant="outlined" color="primary" component={LinkToSearch}>
                                Search
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
            {/* Second/third row */}
            <Grid container={true} alignItems="flex-start" justify="center">
                <Grid item={true} xs={12} sm={6} md={4}>
                    <StatisticsTable />
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(Home);
