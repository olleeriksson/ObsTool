import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import StatisticsTable from "./StatisticsTable";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import logo from "../assets/images/obstool-logo-200px.png";
import "./Layout.css";
import { Link } from "react-router-dom";
import SearchInput from "./SearchInput";
import AladinFrame from "./AladinLiteFrame";

const styles = (theme: Theme) => createStyles({
    header: {
        maxWidth: 800,
        margin: "0 auto",
        verticalAlign: "center",
        padding: `${theme.spacing(7)} 0 ${theme.spacing(6)}`,
    },
    cardGridItem: {
        maxWidth: 400,
    },
    cardContent: {
    },
    cardActions: {
        [theme.breakpoints.up("sm")]: {
            paddingBottom: theme.spacing(2),
        },
    },
    homeTitle: {
        fontFamily: "\"Montserrat\", \"Segoe UI\", Arial, sans-serif",
        fontSize: "2rem",
        fontWeight: "bold",
        lineHeight: 1.1,
    },
});

const LinkToSessions = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/sessions" ref={ref} {...props} />);
const LinkToNewSession = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/newsession" ref={ref} {...props} />);
const LinkToObservedObjects = React.forwardRef<HTMLAnchorElement, any>((props, ref) => <Link to="/observations" ref={ref} {...props} />);

export interface IHomeProps extends WithStyles<typeof styles> {
    children?: React.ReactNode;
}

class Home extends React.Component<IHomeProps> {
    constructor(props: IHomeProps) {
        super(props);
    }

    public render() {
        const { classes } = this.props;

        return <div>
            {/* Header */}
            <Grid container justifyContent="center">
                <Grid size={{ md: 12 }}>
                    <div className={classes.header}>
                        <Typography align="center" gutterBottom={true}>
                            <img src={logo} className="App-logo" alt="logo" />
                        </Typography>
                        <Typography variant="inherit" component="h1" align="center" color="textPrimary" gutterBottom={true} className={classes.homeTitle}>
                            ObsTool
                        </Typography>
                        <Typography variant="h6" align="center" color="textSecondary" component="p">
                            A tool for recording and keeping track of deepsky observations
                        </Typography>
                    </div>
                </Grid>
            </Grid>
            <Grid container alignItems="flex-start" justifyContent="center">
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <div style={{ height: 70 }}>
                        <SearchInput />
                    </div>
                </Grid>
            </Grid>
            {/* First/second row */}
            <Grid container spacing={5} justifyContent="center">
                <Grid size="auto" className={classes.cardGridItem}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="h6" color="textSecondary" align="center">
                                <FontAwesomeIcon icon="table" className="faSpaceAfter" /> Observations
                            </Typography>
                            <Typography variant="subtitle1" align="center">
                                View all recorded observations
                            </Typography>
                        </CardContent>
                        <CardActions className={classes.cardActions}>
                            <Button fullWidth={true} variant="outlined" color="primary" component={LinkToObservedObjects}>
                                Observations
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
                <Grid size="auto" className={classes.cardGridItem}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="h6" color="textSecondary" align="center">
                                <FontAwesomeIcon icon="table" className="faSpaceAfter" /> List sessions
                            </Typography>
                            <Typography variant="subtitle1" align="center">
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
                <Grid size="auto" className={classes.cardGridItem}>
                    <Card>
                        <CardContent className={classes.cardContent}>
                            <Typography variant="h6" color="textSecondary" align="center">
                                <FontAwesomeIcon icon="plus" className="faSpaceAfter" /> New session
                            </Typography>
                            <Typography variant="subtitle1" align="center">
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
            </Grid>
            {/* Second/third row */}
            <Grid container alignItems="flex-start" justifyContent="center">
                <Grid size={{ xs: 12, md: 8 }}>
                    <StatisticsTable />
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(Home);
