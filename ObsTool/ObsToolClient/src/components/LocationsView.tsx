import * as React from "react";
import { withStyles, createStyles } from "src/muiCompat";
import type { Theme } from "@mui/material/styles";
import type { WithStyles } from "src/muiCompat";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Api from "../api/Api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ILocation, IAppState, IDataState } from "src/types/Types";
import classNames from "classnames";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { connect } from "react-redux";
import DeleteDialog from "./DeleteDialog";

const styles = (theme: Theme) => createStyles({
    root: {
    },
    textfieldPaper: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
    },
    textfield: {
        margin: theme.spacing(1),
        width: "95%"
    },
    textfieldNarrow: {
        margin: theme.spacing(1),
        width: "50%"
    },
    form: {
        display: "flex",
        flexWrap: "wrap",
    },
    formControl: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: "95%",
    },
    textField: {
    },
    rowField: {
        width: "100%"
    },
    actionRow: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        marginTop: theme.spacing(1),
    },
});

interface ILocationsViewProps extends WithStyles<typeof styles> {
    store: IDataState;
}

interface ILocationsViewState {
    isLoading: boolean;
    isError: boolean;
    errorMessage?: string;
    isConfirmDeleteOpen: boolean;
    locations: ILocation[];
    currentLocation: ILocation;
}

class LocationsView extends React.Component<ILocationsViewProps, ILocationsViewState> {
    constructor(props: ILocationsViewProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            isConfirmDeleteOpen: false,
            locations: [],
            currentLocation: this.getEmptyLocation()
        };
    }

    // Creates the blank editable location used for the add form and after clearing selection.
    private getEmptyLocation = () => {
        return {
            id: undefined,
            name: "",
            longitude: "",
            latitude: "",
            googleMapsAddress: "",
            numReferences: 0
        };
    }

    public componentDidMount() {
        this.loadLocationsFromApi();
    }

    private loadLocationsFromApi() {
        this.setState({ currentLocation: this.getEmptyLocation() });
        this.setState({ isLoading: true, errorMessage: undefined });
        Api.getLocations().then(
            (response) => {
                const locations: ILocation[] = response.data;
                this.setState({ locations: locations });
                this.setState({ isLoading: false });
                this.setState({ isError: false });
            }).catch(
                (error) => {
                    this.setState({ isLoading: false });
                    this.setState({ isError: true });
                    this.setState({ errorMessage: this.getApiErrorMessage(error, "Error loading locations!") });
                }
            );
    }

    // Updates one field on the currently selected location without mutating the previous state object.
    private handleFormChange = (name: string) => (event: any) => {
        const newValue = event.target.value;
        this.setState((prevState, props) => ({
            currentLocation: {
                ...prevState.currentLocation,
                [name]: newValue
            }
        }));
    }

    private handleClickResource = (locationId?: number) => (event: any) => {
        event.preventDefault();
        if (this.state.locations) {
            const clickedLocation = this.state.locations.find(r => r.id === locationId);
            if (clickedLocation) {
                this.setState({ currentLocation: { ...clickedLocation }, isError: false, errorMessage: undefined });
            }
        }
    }

    // Clears the form back to add mode while keeping the loaded location list intact.
    private onClear = () => {
        this.setState({
            currentLocation: this.getEmptyLocation(),
            isError: false,
            errorMessage: undefined
        });
    }

    // Saves either a new or existing location through the matching API endpoint.
    private handleSubmit = (e: any) => {
        e.preventDefault();
        this.setState({ isLoading: true });
        this.setState({ isError: false, errorMessage: undefined });
        if (this.state.currentLocation.id) {
            Api.updateLocation(this.state.currentLocation).then(
                (response) => {
                    this.loadLocationsFromApi();
                }).catch(
                    (error) => {
                        this.setState({ isLoading: false });
                        this.setState({ isError: true });
                        this.setState({ errorMessage: this.getApiErrorMessage(error, "Error saving!") });
                    }
                );
        } else {
            Api.addLocation(this.state.currentLocation).then(
                (response) => {
                    this.loadLocationsFromApi();
                }).catch(
                    (error) => {
                        this.setState({ isLoading: false });
                        this.setState({ isError: true });
                        this.setState({ errorMessage: this.getApiErrorMessage(error, "Error saving!") });
                    }
                );
        }
    }

    // Opens the shared delete confirmation only for selected, unreferenced locations.
    private onClickDelete = () => {
        if (this.state.currentLocation.id && !this.hasCurrentLocationReferences()) {
            this.setState({ isConfirmDeleteOpen: true });
        }
    }

    // Closes the confirmation dialog and deletes only after the shared dialog reports a confirmed action.
    private handleConfirmDeleteDialogClosed = (confirm: boolean) => {
        this.setState({ isConfirmDeleteOpen: false });
        if (!confirm || !this.state.currentLocation.id) {
            return;
        }

        this.setState({ isLoading: true, isError: false, errorMessage: undefined });
        Api.deleteLocation(this.state.currentLocation.id).then(
            (response) => {
                this.loadLocationsFromApi();
            }).catch(
                (error) => {
                    this.setState({
                        isLoading: false,
                        isError: true,
                        errorMessage: this.getApiErrorMessage(error, "Error deleting location!")
                    });
                }
            );
    }

    // Treats any positive session-reference count as a delete blocker.
    private hasCurrentLocationReferences = () => {
        return (this.state.currentLocation.numReferences || 0) > 0;
    }

    // Extracts a readable backend error when the API sends one, falling back to the caller's generic message.
    private getApiErrorMessage = (error: any, fallbackMessage: string) => {
        if (typeof error?.response?.data === "string" && error.response.data) {
            return error.response.data;
        }

        return fallbackMessage;
    }

    public render() {
        const { classes } = this.props;
        const currentLocationReferenceCount = this.state.currentLocation.numReferences || 0;
        const deleteDisabled = !this.props.store.isLoggedIn || !this.state.currentLocation.id || this.hasCurrentLocationReferences();
        const deleteTooltip = this.hasCurrentLocationReferences()
            ? "Locations used by observation sessions cannot be deleted"
            : "Delete";

        let circularProgress;
        if (this.state.isLoading) {
            circularProgress = (
                <CircularProgress className="circularProgress" style={{ marginLeft: 20 }} />
            );
        }

        const locationForm = (
            <div className="">
                <form onSubmit={this.handleSubmit} className={classes.form} noValidate={true} autoComplete="off">
                    <Grid container direction="column" size="grow">
                        <Grid sx={{ px: 1 }}>
                            <TextField
                                id="name"
                                label="Name"
                                value={this.state.currentLocation.name || ""}
                                onChange={this.handleFormChange("name")}
                                className={classes.rowField}
                                margin="dense"
                                size="small"
                            />
                        </Grid>
                        <Grid container spacing={2} sx={{ px: 1 }}>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    id="longitude"
                                    label="Longitude"
                                    type="string"
                                    value={this.state.currentLocation.longitude}
                                    onChange={this.handleFormChange("longitude")}
                                    className={classes.rowField}
                                    margin="dense"
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 3 }}>
                                <TextField
                                    id="latitude"
                                    label="Latitude"
                                    type="string"
                                    value={this.state.currentLocation.latitude}
                                    onChange={this.handleFormChange("latitude")}
                                    className={classes.rowField}
                                    margin="dense"
                                    size="small"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <TextField
                                    id="googelMapsAddress"
                                    label="Google Maps address"
                                    value={this.state.currentLocation.googleMapsAddress || ""}
                                    onChange={this.handleFormChange("googleMapsAddress")}
                                    className={classes.rowField}
                                    margin="dense"
                                    size="small"
                                />
                            </Grid>
                        </Grid>
                        <Grid className={classes.actionRow}>
                            <Grid container direction="row">
                                <Grid>
                                    <Button variant="contained" color="primary" type="submit" disabled={!this.props.store.isLoggedIn}>
                                        {this.state.currentLocation.id ? "Update" : "Save"}
                                    </Button>
                                    <Button color="primary" onClick={this.onClear}>
                                        Clear
                                    </Button>
                                    {circularProgress}
                                    {this.state.isError ? <span style={{ color: "red", fontWeight: "bold" }}>{this.state.errorMessage || "Error saving!"}</span> : null}
                                </Grid>
                                <Grid size="grow" style={{ textAlign: "right" }}>
                                    <Tooltip title={deleteTooltip}>
                                        <span>
                                            <IconButton onClick={this.onClickDelete} disabled={deleteDisabled} >
                                                <DeleteIcon />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Grid>
                            </Grid>

                        </Grid>
                        {this.state.currentLocation.id ? (
                            <Grid sx={{ px: 1, pt: 1 }}>
                                <Typography variant="caption" color="textSecondary">
                                    Referenced by {currentLocationReferenceCount} observation session{currentLocationReferenceCount === 1 ? "" : "s"}.
                                </Typography>
                            </Grid>
                        ) : null}
                    </Grid>
                </form>
            </div>
        );

        const locations = this.state.locations.map(location => (
            <Grid key={location.id} size={12}>
                <Typography variant="subtitle1" gutterBottom={true}>
                    {location.name}
                    <a href="" onClick={this.handleClickResource(location.id)}>
                        <EditIcon style={{ fontSize: 16, marginLeft: "1em" }} />
                    </a>
                </Typography>
                <Typography variant="caption" gutterBottom={true}>
                    Longitude: <strong>{location.longitude || "N/A"}</strong>,
                    Latitude: <strong>{location.latitude || "N/A"}</strong>,
                    Obs sessions: <strong>{location.numReferences || 0}</strong>
                </Typography>
            </Grid>
        ));
        const deleteDialog = (
            <DeleteDialog
                isOpen={this.state.isConfirmDeleteOpen}
                title={this.state.currentLocation.name ? `Delete location ${this.state.currentLocation.name}?` : "Delete location?"}
                text={this.state.currentLocation.name
                    ? `Are you sure you want to delete this location? ${this.state.currentLocation.name} will be removed.`
                    : "Are you sure you want to delete this location?"}
                onHandleClose={this.handleConfirmDeleteDialogClosed}
            />
        );

        return <div className={classes.root}>
            <Typography variant="h6" align="center" color="textPrimary" component="p" style={{ marginTop: 20 }}>
                <FontAwesomeIcon icon="map-marked" className="faSpaceAfter" size="lg" /> Locations
            </Typography>
            <Grid container spacing={5} justifyContent="center" direction="row">
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        {locationForm}
                    </Paper>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        <Grid container spacing={3} direction="column">
                            {locations}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
            {deleteDialog}
        </div>;
    }
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

//export default withStyles(styles)(LocationsView);
export default connect(mapStateToProps)(withStyles(styles)(LocationsView));
