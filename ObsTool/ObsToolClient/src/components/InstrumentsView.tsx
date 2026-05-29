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
import Popover from "@mui/material/Popover";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Api from "../api/Api";
import { IInstrument, IAppState, IDataState } from "src/types/Types";
import classNames from "classnames";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { connect } from "react-redux";
import { bindActionCreators, Dispatch } from "redux";
import * as instrumentActions from "../actions/InstrumentActions";
import TelescopeIcon, { TELESCOPE_ICON_OPTIONS, isKnownTelescopeIconVariant, resolveTelescopeIconVariant } from "./icons/TelescopeIcon";

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
    fieldColumn: {
        minWidth: 0,
    },
    iconColumn: {
        alignItems: "flex-start",
        alignSelf: "flex-start",
        display: "inline-flex",
        flexDirection: "column",
        paddingLeft: theme.spacing(1),
        width: "auto",
    },
    iconColumnLabel: {
        marginBottom: theme.spacing(0.75),
    },
    iconPickerButton: {
        alignItems: "center",
        alignSelf: "flex-start",
        display: "inline-flex",
        height: 96,
        justifyContent: "center",
        minWidth: 96,
        overflow: "hidden",
        padding: 0,
        width: 96,
        "& img": {
            height: "90%",
            objectFit: "contain",
            width: "90%",
        },
    },
    iconPopoverPaper: {
        padding: theme.spacing(1),
    },
    iconSelector: {
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(1),
    },
    iconToggle: {
        height: 60,
        minWidth: 60,
        padding: theme.spacing(0.75),
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
    iconPickerAnchorEl: HTMLElement | null;
}

class InstrumentsView extends React.Component<IInstrumentsViewProps, IInstrumentsViewState> {
    constructor(props: IInstrumentsViewProps) {
        super(props);

        this.state = {
            isLoading: false,
            isError: false,
            instruments: [],
            currentInstrument: this.getEmptyInstrument(),
            isConfirmDeleteOpen: false,
            iconPickerAnchorEl: null
        };
    }

    private getEmptyInstrument = (): IInstrument => {
        return {
            id: undefined,
            key: null,
            name: "",
            diameterMm: undefined,
            focalLengthMm: undefined,
            iconReference: null
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

    /**
     * Opens the icon chooser from the compact selected-icon button.
     */
    private handleOpenIconPicker = (event: React.MouseEvent<HTMLElement>) => {
        this.setState({ iconPickerAnchorEl: event.currentTarget });
    }

    /**
     * Closes the icon chooser without changing the selected icon.
     */
    private handleCloseIconPicker = () => {
        this.setState({ iconPickerAnchorEl: null });
    }

    /**
     * Stores a blank selector value as null and closes the popover after a choice.
     */
    private handleIconReferenceChange = (_event: React.MouseEvent<HTMLElement>, iconReference: string | null) => {
        this.setState((prevState) => ({
            currentInstrument: {
                ...prevState.currentInstrument,
                iconReference: isKnownTelescopeIconVariant(iconReference) ? iconReference : null
            },
            iconPickerAnchorEl: null
        }));
    }

    private isCurrentInstrumentValid = (): boolean => {
        const { name } = this.state.currentInstrument;
        return !!name.trim();
    }

    /**
     * Converts an empty key field into null before saving so keyless instruments are not parser directives.
     */
    private getInstrumentForSave = (): IInstrument => {
        const trimmedKey = this.state.currentInstrument.key?.trim();
        return {
            ...this.state.currentInstrument,
            key: trimmedKey || null,
            name: this.state.currentInstrument.name.trim()
        };
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
        const instrumentForSave = this.getInstrumentForSave();
        if (instrumentForSave.id) {
            Api.updateInstrument(instrumentForSave).then(
                () => { this.loadFromApi(); }
            ).catch(
                () => { this.setState({ isLoading: false, isError: true }); }
            );
        } else {
            Api.addInstrument(instrumentForSave).then(
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

        const selectedIconPreview = isKnownTelescopeIconVariant(this.state.currentInstrument.iconReference)
            ? <TelescopeIcon variant={resolveTelescopeIconVariant(this.state.currentInstrument.iconReference)} size={196} />
            : <span>None</span>;

        const iconSelector = (
            <ToggleButtonGroup
                exclusive={true}
                value={this.state.currentInstrument.iconReference || ""}
                onChange={this.handleIconReferenceChange}
                aria-label="Instrument icon"
                className={classes.iconSelector}
            >
                <ToggleButton value="" aria-label="No instrument icon" className={classes.iconToggle}>
                    None
                </ToggleButton>
                {TELESCOPE_ICON_OPTIONS.map(iconOption => (
                    <ToggleButton key={iconOption.variant} value={iconOption.variant} aria-label={iconOption.label} className={classes.iconToggle}>
                        <TelescopeIcon variant={iconOption.variant} size={48} />
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        );

        const iconPickerPopover = (
            <Popover
                open={!!this.state.iconPickerAnchorEl}
                anchorEl={this.state.iconPickerAnchorEl}
                onClose={this.handleCloseIconPicker}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                slotProps={{ paper: { className: classes.iconPopoverPaper } }}
            >
                {iconSelector}
            </Popover>
        );

        const instrumentForm = (
            <div>
                <form onSubmit={this.handleSubmit} className={classes.form} noValidate={true} autoComplete="off">
                    <Grid container spacing={2} size="grow" sx={{ px: 1 }}>
                        <Grid className={classes.fieldColumn} size={{ xs: 12, md: "grow" }}>
                            <Grid container direction="column">
                                <Grid container spacing={2}>
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
                                <Grid container spacing={2}>
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
                            </Grid>
                        </Grid>
                        <Grid className={classes.iconColumn} size={{ xs: "auto", md: "auto" }}>
                            <Typography variant="caption" color="textSecondary" className={classes.iconColumnLabel}>
                                Icon
                            </Typography>
                            <Button
                                variant="outlined"
                                className={classes.iconPickerButton}
                                onClick={this.handleOpenIconPicker}
                                aria-haspopup="dialog"
                                aria-label="Choose instrument icon"
                            >
                                {selectedIconPreview}
                            </Button>
                            {iconPickerPopover}
                        </Grid>
                        <Grid className={classes.actionRow} size={12}>
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

        const instrumentList = this.state.instruments.map(instrument => {
            const selectedIcon = isKnownTelescopeIconVariant(instrument.iconReference)
                ? (
                    <>
                        , Icon: <TelescopeIcon variant={resolveTelescopeIconVariant(instrument.iconReference)} size={18} />
                    </>
                )
                : null;

            return (
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
                        {selectedIcon}
                    </Typography>
                </Grid>
            );
        });

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

