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
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Api from "../api/Api";
import { IInstrument, IAppState, IDataState } from "src/types/Types";
import classNames from "classnames";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import * as instrumentActions from "../actions/InstrumentActions";
import TelescopeIcon from "./icons/TelescopeIcon";

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

interface IInstrumentsViewProps extends WithStyles<typeof styles> {
    store: IDataState;
    actions: any;
}

interface IInstrumentsViewState {
    isLoading: boolean;
    isError: boolean;
    instruments: IInstrument[];
    currentInstrument: IInstrument;
    isConfirmDeleteOpen: boolean;
}

class InstrumentsView extends React.Component<IInstrumentsViewProps, IInstrumentsViewState> {
    constructor(props: IInstrumentsViewProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            instruments: [],
            currentInstrument: this.getEmptyInstrument(),
            isConfirmDeleteOpen: false
        };
    }

    private getEmptyInstrument = (): IInstrument => {
        return {
            id: undefined,
            key: "",
            name: "",
            diameterMm: undefined,
            focalLengthMm: undefined
        };
    }

    public componentDidMount() {
        this.loadFromApi();
    }

    private loadFromApi() {
        this.props.actions.getInstrumentsBegin();
        this.setState({ currentInstrument: this.getEmptyInstrument() });
        this.setState({ isLoading: true });
        Api.getInstruments().then(
            (response) => {
                this.setState({ instruments: response.data, isLoading: false, isError: false });
                this.props.actions.getInstrumentsSuccess(response.data);
            }).catch(
                () => {
                    this.setState({ isLoading: false, isError: true });
                    this.props.actions.getInstrumentsFailure("Failed to load instruments");
                }
            );
    }

    private parseIntegerInput = (rawValue: string): number | undefined => {
        const digitsOnly = rawValue.replace(/\D/g, "");
        if (!digitsOnly) {
            return undefined;
        }

        return Number.parseInt(digitsOnly, 10);
    }

    private handleFormChange = (name: string) => (event: any) => {
        const rawValue = event.target.value;
        const newValue = (name === "diameterMm" || name === "focalLengthMm")
            ? this.parseIntegerInput(rawValue)
            : rawValue;
        this.setState((prevState) => ({
            currentInstrument: {
                ...prevState.currentInstrument,
                [name]: newValue
            }
        }));
    }

    private isCurrentInstrumentValid = (): boolean => {
        const { key, name } = this.state.currentInstrument;
        return !!key.trim()
            && !!name.trim();
    }

    private handleClickResource = (instrumentId?: number) => (event: any) => {
        event.preventDefault();
        const clicked = this.state.instruments.find(i => i.id === instrumentId);
        if (clicked) {
            this.setState({ currentInstrument: clicked });
        }
    }

    private onClear = () => {
        this.setState({ currentInstrument: this.getEmptyInstrument(), isError: false });
    }

    private onClickDelete = () => {
        this.setState({ isConfirmDeleteOpen: true });
    }

    private onConfirmDelete = () => {
        this.setState({ isConfirmDeleteOpen: false });
        if (this.state.currentInstrument.id) {
            this.setState({ isLoading: true, isError: false });
            Api.deleteInstrument(this.state.currentInstrument.id).then(
                () => { this.loadFromApi(); }
            ).catch(
                () => { this.setState({ isLoading: false, isError: true }); }
            );
        }
    }

    private onCancelDelete = () => {
        this.setState({ isConfirmDeleteOpen: false });
    }

    private handleSubmit = (e: any) => {
        e.preventDefault();
        if (!this.isCurrentInstrumentValid()) {
            this.setState({ isError: true });
            return;
        }

        this.setState({ isLoading: true, isError: false });
        if (this.state.currentInstrument.id) {
            Api.updateInstrument(this.state.currentInstrument).then(
                () => { this.loadFromApi(); }
            ).catch(
                () => { this.setState({ isLoading: false, isError: true }); }
            );
        } else {
            Api.addInstrument(this.state.currentInstrument).then(
                () => { this.loadFromApi(); }
            ).catch(
                () => { this.setState({ isLoading: false, isError: true }); }
            );
        }
    }

    public render() {
        const { classes } = this.props;

        const circularProgress = this.state.isLoading
            ? <CircularProgress className="circularProgress" style={{ marginLeft: 20 }} />
            : null;

        const keyWarning = this.state.currentInstrument.id
            ? (
                <Typography variant="caption" style={{ color: "#f57c00", marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <FontAwesomeIcon icon="exclamation-triangle" />
                    Changing the key may have unexpected consequences
                </Typography>
            )
            : null;

        const confirmDeleteDialog = (
            <Dialog open={this.state.isConfirmDeleteOpen} onClose={this.onCancelDelete}>
                <DialogTitle>Delete instrument?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{this.state.currentInstrument.name}</strong>? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onCancelDelete} color="primary">Cancel</Button>
                    <Button onClick={this.onConfirmDelete} color="primary">Delete</Button>
                </DialogActions>
            </Dialog>
        );

        const instrumentForm = (
            <div>
                <form onSubmit={this.handleSubmit} className={classes.form} noValidate={true} autoComplete="off">
                    <Grid container direction="column" size="grow">
                        <Grid container spacing={2} sx={{ px: 1 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    id="key"
                                    label="Key"
                                    value={this.state.currentInstrument.key || ""}
                                    onChange={this.handleFormChange("key")}
                                    className={classes.rowField}
                                    margin="dense"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    id="name"
                                    label="Name"
                                    value={this.state.currentInstrument.name || ""}
                                    onChange={this.handleFormChange("name")}
                                    className={classes.rowField}
                                    margin="dense"
                                />
                            </Grid>
                        </Grid>
                        {keyWarning}
                        <Grid container spacing={2} sx={{ px: 1 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    id="diameterMm"
                                    label="Diameter (mm)"
                                    type="text"
                                    value={this.state.currentInstrument.diameterMm ?? ""}
                                    onChange={this.handleFormChange("diameterMm")}
                                    className={classes.rowField}
                                    margin="dense"
                                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    id="focalLengthMm"
                                    label="Focal length (mm)"
                                    value={this.state.currentInstrument.focalLengthMm ?? ""}
                                    onChange={this.handleFormChange("focalLengthMm")}
                                    className={classes.rowField}
                                    margin="dense"
                                    type="text"
                                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                />
                            </Grid>
                        </Grid>
                        <Grid className={classes.actionRow}>
                            <Grid container direction="row">
                                <Grid>
                                    <Button variant="contained" color="primary" type="submit" disabled={!this.props.store.isLoggedIn || !this.isCurrentInstrumentValid()}>
                                        {this.state.currentInstrument.id ? "Update" : "Save"}
                                    </Button>
                                    <Button color="primary" onClick={this.onClear}>
                                        Clear
                                    </Button>
                                    {circularProgress}
                                    {this.state.isError ? <span style={{ color: "red", fontWeight: "bold" }}>Error saving!</span> : null}
                                </Grid>
                                <Grid size="grow" style={{ textAlign: "right" }}>
                                    <IconButton onClick={this.onClickDelete} disabled={!this.props.store.isLoggedIn || !this.state.currentInstrument.id}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </form>
            </div>
        );

        const instrumentList = this.state.instruments.map(instrument => (
            <Grid key={instrument.id} size={12}>
                <Typography variant="subtitle1" gutterBottom={true}>
                    {instrument.name} <span style={{ color: "gray", fontSize: "0.85em" }}>({instrument.key})</span>
                    <a href="" onClick={this.handleClickResource(instrument.id)}>
                        <EditIcon style={{ fontSize: 16, marginLeft: "1em" }} />
                    </a>
                </Typography>
                <Typography variant="caption" gutterBottom={true}>
                    Diameter: <strong>{instrument.diameterMm !== undefined && instrument.diameterMm !== null ? `${instrument.diameterMm} mm` : "N/A"}</strong>,{" "}
                    Focal length: <strong>{instrument.focalLengthMm !== undefined && instrument.focalLengthMm !== null ? `${instrument.focalLengthMm} mm` : "N/A"}</strong>
                </Typography>
            </Grid>
        ));

        return <div className={classes.root}>
            {confirmDeleteDialog}
            <Typography variant="h6" align="center" color="textPrimary" component="p" style={{ marginTop: 20 }}>
                <TelescopeIcon variant="tableTop" className="faSpaceAfter" size={30} /> Instruments
            </Typography>
            <Grid container spacing={5} justifyContent="center" direction="row">
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        {instrumentForm}
                    </Paper>
                    <Paper className={classes.textfieldPaper} elevation={1}>
                        <Grid container spacing={3} direction="column">
                            {instrumentList}
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </div>;
    }
}

const mapStateToProps = (state: IAppState) => {
    return {
        store: state.data
    };
};

const mapDispatchToProps = (dispatch: Dispatch<instrumentActions.InstrumentAction>) => {
    return {
        actions: bindActionCreators(
            instrumentActions,
            dispatch
        )
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(InstrumentsView));

