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
}

interface IObsSessionPageState {
    isLoading: boolean;
    isError: boolean;
    activeView: number;
    obsSession?: IObsSession;
    locations?: ILocation[];
}

class ObsSessionPage extends React.Component<IObsSessionPageProps, IObsSessionPageState> {
    constructor(props: IObsSessionPageProps) {
        super(props);

        this.state = {
            isLoading: true,
            isError: false,
            activeView: 0,
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
        if (nextProps.obsSessionId && this.props.obsSessionId !== nextProps.obsSessionId) {
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
                console.log(data);

                // Update the "shadow" field locationId according to the location.id field.
                data.locationId = data.location ? data.location.id : undefined;

                this.setState({ obsSession: data });
                this.setState({ isLoading: false });
                this.setState({ isError: false });
            },
            () => {
                this.setState({ isLoading: false });
                this.setState({ isError: true });
            }
        );
    }

    public onSelectObsSession = (obsSessionId: number) => {
    }

    public onSelectObservation(observationId: number) {
        console.log("Clicked on observation with id " + observationId);
    }

    public onSaveObsSession(newObsSession: IObsSession) {
        console.log("Wanted to save observation with new title " + newObsSession.title);

        // Convert the "shadow" field locationId back to a number. The API expects a number,
        // but the SelectComponent requires a string backing field.
        newObsSession.locationId = newObsSession.locationId ? Number(newObsSession.locationId) : undefined;

        console.log("Saving");
        console.log(newObsSession);

        axios.put<IObsSession>(
            "http://localhost:50995/api/obsSessions/" + this.props.obsSessionId,
            newObsSession).then(
                (response) => {
                    const { data } = response;

                    // Update the "shadow" field locationId according to the location.id field.
                    data.locationId = data.location ? data.location.id : undefined;

                    console.log("Saved:");
                    console.log(data);
                    this.setState({ obsSession: data });
                    this.setState({ isLoading: false });
                    this.setState({ isError: false });
                },
                () => {
                    this.setState({ isLoading: false });
                    this.setState({ isError: true });
                }
            );
    }

    private handleChange = (event: any, value: number) => {
        this.setState({ activeView: value });
    }

    private handleChangeIndex = (index: number) => {
        this.setState({ activeView: index });
    }

    public render() {
        const { classes } = this.props;

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

        if (this.state.isLoading) {
            return (
                <div>
                    <CircularProgress />
                </div>
            );
        } else if (this.state.obsSession) {
            return (
                <div className={classes.root}>
                    <div className={classes.header}>
                        <Grid container={true} direction="row" justify="center">
                            <Grid item={true}>
                                <Typography gutterBottom={true} variant="display1">
                                    <FontAwesomeIcon icon={["far", "calendar-alt"]} className="faSpaceAfter" />
                                </Typography>
                            </Grid>
                            <Grid item={true}>
                                <Typography variant="title" align="center">
                                    {this.state.obsSession.title}
                                </Typography>
                                <Typography variant="subheading" align="center">
                                    {this.state.obsSession.date}
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
            );
        } else {
            return;
        }
    }
}

export default withStyles(styles)(ObsSessionPage);
