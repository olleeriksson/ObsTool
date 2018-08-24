import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import "./ObsSessionPage.css";
import axios from "axios";
import { IObsSession, IObservation, ILocation } from "./Types";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import ObservationList from "./ObservationList";
import ObsSessionForm from "./ObsSessionForm";
import SwipeableViews from "react-swipeable-views";
import CircularProgress from "@material-ui/core/CircularProgress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Redirect } from "react-router-dom";
// import Snackbar from "@material-ui/core/Snackbar";
// import MySnackbar from "./MySnackbar";

const styles = (theme: Theme) => createStyles({
    root: {
        backgroundColor: theme.palette.background.paper,
    },
    header: {
        padding: theme.spacing.unit * 2,
    }
});

interface IObsSessionPageProps extends WithStyles<typeof styles> {
    obsSessionId?: number;
    onUpdatedObsSession: (obsSession: IObsSession) => void;
}

interface IObsSessionPageState {
    isLoading: boolean;
    isError: boolean;
    redirect: boolean;
    activeView: number;
    obsSessionId?: number;
    obsSession?: IObsSession;
    locations?: ILocation[];
}

class ObsSessionPage extends React.Component<IObsSessionPageProps, IObsSessionPageState> {
    constructor(props: IObsSessionPageProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            redirect: false,
            activeView: 0,
            obsSessionId: this.props.obsSessionId,
            obsSession: undefined,
            locations: undefined,
        };

        this.onSelectObsSession = this.onSelectObsSession.bind(this);
        this.onSelectObservation = this.onSelectObservation.bind(this);
        this.onSaveObsSession = this.onSaveObsSession.bind(this);
    }

    public componentDidMount() {
        this.loadLocations();

        if (this.props.obsSessionId) {
            this.setState({ isLoading: true });
            this.loadObsSession(this.props.obsSessionId);
        }
    }

    public componentWillReceiveProps(nextProps: IObsSessionPageProps) {
        if (nextProps.obsSessionId && this.state.obsSessionId !== nextProps.obsSessionId) {
            this.setState({ isLoading: true });
            this.loadObsSession(nextProps.obsSessionId);
        }
    }

    private loadLocations = () => {
        axios.get<ILocation[]>("http://localhost:50995/api/locations").then(
            (response) => {
                const { data } = response;
                console.log(data);
                this.setState({ locations: data });
                this.setState({ isError: false });
            },
            () => {
                this.setState({ isError: true });
            }
        );
    }

    private loadObsSession = (obsSessionId: number) => {
        axios.get<IObsSession>("http://localhost:50995/api/obsSessions/" + obsSessionId + "?includeLocation=true&includeObservations=true&includeDso=true").then(
            (response) => {
                const { data } = response;
                const obsSession = data;
                this.handleSuccessDataFromApi(obsSession);
            },
            () => this.indicateError()
        );
    }

    public onSaveObsSession(newObsSession: IObsSession) {
        this.setState({ isLoading: true });

        // Convert the "shadow" field locationId back to a number. The API expects a number,
        // but the SelectComponent requires a string backing field.
        newObsSession.locationId = newObsSession.locationId ? Number(newObsSession.locationId) : undefined;

        if (!newObsSession.id) {
            axios.post<IObsSession>(
                "http://localhost:50995/api/obsSessions/",
                newObsSession).then(
                    (response) => {
                        const { data } = response;
                        const obsSession = data;
                        this.handleSuccessDataFromApi(obsSession);
                        this.props.onUpdatedObsSession(obsSession);
                        this.setState({ redirect: true });
                    },
                    () => this.indicateError()
                );
        } else {
            axios.put<IObsSession>(
                "http://localhost:50995/api/obsSessions/" + this.state.obsSessionId,
                newObsSession).then(
                    (response) => {
                        const { data } = response;
                        const obsSession = data;
                        this.handleSuccessDataFromApi(obsSession);
                        this.props.onUpdatedObsSession(obsSession);
                    },
                    () => this.indicateError()
                );
        }
    }

    private handleSuccessDataFromApi = (obsSession: IObsSession) => {
        // Update the "shadow" field locationId according to the location.id field.
        obsSession.locationId = obsSession.location ? obsSession.location.id : undefined;

        this.setState({ obsSessionId: obsSession.id });
        this.setState({ obsSession: obsSession });
        this.setState({ isLoading: false });
        this.setState({ isError: false });

    }

    private indicateError = () => {
        this.setState({ isLoading: false });
        this.setState({ isError: true });
    }

    public onSelectObsSession = (obsSessionId: number) => {
    }

    public onSelectObservation(observationId: number) {
        console.log("Clicked on observation with id " + observationId);
    }

    private handleChange = (event: any, value: number) => {
        this.setState({ activeView: value });
    }

    private handleChangeIndex = (index: number) => {
        this.setState({ activeView: index });
    }

    public render() {
        const { classes } = this.props;

        if (this.state.redirect) {
            console.log(this.state.redirect);
            const url = "/session/" + this.state.obsSessionId;
            return <Redirect to={url} />;
        }

        // const snackbar = <Snackbar
        //     anchorOrigin={{ vertical: "top", horizontal: "center" }}
        //     open={this.state.isError}
        //     autoHideDuration={1000}
        // >
        //     <MySnackbar
        //         variant="error"
        //         message="Something went wrong!"
        //     />
        // </Snackbar>;

        let observations: IObservation[] = [];
        if (this.state.obsSession && this.state.obsSession.observations) {
            observations = this.state.obsSession.observations;
        }

        let circularProgress;
        if (this.state.isLoading) {
            circularProgress = (
                <div className="circularProgressContainer">
                    <CircularProgress className="circularProgress" />
                </div>
            );
        }

        return (
            <div className="circularProgressSuperContainer">
                {circularProgress}
                <div className={classes.root} >
                    <div className={classes.header}>
                        <Grid container={true} direction="row" justify="center">
                            <Grid item={true}>
                                <Typography gutterBottom={true} variant="display1">
                                    <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" />
                                </Typography>
                            </Grid>
                            <Grid item={true}>
                                <Typography variant="title" align="center">
                                    {this.state.obsSession ? this.state.obsSession.title : "New observation session"}
                                </Typography>
                                <Typography variant="subheading" align="center">
                                    {this.state.obsSession ? this.state.obsSession.date : ""}
                                </Typography>
                            </Grid>
                        </Grid>
                    </div>
                    <Tabs
                        value={this.state.activeView}
                        onChange={this.handleChange}
                        indicatorColor="primary"
                        textColor="primary"
                        fullWidth={true}
                        centered={true}
                    >
                        <Tab label="Session data" />
                        <Tab label="View observed objects" />
                    </Tabs>
                    <SwipeableViews
                        axis={"x"}
                        index={this.state.activeView}
                        onChangeIndex={this.handleChangeIndex}
                    >
                        <ObsSessionForm obsSession={this.state.obsSession} locations={this.state.locations} onSaveObsSession={this.onSaveObsSession} />
                        <ObservationList observations={observations} onSelectObservation={this.onSelectObservation} />
                    </SwipeableViews>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(ObsSessionPage);
