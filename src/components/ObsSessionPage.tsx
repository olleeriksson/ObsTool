import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import "./ObsSessionPage.css";
import { IObsSession, IObservation } from "../types/Types";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import ObservationList from "./ObservationList";
import ObsSessionForm from "./ObsSessionForm";
import SwipeableViews from "react-swipeable-views";
import CircularProgress from "@material-ui/core/CircularProgress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Redirect } from "react-router-dom";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import IconButton from "@material-ui/core/IconButton";
import DeleteDialog from "./DeleteDialog";
import Snackbar from "@material-ui/core/Snackbar";
import MySnackbar from "./MySnackbar";
import Api from "../api/Api";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import { IAppState, IDataState } from "../types/Types";
import * as obsSessionActions from "../actions/ObsSessionActions";
import * as locationActions from "../actions/LocationActions";
import * as utils from "../utils";

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
    actions: any;
    store: IDataState;
}

interface IObsSessionPageState {
    isLoading: boolean;
    isError: boolean;
    errorMsg?: string;
    redirectToListView: boolean;
    redirectToSingleSessionPage: boolean;
    menuAnchorEl: any;
    isDeleteDialogOpen: boolean;
    activeTab: number;
    obsSession: IObsSession;
}

class ObsSessionPage extends React.Component<IObsSessionPageProps, IObsSessionPageState> {
    constructor(props: IObsSessionPageProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            errorMsg: undefined,
            redirectToListView: false,
            redirectToSingleSessionPage: false,
            menuAnchorEl: null,
            isDeleteDialogOpen: false,
            activeTab: 0,
            obsSession: {
                date: new Date().toISOString().slice(0, 10),
            },
        };

        this.onSelectObsSession = this.onSelectObsSession.bind(this);
        this.onSelectObservation = this.onSelectObservation.bind(this);
        this.onSaveObsSession = this.onSaveObsSession.bind(this);
        this.deleteObsSession = this.deleteObsSession.bind(this);
    }

    public componentDidMount() {
        this.loadLocations();
        if (this.props.obsSessionId) {
            this.loadObsSession(this.props.obsSessionId);
        }
    }

    public componentWillReceiveProps(nextProps: IObsSessionPageProps) {
        // TODO: Maybe listen to changes here.
        //
        if (nextProps.obsSessionId && nextProps.obsSessionId !== this.props.obsSessionId) {
            // New/different obsSessionId from the store -> load the full obssession from the API
            this.loadObsSession(nextProps.obsSessionId);
            return;
        }
    }

    private loadLocations = () => {
        if (!this.props.store.locations) {
            this.props.actions.getLocationsBegin();
            Api.getLocations().then(
                (response) => {
                    this.props.actions.getLocationsSuccess(response.data);
                },
                () => {
                    this.indicateError();
                }
            );
        }
    }

    private loadObsSession = (obsSessionId: number) => {
        this.setState({ isLoading: true });
        Api.getFullObsSession(obsSessionId).then(
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
            Api.addObsSession(newObsSession).then(
                (response) => {
                    const { data } = response;
                    const obsSession = data;
                    this.handleSuccessDataFromApi(obsSession);
                    this.props.actions.addObsSessionSuccess(obsSession);
                    this.setState({ redirectToSingleSessionPage: true });
                },
                () => this.indicateError()
            );
        } else {
            Api.updateObsSession(newObsSession).then(
                (response) => {
                    const { data } = response;
                    const obsSession = data;
                    this.handleSuccessDataFromApi(obsSession);
                    this.props.actions.updateObsSessionSuccess(obsSession);
                },
                (response) => {
                    // The following could use a rewrite!
                    const { data } = response.response;
                    if (data.Message) {
                        this.indicateError(data.Message);
                    } else {
                        this.indicateError();
                    }
                }
            );
        }
    }

    private deleteObsSession() {
        if (this.state.obsSession.id) {
            Api.deleteObsSession(this.state.obsSession.id).then(
                (response) => {
                    this.props.actions.deleteObsSessionSuccess(this.state.obsSession.id);
                },
                () => this.indicateError()
            );
        }
    }

    private handleSuccessDataFromApi = (obsSession: IObsSession) => {
        // Update the "shadow" field locationId according to the location.id field.
        obsSession.locationId = obsSession.location ? obsSession.location.id : undefined;

        this.setState({ obsSession: obsSession });
        this.setState({ isLoading: false });
        this.setState({ isError: false });
        this.setState({ errorMsg: undefined });
    }

    private indicateError = (errorMsg?: string) => {
        this.setState({ isLoading: false });
        this.setState({ isError: true });
        this.setState({ errorMsg: errorMsg });
    }

    private clearError = () => {
        this.setState({ isError: false });
        this.setState({ errorMsg: undefined });
    }

    public onSelectObsSession = (obsSessionId: number) => {
    }

    public onSelectObservation(observationId: number) {
        console.log("Clicked on observation with id " + observationId);
    }

    private handleChange = (event: any, value: number) => {
        this.setState({ activeTab: value });
    }

    private handleChangeIndex = (index: number) => {
        this.setState({ activeTab: index });
    }

    private handleOpenMenu = (event: any) => {
        this.setState({ menuAnchorEl: event.currentTarget });
    }

    private handleCloseMenu = () => {
        this.setState({ menuAnchorEl: null });
    }

    private handleMenuClickDeleteObsSession = () => {
        this.setState({ menuAnchorEl: null });
        this.setState({ isDeleteDialogOpen: true });
    }

    private handleDeleteDialogClosed = (confirm: boolean) => {
        this.setState({ isDeleteDialogOpen: false });
        if (confirm) {
            this.deleteObsSession();
        }
    }

    public render() {
        const { classes } = this.props;

        // Redirects
        // ----------------------------------------
        if (this.state.redirectToSingleSessionPage) {
            const url = "/session/" + this.state.obsSession.id;
            return <Redirect to={url} />;
        } else if (this.state.redirectToListView) {
            return <Redirect to={"/sessions"} />;
        }

        const snackbar = <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            open={this.state.isError}
            autoHideDuration={1000}
        >
            <MySnackbar
                variant="error"
                message={this.state.errorMsg || "Something went wrong!"}
                onClose={this.clearError}
            />
        </Snackbar>;

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

        let menu;
        if (this.state.obsSession.id) {
            menu = (
                <div>
                    <IconButton onClick={this.handleOpenMenu} >
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        id="simple-menu"
                        anchorEl={this.state.menuAnchorEl}
                        open={Boolean(this.state.menuAnchorEl)}
                        onClose={this.handleCloseMenu}
                    >
                        <MenuItem onClick={this.handleMenuClickDeleteObsSession}>Delete session</MenuItem>
                    </Menu>
                </div>
            );
        }

        const numDsoObjects = this.state.obsSession.observations
            && utils.flatMap(this.state.obsSession.observations, (obs: IObservation) => obs.dsoObservations);

        const listTabLabel = "Observed Objects (" + (numDsoObjects && numDsoObjects.length || 0) + ")";

        const deleteDialogTitle = "Delete " + (this.state.obsSession && this.state.obsSession.title) + "?";
        const deleteDialogText = "Are you sure you want to delete the observation session titled " +
            (this.state.obsSession && this.state.obsSession.title) + "?";

        const numChecked = this.props.store.checkedObsResources.length;

        return (
            <div className="circularProgressSuperContainer">
                <div>{numChecked} checked resources.</div>
                {snackbar}
                {circularProgress}
                <DeleteDialog isOpen={this.state.isDeleteDialogOpen} title={deleteDialogTitle} text={deleteDialogText} onHandleClose={this.handleDeleteDialogClosed} />
                <div className={classes.root} >
                    <div className={classes.header}>
                        <Grid container={true} direction="row">
                            <Grid item={true} xs={1}>
                                <Typography />
                            </Grid>
                            <Grid item={true} xs={10}>
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
                            </Grid>
                            <Grid item={true} xs={1}>
                                {menu}
                            </Grid>
                        </Grid>
                    </div>
                    <Tabs
                        value={this.state.activeTab}
                        onChange={this.handleChange}
                        indicatorColor="primary"
                        textColor="primary"
                        fullWidth={true}
                        centered={true}
                    >
                        <Tab label="Observation Form" />
                        <Tab label={listTabLabel} />
                    </Tabs>
                    <SwipeableViews
                        axis={"x"}
                        index={this.state.activeTab}
                        onChangeIndex={this.handleChangeIndex}
                    >
                        <ObsSessionForm obsSession={this.state.obsSession} locations={this.props.store.locations || []} onSaveObsSession={this.onSaveObsSession} />
                        <ObservationList observations={observations} onSelectObservation={this.onSelectObservation} />
                    </SwipeableViews>
                </div>
            </div >
        );
    }
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

const mapDispatchToProps = (dispatch: Dispatch<obsSessionActions.ObsSessionAction | locationActions.LocationAction>) => {
    return {
        actions: bindActionCreators(
            { ...obsSessionActions, ...locationActions },
            dispatch
        )
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ObsSessionPage));
