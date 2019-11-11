import * as React from "react";
import { withStyles } from "@material-ui/core/styles";
import { WithStyles, createStyles, TextField, CircularProgress, Button, IconButton } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles/createMuiTheme";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Api from "../api/Api";
import { ILocation } from "src/types/Types";
import * as classNames from "classnames";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";

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
    }
});

interface ILocationsViewProps extends WithStyles<typeof styles> {
}

interface ILocationsViewState {
    isLoading: boolean;
    isError: boolean;
    locations: ILocation[];
    currentLocation: ILocation;
}

class LocationsView extends React.Component<ILocationsViewProps, ILocationsViewState> {
    constructor(props: ILocationsViewProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            locations: [],
            currentLocation: this.getEmptyLocation()
        };
    }

    private getEmptyLocation = () => {
        return {
            id: undefined,
            name: "",
            longitude: "",
            latitude: "",
            googleMapsAddress: ""
        };
    }

    public componentDidMount() {
        this.loadLocationsFromApi();
    }

    private loadLocationsFromApi() {
        this.setState({ currentLocation: this.getEmptyLocation() });
        this.setState({ isLoading: true });
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
                }
            );
    }

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
                this.setState({ currentLocation: clickedLocation });
            }
        }
    }

    private onClear = () => {
        this.setState({
            currentLocation: {
                id: undefined,
                name: "",
                longitude: "",
                latitude: "",
                googleMapsAddress: ""
            },
            isError: false
        });
    }

    private handleSubmit = (e: any) => {
        e.preventDefault();
        this.setState({ isLoading: true });
        this.setState({ isError: false });
        if (this.state.currentLocation.id) {
            Api.updateLocation(this.state.currentLocation).then(
                (response) => {
                    this.loadLocationsFromApi();
                }).catch(
                    (error) => {
                        this.setState({ isLoading: false });
                        this.setState({ isError: true });
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
                    }
                );
        }
    }

    private onClickDelete = () => {
        if (this.state.currentLocation.id) {
            this.setState({ isLoading: true });
            this.setState({ isError: false });
            Api.deleteLocation(this.state.currentLocation.id).then(
                (response) => {
                    this.loadLocationsFromApi();
                }).catch(
                    (error) => {
                        this.setState({ isLoading: false });
                        this.setState({ isError: true });
                    }
                );
        }
    }

    public render() {
        const { classes } = this.props;

        let circularProgress;
        if (this.state.isLoading) {
            circularProgress = (
                <CircularProgress className="circularProgress" style={{ marginLeft: 20 }} />
            );
        }

        const locationForm = (
            <div className="">
                <form onSubmit={this.handleSubmit} className={classes.form} noValidate={true} autoComplete="off">
                    <Grid container={true} direction="column">
                        <Grid item={true} >
                            <TextField
                                id="name"
                                label="Name"
                                value={this.state.currentLocation.name || ""}
                                onChange={this.handleFormChange("name")}
                                className={classNames(classes.formControl, classes.textField)}
                                margin="dense"
                            />
                        </Grid>
                        <Grid item={true}>
                            <TextField
                                id="longitude"
                                label="Longitude"
                                type="string"
                                value={this.state.currentLocation.longitude}
                                onChange={this.handleFormChange("longitude")}
                                className={classNames(classes.formControl, classes.textfieldNarrow)}
                                margin="dense"
                            />
                            <TextField
                                id="latitude"
                                label="Latitude"
                                type="string"
                                value={this.state.currentLocation.latitude}
                                onChange={this.handleFormChange("latitude")}
                                className={classNames(classes.formControl, classes.textfieldNarrow)}
                                margin="dense"
                            />
                        </Grid>
                        <Grid item={true}>
                            <TextField
                                id="googelMapsAddress"
                                label="Google Maps address"
                                multiline={true}
                                rowsMax="10"
                                value={this.state.currentLocation.googleMapsAddress || ""}
                                onChange={this.handleFormChange("googleMapsAddress")}
                                className={classNames(classes.formControl, classes.textField)}
                                margin="dense"
                            />
                        </Grid>
                        <Grid item={true}>
                            <Grid container={true} direction="row">
                                <Grid item={true}>
                                    <Button variant="contained" color="primary" type="submit">
                                        {this.state.currentLocation.id ? "Update" : "Save"}
                                    </Button>
                                    <Button color="primary" onClick={this.onClear}>
                                        Clear
                                    </Button>
                                    {circularProgress}
                                    {this.state.isError ? <span style={{ color: "red", fontWeight: "bold" }}>Error saving!</span> : null}
                                </Grid>
                                <Grid item={true} style={{ flex: 1, textAlign: "right" }}>
                                    <IconButton onClick={this.onClickDelete} disabled={!this.state.currentLocation.id} >
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>

                        </Grid>
                    </Grid>
                </form>
            </div>
        );

        const locations = this.state.locations.map(location => (
            <Grid key={location.id} item={true} xs={12}>
                <Typography variant="subtitle1" gutterBottom={true}>
                    {location.name}
                    <a href="" onClick={this.handleClickResource(location.id)}>
                        <EditIcon style={{ fontSize: 16, marginLeft: "1em" }} />
                    </a>
                </Typography>
                <Typography variant="caption" gutterBottom={true}>
                    Longitude: <strong>{location.longitude || "N/A"}</strong>,
                    Latitude: <strong>{location.latitude || "N/A"}</strong>,
                    Google Maps address: <strong>{location.googleMapsAddress || "N/A"}</strong>
                </Typography>
            </Grid>
        ));

        return <div className={classes.root}>
            <Grid container={true} spacing={5} justify="center" direction="row">
                <Grid item={true} xs={12} sm={8}>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        {locationForm}
                    </Paper>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        <Grid container={true} spacing={3} direction="column">
                            {locations}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </div>;
    }
}

export default withStyles(styles)(LocationsView);
