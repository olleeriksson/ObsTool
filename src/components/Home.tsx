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

const styles = (theme: Theme) => createStyles({
    layout: {
        width: "auto",
        marginLeft: theme.spacing.unit * 3,
        marginRight: theme.spacing.unit * 3,
        [theme.breakpoints.up(900 + theme.spacing.unit * 3 * 2)]: {
            width: 900,
            marginLeft: "auto",
            marginRight: "auto",
        },
    },
    header: {
        maxWidth: 600,
        margin: "0 auto",
        verticalAlign: "center",
        padding: `${theme.spacing.unit * 8}px 0 ${theme.spacing.unit * 6}px`,
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
            <div className={classes.header} style={{}}>
                <img src={logo} className="App-logo" alt="logo" />
                <Typography variant="display1" align="center" color="textPrimary" gutterBottom={true}>
                    ObsTool
                </Typography>
                <Typography variant="title" align="center" color="textSecondary" component="p">
                    A tool for recording and keeping track of deepsky observations.
                </Typography>
            </div>
            {/* First row */}
            <Grid container={true} spacing={40} alignItems="flex-start">
                <Grid item={true} xs={12} sm={12} md={4}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="title" color="textSecondary">
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
                <Grid item={true} xs={12} sm={12} md={4}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="title" color="textSecondary">
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
                <Grid item={true} xs={12} sm={12} md={4}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="title" color="textSecondary">
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
            {/* Second row */}
            <Grid container={true} spacing={40} alignItems="flex-start" justify="center">
                <Grid item={true} xs={12} sm={12} md={6}>
                    <StatisticsTable />
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(Home);
